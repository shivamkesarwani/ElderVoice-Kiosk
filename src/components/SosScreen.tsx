import React, { useState, useEffect } from 'react';
import { PhoneCall, XCircle, AlertTriangle, ShieldCheck, HeartPulse, ArrowLeft } from './Icons';
import { useLanguage } from '../context/LanguageContext';

/* =========================================================================
   NOTE: UI SIMULATION ONLY
   This is an interaction prototype for an eldercare tablet kiosk.
   No real telephony, 911 dispatch, or phone calls are placed.
   ========================================================================= */

interface SosScreenProps {
  onCancel: () => void;
  onCallPlaced: () => void;
}

export const SosScreen: React.FC<SosScreenProps> = ({ onCancel, onCallPlaced }) => {
  const { t } = useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isDispatched, setIsDispatched] = useState(false);

  useEffect(() => {
    if (isDispatched) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDispatched(true);
          onCallPlaced();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDispatched, onCallPlaced]);

  const handleImmediateTrigger = () => {
    setSecondsLeft(0);
    setIsDispatched(true);
    onCallPlaced();
  };

  return (
    <div
      id="kiosk-sos-screen"
      role="alertdialog"
      aria-labelledby="sos-status-heading"
      aria-describedby="sos-status-desc"
      className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10"
    >
      {/* UI SIMULATION DISCLAIMER BADGE */}
      <div className="mb-4 inline-flex items-center gap-2 bg-[#C2401F]/10 border-2 border-[#C2401F]/30 px-4 py-1.5 rounded-full text-[#C2401F] text-sm font-bold text-center">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>PROTOTYPE SIMULATION ONLY — No real emergency services called</span>
      </div>

      {!isDispatched ? (
        /* ACTIVE COUNTDOWN STATE */
        <div className="w-full bg-white border-4 border-[#C2401F] rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center space-y-6 shadow-xl">
          <div className="w-24 h-24 rounded-full bg-[#C2401F] text-white flex items-center justify-center animate-pulse">
            <PhoneCall className="w-12 h-12 stroke-[2.5]" aria-hidden="true" />
          </div>

          <div>
            <h2
              id="sos-status-heading"
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#C2401F] tracking-tight"
            >
              {t('emergencyCall')}
            </h2>
            <p id="sos-status-desc" className="text-xl sm:text-2xl text-[#2B2A28] mt-3 font-medium">
              Connecting in <span className="font-bold text-[#C2401F] text-3xl sm:text-4xl">{secondsLeft}</span> seconds
            </p>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full max-w-md bg-[#EAE1D0] h-4 rounded-full overflow-hidden">
            <div
              className="bg-[#C2401F] h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(secondsLeft / 10) * 100}%` }}
              aria-hidden="true"
            />
          </div>

          <p className="text-lg sm:text-xl text-[#2B2A28]/80 max-w-md">
            If this was an accident or you feel fine, tap the large button below right now:
          </p>

          {/* PRIMARY PROMINENT CANCEL TAP TARGET */}
          <div className="pt-2 flex flex-col items-center w-full max-w-md">
            <button
              type="button"
              id="btn-cancel-sos"
              onClick={onCancel}
              className="w-full min-h-[80px] px-8 py-4 rounded-2xl bg-[#2E5D57] hover:bg-[#234641] text-[#FBF7EF] font-bold text-2xl sm:text-3xl active:scale-95 transition-transform flex items-center justify-center gap-3.5 border-4 border-[#1E433E] shadow-xl"
              aria-label={t('cancelCall')}
              autoFocus
            >
              <XCircle className="w-9 h-9 stroke-[2.75] shrink-0" aria-hidden="true" />
              <span>{t('cancelCall')}</span>
            </button>
            <span className="text-sm font-semibold text-[#2B2A28]/70 mt-2">
              (Voice cancel also available: say &apos;cancel emergency&apos;)
            </span>
          </div>

          {/* Immediate test trigger button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleImmediateTrigger}
              className="text-xs sm:text-sm font-semibold text-[#2E5D57] underline hover:text-[#D9714B]"
            >
              ({t('callImmediately')})
            </button>
          </div>
        </div>
      ) : (
        /* DISPATCHED CONFIRMATION STATE */
        <div className="w-full bg-[#FBF7EF] border-4 border-[#2E5D57] rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center space-y-6 shadow-xl">
          <div className="w-24 h-24 rounded-full bg-[#2E5D57] text-white flex items-center justify-center">
            <ShieldCheck className="w-14 h-14 stroke-[2.5]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-[#2E5D57] bg-[#2E5D57]/10 px-3.5 py-1.5 rounded-full">
              Emergency Alert Simulated
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2B2A28] mt-3">
              Sarah &amp; Care Responders Notified
            </h2>
            <p className="text-xl sm:text-2xl text-[#2B2A28] mt-3 font-medium max-w-lg mx-auto">
              Your home address has been transmitted. Sarah (555-0192) has received an immediate high-priority alert.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-2 border-[#EAE1D0] max-w-lg w-full text-left space-y-2">
            <div className="flex items-center gap-2 text-[#2E5D57] font-bold text-lg">
              <HeartPulse className="w-5 h-5" />
              <span>Safety Advice:</span>
            </div>
            <p className="text-lg text-[#2B2A28]">
              • Please stay seated in a comfortable chair.<br />
              • Keep your tablet nearby. Sarah will ring in momentarily.<br />
              • The front door smart lock has unlocked for first responders.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="min-h-[64px] px-8 py-3.5 rounded-2xl bg-white border-3 border-[#2E5D57] text-[#2E5D57] font-bold text-xl flex items-center gap-2.5 active:scale-95 transition-transform hover:bg-[#2E5D57]/10"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>{t('returnToKiosk')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SosScreen;
