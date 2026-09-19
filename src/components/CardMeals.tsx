import React, { useState } from 'react';
import { Utensils, X, Check, Droplets } from 'lucide-react';
import { MealItem } from '../types';

interface CardMealsProps {
  onShowToast: (msg: string) => void;
}

const dailyMeals: MealItem[] = [
  {
    meal: 'Breakfast',
    time: '8:00 AM',
    title: 'Warm Oatmeal with Blueberries',
    description: 'Steel-cut oats with a drizzle of honey, fresh organic blueberries, and sliced almonds.',
    dietaryNote: 'Heart healthy · Low sodium',
  },
  {
    meal: 'Lunch',
    time: '12:30 PM',
    title: 'Roasted Butternut Squash Soup',
    description: 'Warm cream-less vegetable soup served with whole grain crusty sourdough roll.',
    dietaryNote: 'Comforting & easy to digest',
  },
  {
    meal: 'Afternoon Snack',
    time: '3:30 PM',
    title: 'Sliced Honeycrisp Apple & Chamomile Tea',
    description: 'Crisp apple slices with a warm caffeine-free herbal tea.',
    dietaryNote: 'Hydration & fiber',
  },
  {
    meal: 'Dinner',
    time: '6:00 PM',
    title: 'Baked Lemon-Herb Salmon & Asparagus',
    description: 'Tender wild salmon fillet with steamed baby potatoes and tender green asparagus tips.',
    dietaryNote: 'Rich in Omega-3',
  },
];

export const CardMeals: React.FC<CardMealsProps> = ({ onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(4);

  const handleAddWater = () => {
    const next = waterGlasses + 1;
    setWaterGlasses(next);
    onShowToast(`Great job! Logged glass #${next} of water today.`);
  };

  return (
    <>
      <article
        id="card-todays-meals"
        className="bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-2xl p-6 flex flex-col justify-between transition-colors min-h-[260px]"
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0">
              <Utensils className="w-6 h-6 stroke-[2.25]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#2B2A28]">
                Today&apos;s Meals
              </h2>
              <span className="text-sm font-medium text-[#2E5D57]">
                Fresh & nutritious plan
              </span>
            </div>
          </div>

          {/* Two lines of sample content */}
          <div className="space-y-2.5 text-lg text-[#2B2A28] leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="text-[#2E5D57] font-bold text-xl leading-none select-none">•</span>
              <span>
                <strong className="font-semibold">Breakfast:</strong> Warm oatmeal with blueberries.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#2E5D57] font-bold text-xl leading-none select-none">•</span>
              <span>
                <strong className="font-semibold">Lunch:</strong> Roasted butternut squash soup & roll.
              </span>
            </p>
          </div>
        </div>

        {/* Action Button & Voice Caption */}
        <div className="pt-5 mt-auto">
          <button
            type="button"
            id="btn-view-meal-plan"
            onClick={() => setIsModalOpen(true)}
            className="w-full min-h-[56px] px-6 py-3 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-lg flex items-center justify-center gap-2 border border-[#234641] active:scale-[0.98] transition-transform"
          >
            <Utensils className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>View Full Meal Plan</span>
          </button>
          <p className="text-center text-sm font-medium text-[#2B2A28]/70 mt-1.5">
            or say &apos;what&apos;s for lunch&apos;
          </p>
        </div>
      </article>

      {/* Full Meal Plan Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="meal-plan-title"
          className="fixed inset-0 z-50 bg-[#2B2A28]/75 flex items-center justify-center p-4 sm:p-6"
        >
          <div className="bg-[#FBF7EF] border-4 border-[#2E5D57] rounded-3xl max-w-2xl w-full p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#EAE1D0]">
              <div>
                <h3 id="meal-plan-title" className="font-serif text-3xl font-bold text-[#2B2A28]">
                  Today&apos;s Full Meal Plan
                </h3>
                <p className="text-base text-[#2B2A28]/80 mt-0.5">
                  Prepared with balanced nutrition & hydration
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] flex items-center justify-center"
                aria-label="Close meal plan"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Meals List */}
            <div className="mt-5 space-y-4">
              {dailyMeals.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#EAE1D0] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xl font-bold text-[#2E5D57]">
                      {item.meal} ({item.time})
                    </span>
                    {item.dietaryNote && (
                      <span className="text-xs sm:text-sm font-semibold text-[#D9714B] bg-[#D9714B]/10 px-2.5 py-1 rounded-full">
                        {item.dietaryNote}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-[#2B2A28]">{item.title}</h4>
                  <p className="text-base sm:text-lg text-[#2B2A28]/85">{item.description}</p>
                </div>
              ))}

              {/* Hydration Tracker */}
              <div className="bg-[#2E5D57]/10 p-5 rounded-2xl border-2 border-[#2E5D57]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#2E5D57] text-[#FBF7EF] flex items-center justify-center shrink-0">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif text-xl font-bold text-[#2B2A28]">
                      Hydration Tracker
                    </h4>
                    <p className="text-base text-[#2B2A28]">
                      {waterGlasses} of 6 recommended glasses reached
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddWater}
                  className="min-h-[52px] px-5 py-2.5 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-base flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Drank a Glass</span>
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-6 mt-6 border-t-2 border-[#EAE1D0] flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto min-h-[56px] px-8 py-3 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-lg"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
