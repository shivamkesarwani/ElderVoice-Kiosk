import React, { useState, useEffect } from 'react';
import { Wordmark } from './SoundwaveLogo';
import { PhoneCall } from 'lucide-react';

interface HeaderProps {
  onSosClick: () => void;
  onHomeClick: () => void;
  isSosActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSosClick, onHomeClick, isSosActive = false }) => {
  const [currentDateTime, setCurrentDateTime] = useState({
    timeStr: '',
    dateStr: '',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format 12-hour time with AM/PM
      const timeStr = now.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      // Format day and date: e.g., "Friday, Sep 18"
      const dateStr = now.toLocaleDateString([], {
        weekday: 'long',
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
      className="w-full bg-[#FBF7EF] border-b-2 border-[#EAE1D0] px-6 py-4 flex items-center justify-between gap-4"
    >
      {/* Top Left: Wordmark & Logo */}
      <div className="flex items-center">
        <Wordmark onHomeClick={onHomeClick} />
      </div>

      {/* Top Right: Clock & SOS Button */}
      <div className="flex items-center gap-6">
        {/* Date and Time Display */}
        <div className="text-right flex flex-col justify-center">
          <span
            id="kiosk-clock-time"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2B2A28] font-mono leading-none"
            aria-live="polite"
          >
            {currentDateTime.timeStr || '10:30 AM'}
          </span>
          <span
            id="kiosk-clock-date"
            className="text-base sm:text-lg text-[#2B2A28]/80 font-medium mt-1"
          >
            {currentDateTime.dateStr || 'Today'}
          </span>
        </div>

        {/* Large Emergency Red SOS Button */}
        <button
          type="button"
          id="kiosk-sos-button"
          onClick={onSosClick}
          className={`group flex flex-col items-center justify-center min-h-[64px] min-w-[140px] px-5 py-2.5 rounded-2xl bg-[#C2401F] text-[#FBF7EF] font-bold transition-transform active:scale-95 border-2 border-[#A63316] ${
            isSosActive ? 'ring-4 ring-[#C2401F]/40' : ''
          }`}
          aria-label="Emergency SOS - Call for Help"
        >
          <div className="flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-[#FBF7EF] shrink-0 stroke-[2.5]" aria-hidden="true" />
            <span className="text-2xl font-black tracking-wider leading-none">SOS</span>
          </div>
          <span className="text-[12px] font-normal tracking-wide text-[#FBF7EF]/90 mt-0.5">
            or say &apos;emergency&apos;
          </span>
        </button>
      </div>
    </header>
  );
};
