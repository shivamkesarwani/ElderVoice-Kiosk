import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Mail,
  KeyRound,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
} from './Icons';
import { CaregiverUser } from '../types';
import {
  loginWithGoogle,
  loginWithEmail,
  sendPhoneOtp,
  confirmPhoneOtp,
  setupRecaptcha,
  isFirebaseConfigured,
} from '../services/firebaseAuth';

interface CaregiverLoginProps {
  onLoginSuccess: (user: CaregiverUser) => void;
  onBackToKiosk: () => void;
  onShowToast: (msg: string) => void;
}

type AuthTab = 'google' | 'phone' | 'email';

export const CaregiverLogin: React.FC<CaregiverLoginProps> = ({
  onLoginSuccess,
  onBackToKiosk,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('google');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    // Initialize reCAPTCHA verifier if on phone tab and configured
    if (activeTab === 'phone' && !otpSent && isFirebaseConfigured()) {
      setupRecaptcha('recaptcha-container');
    }
  }, [activeTab, otpSent]);

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured()) {
      setErrorMessage('Sign-in is not configured yet. Firebase credentials must be configured for caregiver access.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithGoogle();
      onShowToast(`Welcome back, ${user.displayName || 'Caregiver'}! Signed in with Google.`);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured()) {
      setErrorMessage('Sign-in is not configured yet. Firebase credentials must be configured for caregiver access.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithEmail(email, password, isRegistering);
      onShowToast(`Welcome, ${user.displayName || user.email}!`);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Email authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured()) {
      setErrorMessage('Sign-in is not configured yet. Firebase credentials must be configured for caregiver access.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const verifier = setupRecaptcha('recaptcha-container');
      const res = await sendPhoneOtp(phoneNumber, verifier);
      setConfirmationResult(res.confirmationResult || null);
      setOtpSent(true);
      onShowToast(`Verification code sent via SMS to ${phoneNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send SMS OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured()) {
      setErrorMessage('Sign-in is not configured yet. Firebase credentials must be configured for caregiver access.');
      return;
    }
    if (!otpCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code sent via SMS.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await confirmPhoneOtp(otpCode, phoneNumber, confirmationResult);
      onShowToast(`Phone verified! Logged in as ${user.displayName}.`);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="caregiver-login-surface"
      className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 sm:px-6 py-8"
    >
      {/* Return to Kiosk Top Bar */}
      <div className="w-full flex items-center justify-between pb-6 mb-6 border-b border-[#EAE1D0]">
        <button
          type="button"
          onClick={onBackToKiosk}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EAE1D0] bg-white text-[#2B2A28] font-bold text-base hover:border-[#2E5D57] active:scale-95 transition-transform"
          aria-label="Return to main kiosk dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-[#2E5D57]" />
          <span>Back to Kiosk</span>
        </button>

        <span className="text-xs sm:text-sm font-semibold text-[#2E5D57] bg-[#2E5D57]/10 px-3 py-1 rounded-full">
          Separate Caregiver Surface
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-3xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#2E5D57] text-[#FBF7EF] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2A28]">
              Caregiver Companion Access
            </h1>
            <p className="text-sm text-[#2B2A28]/75 mt-0.5">
              Secure remote monitoring for family members and authorized caregivers
            </p>
          </div>
        </div>

        {/* Reassurance Notice regarding Senior Zero-Login Guarantee */}
        <div className="mb-6 bg-white p-3.5 rounded-xl border border-[#2E5D57]/30 flex items-start gap-2.5 text-xs sm:text-sm text-[#2B2A28]/85">
          <Lock className="w-4 h-4 text-[#2E5D57] shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#2E5D57]">Senior-Friendly Guarantee:</strong> Eleanor’s kiosk dashboard, voice features, reminders, and SOS remain permanently accessible with <em>zero login required</em>.
          </span>
        </div>

        {/* Unconfigured Firebase Alert */}
        {!isFirebaseConfigured() && (
          <div
            id="caregiver-unconfigured-alert"
            className="mb-5 p-4 bg-[#D9714B]/15 border-2 border-[#D9714B] rounded-2xl flex items-start gap-3 text-[#2B2A28]"
          >
            <AlertCircle className="w-5 h-5 text-[#C2401F] shrink-0 mt-0.5" />
            <div className="text-left">
              <h3 className="font-bold text-sm sm:text-base text-[#C2401F]">
                Sign-in is not configured yet
              </h3>
              <p className="text-xs sm:text-sm text-[#2B2A28]/80 mt-1">
                Caregiver login requires a real Firebase project with Authentication enabled.
                Please configure <code className="bg-white/80 px-1 py-0.5 rounded border border-[#EAE1D0]">VITE_FIREBASE_API_KEY</code> and <code className="bg-white/80 px-1 py-0.5 rounded border border-[#EAE1D0]">VITE_FIREBASE_PROJECT_ID</code> in your environment variables.
              </p>
            </div>
          </div>
        )}

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-white border border-[#EAE1D0] rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('google');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              activeTab === 'google'
                ? 'bg-[#2E5D57] text-[#FBF7EF] shadow-sm'
                : 'text-[#2B2A28]/80 hover:bg-[#FBF7EF]'
            }`}
          >
            {/* Google G logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('phone');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              activeTab === 'phone'
                ? 'bg-[#2E5D57] text-[#FBF7EF] shadow-sm'
                : 'text-[#2B2A28]/80 hover:bg-[#FBF7EF]'
            }`}
          >
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>Phone SMS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('email');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
              activeTab === 'email'
                ? 'bg-[#2E5D57] text-[#FBF7EF] shadow-sm'
                : 'text-[#2B2A28]/80 hover:bg-[#FBF7EF]'
            }`}
          >
            <Mail className="w-4 h-4 shrink-0" />
            <span>Email</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-[#C2401F]/10 border border-[#C2401F]/30 rounded-xl flex items-center gap-2.5 text-[#C2401F] text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: GOOGLE SIGN-IN */}
        {activeTab === 'google' && (
          <div className="space-y-4 text-center">
            <p className="text-base text-[#2B2A28]/85">
              Authenticate via your authorized family Google Account with Firebase OAuth.
            </p>
            <button
              type="button"
              id="btn-caregiver-google-login"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full min-h-[56px] px-6 py-3.5 rounded-2xl bg-white border-2 border-[#2E5D57] hover:bg-[#2E5D57]/5 text-[#2B2A28] font-bold text-lg flex items-center justify-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
            >
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-[#2E5D57]" />
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
            <p className="text-xs text-[#2B2A28]/60">
              Verified with Firebase Authentication OAuth 2.0
            </p>
          </div>
        )}

        {/* TAB 2: PHONE NUMBER + SMS OTP */}
        {activeTab === 'phone' && (
          <div className="space-y-4">
            <div id="recaptcha-container" />

            {!otpSent ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label htmlFor="caregiver-phone-input" className="block text-sm font-bold text-[#2B2A28] mb-1.5">
                    Caregiver Mobile Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="caregiver-phone-input"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full min-h-[50px] pl-11 pr-4 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] text-base focus:border-[#2E5D57] focus:outline-none"
                      required
                    />
                    <PhoneCall className="w-5 h-5 text-[#2B2A28]/50 absolute left-3.5 top-3.5" />
                  </div>
                  <span className="text-xs text-[#2B2A28]/70 mt-1 block">
                    We will send a 6-digit one-time passcode via SMS text.
                  </span>
                </div>

                <button
                  type="submit"
                  id="btn-send-phone-otp"
                  disabled={isLoading}
                  className="w-full min-h-[52px] px-6 py-3 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-base flex items-center justify-center gap-2 hover:bg-[#234641] active:scale-95 transition-transform"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Send SMS Verification Code</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-[#2E5D57]/10 p-3 rounded-xl text-xs sm:text-sm text-[#2E5D57] font-medium flex items-center justify-between">
                  <span>SMS sent to: <strong>{phoneNumber}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="underline text-[#D9714B] font-bold"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label htmlFor="caregiver-otp-input" className="block text-sm font-bold text-[#2B2A28] mb-1.5">
                    Enter 6-Digit SMS Code
                  </label>
                  <input
                    id="caregiver-otp-input"
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full min-h-[52px] px-4 rounded-xl border-2 border-[#EAE1D0] bg-white text-center font-mono text-2xl tracking-widest text-[#2B2A28] focus:border-[#2E5D57] focus:outline-none"
                    autoFocus
                    required
                  />
                  <span className="text-xs text-[#2B2A28]/70 mt-1 block text-center">
                    Enter the 6-digit verification code sent to your mobile phone
                  </span>
                </div>

                <button
                  type="submit"
                  id="btn-verify-phone-otp"
                  disabled={isLoading}
                  className="w-full min-h-[52px] px-6 py-3 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-base flex items-center justify-center gap-2 hover:bg-[#234641] active:scale-95 transition-transform"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Verify &amp; Enter Dashboard</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: EMAIL + PASSWORD */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="caregiver-email-input" className="block text-sm font-bold text-[#2B2A28] mb-1.5">
                Caregiver Email Address
              </label>
              <div className="relative">
                <input
                  id="caregiver-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="caregiver@familycare.org"
                  className="w-full min-h-[50px] pl-11 pr-4 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] text-base focus:border-[#2E5D57] focus:outline-none"
                  required
                />
                <Mail className="w-5 h-5 text-[#2B2A28]/50 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label htmlFor="caregiver-password-input" className="block text-sm font-bold text-[#2B2A28] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="caregiver-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[50px] pl-11 pr-4 rounded-xl border-2 border-[#EAE1D0] bg-white text-[#2B2A28] text-base focus:border-[#2E5D57] focus:outline-none"
                  required
                />
                <KeyRound className="w-5 h-5 text-[#2B2A28]/50 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              id="btn-caregiver-email-submit"
              disabled={isLoading}
              className="w-full min-h-[52px] px-6 py-3 rounded-xl bg-[#2E5D57] text-[#FBF7EF] font-bold text-base flex items-center justify-center gap-2 hover:bg-[#234641] active:scale-95 transition-transform"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <span>{isRegistering ? 'Create Caregiver Account' : 'Sign In with Email'}</span>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-[#2E5D57] hover:underline font-semibold"
              >
                {isRegistering
                  ? 'Already have an account? Sign In'
                  : 'New caregiver? Register with this email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CaregiverLogin;
