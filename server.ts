import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy-initialize Gemini client
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "ElderVoice Kiosk" });
  });

  // Voice reply endpoint using Gemini API
  app.post("/api/voice-reply", async (req, res) => {
    try {
      const { transcript, itemQuery } = req.body;
      const prompt = (transcript || "Hello ElderVoice, what is my update for today?").trim();
      const lower = prompt.toLowerCase();

      // Guard: strictly block financial features for senior user safety
      if (
        lower.includes("bank") ||
        lower.includes("credit card") ||
        lower.includes("debit") ||
        lower.includes("payment") ||
        lower.includes("transfer money") ||
        lower.includes("wallet") ||
        lower.includes("upi") ||
        lower.includes("pin number")
      ) {
        return res.json({
          reply: "For your financial safety and protection, financial and banking features are not available on this kiosk. Please consult Sarah or your local bank branch directly.",
          source: "safety_guard",
        });
      }

      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `User query: "${prompt}"\nContext info: Local household room-level items currently tracked:
- Reading Glasses: Kitchen island, 10 minutes ago
- House Keys: Entryway table tray, 25 minutes ago
- TV Remote: Living room armchair pocket, 45 minutes ago
- Daily Pill Box: Kitchen counter next to kettle, 2 hours ago
- Walking Cane: Front porch coat rack, 3 hours ago`,
            config: {
              systemInstruction:
                "You are ElderVoice, a compassionate, warm, patient smart home and wellbeing voice assistant speaking to a senior citizen named Eleanor on her home-mounted tablet kiosk. If she asks about a misplaced item, give a reassuring room-level answer based on the local tracked items. Provide a warm, clear, plain-language spoken reply in 1 to 2 short sentences. Speak gently, respectfully, and reassuringly. Never use markdown formatting, asterisks, bullet points, or complex technical jargon. Ensure the text is natural to be read or spoken aloud.",
            },
          });

          const replyText = response.text?.trim();
          if (replyText) {
            return res.json({ reply: replyText, source: "gemini" });
          }
        } catch (apiErr: any) {
          const isQuota =
            apiErr?.status === 429 ||
            apiErr?.code === 429 ||
            apiErr?.message?.includes("429") ||
            apiErr?.message?.includes("RESOURCE_EXHAUSTED") ||
            apiErr?.message?.includes("prepayment credits");

          if (isQuota) {
            console.log("[ElderVoice API] Gemini credits/quota depleted. Seamlessly using local voice assistant logic.");
          } else {
            console.log(`[ElderVoice API] Gemini query unavailable (${apiErr?.message || "offline"}). Using local voice assistant logic.`);
          }
        }
      }

      // Intelligent warm contextual fallbacks for prototype resilience
      let fallbackReply = "I am right here with you, Eleanor. All your morning reminders are on track, and your home is safe and comfortable.";

      if (lower.includes("glass") || lower.includes("spectacle") || lower.includes("reading")) {
        fallbackReply = "Your reading glasses were last seen in the kitchen on the breakfast island, about 10 minutes ago.";
      } else if (lower.includes("key")) {
        fallbackReply = "Your house keys were last seen in the entryway table tray, about 25 minutes ago.";
      } else if (lower.includes("remote") || lower.includes("television") || lower.includes("tv")) {
        fallbackReply = "Your TV remote was last seen tucked beside your living room armchair, about 45 minutes ago.";
      } else if (lower.includes("pill box") || lower.includes("organizer") || lower.includes("medicine box")) {
        fallbackReply = "Your daily pill box was last seen on the kitchen counter next to the kettle, about 2 hours ago.";
      } else if (lower.includes("cane") || lower.includes("walking stick")) {
        fallbackReply = "Your walking cane was last seen on the front porch coat rack, about 3 hours ago.";
      } else if (lower.includes("find") || lower.includes("where") || lower.includes("lost")) {
        fallbackReply = "I can help locate your glasses in the kitchen, your keys in the entryway, or your TV remote by the armchair.";
      } else if (lower.includes("weather") || lower.includes("outside") || lower.includes("temperature") || lower.includes("rain")) {
        fallbackReply = "It is currently 72 degrees and sunny with a light breeze. A lovely day to sit on the porch.";
      } else if (lower.includes("pill") || lower.includes("medication") || lower.includes("medicine") || lower.includes("prescription")) {
        fallbackReply = "Your 8:00 AM Lisinopril medication is scheduled. You can mark it as taken right on your medicine card.";
      } else if (lower.includes("lunch") || lower.includes("dinner") || lower.includes("meal") || lower.includes("food") || lower.includes("breakfast")) {
        fallbackReply = "For lunch today, roasted butternut squash soup with whole grain bread is planned. It's ready whenever you feel hungry.";
      } else if (lower.includes("sarah") || lower.includes("daughter") || lower.includes("family") || lower.includes("photo") || lower.includes("grandkids")) {
        fallbackReply = "Sarah shared three lovely new photos of Tommy playing soccer this morning. You can view them on your screen anytime.";
      } else if (lower.includes("door") || lower.includes("lock") || lower.includes("security") || lower.includes("safe") || lower.includes("window")) {
        fallbackReply = "Both the front and back doors are securely locked, and the hallway nightlight is set to turn on at dusk.";
      } else if (lower.includes("light") || lower.includes("living room") || lower.includes("kitchen")) {
        fallbackReply = "I have adjusted the living room reading lamp to a cozy, warm brightness for you.";
      } else if (lower.includes("help") || lower.includes("emergency") || lower.includes("call") || lower.includes("fall")) {
        fallbackReply = "If you need help right away, press the red SOS button on your screen or say 'call emergency' and I will reach Sarah immediately.";
      }

      return res.json({ reply: fallbackReply, source: "fallback" });
    } catch (err: any) {
      console.error("Voice reply handler error:", err);
      return res.json({
        reply: "I heard you clearly, Eleanor. Everything is calm and safe in the house.",
        source: "fallback",
      });
    }
  });

  // Vite dev middleware vs Production static serving
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ElderVoice Kiosk server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
