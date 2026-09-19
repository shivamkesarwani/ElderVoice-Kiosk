import React from 'react';

interface SoundwaveLogoProps {
  size?: number;
  className?: string;
}

export const SoundwaveLogo: React.FC<SoundwaveLogoProps> = ({ size = 52, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-[#2E5D57] shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      <svg
        width={Math.round(size * 0.58)}
        height={Math.round(size * 0.58)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#FBF7EF]"
      >
        {/* Simple 4-bar soundwave icon in ivory */}
        <line x1="5" y1="9" x2="5" y2="15" stroke="#FBF7EF" strokeWidth="2.75" strokeLinecap="round" />
        <line x1="10" y1="5" x2="10" y2="19" stroke="#FBF7EF" strokeWidth="2.75" strokeLinecap="round" />
        <line x1="15" y1="7" x2="15" y2="17" stroke="#FBF7EF" strokeWidth="2.75" strokeLinecap="round" />
        <line x1="20" y1="10" x2="20" y2="14" stroke="#FBF7EF" strokeWidth="2.75" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export const Wordmark: React.FC<{ onHomeClick?: () => void }> = ({ onHomeClick }) => {
  return (
    <button
      type="button"
      id="wordmark-btn"
      onClick={onHomeClick}
      className="inline-flex items-center gap-3.5 text-left focus:outline-none focus-visible:ring-3 focus-visible:ring-[#2E5D57] rounded-lg p-1.5 transition-colors"
      aria-label="ElderVoice Kiosk Home"
    >
      <SoundwaveLogo size={52} />
      <div className="flex flex-col">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-bold tracking-tight text-[#2B2A28]">
            ElderVoice
          </span>
          <span className="font-serif italic font-normal text-2xl text-[#D9714B]">
            Kiosk
          </span>
        </div>
        <span className="text-xs tracking-wider uppercase text-[#2B2A28]/70 font-semibold">
          Home & Wellbeing Companion
        </span>
      </div>
    </button>
  );
};
