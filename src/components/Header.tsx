import React, { useState, useEffect } from 'react';
import { Wordmark } from './SoundwaveLogo';
import { PhoneCall, Sliders } from './Icons';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onSosClick: () => void;
  onHomeClick: () => void;
  onOpenAccessibility: () => void;
  isSosActive?: boolean;
  onShowToast: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSosClick,
  onHomeClick,
  onOpenAccessibility,
  isSosActive = false,
  onShowToast,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState({
    timeStr: '',
    dateStr: '',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const dateStr = now.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      setCurrentDateTime({ timeStr, dateStr });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      id="kiosk-header"
      className="w-full bg-[#FBF7EF] border-b-2 border-[#EAE1D0] px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 transition-all"
    >
      {/* Top Left: Logo & Wordmark */}
      <div className="flex items-center min-w-0">
        <Wordmark onHomeClick={onHomeClick} />
      </div>

      {/* Top Right: Clock, Accessibility, PWA Install, & Desktop/Tablet SOS Button */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 shrink-0">
        {/* Date and Time Display (Compressed stack on mobile) */}
        <div className="text-right flex flex-col justify-center">
          <time
            id="kiosk-clock-time"
            className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#2B2A28] font-mono leading-none"
            aria-live="polite"
          >
            {currentDateTime.timeStr || '10:30 AM'}
          </time>
          <span
            id="kiosk-clock-date"
            className="text-xs sm:text-sm lg:text-base text-[#2B2A28]/80 font-medium mt-0.5 sm:mt-1 truncate max-w-[120px] sm:max-w-none"
          >
            {currentDateTime.dateStr || 'Today'}
          </span>
        </div>

        {/* Accessibility Panel Quick Toggle */}
        <button
          type="button"
          id="btn-header-accessibility"
          onClick={onOpenAccessibility}
          className="min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:px-3 px-2 py-2 rounded-xl bg-white border-2 border-[#EAE1D0] hover:border-[#2E5D57] text-[#2E5D57] flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          aria-label="Open accessibility options (Large text, high contrast)"
          title="Accessibility & View"
        >
          <Sliders className="w-5 h-5 stroke-[2.25]" />
          <span className="hidden md:inline text-sm font-bold text-[#2B2A28]">
            View
          </span>
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton onShowToast={onShowToast} />

        {/* Large Emergency Red SOS Button (Visible in header on tablet/desktop >= 600px) */}
        <div className="hidden sm:block">
          <button
            type="button"
            id="kiosk-sos-button"
            onClick={onSosClick}
            className={`group flex flex-col items-center justify-center min-h-[56px] lg:min-h-[64px] min-w-[120px] lg:min-w-[140px] px-4 lg:px-5 py-2 lg:py-2.5 rounded-2xl bg-[#C2401F] text-[#FBF7EF] font-bold transition-transform active:scale-95 border-2 border-[#A63316] shadow-sm ${
              isSosActive ? 'ring-4 ring-[#C2401F]/40' : ''
            }`}
            aria-label="Emergency SOS - Call for Help"
          >
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 lg:w-6 lg:h-6 text-[#FBF7EF] shrink-0 stroke-[2.5]" aria-hidden="true" />
              <span className="text-xl lg:text-2xl font-black tracking-wider leading-none">SOS</span>
            </div>
            <span className="text-[11px] lg:text-[12px] font-normal tracking-wide text-[#FBF7EF]/90 mt-0.5">
              or say &apos;emergency&apos;
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
