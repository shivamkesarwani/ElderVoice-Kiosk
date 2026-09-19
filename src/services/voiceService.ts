import { VoiceExchange } from '../types';

/**
 * Lazily requested voice response service communicating with Gemini API endpoint
 */
export async function requestVoiceReply(text: string, language: string = 'en'): Promise<VoiceExchange> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    const res = await fetch('/api/voice-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text, language }),
    });

    const data = await res.json();
    const replyText = data.reply || "I am right here with you, Eleanor. Everything is calm and safe.";

    return {
      transcript: text,
      reply: replyText,
      timestamp,
      source: data.source || 'gemini',
    };
  } catch (err) {
    console.error('Failed to get voice reply:', err);
    return {
      transcript: text,
      reply: "I am right here with you, Eleanor. Everything is in order and on schedule.",
      timestamp,
      source: 'fallback',
    };
  }
}

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  source: 'gemini' | 'dictionary';
}

/**
 * Service to translate text via server endpoint
 */
export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'hi'
): Promise<TranslationResult> {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });
    if (!res.ok) {
      throw new Error(`Translation failed with status: ${res.status}`);
    }
    const data = await res.json();
    return {
      translatedText: data.translatedText || text,
      sourceLang,
      targetLang,
      source: data.source || 'gemini',
    };
  } catch (err) {
    console.error('Translation request error:', err);
    return {
      translatedText: text,
      sourceLang,
      targetLang,
      source: 'dictionary',
    };
  }
}
