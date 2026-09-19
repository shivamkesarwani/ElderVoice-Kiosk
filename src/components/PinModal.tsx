import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Check } from './Icons';
import { isPinConfigured, verifyPin, setCaregiverPin } from '../services/pinService';

interface PinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  title,
  description,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // First-launch setup flow if no PIN is configured in env or localStorage
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [setupStep, setSetupStep] = useState<'enter' | 'confirm'>('enter');
  const [initialSetupPin, setInitialSetupPin] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setErrorMessage(null);
      const configured = isPinConfigured();
      setIsConfigured(configured);
      setSetupStep('enter');
      setInitialSetupPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalTitle =
    title ||
    (!isConfigured
      ? setupStep === 'enter'
        ? 'Set Caregiver PIN'
        : 'Confirm Caregiver PIN'
      : 'Caregiver Local PIN');

  const modalDescription =
    description ||
    (!isConfigured
      ? setupStep === 'enter'
        ? 'Create a 4-digit PIN for on-device kiosk configuration.'
        : 'Please re-enter the 4-digit PIN to confirm.'
      : 'Enter your 4-digit caregiver PIN for on-device configuration.');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      setErrorMessage(null);

      if (nextPin.length === 4) {
        if (!isConfigured) {
          // First use setup workflow
          if (setupStep === 'enter') {
            setInitialSetupPin(nextPin);
            setTimeout(() => {
              setPin('');
              setSetupStep('confirm');
            }, 180);
          } else {
            // Confirm step
            if (nextPin === initialSetupPin) {
              const saved = setCaregiverPin(nextPin);
              if (saved) {
                setIsConfigured(true);
                setTimeout(() => {
                  setPin('');
                  onSuccess();
                }, 150);
              } else {
                setError(true);
                setErrorMessage('Failed to save PIN. Please try again.');
                setPin('');
                setSetupStep('enter');
              }
            } else {
              setTimeout(() => {
                setError(true);
                setErrorMessage('PINs do not match. Please start over.');
                setPin('');
                setSetupStep('enter');
                setInitialSetupPin('');
              }, 250);
            }
          }
        } else {
          // Standard validation against configured PIN (hash in localStorage or env variable)
          // Strictly no hardcoded bypasses
          if (verifyPin(nextPin)) {
            setTimeout(() => {
              setPin('');
              onSuccess();
            }, 150);
          } else {
            setTimeout(() => {
              setError(true);
              setErrorMessage('Incorrect PIN. Please try again.');
              setPin('');
            }, 250);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
    setErrorMessage(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-[#FBF7EF] border-4 border-[#2E5D57] rounded-3xl max-w-sm w-full p-6 flex flex-col items-center text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-[#2E5D57]/10 text-[#2E5D57] flex items-center justify-center mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h2 id="pin-modal-title" className="font-serif text-2xl font-bold text-[#2B2A28]">
          {modalTitle}
        </h2>
        <p className="text-xs sm:text-sm text-[#2B2A28]/75 mt-1 mb-4">
          {modalDescription}
        </p>

        {/* 4-digit indicator dots */}
        <div className="flex gap-4 my-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > i
                  ? 'bg-[#2E5D57] border-[#2E5D57]'
                  : 'bg-white border-[#C8BCA7]'
              } ${error ? 'border-[#C2401F] bg-[#C2401F]/20' : ''}`}
            />
          ))}
        </div>

        {error && (
          <div className="text-xs text-[#C2401F] font-bold mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage || 'Incorrect PIN. Please try again.'}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full mt-4 max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-white border-2 border-[#EAE1D0] font-bold text-xl text-[#2B2A28] hover:border-[#2E5D57] active:scale-95 transition-all shadow-xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-white border border-[#EAE1D0] font-semibold text-xs text-[#2B2A28]/70 hover:bg-black/5 active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white border-2 border-[#EAE1D0] font-bold text-xl text-[#2B2A28] hover:border-[#2E5D57] active:scale-95 transition-all shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-white border border-[#EAE1D0] font-semibold text-xs text-[#2B2A28]/70 hover:bg-black/5 active:scale-95"
          >
            ⌫
          </button>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 text-sm font-bold text-[#2B2A28]/70 hover:text-[#2B2A28] underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PinModal;
