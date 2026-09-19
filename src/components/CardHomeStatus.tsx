import React, { useState } from 'react';
import { Home, ShieldCheck, X, Check, Lock, Thermometer, Sun } from 'lucide-react';

interface CardHomeStatusProps {
  onShowToast: (msg: string) => void;
}

export const CardHomeStatus: React.FC<CardHomeStatusProps> = ({ onShowToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTestChime = () => {
    onShowToast('Home status verified: All doors locked and hallway nightlight set. (Simulated)');
  };

  return (
    <>
      <article
        id="card-home-status"
        className="bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-2xl p-6 flex flex-col justify-between transition-colors min-h-[260px]"
      >
        <div>
          {/* Card Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0">
              <Home className="w-6 h-6 stroke-[2.25]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#2B2A28]">
                Home Status
              </h2>
              <span className="text-sm font-medium text-[#2E5D57]">
                All calm & secure
              </span>
            </div>
          </div>

          {/* Two lines of sample content: plain-language activity summary */}
          <div className="space-y-2.5 text-lg text-[#2B2A28] leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="text-[#2E5D57] font-bold text-xl leading-none select-none">•</span>
              <span>Kitchen visited this morning; kettle used at 8:15 AM.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#2E5D57] font-bold text-xl leading-none select-none">•</span>
              <span>Front and back doors are securely locked.</span>
            </p>
          </div>
        </div>

        {/* Action Button & Voice Caption */}
        <div className="pt-5 mt-auto">
          <button
            type="button"
            id="btn-check-home-status"
            onClick={() => setIsModalOpen(true)}
            className="w-full min-h-[56px] px-6 py-3 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-lg flex items-center justify-center gap-2 border border-[#234641] active:scale-[0.98] transition-transform"
          >
            <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>Check Security & Comfort</span>
          </button>
          <p className="text-center text-sm font-medium text-[#2B2A28]/70 mt-1.5">
            or say &apos;check front door&apos;
          </p>
        </div>
      </article>

      {/* Home Comfort & Security Details Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-status-title"
          className="fixed inset-0 z-50 bg-[#2B2A28]/75 flex items-center justify-center p-4 sm:p-6"
        >
          <div className="bg-[#FBF7EF] border-4 border-[#2E5D57] rounded-3xl max-w-2xl w-full p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#EAE1D0]">
              <div>
                <h3 id="home-status-title" className="font-serif text-3xl font-bold text-[#2B2A28]">
                  Home Comfort & Security
                </h3>
                <p className="text-base text-[#2B2A28]/80 mt-0.5">
                  Plain-language summary of your living space
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] flex items-center justify-center"
                aria-label="Close home status"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Plain-language home health checks */}
            <div className="mt-5 space-y-4">
              <div className="bg-white p-5 rounded-2xl border-2 border-[#EAE1D0] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#2B2A28]">
                    Doors & Entryways
                  </h4>
                  <p className="text-lg text-[#2B2A28]/85 mt-1">
                    Front door and patio door are both securely bolted. No unexpected doors were opened overnight.
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border-2 border-[#EAE1D0] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0">
                  <Thermometer className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#2B2A28]">
                    Room Temperature
                  </h4>
                  <p className="text-lg text-[#2B2A28]/85 mt-1">
                    Living room is a comfortable 71°F. Bedroom thermostat is set to 68°F for restful sleep tonight.
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border-2 border-[#EAE1D0] flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#2B2A28]">
                    Lighting & Ambience
                  </h4>
                  <p className="text-lg text-[#2B2A28]/85 mt-1">
                    Daylight living room lamps are active. Hallway path lighting is scheduled to automatically illuminate at dusk.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="pt-6 mt-6 border-t-2 border-[#EAE1D0] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <button
                type="button"
                onClick={handleTestChime}
                className="w-full sm:w-auto min-h-[56px] px-6 py-3 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-lg flex items-center justify-center gap-2 border border-[#234641]"
              >
                <Check className="w-5 h-5" />
                <span>Re-check Locks</span>
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
