import { VoiceExchange } from '../types';

/**
 * Lazily requested voice response service communicating with Gemini API endpoint
 */
export async function requestVoiceReply(text: string): Promise<VoiceExchange> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    const res = await fetch('/api/voice-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text }),
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
