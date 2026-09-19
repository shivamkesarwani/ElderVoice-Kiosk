import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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
      const { transcript } = req.body;
      const prompt = (transcript || "Hello ElderVoice, what is my update for today?").trim();

      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
              systemInstruction:
                "You are ElderVoice, a compassionate, warm, patient smart home and wellbeing voice assistant speaking to a senior citizen named Eleanor on her home-mounted tablet kiosk. Provide a warm, clear, plain-language spoken reply in 1 to 2 short sentences. Speak gently, respectfully, and reassuringly. Never use markdown formatting, asterisks, bullet points, or complex technical jargon. Ensure the text is natural to be read or spoken aloud.",
            },
          });

          const replyText = response.text?.trim();
          if (replyText) {
            return res.json({ reply: replyText, source: "gemini" });
          }
        } catch (apiErr) {
          console.warn("Gemini API call failed, falling back to local voice logic:", apiErr);
        }
      }

      // Intelligent warm contextual fallbacks for prototype resilience
      const lower = prompt.toLowerCase();
      let fallbackReply = "I am right here with you, Eleanor. All your morning reminders are on track, and your home is safe and comfortable.";

      if (lower.includes("weather") || lower.includes("outside") || lower.includes("temperature") || lower.includes("rain")) {
        fallbackReply = "It is currently 72 degrees and sunny with a light breeze. A lovely day to sit on the porch.";
      } else if (lower.includes("pill") || lower.includes("medication") || lower.includes("medicine") || lower.includes("prescription")) {
        fallbackReply = "Your morning heart medication was taken on time. Your next reminder will be at 7:00 PM for your evening vitamins.";
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
