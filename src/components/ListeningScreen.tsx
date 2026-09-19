import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX, ArrowLeft, RefreshCw, Sparkles, Send } from './Icons';
import { VoiceExchange } from '../types';
import { requestVoiceReply } from '../services/voiceService';
import { useLanguage } from '../context/LanguageContext';

interface ListeningScreenProps {
  initialTranscript?: string;
  onClose: () => void;
}

export const ListeningScreen: React.FC<ListeningScreenProps> = ({
  initialTranscript,
  onClose,
}) => {
  const { t, language, languageInfo } = useLanguage();
  // States: 'listening' -> 'thinking' -> 'responded'
  const [phase, setPhase] = useState<'listening' | 'thinking' | 'responded'>('listening');
  const [transcript, setTranscript] = useState<string>(initialTranscript || '');
  const [interimText, setInterimText] = useState<string>('');
  const [exchange, setExchange] = useState<VoiceExchange | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [micState, setMicState] = useState<'listening' | 'idle' | 'unsupported' | 'denied'>('idle');
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const recognitionRef = useRef<any>(null);

  const sampleTranscripts = [
    t('sampleQueryGlasses'),
    t('sampleQueryPills'),
    t('sampleQueryLunch'),
    t('sampleQueryDoor'),
    t('sampleQueryKeys'),
    t('sampleQuerySarah'),
  ];

  // Request voice reply from the server
  const startProcessing = async (text: string) => {
    stopListening();
    if (!isMountedRef.current) return;
    setPhase('thinking');

    try {
      const newExchange = await requestVoiceReply(text, language);
      if (!isMountedRef.current) return;
      setExchange(newExchange);
      setPhase('responded');

      // Accessibility: speak aloud the response if speech synthesis is supported
      speakAloud(newExchange.reply);
    } catch (err) {
      console.error('Failed to get voice reply:', err);
      if (!isMountedRef.current) return;
      let fallbackText = "I am right here with you, Eleanor. Everything is in order and on schedule.";
      if (language === 'hi') {
        fallbackText = "मैं यहीं आपके साथ हूँ, एलेनोर। घर में सब कुछ शांत और व्यवस्थित है।";
      } else if (language === 'mr') {
        fallbackText = "मी इथेच आपल्यासोबत आहे, एलेनॉर. घरात सर्व काही शांत आणि व्यवस्थित आहे.";
      } else if (language === 'pa') {
        fallbackText = "ਮੈਂ ਇੱਥੇ ਹੀ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ, ਐਲੀਨੋਰ। ਘਰ ਵਿੱਚ ਸਭ ਕੁਝ ਸ਼ਾਂਤ ਅਤੇ ਠੀਕ ਹੈ।";
      }

      const fallbackExchange: VoiceExchange = {
        transcript: text,
        reply: fallbackText,
        timestamp: new Date().toLocaleTimeString(languageInfo.locale || 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        source: 'fallback',
      };
      setExchange(fallbackExchange);
      setPhase('responded');
      speakAloud(fallbackText);
    }
  };

  // Start real browser speech recognition
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicState('unsupported');
      setMicErrorMsg(t('micUnsupported'));
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = languageInfo.locale || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (!isMountedRef.current) return;
        setMicState('listening');
        setMicErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        if (!isMountedRef.current) return;
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (final) {
          setTranscript(final);
          setInterimText('');
          startProcessing(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (!isMountedRef.current) return;
        if (event.error === 'not-allowed') {
          setMicState('denied');
          setMicErrorMsg(t('micPermissionDenied'));
        } else if (event.error === 'no-speech') {
          setMicState('idle');
          setMicErrorMsg('No voice heard. Tap the microphone to try speaking again.');
        } else {
          setMicState('idle');
          setMicErrorMsg(`Voice error (${event.error}). You can tap to retry or type below.`);
        }
      };

      recognition.onend = () => {
        if (!isMountedRef.current) return;
        if (micState === 'listening') {
          setMicState('idle');
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setMicState('unsupported');
      setMicErrorMsg(t('micPermissionDenied'));
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setMicState('idle');
  };

  // Initial mount behavior
  useEffect(() => {
    isMountedRef.current = true;

    if (initialTranscript) {
      setTranscript(initialTranscript);
      startProcessing(initialTranscript);
    } else {
      // Automatically initiate microphone listening for natural voice-first experience
      startListening();
    }

    return () => {
      isMountedRef.current = false;
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [initialTranscript]);

  const speakAloud = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = languageInfo.locale || 'en-US';
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
    stopListening();
    setTranscript(sample);
    startProcessing(sample);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    stopListening();
    const q = customInput.trim();
    setTranscript(q);
    setCustomInput('');
    startProcessing(q);
  };

  const handleAskAnother = () => {
    stopSpeaking();
    setExchange(null);
    setTranscript('');
    setInterimText('');
    setPhase('listening');
    startListening();
  };

  const handleManualDoneSpeaking = () => {
    const text = (interimText || transcript || customInput).trim();
    if (text) {
      startProcessing(text);
    } else {
      stopListening();
    }
  };

  return (
    <section
      id="kiosk-listening-screen"
      role="region"
      aria-label="Voice and typed interaction"
      className="flex-1 flex flex-col items-center justify-between max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8"
    >
      {/* PHASE 1: REAL MICROPHONE LISTENING */}
      {phase === 'listening' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center my-auto w-full max-w-2xl">
          {/* Concentric rings with active microphone pulse */}
          <div className="relative flex items-center justify-center my-4 sm:my-6">
            {micState === 'listening' && (
              <div
                className="absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-[#2E5D57]/20 animate-ping opacity-75 motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={micState === 'listening' ? stopListening : startListening}
              className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center border-4 transition-transform active:scale-95 shadow-md ${
                micState === 'listening'
                  ? 'bg-[#2E5D57]/20 border-[#2E5D57]'
                  : 'bg-white border-[#EAE1D0] hover:border-[#2E5D57]'
              }`}
              aria-label={micState === 'listening' ? 'Stop listening' : 'Start listening'}
            >
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-[#FBF7EF] transition-colors ${
                  micState === 'listening' ? 'bg-[#2E5D57]' : 'bg-[#2E5D57]/80'
                }`}
              >
                <Mic className="w-12 h-12 stroke-[2.5]" aria-hidden="true" />
              </div>
            </button>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2B2A28] tracking-tight">
            {micState === 'listening' ? t('listening') : t('tapToSpeak')}
          </h2>

          {/* Active Audio / Soundwave indication */}
          {micState === 'listening' && (
            <div className="flex items-center gap-1.5 justify-center mt-3" aria-hidden="true">
              <span className="w-1.5 h-6 bg-[#2E5D57] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-10 bg-[#2E5D57] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-7 bg-[#2E5D57] rounded-full animate-bounce" />
              <span className="w-1.5 h-12 bg-[#2E5D57] rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1.5 h-5 bg-[#2E5D57] rounded-full animate-bounce [animation-delay:-0.4s]" />
            </div>
          )}

          {/* Live speech transcription display */}
          <div className="mt-3 min-h-[48px] px-4 py-2 flex items-center justify-center">
            {interimText ? (
              <p className="text-xl sm:text-2xl font-semibold text-[#2E5D57] animate-pulse">
                &ldquo;{interimText}&rdquo;
              </p>
            ) : (
              <p className="text-base sm:text-lg text-[#2B2A28]/85 font-medium">
                {micState === 'listening'
                  ? `${t('micListeningActive')} (${languageInfo.nativeName})`
                  : t('micListeningPrompt')}
              </p>
            )}
          </div>

          {/* If error or permissions issue */}
          {micErrorMsg && (
            <div className="mt-2 p-3 rounded-xl bg-[#C2401F]/10 border border-[#C2401F]/30 text-[#C2401F] text-sm font-semibold max-w-md">
              {micErrorMsg}
            </div>
          )}

          {/* Finish Speaking Button if words detected */}
          {(interimText || micState === 'listening') && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleManualDoneSpeaking}
                className="min-h-[50px] px-6 py-2.5 rounded-xl bg-[#2E5D57] hover:bg-[#234641] text-[#FBF7EF] font-bold text-base sm:text-lg shadow-sm active:scale-95 transition-transform"
              >
                {t('finishSpeaking')}
              </button>
            </div>
          )}

          {/* EQUAL FIRST-CLASS TYPED INPUT ALTERNATIVE (Low hearing / quiet environment support) */}
          <form
            onSubmit={handleCustomSubmit}
            className="w-full mt-5 p-3 sm:p-4 rounded-2xl bg-white border-2 border-[#2E5D57] shadow-sm flex flex-col sm:flex-row gap-2.5"
            aria-label="Typed query input"
          >
            <input
              type="text"
              id="typed-query-input-main"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={t('typeAQuestion')}
              className="flex-1 min-h-[52px] px-4 rounded-xl border border-[#EAE1D0] bg-[#FBF7EF] text-[#2B2A28] text-base sm:text-lg focus:border-[#2E5D57] focus:outline-none font-medium"
              aria-label="Type your question as an alternative to speaking"
            />
            <button
              type="submit"
              className="min-h-[52px] px-6 rounded-xl bg-[#2E5D57] hover:bg-[#234641] text-[#FBF7EF] font-bold text-base sm:text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform shrink-0"
              aria-label="Send typed question"
            >
              <Send className="w-5 h-5" />
              <span>{t('send')}</span>
            </button>
          </form>

          {/* Quick selection chips for convenient tap-to-ask */}
          <div className="mt-5 w-full">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2E5D57] mb-2.5">
              {t('tryAsking')}
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
            {t('thinking')}
          </h2>
          <p className="text-xl text-[#2B2A28]/80 mt-2 font-medium">
            &ldquo;{transcript}&rdquo;
          </p>
        </div>
      )}

      {/* PHASE 3: RESPONSE SCREEN (SIMULTANEOUS FULL TEXT + SPEECH) */}
      {phase === 'responded' && exchange && (
        <div className="flex-1 flex flex-col items-center justify-center w-full my-auto max-w-3xl">
          <div className="w-full bg-[#FBF7EF] border-3 border-[#2E5D57] rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
            {/* Recognized / Typed Query */}
            <div className="bg-white p-5 rounded-2xl border-2 border-[#EAE1D0]">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2E5D57] block mb-1">
                Your question:
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2A28]">
                &ldquo;{exchange.transcript}&rdquo;
              </p>
            </div>

            {/* ElderVoice Spoken & Synchronized Full On-Screen Text */}
            <div className="bg-[#2E5D57]/10 p-6 rounded-2xl border-2 border-[#2E5D57]/30 space-y-4">
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

              {/* MANDATORY FULL ON-SCREEN TEXT */}
              <p className="text-2xl sm:text-3xl text-[#2B2A28] leading-relaxed font-semibold">
                {exchange.reply}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#2B2A28]/70 pt-2 border-t border-[#2E5D57]/20">
                <span>Full on-screen captions in {languageInfo.nativeName}</span>
                <span>Powered by Gemini AI</span>
              </div>
            </div>

            {/* Typed follow-up input */}
            <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={t('typeAQuestion')}
                className="flex-1 min-h-[52px] px-4 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] text-base sm:text-lg focus:border-[#2E5D57] focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-[52px] px-6 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-base sm:text-lg flex items-center gap-2 shrink-0 active:scale-95 transition-transform"
              >
                <Send className="w-5 h-5" />
                <span>{t('send')}</span>
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
              <span>{t('tryAgain')}</span>
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
              <span>{t('returnToKiosk')}</span>
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
            stopListening();
            onClose();
          }}
          className="min-h-[56px] min-w-[200px] px-8 py-3 rounded-2xl bg-white border-2 border-[#EAE1D0] text-[#2B2A28] font-bold text-xl active:scale-95 transition-transform hover:border-[#D9714B]"
          aria-label={`${t('cancel')} - return home`}
        >
          {t('cancel')}
        </button>
      </div>
    </section>
  );
};

export default ListeningScreen;
