import React from 'react';
import { X, Eye, Ear, Sliders, Check } from './Icons';
import { AccessibilitySettings } from '../types';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-panel-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#FBF7EF] border-4 border-[#2E5D57] p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#EAE1D0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2E5D57]/15 flex items-center justify-center text-[#2E5D57]">
              <Sliders className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="a11y-panel-title" className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2A28]">
                Accessibility & View
              </h2>
              <p className="text-sm sm:text-base text-[#2B2A28]/80">
                Tailored for low vision and hearing comfort
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white border-2 border-[#EAE1D0] flex items-center justify-center text-[#2B2A28] hover:border-[#2E5D57] transition-colors active:scale-95"
            aria-label="Close accessibility settings"
          >
            <X className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Setting Toggles */}
        <div className="py-6 space-y-6">
          {/* Large Text Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border-2 border-[#EAE1D0]">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0 mt-0.5">
                <Eye className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2B2A28]">Large Text Mode</h3>
                <p className="text-sm sm:text-base text-[#2B2A28]/80 mt-0.5">
                  Increases typography scale across all screens by 25% for easy reading without straining.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="toggle-large-text"
              onClick={() => onUpdateSettings({ largeText: !settings.largeText })}
              className={`min-h-[48px] px-5 py-2.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 transition-all shrink-0 ${
                settings.largeText
                  ? 'bg-[#2E5D57] border-[#234641] text-[#FBF7EF]'
                  : 'bg-[#FBF7EF] border-[#C8BCA7] text-[#2B2A28]'
              }`}
              aria-pressed={settings.largeText}
            >
              {settings.largeText && <Check className="w-5 h-5 stroke-[2.5]" />}
              <span>{settings.largeText ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          {/* High Contrast Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border-2 border-[#EAE1D0]">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0 mt-0.5">
                <Sliders className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#2B2A28]">High-Contrast Mode</h3>
                <p className="text-sm sm:text-base text-[#2B2A28]/80 mt-0.5">
                  Enhances borders with bold dark contours and pure dark-black text for sharp contrast.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="toggle-high-contrast"
              onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
              className={`min-h-[48px] px-5 py-2.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 transition-all shrink-0 ${
                settings.highContrast
                  ? 'bg-[#2E5D57] border-[#234641] text-[#FBF7EF]'
                  : 'bg-[#FBF7EF] border-[#C8BCA7] text-[#2B2A28]'
              }`}
              aria-pressed={settings.highContrast}
            >
              {settings.highContrast && <Check className="w-5 h-5 stroke-[2.5]" />}
              <span>{settings.highContrast ? 'Enabled' : 'Disabled'}</span>
            </button>
          </div>

          {/* Hearing Accessibility Note */}
          <div className="p-4 rounded-2xl bg-[#2E5D57]/10 border border-[#2E5D57]/30 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#2E5D57] text-[#FBF7EF] flex items-center justify-center shrink-0">
              <Ear className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2E5D57]">Low Hearing Protections Active</h3>
              <p className="text-sm text-[#2B2A28]/90 mt-1 leading-relaxed">
                • Every voice answer shows <strong>full synchronized text on-screen</strong> — never audio-only.<br />
                • Reminder chimes display <strong>visual banners and toasts</strong> alongside sound.<br />
                • Typed text input is available on the voice screen as an equal first-class option.
              </p>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[56px] rounded-2xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-lg hover:bg-[#234641] transition-colors"
        >
          Done & Apply
        </button>
      </div>
    </div>
  );
};
