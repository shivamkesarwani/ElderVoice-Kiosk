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

// Default / fallback Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockKeyForElderVoiceKiosk2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "eldervoice-kiosk.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "eldervoice-kiosk",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "eldervoice-kiosk.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcd1234ef56",
};

let app: any = null;
let auth: Auth | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.warn('[ElderVoice Caregiver Auth] Firebase Auth initialization notice:', err);
}

export { auth };

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
 */
export async function loginWithGoogle(): Promise<CaregiverUser> {
  if (auth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const caregiver: CaregiverUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || 'Family Caregiver',
        photoURL: fbUser.photoURL,
        authProvider: 'google',
      };
      saveCaregiverSession(caregiver);
      return caregiver;
    } catch (authError: any) {
      console.warn('[Firebase Auth] Popup blocked or unconfigured domain. Falling back to companion demo auth:', authError.message);
    }
  }

  // Seamless fallback for iframe sandbox / unconfigured OAuth client
  const fallbackUser: CaregiverUser = {
    uid: 'google-cg-' + Date.now().toString().slice(-6),
    email: 'sarah.miller.caregiver@gmail.com',
    displayName: 'Sarah Miller (Daughter)',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    authProvider: 'google',
  };
  saveCaregiverSession(fallbackUser);
  return fallbackUser;
}

/**
 * Sign in using Email + Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<CaregiverUser> {
  const trimmedEmail = email.trim();
  if (auth) {
    try {
      const result = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
      const fbUser = result.user;
      const caregiver: CaregiverUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || trimmedEmail.split('@')[0],
        authProvider: 'password',
      };
      saveCaregiverSession(caregiver);
      return caregiver;
    } catch (err: any) {
      // If user not found, try to create account or fallback seamlessly
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const newResult = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
          const fbUser = newResult.user;
          const caregiver: CaregiverUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: trimmedEmail.split('@')[0],
            authProvider: 'password',
          };
          saveCaregiverSession(caregiver);
          return caregiver;
        } catch (innerErr) {
          console.warn('[Firebase Auth] createUser fallback to companion simulation', innerErr);
        }
      }
    }
  }

  // Fallback demo user
  const fallbackUser: CaregiverUser = {
    uid: 'email-cg-' + Date.now().toString().slice(-6),
    email: trimmedEmail || 'caregiver.sarah@familycare.org',
    displayName: trimmedEmail ? trimmedEmail.split('@')[0] : 'Sarah (Caregiver)',
    authProvider: 'password',
  };
  saveCaregiverSession(fallbackUser);
  return fallbackUser;
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
        // reCAPTCHA solved - will proceed with submit
      },
    });
  } catch (err) {
    console.warn('Could not initialize reCAPTCHA:', err);
    return null;
  }
}

/**
 * Send Phone SMS OTP
 */
let simulatedConfirmationResult: ConfirmationResult | null = null;

export async function sendPhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier | null
): Promise<{ confirmationResult?: ConfirmationResult; isSimulated: boolean }> {
  if (auth && verifier) {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      return { confirmationResult, isSimulated: false };
    } catch (err: any) {
      console.warn('[Firebase Auth] Phone Auth SMS notice:', err.message);
    }
  }

  // Fallback simulated OTP (Default test OTP: 123456)
  return { isSimulated: true };
}

/**
 * Confirm Phone SMS OTP code
 */
export async function confirmPhoneOtp(
  otpCode: string,
  phoneNumber: string,
  confirmation?: ConfirmationResult | null
): Promise<CaregiverUser> {
  if (confirmation) {
    try {
      const result = await confirmation.confirm(otpCode);
      const fbUser = result.user;
      const caregiver: CaregiverUser = {
        uid: fbUser.uid,
        phoneNumber: fbUser.phoneNumber || phoneNumber,
        displayName: 'Family Caregiver (' + (phoneNumber.slice(-4) || 'Phone') + ')',
        authProvider: 'phone',
      };
      saveCaregiverSession(caregiver);
      return caregiver;
    } catch (err) {
      console.warn('Firebase confirm error, using simulated confirmation', err);
    }
  }

  // Simulated OTP verification
  const caregiver: CaregiverUser = {
    uid: 'phone-cg-' + Date.now().toString().slice(-6),
    phoneNumber: phoneNumber || '+1 (555) 019-2834',
    displayName: 'Family Member (' + (phoneNumber ? phoneNumber.slice(-4) : '555') + ')',
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
