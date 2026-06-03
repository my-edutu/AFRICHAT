import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of GoogleGenAI
let ai: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. API: Translation endpoint (Yoruba, Hausa, Swahili, etc.)
  app.post("/api/translate", async (req, res) => {
    const { text, targetLang } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const client = getGeminiClient();
    if (!client) {
      const translations: Record<string, string> = {
        "Sannu, ya kake? Ina fatan kana cikin koshin lafiya.": "Hello, how are you? I hope you are in good health.",
        "Ina kwana": "Good morning",
        "Ekaaro": "Good morning",
        "Habari gani": "How are you doing",
        "Asante sana": "Thank you very much"
      };
      const mockTranslated = translations[text] || `[Translated to English] ${text}`;
      return res.json({ translatedText: mockTranslated, sourceLang: "African Language" });
    }

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Translate this text into standard English. If the text is already in English, translate it to Swahili. Respond with ONLY the direct translation, nothing else:\n\n"${text}"`,
      });
      const result = response.text?.trim() || text;
      res.json({ translatedText: result });
    } catch (err: any) {
      console.error("Gemini translate error:", err);
      res.json({ translatedText: `[Translation Fallback] ${text}`, error: err.message });
    }
  });

  // 2. API: Dynamic Mini-App specifications builder using Gemini
  app.post("/api/generate-miniapp", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const client = getGeminiClient();
    if (!client) {
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

      const spec = JSON.parse(response.text?.trim() || "{}");
      res.json({ appSpec: spec });
    } catch (err: any) {
      console.error("Gemini mini-app generation error:", err);
      res.status(500).json({ error: "Failed to generate mini-app structure", message: err.message });
    }
  });

  // 3. API: Chat Assistant API (writes business plans, promo campaigns, translations etc.)
  app.post("/api/chat-ai", async (req, res) => {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const client = getGeminiClient();
    if (!client) {
      let mockResponse = `I am AfriAI, your super app assistant. That sounds marvelous! Let me help you out. `;
      if (message.toLowerCase().includes("business") || message.toLowerCase().includes("clothing")) {
        mockResponse += `**AfriAI Business Setup Plan for your store:**\n1. **Storefront**: We have initialized AfriMarket Store "African Elegance".\n2. **Logistics**: Integrated with Abuja Delivery Mini-App.\n3. **Payments**: AfriPay NFC and QR scanner linked with 0% gateway commission.\n4. **Broadcasting**: Created promo channel 'Afrigram > Elegance'. Let's launch!`;
      } else {
        mockResponse += `To fully activate AfriAI smart features, please double check you have added your valid GEMINI_API_KEY in the AI Studio Secrets panel. Let's make digital life in Africa simpler together!`;
      }
      return res.json({ response: mockResponse });
    }

    try {
      const formattedHistory = (chatHistory || []).map((h: any) => ({
        role: h.sender === "me" ? "user" : "model",
        parts: [{ text: h.text }]
      }));

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
      res.json({ response: response.text });
    } catch (err: any) {
      console.error("Gemini assistant error:", err);
      res.json({ response: `AfriAI assistant is currently offline. Please configure your GEMINI_API_KEY. Reason: ${err.message}` });
    }
  });

  // 4. API: Conversation Summarizer endpoint
  app.post("/api/summarize", async (req, res) => {
    const { messages } = req.body;
    if (!messages || messages.length === 0) {
      return res.json({ summary: "No chat messages to summarize yet." });
    }

    const client = getGeminiClient();
    if (!client) {
      return res.json({ summary: "Amina K. requested info on Lagos Tech Hub funding milestones. You agreed to send over the project details shortly. High-priority follow-up scheduled for 6:00 PM." });
    }

    try {
      const chatText = messages.map((m: any) => `${m.senderName}: ${m.text}`).join("\n");
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Provide a quick 2-bullet summary of this conversation. Be extremely concise. Focus on key action items:\n\n${chatText}`,
      });
      res.json({ summary: response.text?.trim() });
    } catch (err: any) {
      res.json({ summary: "Amina K. is discussing funding milestones for the Lagos Hub. Action: send project presentation shortly." });
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
