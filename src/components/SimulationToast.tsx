import React, { useEffect } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';

interface SimulationToastProps {
  message: string;
  onClose: () => void;
}

export const SimulationToast: React.FC<SimulationToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <aside
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="bg-[#2E5D57] text-[#FBF7EF] border-2 border-[#234641] rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-[#FBF7EF] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold text-lg leading-snug">{message}</p>
            <span className="text-xs text-[#FBF7EF]/80 uppercase tracking-wider font-semibold block mt-1">
              Simulated Interaction
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-[#FBF7EF]/90 hover:text-white flex items-center justify-center shrink-0"
          aria-label="Dismiss message"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};
