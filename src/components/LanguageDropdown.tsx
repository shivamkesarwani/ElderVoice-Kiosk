import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, ChevronDown, Check } from './Icons';
import { LanguageCode } from '../types';

interface LanguageDropdownProps {
  onShowToast?: (msg: string) => void;
  className?: string;
}

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  onShowToast,
  className = '',
}) => {
  const { language, languageInfo, setLanguage, t, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
    triggerRef.current?.focus();

    if (onShowToast) {
      const selected = supportedLanguages.find((l) => l.code === code);
      const toastMsg = selected
        ? `${selected.flag} ${t('languageChangedToast')}`
        : t('languageChangedToast');
      onShowToast(toastMsg);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Language Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id="btn-language-selector"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${t('language')}: ${languageInfo.nativeName}. Click to change language.`}
        title={`${t('language')}: ${languageInfo.nativeName}`}
        className={`min-h-[44px] min-w-[44px] sm:min-h-[48px] px-2.5 sm:px-3.5 py-2 rounded-xl bg-white border-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 shadow-xs ${
          isOpen
            ? 'border-[#2E5D57] ring-2 ring-[#2E5D57]/20 bg-[#FBF7EF]'
            : 'border-[#EAE1D0] hover:border-[#2E5D57] text-[#2E5D57]'
        }`}
      >
        <Globe className="w-5 h-5 text-[#2E5D57] shrink-0 stroke-[2.25]" aria-hidden="true" />
        
        {/* Language Display: Code on mobile, Native Name on medium+ screens */}
        <span className="text-sm font-bold text-[#2B2A28] flex items-center gap-1">
          <span className="text-base sm:text-lg leading-none" role="img" aria-label={languageInfo.name}>
            {languageInfo.flag}
          </span>
          <span className="hidden sm:inline">{languageInfo.nativeName}</span>
          <span className="inline sm:hidden uppercase font-semibold text-xs tracking-wider">
            {languageInfo.code}
          </span>
        </span>

        <ChevronDown
          className={`w-4 h-4 text-[#2B2A28]/70 shrink-0 transition-transform duration-200 stroke-[2.5] ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Language Dropdown Menu */}
      {isOpen && (
        <div
          id="language-dropdown-menu"
          role="listbox"
          aria-label={t('selectLanguage')}
          className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white border-2 border-[#2E5D57] rounded-2xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header info in dropdown */}
          <div className="px-4 py-2 border-b border-[#EAE1D0] bg-[#FBF7EF]">
            <p className="text-xs font-bold uppercase tracking-wider text-[#2E5D57]">
              {t('selectLanguage')}
            </p>
            <p className="text-[11px] text-[#2B2A28]/70 mt-0.5">
              Instant voice and screen translations
            </p>
          </div>

          {/* List of languages */}
          <div className="max-h-[340px] overflow-y-auto py-1 divide-y divide-[#EAE1D0]/40">
            {/* Indian & Primary Languages */}
            <div className="px-3.5 py-1.5 bg-[#F5EFE1]/60">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#2E5D57]">
                Indian & English Languages
              </span>
            </div>
            {supportedLanguages
              .filter((l) => ['en', 'hi', 'mr', 'pa'].includes(l.code))
              .map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    id={`language-option-${lang.code}`}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full text-left min-h-[44px] px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#2E5D57]/10 text-[#2E5D57] font-bold'
                        : 'hover:bg-[#FBF7EF] text-[#2B2A28]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none" role="img" aria-hidden="true">
                        {lang.flag}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm sm:text-base font-bold leading-tight">
                          {lang.nativeName}
                        </span>
                        <span className="text-xs text-[#2B2A28]/60 leading-tight">
                          {lang.name}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#2E5D57] text-[#FBF7EF] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                      </div>
                    )}
                  </button>
                );
              })}

            {/* Other International Languages */}
            <div className="px-3.5 py-1.5 bg-[#F5EFE1]/60">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#2E5D57]">
                Other Global Languages
              </span>
            </div>
            {supportedLanguages
              .filter((l) => !['en', 'hi', 'mr', 'pa'].includes(l.code))
              .map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    id={`language-option-${lang.code}`}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full text-left min-h-[44px] px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#2E5D57]/10 text-[#2E5D57] font-bold'
                        : 'hover:bg-[#FBF7EF] text-[#2B2A28]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl leading-none" role="img" aria-hidden="true">
                        {lang.flag}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm sm:text-base font-bold leading-tight">
                          {lang.nativeName}
                        </span>
                        <span className="text-xs text-[#2B2A28]/60 leading-tight">
                          {lang.name}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#2E5D57] text-[#FBF7EF] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
