import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI as GenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const MAX_TEXT_LENGTH = 4000;
const MAX_MESSAGES = 40;
const AI_RATE_LIMIT_WINDOW_MS = 60_000;
const AI_RATE_LIMIT_MAX_REQUESTS = 30;

// Lazy initialization of the AI client
let ai: GenAI | null = null;
function getAiClient() {
  const apiKey = process.env.AI_API_KEY;
  if (!ai && apiKey) {
    ai = new GenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'africhat-build',
        }
      }
    });
  }
  return ai;
}

type RateBucket = { count: number; resetAt: number };
const aiRateLimits = new Map<string, RateBucket>();

function getClientIdentifier(req: express.Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(req: express.Request, routeName: string) {
  const key = `${routeName}:${getClientIdentifier(req)}`;
  const now = Date.now();

  if (aiRateLimits.size > 5000) {
    for (const [entryKey, bucket] of aiRateLimits.entries()) {
      if (bucket.resetAt <= now) {
        aiRateLimits.delete(entryKey);
      }
    }
  }

  const bucket = aiRateLimits.get(key);
  if (!bucket || bucket.resetAt <= now) {
    aiRateLimits.set(key, { count: 1, resetAt: now + AI_RATE_LIMIT_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > AI_RATE_LIMIT_MAX_REQUESTS;
}

function readTextField(value: unknown, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

function readTargetLanguage(value: unknown) {
  if (typeof value !== "string") {
    return "English";
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64) {
    return "English";
  }

  return trimmed;
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return err.message;
  }

  return "Unknown error";
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "32kb" }));

  // 1. API: Translation endpoint (Yoruba, Hausa, Swahili, etc.)
  app.post("/api/translate", async (req, res) => {
    if (isRateLimited(req, "translate")) {
      return res.status(429).json({ error: "Too many translation requests. Please slow down." });
    }

    const text = readTextField(req.body?.text);
    const targetLang = readTargetLanguage(req.body?.targetLang);
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const client = getAiClient();
    if (!client) {
      if (IS_PRODUCTION) {
        return res.status(503).json({ error: "Translation is temporarily unavailable." });
      }

      const translations: Record<string, string> = {
        "Sannu, ya kake? Ina fatan kana cikin koshin lafiya.": "Hello, how are you? I hope you are in good health.",
        "Ina kwana": "Good morning",
        "Ekaaro": "Good morning",
        "Habari gani": "How are you doing",
        "Asante sana": "Thank you very much"
      };
      const mockTranslated = translations[text] || `[Translated to ${targetLang}] ${text}`;
      return res.json({ translatedText: mockTranslated, sourceLang: "African Language", targetLang });
    }

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Translate the following text into ${targetLang}. Respond with ONLY the direct translation, nothing else.\n\n"${text}"`,
      });
      const result = response.text?.trim() || text;
      res.json({ translatedText: result, targetLang });
    } catch (err: any) {
      console.error("AI translate error:", err);
      res.status(502).json({ error: "Translation failed", details: IS_PRODUCTION ? undefined : getErrorMessage(err) });
    }
  });

  // 2. API: Dynamic Mini-App specifications builder
  app.post("/api/generate-miniapp", async (req, res) => {
    if (isRateLimited(req, "generate-miniapp")) {
      return res.status(429).json({ error: "Too many mini-app requests. Please slow down." });
    }

    const prompt = readTextField(req.body?.prompt, 3000);
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const client = getAiClient();
    if (!client) {
      if (IS_PRODUCTION) {
        return res.status(503).json({ error: "Mini-app generation is temporarily unavailable." });
      }

      const fallbackApps: Record<string, any> = {
        "ride": {
          name: "Abuja City Rides",
          category: "Ride Hailing",
          colorTheme: "#0284c7",
          pricingStructure: "₦250 base fee + ₦120 per km",
          paymentMethods: ["AfriPay Wallet", "Virtual USD Card"],
          initialData: [
            { driver: "Babajide Alabi", state: "Available", vehicle: "Toyota Corolla (Silver)", rating: "4.9 ★", currentY: "Wuse II" },
            { driver: "Chidi Okafor", state: "Busy", vehicle: "Honda Civic (Black)", rating: "4.8 ★", currentY: "Garki Area 11" },
            { driver: "Moussa Diop", state: "Available", vehicle: "Hyundai Elantra (White)", rating: "4.7 ★", currentY: "Maitama" }
          ],
          adminNotes: "Auto-generated Ride Hailing program for Abuja with integrated cashout system on AfriPay."
        },
        "school": {
          name: "Lagos Tech Portal",
          category: "School Portal",
          colorTheme: "#7c3aed",
          pricingStructure: "Free for students + Premium admin tools",
          paymentMethods: ["AfriPay Wallet", "Bank Transfer"],
          initialData: [
            { subject: "Introduction to AI & Coding", teacher: "Instructor Godfrey", time: "Monday 10:00 AM", status: "Active" },
            { subject: "African History Studies", teacher: "Prof. Amina K.", time: "Wednesday 2:00 PM", status: "Upcoming" },
            { subject: "Fintech 101: Digital Wallets", teacher: "Dr. Abidemi", time: "Friday 4:00 PM", status: "Completed" }
          ],
          adminNotes: "School administrative system featuring lesson timelines, fee payments, and grader sheets catalog."
        }
      };

      const key = prompt.toLowerCase().includes("school") ? "school" : "ride";
      const appSpec = fallbackApps[key] || {
        name: prompt.slice(0, 20).replace(/[^a-zA-Z ]/g, "") + " App",
        category: "Marketplace",
        colorTheme: "#0d9488",
        pricingStructure: "Standard peer-to-peer commissions",
        paymentMethods: ["AfriPay Wallet"],
        initialData: [
          { item: "Fresh Jollof Rice", price: "₦1,800", stock: 15, seller: "Mama Kenya Foods" },
          { item: "Handwoven Ankara Dress", price: "₦12,000", stock: 3, seller: "Lagos Threads Hub" }
        ],
        adminNotes: "Custom generated retail storefront inside AfriMarket, integrated into WeChat-style AfriChat."
      };

      return res.json({ appSpec });
    }

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are AfriChat's Mini-App AI Developer. Analyze this prompt: "${prompt}". 
        Construct a beautifully stylized structure for a WeChat-style mini app suited for African everyday life.
        Respond with a JSON object that satisfies this schema. Do not write markdown tags, respond with exact JSON only:
        {
          "name": "Exact creative name representing the app (e.g. Abuja Express, Kenya Market, Accra Edu)",
          "category": "Choose one: Ride Hailing, School Portal, Marketplace, Healthcare, Cooperative, Logistics, Delivery",
          "colorTheme": "A beautiful deep hex code suited for the design, e.g. #0284c7 or #ef4444 or #8b5cf6",
          "pricingStructure": "Clear simple pricing statement (e.g. ₦100 fixed, ₦1200 / semester)",
          "paymentMethods": ["AfriPay Wallet", "Card"],
          "initialData": [
            { "title": "First mock item/driver/subject", "detail": "supporting detail", "status": "Available or Active or Registered" },
            { "title": "Second mock item/driver", "detail": "supporting detail", "status": "Busy or Upcoming or Completed" },
            { "title": "Third mock item/driver", "detail": "supporting detail", "status": "Available or Active or Completed" }
          ],
          "adminNotes": "Short 1-sentence deployment summary by AfriChat AI."
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              colorTheme: { type: Type.STRING },
              pricingStructure: { type: Type.STRING },
              paymentMethods: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              initialData: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    status: { type: Type.STRING }
                  },
                  required: ["title", "detail", "status"]
                }
              },
              adminNotes: { type: Type.STRING }
            },
            required: ["name", "category", "colorTheme", "pricingStructure", "paymentMethods", "initialData", "adminNotes"]
          }
        }
      });

      const rawSpec = response.text?.trim();
      if (!rawSpec) {
        throw new Error("No mini-app specification was returned.");
      }

      const spec = JSON.parse(rawSpec);
      if (!spec || typeof spec !== "object") {
        throw new Error("Invalid mini-app specification.");
      }

      res.json({ appSpec: spec });
    } catch (err: any) {
      console.error("AI mini-app generation error:", err);
      res.status(502).json({
        error: "Failed to generate mini-app structure",
        details: IS_PRODUCTION ? undefined : getErrorMessage(err)
      });
    }
  });

  // 3. API: Chat Assistant API (writes business plans, promo campaigns, translations etc.)
  app.post("/api/chat-ai", async (req, res) => {
    if (isRateLimited(req, "chat-ai")) {
      return res.status(429).json({ error: "Too many AI chat requests. Please slow down." });
    }

    const message = readTextField(req.body?.message, 3000);
    const chatHistory = Array.isArray(req.body?.chatHistory) ? req.body.chatHistory : [];
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const client = getAiClient();
    if (!client) {
      if (IS_PRODUCTION) {
        return res.status(503).json({ error: "AfriAI is temporarily unavailable." });
      }

      let mockResponse = `I am AfriAI, your super app assistant. That sounds marvelous! Let me help you out. `;
      if (message.toLowerCase().includes("business") || message.toLowerCase().includes("clothing")) {
        mockResponse += `**AfriAI Business Setup Plan for your store:**\n1. **Storefront**: We have initialized AfriMarket Store "African Elegance".\n2. **Logistics**: Integrated with Abuja Delivery Mini-App.\n3. **Payments**: AfriPay NFC and QR scanner linked with 0% gateway commission.\n4. **Broadcasting**: Created promo channel 'Afrigram > Elegance'. Let's launch!`;
      } else {
        mockResponse += `To fully activate AfriAI smart features, please configure the AI service. Let's make digital life in Africa simpler together!`;
      }
      return res.json({ response: mockResponse });
    }

    try {
      const formattedHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];
      for (const entry of chatHistory.slice(-20)) {
        const text = readTextField(entry?.text, 2000);
        if (!text) {
          continue;
        }

        formattedHistory.push({
          role: entry?.sender === "me" ? "user" : "model",
          parts: [{ text }]
        });
      }

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...formattedHistory,
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: `You are AfriAI, the highly intelligent built-in virtual assistant of AfriChat - Africa's ultimate mobile digital ecosystem.
          You are warm, resourceful, precise, and practical. You understand finance (Micro loans, Cooperatives, conversions), translation across African languages (Swahili, Yoruba, Igbo, Hausa, French, English), commerce, business setup automation, and live broadcasting features.
          Keep your copy highly scannable, engaging, and clear. Help merchants structure business plans, promo messages, or coordinate digital services in Africa.`
        }
      });
      const responseText = response.text?.trim();
      if (!responseText) {
        throw new Error("No assistant response was returned.");
      }

      res.json({ response: responseText });
    } catch (err: any) {
      console.error("AI assistant error:", err);
      res.status(502).json({
        error: "AfriAI assistant is currently offline.",
        details: IS_PRODUCTION ? undefined : getErrorMessage(err)
      });
    }
  });

  // 4. API: Conversation Summarizer endpoint
  app.post("/api/summarize", async (req, res) => {
    if (isRateLimited(req, "summarize")) {
      return res.status(429).json({ error: "Too many summary requests. Please slow down." });
    }

    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) {
      return res.json({ summary: "No chat messages to summarize yet." });
    }

    const client = getAiClient();
    if (!client) {
      if (IS_PRODUCTION) {
        return res.status(503).json({ error: "Summarization is temporarily unavailable." });
      }

      return res.json({ summary: "Amina K. requested info on Lagos Tech Hub funding milestones. You agreed to send over the project details shortly. High-priority follow-up scheduled for 6:00 PM." });
    }

    try {
      const chatTextParts: string[] = [];
      for (const message of messages.slice(-MAX_MESSAGES)) {
        const senderName = readTextField(message?.senderName, 120) || "Unknown";
        const text = readTextField(message?.text, 2000);
        if (!text) {
          continue;
        }

        chatTextParts.push(`${senderName}: ${text}`);
      }

      if (!chatTextParts.length) {
        return res.status(400).json({ error: "No valid messages to summarize." });
      }

      const chatText = chatTextParts.join("\n");
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Provide a quick 2-bullet summary of this conversation. Be extremely concise. Focus on key action items:\n\n${chatText}`,
      });
      const summary = response.text?.trim();
      if (!summary) {
        throw new Error("No summary was returned.");
      }

      res.json({ summary });
    } catch (err: any) {
      console.error("AI summarize error:", err);
      res.status(502).json({
        error: "Failed to summarize conversation.",
        details: IS_PRODUCTION ? undefined : getErrorMessage(err)
      });
    }
  });

  // Serve static assets in production, hook up Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();