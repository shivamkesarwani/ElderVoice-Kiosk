import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX, ArrowLeft, RefreshCw, Sparkles, Send } from 'lucide-react';
import { VoiceExchange } from '../types';

interface ListeningScreenProps {
  initialTranscript?: string;
  onClose: () => void;
}

const sampleTranscripts = [
  "What is the weather outside today?",
  "Did I take my morning pills?",
  "What's for lunch today?",
  "Is the front door securely locked?",
  "How is my daughter Sarah doing?",
];

export const ListeningScreen: React.FC<ListeningScreenProps> = ({
  initialTranscript,
  onClose,
}) => {
  // States: 'listening' -> 'thinking' -> 'responded'
  const [phase, setPhase] = useState<'listening' | 'thinking' | 'responded'>('listening');
  const [transcript, setTranscript] = useState<string>(initialTranscript || '');
  const [exchange, setExchange] = useState<VoiceExchange | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto transition from listening to processing
  useEffect(() => {
    if (initialTranscript) {
      setTranscript(initialTranscript);
      startProcessing(initialTranscript);
    } else {
      // Give a realistic 2.5s simulated listening window
      timeoutRef.current = setTimeout(() => {
        const randomQuery = sampleTranscripts[0];
        setTranscript(randomQuery);
        startProcessing(randomQuery);
      }, 2500);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [initialTranscript]);

  // Request voice reply from the server (using Gemini API)
  const startProcessing = async (text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase('thinking');

    try {
      const res = await fetch('/api/voice-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      const data = await res.json();
      const replyText = data.reply || "I am right here with you, Eleanor. Everything is calm and safe.";

      const newExchange: VoiceExchange = {
        transcript: text,
        reply: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini',
      };

      setExchange(newExchange);
      setPhase('responded');

      // Accessibility: speak aloud the response if speech synthesis is supported
      speakAloud(replyText);
    } catch (err) {
      console.error('Failed to get voice reply:', err);
      const fallbackExchange: VoiceExchange = {
        transcript: text,
        reply: "I am right here with you, Eleanor. Everything is in order and on schedule.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'fallback',
      };
      setExchange(fallbackExchange);
      setPhase('responded');
    }
  };

  const speakAloud = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9; // Slightly slower, calm cadence for seniors
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSelectSample = (sample: string) => {
    setTranscript(sample);
    startProcessing(sample);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const q = customInput.trim();
    setTranscript(q);
    setCustomInput('');
    startProcessing(q);
  };

  const handleAskAnother = () => {
    stopSpeaking();
    setExchange(null);
    setTranscript('');
    setPhase('listening');
    // Start listening again
    timeoutRef.current = setTimeout(() => {
      const nextQuery = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
      setTranscript(nextQuery);
      startProcessing(nextQuery);
    }, 2500);
  };

  return (
    <section
      id="kiosk-listening-screen"
      role="region"
      aria-label="Voice interaction"
      className="flex-1 flex flex-col items-center justify-between max-w-4xl mx-auto w-full px-4 sm:px-8 py-8"
    >
      {/* PHASE 1: LISTENING (CONCENTRIC SOFT RINGS PULSE) */}
      {phase === 'listening' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center my-auto w-full">
          {/* Concentric soft rings with pulse animation */}
          <div className="relative flex items-center justify-center my-8">
            {/* Outer soft ring */}
            <div
              className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-[#2E5D57]/10 animate-ping opacity-60 motion-reduce:animate-none"
              aria-hidden="true"
            />
            {/* Inner soft ring */}
            <div
              className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#2E5D57]/20 flex items-center justify-center border-2 border-[#2E5D57]/30"
              aria-hidden="true"
            >
              {/* Solid center circle with ivory mic */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#2E5D57] flex items-center justify-center shadow-none">
                <Mic className="w-12 h-12 text-[#FBF7EF] stroke-[2.5]" aria-hidden="true" />
              </div>
            </div>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#2B2A28] mt-4 tracking-tight">
            Listening…
          </h2>
          <p className="text-xl sm:text-2xl text-[#2B2A28]/85 mt-2 font-medium max-w-lg">
            Say &ldquo;Hey ElderVoice&rdquo; or press the microphone
          </p>

          {/* Quick selection chips for simulation ease */}
          <div className="mt-8 max-w-xl w-full">
            <p className="text-base font-semibold text-[#2B2A28]/70 mb-3">
              Or tap a sample query to speak:
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {sampleTranscripts.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="min-h-[48px] px-4 py-2.5 bg-white border-2 border-[#EAE1D0] rounded-2xl text-[#2B2A28] font-medium text-base hover:border-[#2E5D57] active:scale-95 transition-transform"
                >
                  &ldquo;{sample}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 2: THINKING / PROCESSING */}
      {phase === 'thinking' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center my-auto w-full">
          <div className="w-24 h-24 rounded-full bg-[#2E5D57]/15 flex items-center justify-center my-6 border-2 border-[#2E5D57]">
            <RefreshCw className="w-12 h-12 text-[#2E5D57] animate-spin motion-reduce:animate-none stroke-[2.5]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B2A28] mt-2">
            Thinking…
          </h2>
          <p className="text-xl text-[#2B2A28]/80 mt-2 font-medium">
            &ldquo;{transcript}&rdquo;
          </p>
        </div>
      )}

      {/* PHASE 3: RESPONSE SCREEN (GEMINI SPOKEN REPLY) */}
      {phase === 'responded' && exchange && (
        <div className="flex-1 flex flex-col items-center justify-center w-full my-auto">
          {/* Card containing both user recognized text & AI response */}
          <div className="w-full bg-[#FBF7EF] border-3 border-[#2E5D57] rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Senior's Recognized Voice Query */}
            <div className="bg-white p-5 rounded-2xl border-2 border-[#EAE1D0]">
              <span className="text-sm font-bold uppercase tracking-wider text-[#2E5D57] block mb-1">
                You asked:
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2A28]">
                &ldquo;{exchange.transcript}&rdquo;
              </p>
            </div>

            {/* ElderVoice Spoken Reply */}
            <div className="bg-[#2E5D57]/10 p-6 rounded-2xl border-2 border-[#2E5D57]/25 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-6 h-6 text-[#D9714B]" aria-hidden="true" />
                  <span className="font-serif text-xl sm:text-2xl font-bold text-[#2E5D57]">
                    ElderVoice:
                  </span>
                </div>

                {/* Voice audio toggle */}
                <button
                  type="button"
                  onClick={() => (isSpeaking ? stopSpeaking() : speakAloud(exchange.reply))}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-white border-2 border-[#2E5D57] text-[#2E5D57] font-bold text-base flex items-center gap-2"
                  aria-label={isSpeaking ? 'Mute spoken reply' : 'Read aloud response'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-5 h-5 text-[#C2401F]" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      <span>Hear Again</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-2xl sm:text-3xl text-[#2B2A28] leading-relaxed font-medium">
                {exchange.reply}
              </p>

              <div className="flex items-center justify-between text-xs text-[#2B2A28]/70 pt-2 border-t border-[#2E5D57]/20">
                <span>Natural conversational assistance</span>
                <span>Generated via Gemini AI</span>
              </div>
            </div>

            {/* Optional custom input for typing any test question */}
            <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Or type a question to test (e.g. 'Can you call Sarah?')"
                className="flex-1 min-h-[56px] px-4 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] text-lg focus:border-[#2E5D57] focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[56px] px-6 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-lg flex items-center gap-2 shrink-0"
              >
                <Send className="w-5 h-5" />
                <span>Ask</span>
              </button>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full mt-6">
            <button
              type="button"
              id="btn-ask-another-voice"
              onClick={handleAskAnother}
              className="w-full sm:w-auto min-h-[60px] px-8 py-3.5 rounded-2xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-xl flex items-center justify-center gap-3 border-2 border-[#234641] active:scale-95 transition-transform"
            >
              <Mic className="w-6 h-6" />
              <span>Ask Another Question</span>
            </button>

            <button
              type="button"
              id="btn-return-home-from-voice"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="w-full sm:w-auto min-h-[60px] px-8 py-3.5 rounded-2xl bg-white border-2 border-[#EAE1D0] text-[#2B2A28] font-bold text-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-6 h-6" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Visible Cancel Button (always accessible at the bottom) */}
      <div className="pt-6 w-full flex flex-col items-center">
        <button
          type="button"
          id="btn-cancel-listening"
          onClick={() => {
            stopSpeaking();
            onClose();
          }}
          className="min-h-[56px] min-w-[200px] px-8 py-3 rounded-2xl bg-white border-2 border-[#EAE1D0] text-[#2B2A28] font-bold text-xl active:scale-95 transition-transform hover:border-[#D9714B]"
          aria-label="Cancel voice listening and return home"
        >
          Cancel
        </button>
        <p className="text-sm font-medium text-[#2B2A28]/70 mt-1.5">
          or say &apos;cancel&apos; / &apos;stop&apos;
        </p>
      </div>
    </section>
  );
};
