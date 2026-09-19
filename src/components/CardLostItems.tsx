import React, { useState } from 'react';
import { Search, Glasses, Key, Tv, Pill, MapPin, Mic, Volume2 } from './Icons';
import { TrackedItem } from '../types';
import { requestVoiceReply } from '../services/voiceService';
import { useLanguage } from '../context/LanguageContext';

export interface CardLostItemsProps {
  onStartListening: (initialQuery?: string) => void;
  onShowToast: (msg: string) => void;
  items?: TrackedItem[];
}

export const defaultTrackedItems: TrackedItem[] = [
  {
    id: 'item-glasses',
    name: 'Reading Glasses',
    room: 'Kitchen (Island counter)',
    relativeTime: '10 minutes ago',
    category: 'reading',
    iconName: 'glasses',
  },
  {
    id: 'item-keys',
    name: 'House Keys',
    room: 'Entryway (Hall table tray)',
    relativeTime: '25 minutes ago',
    category: 'keys',
    iconName: 'key',
  },
  {
    id: 'item-remote',
    name: 'TV Remote',
    room: 'Living Room (Recliner pocket)',
    relativeTime: '45 minutes ago',
    category: 'remote',
    iconName: 'tv',
  },
  {
    id: 'item-pills',
    name: 'Daily Medicine Box',
    room: 'Kitchen Counter (By kettle)',
    relativeTime: '2 hours ago',
    category: 'medication',
    iconName: 'pill',
  },
];

export const CardLostItems: React.FC<CardLostItemsProps> = ({
  onStartListening,
  onShowToast,
  items,
}) => {
  const { t, language, languageInfo } = useLanguage();
  const [selectedItem, setSelectedItem] = useState<TrackedItem | null>(null);
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const displayItems = items !== undefined ? items : defaultTrackedItems;

  const getItemIcon = (iconName: TrackedItem['iconName']) => {
    switch (iconName) {
      case 'glasses':
        return <Glasses className="w-6 h-6 text-[#2E5D57]" strokeWidth="2.25" />;
      case 'key':
        return <Key className="w-6 h-6 text-[#2E5D57]" strokeWidth="2.25" />;
      case 'tv':
        return <Tv className="w-6 h-6 text-[#2E5D57]" strokeWidth="2.25" />;
      case 'pill':
        return <Pill className="w-6 h-6 text-[#2E5D57]" strokeWidth="2.25" />;
      default:
        return <MapPin className="w-6 h-6 text-[#2E5D57]" strokeWidth="2.25" />;
    }
  };

  const handleItemTap = async (item: TrackedItem) => {
    setSelectedItem(item);
    setIsLoading(true);
    const query = `Where are my ${item.name.toLowerCase()}?`;

    try {
      const response = await requestVoiceReply(query, language);
      const text =
        response.reply ||
        `Your ${item.name.toLowerCase()} were last seen in the ${item.room} about ${item.relativeTime}.`;
      setQueryResult(text);
      onShowToast(`Located: ${item.name} in ${item.room}`);

      // Play accessible text-to-speech if speech synthesis is available
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageInfo?.locale || 'en-US';
        utterance.rate = 0.88; // Gentle, slower pace for seniors
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      const fallback = `Your ${item.name.toLowerCase()} were last seen in the ${item.room} about ${item.relativeTime}.`;
      setQueryResult(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article
      id="card-lost-items-finder"
      className="bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors min-h-[340px]"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0">
              <Search className="w-6 h-6 stroke-[2.25]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#2B2A28]">
                {t ? t('cardLostItemsTitle') : 'Find My Items'}
              </h2>
              <span className="text-sm font-medium text-[#2B2A28]/80">
                {t ? t('cardLostItemsSubtitle') : 'Room location helpers'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartListening('Where are my glasses?')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E5D57] text-[#FBF7EF] text-xs sm:text-sm font-bold active:scale-95 transition-transform"
            aria-label="Ask assistant to locate an item using voice"
          >
            <Mic className="w-4 h-4" />
            <span>{t ? t('locateItem') : 'Locate'}</span>
          </button>
        </div>

        {/* On-Screen Text Response Area */}
        {queryResult && (
          <div
            id="item-finder-response-banner"
            className="mb-4 p-4 rounded-xl bg-[#2E5D57]/15 border-2 border-[#2E5D57] text-[#2B2A28]"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-2.5">
              <Volume2 className="w-5 h-5 text-[#2E5D57] shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-bold text-[#2E5D57] uppercase tracking-wider block">
                  Location Response (Voice & Captions):
                </span>
                <p className="text-base sm:text-lg font-bold text-[#2B2A28] mt-0.5 leading-snug">
                  &ldquo;{queryResult}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tracked Items List */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#2B2A28]/70">
            Tap an item to announce its room location:
          </p>

          {displayItems.length > 0 ? (
            displayItems.map((item) => {
              const isCurrent = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemTap(item)}
                  disabled={isLoading}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3 active:scale-[0.98] ${
                    isCurrent
                      ? 'bg-white border-[#2E5D57] shadow-sm'
                      : 'bg-white/80 border-[#EAE1D0] hover:border-[#2E5D57]/60'
                  }`}
                  aria-label={`Find ${item.name}. Last seen in ${item.room}, ${item.relativeTime}.`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#FBF7EF] border border-[#EAE1D0] flex items-center justify-center shrink-0">
                      {getItemIcon(item.iconName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-[#2B2A28] truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#2B2A28]/80">
                        <MapPin className="w-3.5 h-3.5 text-[#2E5D57] shrink-0" />
                        <span className="font-semibold text-[#2E5D57] truncate">{item.room}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-[#2B2A28]/70 bg-[#FBF7EF] px-2.5 py-1 rounded-lg border border-[#EAE1D0] shrink-0">
                    {item.relativeTime}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-6 rounded-xl bg-white border border-[#EAE1D0] text-center text-sm text-[#2B2A28]/70">
              No tracked items registered currently.
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="pt-4 mt-auto border-t border-[#EAE1D0]/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-xs text-[#2B2A28]/70">
        <span>Local room beacons only · No GPS or camera tracking</span>
        <span className="font-medium text-[#2E5D57]">Tap item or say &apos;Where are my keys?&apos;</span>
      </div>
    </article>
  );
};

export default CardLostItems;
