import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  ConfirmationResult,
  Auth
} from 'firebase/auth';
import { CaregiverUser } from '../types';

/**
 * Check whether real Firebase credentials have been configured in environment variables.
 * Returns false if credentials are unset or placeholders.
 */
export function isFirebaseConfigured(): boolean {
  try {
    const apiKey =
      typeof import.meta !== 'undefined'
        ? import.meta.env?.VITE_FIREBASE_API_KEY
        : typeof process !== 'undefined'
        ? process.env?.VITE_FIREBASE_API_KEY
        : undefined;

    const projectId =
      typeof import.meta !== 'undefined'
        ? import.meta.env?.VITE_FIREBASE_PROJECT_ID
        : typeof process !== 'undefined'
        ? process.env?.VITE_FIREBASE_PROJECT_ID
        : undefined;

    if (!apiKey || !projectId) return false;
    if (
      apiKey.includes('MockKey') ||
      apiKey === 'MY_FIREBASE_API_KEY' ||
      projectId === 'eldervoice-kiosk'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

const firebaseConfig = {
  apiKey:
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_API_KEY : '') || '',
  authDomain:
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN : '') || '',
  projectId:
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_PROJECT_ID : '') || '',
  storageBucket:
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET : '') || '',
  messagingSenderId:
    (typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID
      : '') || '',
  appId:
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_FIREBASE_APP_ID : '') || '',
};

let app: any = null;
let auth: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (err) {
    console.warn('[ElderVoice Caregiver Auth] Firebase Auth initialization notice:', err);
  }
}

export { auth };

/**
 * Allows injecting a mock Auth instance for unit tests
 */
export function setFirebaseAuthForTesting(mockAuth: Auth | null): void {
  auth = mockAuth;
}

// Active caregiver session state in memory + local persistence
const STORAGE_KEY = 'eldervoice_caregiver_session';

export function getStoredCaregiver(): CaregiverUser | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading stored caregiver session', e);
  }
  return null;
}

export function saveCaregiverSession(user: CaregiverUser | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving caregiver session', e);
  }
}

/**
 * Sign in using Google OAuth
 * Fails strictly if Firebase is not configured or if the OAuth request fails.
 * Never fabricates a fallback user session.
 */
export async function loginWithGoogle(): Promise<CaregiverUser> {
  if (!auth) {
    throw new Error(
      'Sign-in is not configured yet. Firebase credentials must be configured for caregiver access.'
    );
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;
  const caregiver: CaregiverUser = {
    uid: fbUser.uid,
    email: fbUser.email || undefined,
    displayName: fbUser.displayName || 'Family Caregiver',
    photoURL: fbUser.photoURL || undefined,
    authProvider: 'google',
  };
  saveCaregiverSession(caregiver);
  return caregiver;
}

/**
 * Sign in or Register using Email + Password
 * Fails strictly if Firebase is not configured or credentials are bad.
 * Never fabricates a fallback user session.
 */
export async function loginWithEmail(
  email: string,
  pass: string,
  isRegistering: boolean = false
): Promise<CaregiverUser> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !pass) {
    throw new Error('Please enter both email address and password.');
  }

  if (!auth) {
    throw new Error(
      'Sign-in is not configured yet. Firebase credentials must be configured for caregiver access.'
    );
  }

  const result = isRegistering
    ? await createUserWithEmailAndPassword(auth, trimmedEmail, pass)
    : await signInWithEmailAndPassword(auth, trimmedEmail, pass);

  const fbUser = result.user;
  const caregiver: CaregiverUser = {
    uid: fbUser.uid,
    email: fbUser.email || trimmedEmail,
    displayName: fbUser.displayName || trimmedEmail.split('@')[0] || 'Caregiver',
    photoURL: fbUser.photoURL || undefined,
    authProvider: 'password',
  };
  saveCaregiverSession(caregiver);
  return caregiver;
}

/**
 * Setup RecaptchaVerifier for Phone SMS Auth
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier | null {
  if (!auth) return null;
  try {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    });
  } catch (err) {
    console.warn('Could not initialize reCAPTCHA:', err);
    return null;
  }
}

/**
 * Send Phone SMS OTP
 * Strictly requires real Firebase Auth and RecaptchaVerifier.
 */
export async function sendPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier | null
): Promise<{ confirmationResult: ConfirmationResult }> {
  if (!auth) {
    throw new Error(
      'Sign-in is not configured yet. Firebase credentials must be configured for caregiver access.'
    );
  }
  if (!verifier) {
    throw new Error('reCAPTCHA verifier is required for phone verification.');
  }

  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
  return { confirmationResult };
}

/**
 * Confirm Phone SMS OTP code
 * Only succeeds if confirmation.confirm(otpCode) actually resolves.
 * Never fabricates a fallback session.
 */
export async function confirmPhoneOtp(
  otpCode: string,
  phoneNumber: string,
  confirmation?: ConfirmationResult | null
): Promise<CaregiverUser> {
  if (!auth) {
    throw new Error(
      'Sign-in is not configured yet. Firebase credentials must be configured for caregiver access.'
    );
  }
  if (!confirmation || typeof confirmation.confirm !== 'function') {
    throw new Error('No active verification session. Please request an SMS code first.');
  }

  const result = await confirmation.confirm(otpCode);
  const fbUser = result.user;
  const caregiver: CaregiverUser = {
    uid: fbUser.uid,
    phoneNumber: fbUser.phoneNumber || phoneNumber,
    displayName:
      fbUser.displayName || 'Family Caregiver (' + (phoneNumber.slice(-4) || 'Phone') + ')',
    authProvider: 'phone',
  };
  saveCaregiverSession(caregiver);
  return caregiver;
}

/**
 * Sign out caregiver session
 */
export async function logoutCaregiver(): Promise<void> {
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase signOut notice:', err);
    }
  }
  saveCaregiverSession(null);
}

/**
 * Subscribe to caregiver authentication state changes
 */
export function onAuthStateChange(callback: (user: CaregiverUser | null) => void): () => void {
  const stored = getStoredCaregiver();
  if (stored) {
    callback(stored);
  }

  if (auth) {
    try {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          const providerId = fbUser.providerData[0]?.providerId || '';
          let authProvider: 'google' | 'phone' | 'password' = 'password';
          if (providerId.includes('google')) authProvider = 'google';
          else if (providerId.includes('phone')) authProvider = 'phone';

          const caregiver: CaregiverUser = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Caregiver',
            email: fbUser.email || undefined,
            photoURL: fbUser.photoURL || undefined,
            phoneNumber: fbUser.phoneNumber || undefined,
            authProvider,
          };
          saveCaregiverSession(caregiver);
          callback(caregiver);
        } else {
          const currentStored = getStoredCaregiver();
          if (!currentStored) {
            callback(null);
          }
        }
      });
      return unsubscribe;
    } catch (err) {
      console.warn('onAuthStateChanged notice:', err);
    }
  }

  return () => {};
}
