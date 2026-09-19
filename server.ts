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
      const { transcript, itemQuery, language = 'en' } = req.body;
      const prompt = (transcript || "Hello ElderVoice, what is my update for today?").trim();
      const lower = prompt.toLowerCase();

      // Language description lookup for Gemini system instruction
      const languageNames: Record<string, string> = {
        en: "English",
        hi: "Hindi (हिन्दी)",
        mr: "Marathi (मराठी)",
        pa: "Punjabi (ਪੰਜਾਬੀ)",
        es: "Spanish (Español)",
        fr: "French (Français)",
        de: "German (Deutsch)",
        it: "Italian (Italiano)",
        pt: "Portuguese (Português)",
        zh: "Simplified Chinese (简体中文)",
        ja: "Japanese (日本語)",
      };
      const requestedLangName = languageNames[language] || language;

      // Guard: strictly block financial features for senior user safety
      if (
        lower.includes("bank") ||
        lower.includes("credit card") ||
        lower.includes("debit") ||
        lower.includes("payment") ||
        lower.includes("transfer money") ||
        lower.includes("wallet") ||
        lower.includes("upi") ||
        lower.includes("pin number") ||
        lower.includes("पैसे") ||
        lower.includes("बैंक") ||
        lower.includes("खाते")
      ) {
        let blockReply = "For your financial safety and protection, financial and banking features are not available on this kiosk. Please consult Sarah or your local bank branch directly.";
        if (language === 'hi') {
          blockReply = "आपकी वित्तीय सुरक्षा के लिए, इस कियोस्क पर बैंकिंग या पैसे के लेन-देन की सुविधा उपलब्ध नहीं है। कृपया सारा से संपर्क करें।";
        } else if (language === 'mr') {
          blockReply = "तुमच्या आर्थिक सुरक्षेसाठी, या किओस्कवर बँक किंवा पैशांचे व्यवहार उपलब्ध नाहीत. कृपया थेट साराशी संपर्क साधा.";
        } else if (language === 'pa') {
          blockReply = "ਤੁਹਾਡੀ ਵਿੱਤੀ ਸੁਰੱਖਿਆ ਲਈ, ਇਸ ਕਿਓਸਕ ਤੇ ਬੈਂਕਿੰਗ ਜਾਂ ਪੈਸਿਆਂ ਦੇ ਲੈਣ-ਦੇਣ ਦੀ ਸੁਵਿਧਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਿੱਧਾ ਸਾਰਾਹ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।";
        }
        return res.json({
          reply: blockReply,
          source: "safety_guard",
        });
      }

      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `User query: "${prompt}"\nLanguage requested: "${requestedLangName}"\nContext info: Local household room-level items currently tracked:
- Reading Glasses: Kitchen island, 10 minutes ago
- House Keys: Entryway table tray, 25 minutes ago
- TV Remote: Living room armchair pocket, 45 minutes ago
- Daily Pill Box: Kitchen counter next to kettle, 2 hours ago
- Walking Cane: Front porch coat rack, 3 hours ago`,
            config: {
              systemInstruction:
                `You are ElderVoice, a compassionate, warm, patient smart home and wellbeing voice assistant speaking to a senior citizen named Eleanor on her home-mounted tablet kiosk. If she asks about a misplaced item, give a reassuring room-level answer based on the local tracked items. Provide a warm, clear, plain-language spoken reply in 1 to 2 short sentences. Speak gently, respectfully, and reassuringly exclusively in the user's requested language (${requestedLangName}). Never use markdown formatting, asterisks, bullet points, or complex technical jargon. Ensure the text is natural to be read or spoken aloud by a speech synthesizer.`,
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

      if (language === 'mr') {
        // Marathi fallbacks
        if (lower.includes("glass") || lower.includes("चष्मा") || lower.includes("वाचन")) {
          fallbackReply = "तुमचा वाचनाचा चष्मा १० मिनिटांपूर्वी स्वयंपाकघरातील टेबलवर पाहिला गेला होता.";
        } else if (lower.includes("key") || lower.includes("चावी") || lower.includes("चाव्या")) {
          fallbackReply = "तुमच्या घराच्या चाव्या २५ मिनिटांपूर्वी प्रवेशद्वाराच्या ट्रेमध्ये होत्या.";
        } else if (lower.includes("pill") || lower.includes("औषध") || lower.includes("गोळी")) {
          fallbackReply = "तुमची सकाळची औषधे वेळेवर आहेत. तुम्ही स्क्रीनवर औषध घेतल्याची नोंद करू शकता.";
        } else if (lower.includes("lunch") || lower.includes("जेवण") || lower.includes("दुपार")) {
          fallbackReply = "आज दुपारच्या जेवणात पौष्टिक भाजी आणि ताजे सूप आहे. तुम्हाला भूक लागेल तेव्हा ते तयार आहे.";
        } else if (lower.includes("door") || lower.includes("दरवाजा") || lower.includes("सुरक्षा")) {
          fallbackReply = "मुख्य दरवाजा सुरक्षितपणे बंद आहे आणि तुमचे घर पूर्णपणे सुरक्षित आहे.";
        } else {
          fallbackReply = "मी तुमच्या सोबत आहे, एलेनॉर. तुमचे सर्व वेळापत्रक व्यवस्थित सुरू आहे आणि घर सुरक्षित आहे.";
        }
      } else if (language === 'pa') {
        // Punjabi fallbacks
        if (lower.includes("glass") || lower.includes("ਐਨਕ") || lower.includes("ਚਸ਼ਮਾ")) {
          fallbackReply = "ਤੁਹਾਡੀਆਂ ਪੜ੍ਹਨ ਵਾਲੀਆਂ ਐਨਕਾਂ ਲਗਭਗ 10 ਮਿੰਟ ਪਹਿਲਾਂ ਰਸੋਈ ਦੇ ਕਾਊਂਟਰ ਤੇ ਦੇਖੀਆਂ ਗਈਆਂ ਸਨ।";
        } else if (lower.includes("key") || lower.includes("ਚਾਬੀ") || lower.includes("ਚਾਬੀਆਂ")) {
          fallbackReply = "ਤੁਹਾਡੇ ਘਰ ਦੀਆਂ ਚਾਬੀਆਂ 25 ਮਿੰਟ ਪਹਿਲਾਂ ਮੁੱਖ ਦਰਵਾਜ਼ੇ ਦੇ ਮੇਜ਼ ਤੇ ਸਨ।";
        } else if (lower.includes("pill") || lower.includes("ਦਵਾਈ") || lower.includes("ਗੋਲੀ")) {
          fallbackReply = "ਤੁਹਾਡੀ ਸਵੇਰ ਦੀ ਦਵਾਈ ਦਾ ਸਮਾਂ ਹੋ ਗਿਆ ਹੈ। ਤੁਸੀਂ ਸਕ੍ਰੀਨ ਤੇ ਇਸਨੂੰ ਲਿਆ ਗਿਆ ਦਰਜ ਕਰ ਸਕਦੇ ਹੋ।";
        } else if (lower.includes("lunch") || lower.includes("ਖਾਣਾ") || lower.includes("ਦੁਪਹਿਰ")) {
          fallbackReply = "ਅੱਜ ਦੁਪਹਿਰ ਦੇ ਖਾਣੇ ਵਿੱਚ ਸਵਾਦੀ ਅਤੇ ਤਾਜ਼ਾ ਸੂਪ ਤਿਆਰ ਹੈ। ਜਦੋਂ ਵੀ ਤੁਹਾਨੂੰ ਭੁੱਖ ਲੱਗੇ, ਤੁਸੀਂ ਲੈ ਸਕਦੇ ਹੋ।";
        } else if (lower.includes("door") || lower.includes("ਦਰਵਾਜ਼ਾ") || lower.includes("ਸੁਰੱਖਿਆ")) {
          fallbackReply = "ਮੁੱਖ ਦਰਵਾਜ਼ਾ ਬਿਲਕੁਲ ਸੁਰੱਖਿਅਤ ਬੰਦ ਹੈ ਅਤੇ ਤੁਹਾਡਾ ਘਰ ਸ਼ਾਂਤ ਅਤੇ ਸੁਰੱਖਿਅਤ ਹੈ।";
        } else {
          fallbackReply = "ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ, ਐਲੀਨੋਰ। ਤੁਹਾਡਾ ਸਾਰਾ ਕੰਮ ਸਮੇਂ ਸਿਰ ਹੈ ਅਤੇ ਤੁਹਾਡਾ ਘਰ ਬਿਲਕੁਲ ਸੁਰੱਖਿਅਤ ਹੈ।";
        }
      } else if (language === 'hi') {
        // Hindi fallbacks
        if (lower.includes("glass") || lower.includes("चश्मा") || lower.includes("पढ़ने")) {
          fallbackReply = "आपका पढ़ने का चश्मा 10 मिनट पहले रसोई के आइलैंड काउंटर पर देखा गया था।";
        } else if (lower.includes("key") || lower.includes("चाबी") || lower.includes("चाबियाँ")) {
          fallbackReply = "आपके घर की चाबियाँ 25 मिनट पहले प्रवेश द्वार की ट्रे में थीं।";
        } else if (lower.includes("pill") || lower.includes("दवाई") || lower.includes("गोली")) {
          fallbackReply = "आपकी सुबह की दवाई का समय निर्धारित है। आप स्क्रीन पर उसे लिया हुआ दर्ज कर सकती हैं।";
        } else if (lower.includes("lunch") || lower.includes("भोजन") || lower.includes("खाना")) {
          fallbackReply = "आज दोपहर के भोजन में पौष्टिक सूप और रोटी तैयार है। जब भी आपको भूख लगे आप ले सकती हैं।";
        } else if (lower.includes("door") || lower.includes("दरवाज़ा") || lower.includes("ताला")) {
          fallbackReply = "मुख्य दरवाज़ा सुरक्षित रूप से बंद है और आपका घर पूरी तरह सुरक्षित है।";
        } else {
          fallbackReply = "मैं आपके साथ ही हूँ, एलेनोर। आपके सभी कार्य समय पर हैं और घर सुरक्षित है।";
        }
      } else {
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

  // Dedicated real-time translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, sourceLang = "en", targetLang = "hi" } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Text to translate is required." });
      }

      const languageNames: Record<string, string> = {
        en: "English",
        hi: "Hindi (हिन्दी)",
        mr: "Marathi (मराठी)",
        pa: "Punjabi (ਪੰਜਾਬੀ)",
        es: "Spanish (Español)",
        fr: "French (Français)",
        de: "German (Deutsch)",
        it: "Italian (Italiano)",
        pt: "Portuguese (Português)",
        zh: "Simplified Chinese (简体中文)",
        ja: "Japanese (日本語)",
      };

      const srcName = languageNames[sourceLang] || sourceLang;
      const tgtName = languageNames[targetLang] || targetLang;

      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: `Translate the following text accurately, respectfully, and clearly from ${srcName} to ${tgtName}:\n\n"${text.trim()}"`,
            config: {
              systemInstruction: `You are an expert real-time language translator designed for an eldercare kiosk. Translate accurately, warmly, and naturally into ${tgtName}. Output ONLY the translated sentence with no surrounding quotation marks, markdown, explanations, or notes.`,
            },
          });

          const translated = response.text?.trim().replace(/^["']|["']$/g, "");
          if (translated) {
            return res.json({
              translatedText: translated,
              sourceLang,
              targetLang,
              source: "gemini",
            });
          }
        } catch (apiErr) {
          console.warn("Gemini translate error, using multilingual dictionary fallback:", apiErr);
        }
      }

      // Robust fallback translations for common phrases
      const clean = text.trim().toLowerCase();
      let fallback = text;

      const dict: Record<string, Record<string, string>> = {
        "where are my glasses?": {
          hi: "मेरा चश्मा कहाँ है?",
          mr: "माझा वाचनाचा चष्मा कुठे आहे?",
          pa: "ਮੇਰੀਆਂ ਐਨਕਾਂ ਕਿੱਥੇ ਹਨ?",
          en: "Where are my glasses?",
        },
        "where are my reading glasses?": {
          hi: "मेरा पढ़ने का चश्मा कहाँ है?",
          mr: "माझा वाचनाचा चष्मा कुठे आहे?",
          pa: "ਮੇਰੀਆਂ ਪੜ੍ਹਨ ਵਾਲੀਆਂ ਐਨਕਾਂ ਕਿੱਥੇ ਹਨ?",
          en: "Where are my reading glasses?",
        },
        "what medicine is next?": {
          hi: "मेरी अगली दवाई कौन सी है?",
          mr: "माझे पुढचे औषध कोणते आहे?",
          pa: "ਮੇਰੀ ਅਗਲੀ ਦਵਾਈ ਕਿਹੜੀ ਹੈ?",
          en: "What medicine is next?",
        },
        "what's for lunch today?": {
          hi: "आज दोपहर के भोजन में क्या है?",
          mr: "आज दुपारच्या जेवणात काय आहे?",
          pa: "ਅੱਜ ਦੁਪਹਿਰ ਦੇ ਖਾਣੇ ਵਿੱਚ ਕੀ ਹੈ?",
          en: "What's for lunch today?",
        },
        "is the front door locked?": {
          hi: "क्या मुख्य दरवाज़ा बंद है?",
          mr: "मुख्य दरवाजा बंद आहे का?",
          pa: "ਕੀ ਬਾਹਰਲਾ ਦਰਵਾਜ਼ਾ ਬੰਦ ਹੈ?",
          en: "Is the front door locked?",
        },
        "where are my keys?": {
          hi: "मेरी चाबियाँ कहाँ हैं?",
          mr: "माझ्या चाव्या कुठे आहेत?",
          pa: "ਮੇਰੀਆਂ ਚਾਬੀਆਂ ਕਿੱਥੇ ਹਨ?",
          en: "Where are my keys?",
        },
        "call sarah": {
          hi: "सारा को कॉल करें",
          mr: "साराला फोन करा",
          pa: "ਸਾਰਾਹ ਨੂੰ ਕਾਲ ਕਰੋ",
          en: "Call Sarah",
        },
        "i need help": {
          hi: "मुझे मदद चाहिए",
          mr: "मला मदतीची गरज आहे",
          pa: "ਮੈਨੂੰ ਮਦਦ ਚਾਹੀਦੀ ਹੈ",
          en: "I need help",
        },
        "good morning": {
          hi: "शुभ प्रभात",
          mr: "शुभ सकाळ",
          pa: "ਸ਼ੁਭ ਸਵੇਰ",
          en: "Good morning",
        },
        "good afternoon": {
          hi: "शुभ दोपहर",
          mr: "शुभ दुपार",
          pa: "ਸ਼ੁਭ ਦੁਪਹਿਰ",
          en: "Good afternoon",
        },
        "good evening": {
          hi: "शुभ संध्या",
          mr: "शुभ संध्याकाळ",
          pa: "ਸ਼ੁਭ ਸ਼ਾਮ",
          en: "Good evening",
        },
        "thank you": {
          hi: "धन्यवाद",
          mr: "धन्यवाद",
          pa: "ਧੰਨਵਾਦ",
          en: "Thank you",
        },
        "how are you?": {
          hi: "आप कैसे हैं?",
          mr: "तुम्ही कसे आहात?",
          pa: "ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?",
          en: "How are you?",
        },
      };

      for (const [phrase, translations] of Object.entries(dict)) {
        if (clean.includes(phrase)) {
          fallback = translations[targetLang] || translations["hi"] || text;
          break;
        }
      }

      return res.json({
        translatedText: fallback,
        sourceLang,
        targetLang,
        source: "dictionary",
      });
    } catch (err) {
      console.error("Translate route error:", err);
      return res.status(500).json({ error: "Failed to translate text." });
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
