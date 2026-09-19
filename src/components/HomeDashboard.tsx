import React, { useMemo } from 'react';
import { Mic } from 'lucide-react';
import { CardFamilyNews } from './CardFamilyNews';
import { CardMeals } from './CardMeals';
import { CardReminders } from './CardReminders';
import { CardHomeStatus } from './CardHomeStatus';

interface HomeDashboardProps {
  onStartListening: (initialQuery?: string) => void;
  onShowToast: (msg: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartListening,
  onShowToast,
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
    "What's the weather outside?",
    "Did I take my morning pills?",
    "What's for lunch today?",
    "Is the front door locked?",
  ];

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 gap-6">
      {/* Greeting Banner */}
      <section
        id="kiosk-greeting-section"
        className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 border-b-2 border-[#EAE1D0]"
        aria-label="Welcome greeting"
      >
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#2B2A28]">
            {greeting}
          </h1>
          <p className="text-lg sm:text-xl text-[#2B2A28]/80 mt-1 font-medium">
            Everything is peaceful and on schedule today.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-[#2E5D57]/10 px-4 py-2 rounded-xl text-[#2E5D57] font-semibold text-base sm:text-lg">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#2E5D57] animate-pulse" />
          <span>Living Room · 71°F · Calm</span>
        </div>
      </section>

      {/* 2x2 Grid for the 4 Core Cards */}
      <main
        id="kiosk-main-cards-grid"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch"
        aria-label="Daily wellbeing and smart home overview"
      >
        <CardFamilyNews onShowToast={onShowToast} />
        <CardMeals onShowToast={onShowToast} />
        <CardReminders onShowToast={onShowToast} />
        <CardHomeStatus onShowToast={onShowToast} />
      </main>

      {/* Voice-first prominent footer interaction bar */}
      <nav
        id="kiosk-voice-bar"
        className="bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center gap-4 text-center mt-2"
        aria-label="Voice interaction bar"
      >
        {/* Main Microphone Button */}
        <button
          type="button"
          id="btn-voice-listen-trigger"
          onClick={() => onStartListening()}
          className="group flex items-center justify-center gap-4 min-h-[64px] px-8 py-3.5 rounded-2xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-xl sm:text-2xl border-2 border-[#234641] active:scale-95 transition-all w-full sm:w-auto"
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
            Try saying:
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
    </div>
  );
};
