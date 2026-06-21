import express from 'express';
import path from 'node:path';

import { GoogleGenAI as GenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { PlatformStore } from './server/platform-store';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MAX_TEXT_LENGTH = 4000;
const MAX_MESSAGES = 40;
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX_REQUESTS = 30;
const WRITE_RATE_LIMIT_MAX_REQUESTS = 60;

const store = new PlatformStore();

let ai: GenAI | null = null;
function getAiClient() {
  const apiKey = process.env.AI_API_KEY;
  if (!ai && apiKey) {
    ai = new GenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'africhat-build',
        },
      },
    });
  }
  return ai;
}

type RateBucket = { count: number; resetAt: number };
const rateLimits = new Map<string, RateBucket>();

function getClientIdentifier(req: express.Request) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

function isRateLimited(req: express.Request, routeName: string, maxRequests = AI_RATE_LIMIT_MAX_REQUESTS) {
  const key = `${routeName}:${getClientIdentifier(req)}`;
  const now = Date.now();

  if (rateLimits.size > 5000) {
    for (const [entryKey, bucket] of rateLimits.entries()) {
      if (bucket.resetAt <= now) {
        rateLimits.delete(entryKey);
      }
    }
  }

  const bucket = rateLimits.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > maxRequests;
}

function readTextField(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

function readTargetLanguage(value: unknown) {
  if (typeof value !== 'string') {
    return 'English';
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64) {
    return 'English';
  }

  return trimmed;
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }

  return 'Unknown error';
}

function buildFallbackMiniAppSpec(prompt: string) {
  const fallbackApps: Record<string, any> = {
    ride: {
      name: 'Abuja City Rides',
      category: 'Ride Hailing',
      colorTheme: '#0284c7',
      pricingStructure: 'NGN 250 base fee + NGN 120 per km',
      paymentMethods: ['AfriPay Wallet', 'Virtual USD Card'],
      initialData: [
        { title: 'Babajide Alabi', detail: 'Toyota Corolla (Silver)', status: 'Available' },
        { title: 'Chidi Okafor', detail: 'Honda Civic (Black)', status: 'Busy' },
        { title: 'Moussa Diop', detail: 'Hyundai Elantra (White)', status: 'Available' },
      ],
      adminNotes: 'Auto-generated ride hailing program for Abuja with integrated cashout system.',
    },
    school: {
      name: 'Lagos Tech Portal',
      category: 'School Portal',
      colorTheme: '#7c3aed',
      pricingStructure: 'Free for students + Premium admin tools',
      paymentMethods: ['AfriPay Wallet', 'Bank Transfer'],
      initialData: [
        { title: 'Introduction to AI & Coding', detail: 'Instructor Godfrey', status: 'Active' },
        { title: 'African History Studies', detail: 'Prof. Amina K.', status: 'Upcoming' },
        { title: 'Fintech 101', detail: 'Dr. Abidemi', status: 'Completed' },
      ],
      adminNotes: 'School administrative system featuring lesson timelines, fee payments, and grader sheets catalog.',
    },
  };

  const key = prompt.toLowerCase().includes('school') ? 'school' : 'ride';
  return fallbackApps[key] || {
    name: prompt.slice(0, 20).replace(/[^a-zA-Z ]/g, '') + ' App',
    category: 'Marketplace',
    colorTheme: '#0d9488',
    pricingStructure: 'Standard peer-to-peer commissions',
    paymentMethods: ['AfriPay Wallet'],
    initialData: [
      { title: 'Fresh Jollof Rice', detail: 'Mama Kenya Foods', status: 'Available' },
      { title: 'Handwoven Ankara Dress', detail: 'Lagos Threads Hub', status: 'Available' },
    ],
    adminNotes: 'Custom generated retail storefront inside AfriMarket, integrated into AfriChat.',
  };
}

function buildFallbackSummary(messages: any[]) {
  const parts: string[] = [];
  for (const message of messages.slice(-MAX_MESSAGES)) {
    const senderName = readTextField(message?.senderName, 120) || 'Unknown';
    const text = readTextField(message?.text, 2000);
    if (!text) {
      continue;
    }

    parts.push(`${senderName}: ${text}`);
    if (parts.length >= 3) {
      break;
    }
  }

  if (!parts.length) {
    return 'Summary unavailable right now.';
  }

  return `Recent discussion: ${parts.join(' • ')}.`;
}

function sendProductionAiUnavailable(res: express.Response) {
  return res.status(503).json({ error: 'AI service unavailable' });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '32kb' }));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
  });

  app.get(['/healthz', '/api/health'], async (_req, res) => {
    const bootstrap = await store.bootstrap();
    res.json({
      ok: true,
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      aiConfigured: Boolean(process.env.AI_API_KEY),
      revision: bootstrap.revision,
      deployedApps: bootstrap.deployedApps.length,
      queuedOperations: bootstrap.templates?.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/bootstrap', async (_req, res) => {
    const bootstrap = await store.bootstrap();
    res.json(bootstrap);
  });

  app.get('/api/miniapps', async (_req, res) => {
    const apps = await store.listMiniApps();
    res.json({ apps });
  });

  app.get('/api/wallet', async (_req, res) => {
    const wallet = await store.getWallet();
    res.json({ wallet });
  });

  app.post('/api/miniapps/publish', async (req, res) => {
    if (isRateLimited(req, 'publish', WRITE_RATE_LIMIT_MAX_REQUESTS)) {
      return res.status(429).json({ error: 'Too many publish requests. Please slow down.' });
    }

    const miniApp = req.body?.app;
    if (!isRecord(miniApp)) {
      return res.status(400).json({ error: 'Mini app payload is required' });
    }

    try {
      const published = await store.publishMiniApp({
        app: miniApp as any,
        context: isRecord(req.body?.context)
          ? {
              prompt: typeof req.body.context.prompt === 'string' ? req.body.context.prompt : undefined,
              templateId: typeof req.body.context.templateId === 'string' ? req.body.context.templateId : undefined,
              clientOperationId: typeof req.body.context.clientOperationId === 'string' ? req.body.context.clientOperationId : undefined,
              creator: typeof req.body.context.creator === 'string' ? req.body.context.creator : undefined,
            }
          : undefined,
      });

      res.json({ app: published });
    } catch (error: any) {
      res.status(400).json({ error: error?.message || 'Failed to publish mini app' });
    }
  });

  app.post('/api/wallet/transactions', async (req, res) => {
    if (isRateLimited(req, 'wallet', WRITE_RATE_LIMIT_MAX_REQUESTS)) {
      return res.status(429).json({ error: 'Too many wallet requests. Please slow down.' });
    }

    const transaction = req.body?.transaction;
    if (!isRecord(transaction)) {
      return res.status(400).json({ error: 'Transaction payload is required' });
    }

    try {
      const result = await store.recordWalletTransaction({
        transaction: transaction as any,
        context: isRecord(req.body?.context)
          ? {
              clientOperationId: typeof req.body.context.clientOperationId === 'string' ? req.body.context.clientOperationId : undefined,
              sourceAppId: typeof req.body.context.sourceAppId === 'string' ? req.body.context.sourceAppId : undefined,
            }
          : undefined,
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || 'Failed to record transaction' });
    }
  });

  app.post('/api/sync', async (req, res) => {
    if (isRateLimited(req, 'sync', WRITE_RATE_LIMIT_MAX_REQUESTS)) {
      return res.status(429).json({ error: 'Too many sync requests. Please slow down.' });
    }

    const operations = Array.isArray(req.body?.operations) ? req.body.operations : null;
    if (!operations) {
      return res.status(400).json({ error: 'Offline operations are required' });
    }

    try {
      const result = await store.syncOperations({ operations: operations as any });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || 'Failed to sync operations' });
    }
  });

  app.post('/api/translate', async (req, res) => {
    if (isRateLimited(req, 'translate')) {
      return res.status(429).json({ error: 'Too many translation requests. Please slow down.' });
    }

    const text = readTextField(req.body?.text);
    const targetLang = readTargetLanguage(req.body?.targetLang);
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const client = getAiClient();
    if (!client) {
      if (IS_PRODUCTION) {
        return sendProductionAiUnavailable(res);
      }

      const translations: Record<string, string> = {
        'Sannu, ya kake? Ina fatan kana cikin koshin lafiya.': 'Hello, how are you? I hope you are in good health.',
        'Ina kwana': 'Good morning',
        'Ekaaro': 'Good morning',
        'Habari gani': 'How are you doing',
        'Asante sana': 'Thank you very much',
      };
      const mockTranslated = translations[text] || `[Translated to ${targetLang}] ${text}`;
      return res.json({ translatedText: mockTranslated, sourceLang: 'African Language', targetLang, fallback: true });
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Translate the following text into ${targetLang}. Respond with ONLY the direct translation, nothing else.\n\n"${text}"`,
      });
      res.json({ translatedText: response.text?.trim() || text, targetLang });
    } catch (err: any) {
      console.error('AI translate error:', err);
      if (IS_PRODUCTION) {
        return sendProductionAiUnavailable(res);
      }
      res.json({
        translatedText: `[Translation unavailable in ${targetLang}] ${text}`,
        targetLang,
        error: 'Translation failed',
        fallback: true,
      });
    }
  });

  app.post('/api/generate-miniapp', async (req, res) => {
    if (isRateLimited(req, 'generate-miniapp')) {
      return res.status(429).json({ error: 'Too many mini-app requests. Please slow down.' });
    }

    const prompt = readTextField(req.body?.prompt, 3000);
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const client = getAiClient();
    if (!client) {
      if (IS_PRODUCTION) {
        return sendProductionAiUnavailable(res);
      }
      return res.json({ appSpec: buildFallbackMiniAppSpec(prompt), fallback: true });
    }

    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are AfriChat's Mini-App AI Developer. Analyze this prompt: "${prompt}". Construct a practical mini app for African everyday life. Respond with exact JSON only using this schema:\n{\n  "name": string,\n  "category": "Ride Hailing" | "School Portal" | "Marketplace" | "Healthcare" | "Cooperative" | "Logistics" | "Delivery",\n  "colorTheme": string,\n  "pricingStructure": string,\n  "paymentMethods": string[],\n  "initialData": [{ "title": string, "detail": string, "status": string }],\n  "adminNotes": string\n}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              colorTheme: { type: Type.STRING },
              pricingStructure: { type: Type.STRING },
              paymentMethods: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              initialData: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    status: { type: Type.STRING },
                  },
                  required: ['title', 'detail', 'status'],
                },
              },
              adminNotes: { type: Type.STRING },
            },
            required: ['name', 'category', 'colorTheme', 'pricingStructure', 'paymentMethods', 'initialData', 'adminNotes'],
          },
        },
      });

      const rawSpec = response.text?.trim();
      if (!rawSpec) {
        throw new Error('No mini-app specification was returned.');
      }

      const spec = JSON.parse(rawSpec);
      if (!spec || typeof spec !== 'object') {
        throw new Error('Invalid mini-app specification.');
      }

      res.json({ appSpec: spec });
    } catch (err: any) {
      console.error('AI mini-app generation error:', err);
      if (IS_PRODUCTION) {
        return sendProductionAiUnavailable(res);
      }
      res.json({
        appSpec: buildFallbackMiniAppSpec(prompt),
        fallback: true,
        error: 'Mini-app generation used a fallback template.',
        details: getErrorMessage(err),
      });
    }
  });

  app.post('/api/chat-ai', async (req, res) => {
    if (isRateLimited(req, 'chat-ai')) {
      return res.status(429).json({ error: 'Too many AI chat requests. Please slow down.' });
    }

    const message = readTextField(req.body?.message, 3000);
    const chatHistory = Array.isArray(req.body?.chatHistory) ? req.body.chatHistory : [];
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const client = getAiClient();
    if (!client) {
      if (IS_PRODUCTION) {
        return sendProductionAiUnavailable(res);
      }

      let mockResponse = 'I am AfriAI, your super app assistant. That sounds marvelous! Let me help you out. ';
      if (message.toLowerCase().includes('business') || message.toLowerCase().includes('clothing')) {
        mockResponse += `AfriAI Business Setup Plan for your store:\n1. Storefront: We have initialized AfriMarket Store "African Elegance".\n2. Logistics: Integrated with Abuja Delivery Mini-App.\n3. Payments: AfriPay NFC and QR scanner linked with 0% gateway commission.\n4. Broadcasting: Created promo channel 'Afrigram > Elegance'.`;
      } else {
        mockResponse += 'To fully activate AfriAI smart features, please configure the AI service.';
      }
      return res.json({ response: mockResponse, fallback: true });
    }

    try {
      const formattedHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      for (const entry of chatHistory.slice(-20)) {
        const text = readTextField(entry?.text, 2000);
        if (!text) {
          continue;
        }

        formattedHistory.push({
          role: entry?.sender === 'me' ? 'user' : 'model',
          parts: [{ text }],
        });
      }

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] },
        ],
        config: {
          systemInstruction: `You are AfriAI, the highly intelligent built-in virtual assistant of AfriChat. Keep your copy highly scannable, engaging, and clear. Help merchants structure business plans, promo messages, or coordinate digital services in Africa.`,
        },
      });
      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error('No assistant response was returned.');
      }

      res.json({ response: responseText });
    } catch (err: any) {
      console.error('AI assistant error:', err);
      if (IS_PRODUCTION) {
        return sendProductionAiUnavailable(res);
      }
      res.json({
        response: 'AfriAI assistant is temporarily unavailable. Please try again in a moment.',
        fallback: true,
        details: getErrorMessage(err),
      });
    }
  });

  app.post('/api/summarize', async (req, res) => {
    if (isRateLimited(req, 'summarize')) {
      return res.status(429).json({ error: 'Too many summary requests. Please slow down.' });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) {
      return res.json({ summary: 'No chat messages to summarize yet.' });
    }

    const client = getAiClient();
    if (!client) {
      if (IS_PRODUCTION) {
        return sendProductionAiUnavailable(res);
      }
      return res.json({ summary: buildFallbackSummary(messages), fallback: true });
    }

    try {
      const chatTextParts: string[] = [];
      for (const message of messages.slice(-MAX_MESSAGES)) {
        const senderName = readTextField(message?.senderName, 120) || 'Unknown';
        const text = readTextField(message?.text, 2000);
        if (!text) {
          continue;
        }

        chatTextParts.push(`${senderName}: ${text}`);
      }

      if (!chatTextParts.length) {
        return res.status(400).json({ error: 'No valid messages to summarize.' });
      }

      const chatText = chatTextParts.join('\n');
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Provide a quick 2-bullet summary of this conversation. Be extremely concise. Focus on key action items:\n\n${chatText}`,
      });
      const summary = response.text?.trim();
      if (!summary) {
        throw new Error('No summary was returned.');
      }

      res.json({ summary });
    } catch (err: any) {
      console.error('AI summarize error:', err);
      if (IS_PRODUCTION) {
        return sendProductionAiUnavailable(res);
      }
      res.json({
        summary: buildFallbackSummary(messages),
        fallback: true,
        details: getErrorMessage(err),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { maxAge: '1h' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();