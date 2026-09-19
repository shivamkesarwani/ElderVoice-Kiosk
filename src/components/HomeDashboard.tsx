import React, { useMemo } from 'react';
import { Mic, PhoneCall, Globe } from './Icons';
import { CardFamilyNews } from './CardFamilyNews';
import { CardMeals } from './CardMeals';
import { CardReminders } from './CardReminders';
import { CardHomeStatus } from './CardHomeStatus';
import { CardLostItems } from './CardLostItems';
import { useLanguage } from '../context/LanguageContext';

/* =========================================================================================================
   NOTE: Background BLE scanning and always-listening wake-word detection are for the dedicated kiosk build
   only; a phone/tablet PWA install should treat voice and item-finder features as 'tap to activate' rather
   than assuming always-on background access, since iOS Safari restricts this for web apps.
   ========================================================================================================= */

interface HomeDashboardProps {
  onStartListening: (initialQuery?: string) => void;
  onOpenTranslator?: () => void;
  onShowToast: (msg: string) => void;
  onSosClick: () => void;
  isSosActive?: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartListening,
  onOpenTranslator,
  onShowToast,
  onSosClick,
  isSosActive = false,
}) => {
  const { t, language } = useLanguage();

  // Determine greeting based on current time of day and language
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return t('goodMorning');
    } else if (hour < 17) {
      return t('goodAfternoon');
    } else {
      return t('goodEvening');
    }
  }, [t, language]);

  const sampleVoicePrompts = [
    t('sampleQueryGlasses'),
    t('sampleQueryPills'),
    t('sampleQueryLunch'),
    t('sampleQueryDoor'),
    t('sampleQueryKeys'),
  ];

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-6 gap-6 pb-28 sm:pb-8">
      {/* Greeting & Status Banner */}
      <section
        id="kiosk-greeting-section"
        className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b-2 border-[#EAE1D0]"
        aria-label="Welcome greeting and home environment status"
      >
        <div>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#2B2A28]">
            {greeting}
          </h1>
          <p className="text-base sm:text-xl text-[#2B2A28]/80 mt-1 font-medium">
            {t('peacefulSchedule')}
          </p>
        </div>

        {/* Home Status Pill & Quick Translator shortcut */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenTranslator && (
            <button
              type="button"
              onClick={onOpenTranslator}
              className="inline-flex items-center gap-1.5 bg-white border-2 border-[#EAE1D0] hover:border-[#2E5D57] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[#2E5D57] font-bold text-sm sm:text-base active:scale-95 transition-transform"
            >
              <Globe className="w-4 h-4" />
              <span>{t('translator')}</span>
            </button>
          )}

          <div className="inline-flex items-center gap-2 bg-[#2E5D57]/10 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[#2E5D57] font-semibold text-sm sm:text-base">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2E5D57] animate-pulse" />
            <span>{t('livingRoomStatus')}</span>
          </div>
        </div>
      </section>

      {/* Responsive Grid Layout
          - Desktop / Tablet Landscape (>= 1024px): 2-column grid
          - Tablet Portrait (600px - 1023px): 1 column (cards stack)
          - Mobile (< 600px): 1 column (cards stack)
      */}
      <main
        id="kiosk-main-cards-grid"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-stretch"
        aria-label="Daily wellbeing and smart home overview"
      >
        {/* Core Daily Wellbeing & Household Cards */}
        <CardReminders onShowToast={onShowToast} />
        <CardLostItems onStartListening={onStartListening} onShowToast={onShowToast} />
        <CardFamilyNews onShowToast={onShowToast} />
        <CardMeals onShowToast={onShowToast} />
        <div className="lg:col-span-2">
          <CardHomeStatus onShowToast={onShowToast} />
        </div>
      </main>

      {/* Voice Bar for Tablet & Desktop (Hidden on small mobile since mobile has pinned bottom bar) */}
      <nav
        id="kiosk-voice-bar-desktop"
        className="hidden sm:flex bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-3xl p-5 sm:p-6 flex-col items-center justify-center gap-4 text-center mt-2"
        aria-label="Voice interaction bar"
      >
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {/* Main Microphone Button */}
          <button
            type="button"
            id="btn-voice-listen-trigger"
            onClick={() => onStartListening()}
            className="group flex items-center justify-center gap-4 min-h-[64px] px-8 py-3.5 rounded-2xl bg-[#2E5D57] hover:bg-[#234641] text-[#FBF7EF] font-bold text-xl sm:text-2xl border-2 border-[#234641] active:scale-95 transition-all w-full sm:w-auto shadow-sm"
            aria-label={`${t('tapToSpeak')} - ${t('orSayGreeting')}`}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Mic className="w-6 h-6 text-[#FBF7EF] stroke-[2.5]" aria-hidden="true" />
            </div>
            <span>{t('tapToSpeak')}</span>
            <span className="text-sm sm:text-base font-normal text-[#FBF7EF]/85 border-l border-white/30 pl-3">
              {t('orSayGreeting')}
            </span>
          </button>

          {/* Real-time Language Translator Button */}
          {onOpenTranslator && (
            <button
              type="button"
              id="btn-open-translator-bar"
              onClick={onOpenTranslator}
              className="flex items-center justify-center gap-3 min-h-[64px] px-6 py-3.5 rounded-2xl bg-white hover:border-[#2E5D57] text-[#2E5D57] font-bold text-lg sm:text-xl border-2 border-[#EAE1D0] active:scale-95 transition-all shadow-sm"
              aria-label={t('translatorTitle')}
            >
              <Globe className="w-6 h-6 stroke-[2.25]" />
              <span>{t('translatorTitle')}</span>
            </button>
          )}
        </div>

        {/* Spoken Query Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-sm font-semibold text-[#2B2A28]/70 mr-1">
            {t('tryAsking')}
          </span>
          {sampleVoicePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onStartListening(prompt)}
              className="text-sm sm:text-base bg-white border border-[#EAE1D0] px-3.5 py-1.5 rounded-full text-[#2B2A28] font-medium hover:border-[#2E5D57] active:scale-95 transition-transform"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </nav>

      {/* Pinned Bottom Action Bar for Mobile (<600px):
          Ensures Mic + Translator + SOS buttons stay always accessible with 56px+ touch targets
      */}
      <div
        id="kiosk-mobile-pinned-bar"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF7EF]/95 backdrop-blur-md border-t-2 border-[#EAE1D0] px-3 py-2.5 flex items-center justify-between gap-2 shadow-lg"
        role="toolbar"
        aria-label="Pinned mobile actions"
      >
        {/* Mobile Mic Button */}
        <button
          type="button"
          id="btn-voice-listen-trigger-mobile"
          onClick={() => onStartListening()}
          className="flex-1 min-h-[54px] px-3 py-2 rounded-2xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-base flex items-center justify-center gap-2 border-2 border-[#234641] active:scale-95 transition-transform shadow-sm"
          aria-label={t('tapToSpeak')}
        >
          <Mic className="w-5 h-5 stroke-[2.5]" />
          <span>{t('tapToSpeak')}</span>
        </button>

        {/* Mobile Translator Button */}
        {onOpenTranslator && (
          <button
            type="button"
            id="btn-translator-mobile-pinned"
            onClick={onOpenTranslator}
            className="min-h-[54px] px-3 py-2 rounded-2xl bg-white border-2 border-[#EAE1D0] text-[#2E5D57] font-bold text-base flex items-center justify-center gap-1.5 active:scale-95 transition-transform shrink-0"
            aria-label={t('translator')}
          >
            <Globe className="w-5 h-5 stroke-[2.25]" />
            <span className="text-xs font-bold">{t('translator')}</span>
          </button>
        )}

        {/* Mobile SOS Button */}
        <button
          type="button"
          id="btn-sos-mobile-pinned"
          onClick={onSosClick}
          className={`min-h-[54px] min-w-[80px] px-3 py-2 rounded-2xl bg-[#C2401F] text-[#FBF7EF] font-bold text-base flex items-center justify-center gap-1.5 border-2 border-[#A63316] active:scale-95 transition-transform shrink-0 shadow-sm ${
            isSosActive ? 'ring-4 ring-[#C2401F]/40' : ''
          }`}
          aria-label={`${t('emergencyCall')} - ${t('sos')}`}
        >
          <PhoneCall className="w-5 h-5 stroke-[2.5]" />
          <span>{t('sos')}</span>
        </button>
      </div>
    </div>
  );
};

export default HomeDashboard;
