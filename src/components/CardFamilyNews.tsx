import React, { useState } from 'react';
import { Heart, ImageIcon, X, MessageCircleHeart } from './Icons';
import { FamilyPhoto } from '../types';

interface CardFamilyNewsProps {
  onShowToast: (msg: string) => void;
}

const samplePhotos: FamilyPhoto[] = [
  {
    id: 'photo-1',
    title: "Tommy's Soccer Match",
    sender: 'Daughter Sarah',
    timeAgo: '2 hours ago',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80',
    caption: 'Tommy scored his first goal today! He asked if Nana was watching.',
  },
  {
    id: 'photo-2',
    title: 'Garden Irises Blooming',
    sender: 'Daughter Sarah',
    timeAgo: 'Yesterday',
    imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
    caption: 'The purple irises you planted in our backyard have opened up beautifully!',
  },
  {
    id: 'photo-3',
    title: 'Sunday Pancakes',
    sender: 'Grandson Tommy',
    timeAgo: 'Sunday',
    imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    caption: 'Making your blueberry pancake recipe Nana, with extra syrup.',
  },
];

export const CardFamilyNews: React.FC<CardFamilyNewsProps> = ({ onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FamilyPhoto | null>(samplePhotos[0] || null);

  const handleSendHeart = () => {
    onShowToast("Heart message sent to Sarah: 'Nana loved the photos!' (Simulated)");
  };

  return (
    <>
      <article
        id="card-family-news"
        className="bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-2xl p-6 flex flex-col justify-between transition-colors min-h-[260px]"
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0">
              <Heart className="w-6 h-6 stroke-[2.25]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#2B2A28]">
                Family & News
              </h2>
              <span className="text-sm font-medium text-[#D9714B]">
                3 new photos from Sarah
              </span>
            </div>
          </div>

          {/* Two lines of sample content */}
          <div className="space-y-2.5 text-lg text-[#2B2A28] leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="text-[#2E5D57] font-bold text-xl leading-none select-none">•</span>
              <span>Sarah shared 3 photos from Tommy&apos;s soccer game.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#2E5D57] font-bold text-xl leading-none select-none">•</span>
              <span>Sunny today, high of 74° with a pleasant breeze.</span>
            </p>
          </div>
        </div>

        {/* Action Button & Voice Caption */}
        <div className="pt-5 mt-auto">
          <button
            type="button"
            id="btn-view-family-photos"
            onClick={() => setIsModalOpen(true)}
            className="w-full min-h-[56px] px-6 py-3 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-lg flex items-center justify-center gap-2 border border-[#234641] active:scale-[0.98] transition-transform"
          >
            <ImageIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>View Family Photos</span>
          </button>
          <p className="text-center text-sm font-medium text-[#2B2A28]/70 mt-1.5">
            or say &apos;show photos&apos;
          </p>
        </div>
      </article>

      {/* Family Photos Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="family-photos-title"
          className="fixed inset-0 z-50 bg-[#2B2A28]/75 flex items-center justify-center p-4 sm:p-6"
        >
          <div className="bg-[#FBF7EF] border-4 border-[#2E5D57] rounded-3xl max-w-2xl w-full p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#EAE1D0]">
              <div>
                <h3 id="family-photos-title" className="font-serif text-3xl font-bold text-[#2B2A28]">
                  Family Album
                </h3>
                <p className="text-base text-[#2B2A28]/80 mt-0.5">
                  Recent memories shared by daughter Sarah
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] flex items-center justify-center"
                aria-label="Close photo album"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Photo Preview */}
            {selectedPhoto ? (
              <div className="mt-5 space-y-4">
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#EAE1D0] bg-black/5 aspect-video">
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#EAE1D0]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-2xl font-bold text-[#2B2A28]">
                      {selectedPhoto.title}
                    </h4>
                    <span className="text-sm font-semibold text-[#D9714B]">
                      {selectedPhoto.timeAgo}
                    </span>
                  </div>
                  <p className="text-lg text-[#2B2A28] mt-2">
                    {selectedPhoto.caption}
                  </p>
                </div>

                {/* Photo selector thumbnails */}
                <div className="grid grid-cols-3 gap-3">
                  {samplePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhoto(photo)}
                      className={`min-h-[56px] p-2 rounded-xl border-2 text-left transition-all ${
                        selectedPhoto.id === photo.id
                          ? 'border-[#2E5D57] bg-[#2E5D57]/10 font-bold'
                          : 'border-[#EAE1D0] bg-white'
                      }`}
                    >
                      <p className="text-base text-[#2B2A28] truncate">{photo.title}</p>
                      <span className="text-xs text-[#2B2A28]/70 block">{photo.sender}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-[#2B2A28]/70">
                No family photos uploaded yet.
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-6 mt-6 border-t-2 border-[#EAE1D0] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <button
                type="button"
                onClick={handleSendHeart}
                className="w-full sm:w-auto min-h-[56px] px-6 py-3 rounded-xl bg-[#D9714B] text-white font-bold text-lg flex items-center justify-center gap-2 border border-[#B85734]"
              >
                <MessageCircleHeart className="w-5 h-5 shrink-0" />
                <span>Send Love to Sarah</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto min-h-[56px] px-8 py-3 rounded-xl bg-white border-2 border-[#EAE1D0] text-[#2B2A28] font-bold text-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
