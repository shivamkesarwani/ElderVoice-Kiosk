import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mic, Volume2, VolumeX, RefreshCw, Send, Sparkles, Check, Globe } from './Icons';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/voiceService';
import { LanguageCode } from '../types';

interface LanguageTranslatorScreenProps {
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const LanguageTranslatorScreen: React.FC<LanguageTranslatorScreenProps> = ({
  onClose,
  onShowToast,
}) => {
  const { language, supportedLanguages, t } = useLanguage();

  // Default: from English to Current Language (or if current is Hindi/Marathi/Punjabi, from that to English)
  const [sourceLang, setSourceLang] = useState<LanguageCode>(() => {
    return language === 'en' ? 'en' : language;
  });
  const [targetLang, setTargetLang] = useState<LanguageCode>(() => {
    return language === 'en' ? 'hi' : 'en';
  });

  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micStatusMsg, setMicStatusMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const sourceInfo = supportedLanguages.find((l) => l.code === sourceLang) || supportedLanguages[0];
  const targetInfo = supportedLanguages.find((l) => l.code === targetLang) || supportedLanguages[1];

  // Stop speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Quick preset phrases in source language
  const presetPhrases = [
    t('phraseHelp'),
    t('phraseGlasses'),
    t('phrasePills'),
    t('phraseHungry'),
    t('phraseThankYou'),
    t('phraseHowAreYou'),
  ];

  // Handle translation
  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate !== undefined ? textToTranslate : inputText).trim();
    if (!text) return;

    setIsTranslating(true);
    try {
      const res = await translateText(text, sourceLang, targetLang);
      setTranslatedText(res.translatedText);
      // Automatically offer audio playback
      speakText(res.translatedText, targetInfo.locale);
    } catch (err) {
      console.error('Translation failed:', err);
      onShowToast('Could not complete translation. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Swap source and target languages
  const handleSwapLanguages = () => {
    const prevSrc = sourceLang;
    const prevTgt = targetLang;
    setSourceLang(prevTgt);
    setTargetLang(prevSrc);
    // Swap text if both exist
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  };

  // Text to speech
  const speakText = (text: string, locale: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale || 'en-US';
    utterance.rate = 0.88;
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

  // Start Voice Recognition for Source Language
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicStatusMsg(t('micUnsupported'));
      onShowToast('Microphone speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = sourceInfo.locale || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatusMsg(`${t('micListeningActive')} (${sourceInfo.nativeName})`);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentSaid = final || interim;
        if (currentSaid) {
          setInputText(currentSaid);
        }

        if (final) {
          setIsListening(false);
          setMicStatusMsg(null);
          handleTranslate(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMicStatusMsg(t('micPermissionDenied'));
        } else if (event.error === 'no-speech') {
          setMicStatusMsg('No speech detected. Please tap to speak again.');
        } else {
          setMicStatusMsg(`Microphone error (${event.error}). Please type below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setMicStatusMsg(t('micPermissionDenied'));
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    if (inputText.trim()) {
      handleTranslate(inputText);
    }
  };

  return (
    <section
      id="kiosk-translator-screen"
      role="region"
      aria-label="Real-time Language Translator"
      className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-8 py-5 sm:py-7 gap-5 pb-24 sm:pb-8"
    >
      {/* Top Bar with Back Button & Title */}
      <div className="flex items-center justify-between border-b-2 border-[#EAE1D0] pb-4">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[52px] px-4 py-2.5 rounded-2xl bg-white border-2 border-[#EAE1D0] hover:border-[#2E5D57] text-[#2E5D57] font-bold text-base sm:text-lg flex items-center gap-2 active:scale-95 transition-transform"
          aria-label={t('returnToKiosk')}
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          <span>{t('returnToKiosk')}</span>
        </button>

        <div className="text-center sm:text-right">
          <div className="flex items-center justify-end gap-2 text-[#2E5D57]">
            <Globe className="w-5 h-5" />
            <h1 className="font-serif text-xl sm:text-3xl font-bold text-[#2B2A28]">
              {t('translatorTitle')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#2B2A28]/75 font-medium mt-0.5">
            {t('translatorSubtitle')}
          </p>
        </div>
      </div>

      {/* Language Selectors & Swap Bar */}
      <div className="bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Source Language Picker */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <span className="text-sm font-bold uppercase tracking-wider text-[#2E5D57] min-w-[50px]">
            {t('sourceLanguage')}:
          </span>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as LanguageCode)}
            className="flex-1 min-h-[50px] px-4 rounded-xl bg-white border-2 border-[#EAE1D0] font-bold text-base sm:text-lg text-[#2B2A28] focus:border-[#2E5D57] focus:outline-none"
            aria-label="Select source language"
          >
            {supportedLanguages.map((l) => (
              <option key={`src-${l.code}`} value={l.code}>
                {l.flag} {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwapLanguages}
          className="min-h-[48px] min-w-[48px] px-3 py-2 rounded-xl bg-white border-2 border-[#EAE1D0] hover:border-[#2E5D57] text-[#2E5D57] font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          aria-label={t('swapLanguages')}
          title={t('swapLanguages')}
        >
          <RefreshCw className="w-5 h-5 stroke-[2.25]" />
          <span className="text-sm hidden sm:inline">{t('swapLanguages')}</span>
        </button>

        {/* Target Language Picker */}
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <span className="text-sm font-bold uppercase tracking-wider text-[#2E5D57] min-w-[50px]">
            {t('targetLanguage')}:
          </span>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
            className="flex-1 min-h-[50px] px-4 rounded-xl bg-white border-2 border-[#EAE1D0] font-bold text-base sm:text-lg text-[#2B2A28] focus:border-[#2E5D57] focus:outline-none"
            aria-label="Select target language"
          >
            {supportedLanguages.map((l) => (
              <option key={`tgt-${l.code}`} value={l.code}>
                {l.flag} {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Dual Cards Grid (Input & Translated Output) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 items-stretch">
        {/* Card 1: Source Input (Voice & Text) */}
        <div className="bg-white border-2 border-[#EAE1D0] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#2E5D57] uppercase tracking-wider flex items-center gap-1.5">
                <span>{sourceInfo.flag}</span>
                <span>{sourceInfo.nativeName}</span>
              </span>

              {/* Voice Speak Input Button */}
              <button
                type="button"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                className={`min-h-[46px] px-3.5 py-1.5 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 border-2 transition-all ${
                  isListening
                    ? 'bg-[#C2401F] border-[#A63316] text-[#FBF7EF] animate-pulse'
                    : 'bg-[#2E5D57]/10 border-[#2E5D57] text-[#2E5D57] hover:bg-[#2E5D57] hover:text-[#FBF7EF]'
                }`}
                aria-label={isListening ? 'Stop listening' : `Speak in ${sourceInfo.name}`}
              >
                <Mic className="w-5 h-5" />
                <span>{isListening ? 'Listening...' : 'Tap to Speak'}</span>
              </button>
            </div>

            {/* Mic Status Banner if active or error */}
            {micStatusMsg && (
              <div className="mb-3 p-3 rounded-xl bg-[#2E5D57]/10 text-xs sm:text-sm font-medium text-[#2E5D57]">
                {micStatusMsg}
              </div>
            )}

            {/* Large Textarea for input */}
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('typeOrSpeakToTranslate')}
              className="w-full p-4 rounded-2xl border-2 border-[#EAE1D0] bg-[#FBF7EF] text-lg sm:text-2xl text-[#2B2A28] focus:border-[#2E5D57] focus:outline-none resize-none font-medium leading-relaxed"
              aria-label="Text to translate"
            />
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-sm text-[#2B2A28]/60 hover:text-[#C2401F] font-semibold"
              >
                Clear text
              </button>
            )}

            <button
              type="button"
              onClick={() => handleTranslate()}
              disabled={isTranslating || !inputText.trim()}
              className="ml-auto min-h-[52px] px-6 py-2.5 rounded-xl bg-[#2E5D57] hover:bg-[#234641] disabled:opacity-50 text-[#FBF7EF] font-bold text-base sm:text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {isTranslating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>{t('translating')}</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{t('translateButton')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Target Translation Output */}
        <div className="bg-[#2E5D57]/5 border-2 border-[#2E5D57]/40 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#2E5D57] uppercase tracking-wider flex items-center gap-1.5">
                <span>{targetInfo.flag}</span>
                <span>{targetInfo.nativeName} ({targetInfo.name})</span>
              </span>

              {/* Listen to translation aloud */}
              {translatedText && (
                <button
                  type="button"
                  onClick={() =>
                    isSpeaking ? stopSpeaking() : speakText(translatedText, targetInfo.locale)
                  }
                  className="min-h-[46px] px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#2E5D57] text-[#2E5D57] font-bold text-sm sm:text-base flex items-center gap-2 active:scale-95 transition-transform"
                  aria-label={isSpeaking ? 'Stop audio' : 'Listen to translation'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-5 h-5 text-[#C2401F]" />
                      <span>Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      <span>{t('speakTranslation')}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Translation Output Display */}
            <div className="min-h-[140px] p-4 rounded-2xl bg-white border-2 border-[#2E5D57]/30 flex flex-col justify-center">
              {translatedText ? (
                <p className="text-xl sm:text-3xl text-[#2B2A28] font-bold leading-relaxed">
                  {translatedText}
                </p>
              ) : (
                <p className="text-[#2B2A28]/45 italic text-base sm:text-xl">
                  {isTranslating
                    ? t('translating')
                    : 'Translation will appear here in large, easy-to-read text...'}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-[#2B2A28]/70">
            <span>Powered by Gemini &amp; ElderVoice Multilingual Service</span>
            {translatedText && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(translatedText);
                  onShowToast('Translation copied!');
                }}
                className="font-bold text-[#2E5D57] hover:underline"
              >
                Copy Text
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Senior Preset Phrases for 1-Tap Translation */}
      <div className="bg-white border-2 border-[#EAE1D0] rounded-2xl p-4 sm:p-5">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2E5D57] block mb-2.5">
          {t('commonPhrases')}
        </span>
        <div className="flex flex-wrap gap-2">
          {presetPhrases.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(phrase);
                handleTranslate(phrase);
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FBF7EF] border border-[#EAE1D0] hover:border-[#2E5D57] text-[#2B2A28] text-sm sm:text-base font-semibold active:scale-95 transition-transform"
            >
              &ldquo;{phrase}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LanguageTranslatorScreen;
