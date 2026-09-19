import React, { useMemo } from 'react';
import { Mic, PhoneCall } from './Icons';
import { CardFamilyNews } from './CardFamilyNews';
import { CardMeals } from './CardMeals';
import { CardReminders } from './CardReminders';
import { CardHomeStatus } from './CardHomeStatus';
import { CardLostItems } from './CardLostItems';

/* =========================================================================================================
   NOTE: Background BLE scanning and always-listening wake-word detection are for the dedicated kiosk build
   only; a phone/tablet PWA install should treat voice and item-finder features as 'tap to activate' rather
   than assuming always-on background access, since iOS Safari restricts this for web apps.
   ========================================================================================================= */

interface HomeDashboardProps {
  onStartListening: (initialQuery?: string) => void;
  onShowToast: (msg: string) => void;
  onSosClick: () => void;
  isSosActive?: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartListening,
  onShowToast,
  onSosClick,
  isSosActive = false,
}) => {
  // Determine greeting based on current time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning, Eleanor';
    } else if (hour < 17) {
      return 'Good afternoon, Eleanor';
    } else {
      return 'Good evening, Eleanor';
    }
  }, []);

  const sampleVoicePrompts = [
    "Where are my reading glasses?",
    "Did I take my morning pills?",
    "What's for lunch today?",
    "Is the front door locked?",
    "Where are my keys?",
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
            Everything is peaceful and on schedule in your home.
          </p>
        </div>

        {/* Home Status Pill (Shortened on mobile) */}
        <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-[#2E5D57]/10 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[#2E5D57] font-semibold text-sm sm:text-lg">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2E5D57] animate-pulse" />
          <span className="sm:hidden">Living Room · 71°F</span>
          <span className="hidden sm:inline">Living Room · 71°F · Calm &amp; Secure</span>
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
        {/* Main Microphone Button */}
        <button
          type="button"
          id="btn-voice-listen-trigger"
          onClick={() => onStartListening()}
          className="group flex items-center justify-center gap-4 min-h-[64px] px-8 py-3.5 rounded-2xl bg-[#2E5D57] hover:bg-[#234641] text-[#FBF7EF] font-bold text-xl sm:text-2xl border-2 border-[#234641] active:scale-95 transition-all w-full sm:w-auto shadow-sm"
          aria-label="Activate voice assistant or say 'Hey ElderVoice'"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Mic className="w-6 h-6 text-[#FBF7EF] stroke-[2.5]" aria-hidden="true" />
          </div>
          <span>Tap to Speak</span>
          <span className="text-sm sm:text-base font-normal text-[#FBF7EF]/85 border-l border-white/30 pl-3">
            or say &apos;Hey ElderVoice&apos;
          </span>
        </button>

        {/* Spoken Query Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-sm font-semibold text-[#2B2A28]/70 mr-1">
            Try asking:
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
          Ensures Mic + SOS buttons stay always accessible with 56px+ touch targets
      */}
      <div
        id="kiosk-mobile-pinned-bar"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF7EF]/95 backdrop-blur-md border-t-2 border-[#EAE1D0] px-4 py-3 flex items-center justify-between gap-3 shadow-lg"
        role="toolbar"
        aria-label="Pinned mobile actions"
      >
        {/* Mobile Mic Button */}
        <button
          type="button"
          id="btn-voice-listen-trigger-mobile"
          onClick={() => onStartListening()}
          className="flex-1 min-h-[56px] px-4 py-2.5 rounded-2xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-lg flex items-center justify-center gap-2.5 border-2 border-[#234641] active:scale-95 transition-transform shadow-sm"
          aria-label="Tap to speak with ElderVoice"
        >
          <Mic className="w-6 h-6 stroke-[2.5]" />
          <span>Tap to Speak</span>
        </button>

        {/* Mobile SOS Button */}
        <button
          type="button"
          id="btn-sos-mobile-pinned"
          onClick={onSosClick}
          className={`min-h-[56px] min-w-[96px] px-4 py-2.5 rounded-2xl bg-[#C2401F] text-[#FBF7EF] font-bold text-lg flex items-center justify-center gap-1.5 border-2 border-[#A63316] active:scale-95 transition-transform shrink-0 shadow-sm ${
            isSosActive ? 'ring-4 ring-[#C2401F]/40' : ''
          }`}
          aria-label="Emergency SOS call"
        >
          <PhoneCall className="w-5 h-5 stroke-[2.5]" />
          <span>SOS</span>
        </button>
      </div>
    </div>
  );
};

export default HomeDashboard;
