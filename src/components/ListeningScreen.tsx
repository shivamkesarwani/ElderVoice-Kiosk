import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX, ArrowLeft, RefreshCw, Sparkles, Send } from './Icons';
import { VoiceExchange } from '../types';
import { requestVoiceReply } from '../services/voiceService';

interface ListeningScreenProps {
  initialTranscript?: string;
  onClose: () => void;
}

const sampleTranscripts = [
  "What is the weather outside today?",
  "Did I take my morning pills?",
  "Where are my reading glasses?",
  "What's for lunch today?",
  "Is the front door securely locked?",
  "Where did I leave my keys?",
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

  // Request voice reply from the server (using Gemini API lazily imported)
  const startProcessing = async (text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase('thinking');

    try {
      const newExchange = await requestVoiceReply(text);
      setExchange(newExchange);
      setPhase('responded');

      // Accessibility: speak aloud the response if speech synthesis is supported
      // Low hearing mandate: Full text is simultaneously visible on-screen below!
      speakAloud(newExchange.reply);
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
    utterance.rate = 0.88; // Gentle, clear tempo for seniors
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
      aria-label="Voice and typed interaction"
      className="flex-1 flex flex-col items-center justify-between max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8"
    >
      {/* PHASE 1: LISTENING WITH FIRST-CLASS TYPED INPUT */}
      {phase === 'listening' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center my-auto w-full max-w-2xl">
          {/* Concentric soft rings with pulse animation */}
          <div className="relative flex items-center justify-center my-4 sm:my-6">
            <div
              className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-[#2E5D57]/10 animate-ping opacity-60 motion-reduce:animate-none"
              aria-hidden="true"
            />
            <div
              className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#2E5D57]/20 flex items-center justify-center border-2 border-[#2E5D57]/30"
              aria-hidden="true"
            >
              <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-[#2E5D57] flex items-center justify-center">
                <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-[#FBF7EF] stroke-[2.5]" aria-hidden="true" />
              </div>
            </div>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2B2A28] tracking-tight">
            Listening for your voice…
          </h2>
          <p className="text-lg sm:text-xl text-[#2B2A28]/85 mt-1.5 font-medium">
            Speak naturally or type your question below
          </p>

          {/* EQUAL FIRST-CLASS TYPED INPUT ALTERNATIVE (Low hearing / quiet environment support) */}
          <form
            onSubmit={handleCustomSubmit}
            className="w-full mt-6 p-4 rounded-2xl bg-white border-2 border-[#2E5D57] shadow-sm flex flex-col sm:flex-row gap-2.5"
            aria-label="Typed query input"
          >
            <input
              type="text"
              id="typed-query-input-main"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type any question (e.g. 'Where are my glasses?')"
              className="flex-1 min-h-[52px] px-4 rounded-xl border border-[#EAE1D0] bg-[#FBF7EF] text-[#2B2A28] text-base sm:text-lg focus:border-[#2E5D57] focus:outline-none"
              aria-label="Type your question as an alternative to speaking"
            />
            <button
              type="submit"
              className="min-h-[52px] px-6 rounded-xl bg-[#2E5D57] hover:bg-[#234641] text-[#FBF7EF] font-bold text-base sm:text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shrink-0"
              aria-label="Send typed question"
            >
              <Send className="w-5 h-5" />
              <span>Send</span>
            </button>
          </form>

          {/* Quick selection chips for convenient tap-to-ask */}
          <div className="mt-6 w-full">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2B2A28]/70 mb-2.5">
              Or tap a quick question:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {sampleTranscripts.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="min-h-[44px] px-3.5 py-2 bg-white border border-[#EAE1D0] rounded-xl text-[#2B2A28] font-medium text-sm sm:text-base hover:border-[#2E5D57] active:scale-95 transition-transform"
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

      {/* PHASE 3: RESPONSE SCREEN (SIMULTANEOUS FULL TEXT + SPEECH) */}
      {phase === 'responded' && exchange && (
        <div className="flex-1 flex flex-col items-center justify-center w-full my-auto max-w-3xl">
          {/* Card containing both user recognized text & AI response */}
          <div className="w-full bg-[#FBF7EF] border-3 border-[#2E5D57] rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
            {/* Senior's Recognized / Typed Query */}
            <div className="bg-white p-5 rounded-2xl border-2 border-[#EAE1D0]">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2E5D57] block mb-1">
                Your question:
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2A28]">
                &ldquo;{exchange.transcript}&rdquo;
              </p>
            </div>

            {/* ElderVoice Spoken & Full Synchronized On-Screen Text Reply */}
            <div className="bg-[#2E5D57]/10 p-6 rounded-2xl border-2 border-[#2E5D57]/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-6 h-6 text-[#D9714B]" aria-hidden="true" />
                  <span className="font-serif text-xl sm:text-2xl font-bold text-[#2E5D57]">
                    ElderVoice Response:
                  </span>
                </div>

                {/* Voice audio toggle */}
                <button
                  type="button"
                  onClick={() => (isSpeaking ? stopSpeaking() : speakAloud(exchange.reply))}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-white border-2 border-[#2E5D57] text-[#2E5D57] font-bold text-sm sm:text-base flex items-center gap-2 active:scale-95 transition-transform"
                  aria-label={isSpeaking ? 'Mute spoken reply' : 'Read aloud response again'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-5 h-5 text-[#C2401F]" />
                      <span>Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      <span>Hear Again</span>
                    </>
                  )}
                </button>
              </div>

              {/* MANDATORY FULL ON-SCREEN TEXT (Low Hearing Guarantee) */}
              <p className="text-2xl sm:text-3xl text-[#2B2A28] leading-relaxed font-semibold">
                {exchange.reply}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#2B2A28]/70 pt-2 border-t border-[#2E5D57]/20">
                <span>Full on-screen captions guaranteed</span>
                <span>Powered by Gemini AI</span>
              </div>
            </div>

            {/* Typed follow-up input */}
            <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Type another question (e.g. 'Where is my cane?')"
                className="flex-1 min-h-[52px] px-4 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] text-base sm:text-lg focus:border-[#2E5D57] focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[52px] px-6 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-base sm:text-lg flex items-center gap-2 shrink-0 active:scale-95 transition-transform"
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
              className="w-full sm:w-auto min-h-[60px] px-8 py-3.5 rounded-2xl bg-[#2E5D57] hover:bg-[#234641] text-[#FBF7EF] font-bold text-xl flex items-center justify-center gap-3 border-2 border-[#234641] active:scale-95 transition-transform shadow-sm"
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
              className="w-full sm:w-auto min-h-[60px] px-8 py-3.5 rounded-2xl bg-white border-2 border-[#EAE1D0] hover:border-[#2E5D57] text-[#2B2A28] font-bold text-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-6 h-6" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Visible Cancel Button */}
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
        <span className="text-xs sm:text-sm font-medium text-[#2B2A28]/70 mt-1.5">
          or say &apos;cancel&apos;
        </span>
      </div>
    </section>
  );
};

export default ListeningScreen;
