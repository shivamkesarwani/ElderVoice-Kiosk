import React from 'react';

interface LogoProps {
  className?: string;
  onHomeClick?: () => void;
}

export const SoundwaveLogo: React.FC<LogoProps> = ({ className = 'h-12 w-auto' }) => {
  return (
    <img
      src="/logo.svg"
      alt="ElderVoice Kiosk"
      className={`object-contain select-none ${className}`}
      width={160}
      height={160}
    />
  );
};

export const Wordmark: React.FC<{ onHomeClick?: () => void; className?: string }> = ({
  onHomeClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      id="brand-logo-home-btn"
      onClick={onHomeClick}
      className={`inline-flex items-center text-left focus:outline-none focus-visible:ring-3 focus-visible:ring-[#2E5D57] rounded-xl p-1 transition-transform active:scale-95 ${className}`}
      aria-label="ElderVoice Kiosk - Return to Home Dashboard"
    >
      {/* The official logo includes the illustration and full wordmark; used alone as requested */}
      <img
        src="/logo.svg"
        alt="ElderVoice Kiosk"
        className="h-14 sm:h-16 md:h-18 w-auto max-w-[220px] object-contain drop-shadow-sm"
      />
    </button>
  );
};
