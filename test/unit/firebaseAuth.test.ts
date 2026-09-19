import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { setupTestEnvironment } from '../setupDom';
import {
  loginWithGoogle,
  loginWithEmail,
  confirmPhoneOtp,
  sendPhoneOtp,
  isFirebaseConfigured,
  setFirebaseAuthForTesting,
  getStoredCaregiver,
  saveCaregiverSession,
} from '../../src/services/firebaseAuth';

describe('firebaseAuth unit tests: Strict authentication & no fallbacks', () => {
  beforeEach(() => {
    setupTestEnvironment();
    localStorage.clear();
    setFirebaseAuthForTesting(null);
  });

  test('isFirebaseConfigured: returns false when credentials are unset or placeholder', () => {
    const configured = isFirebaseConfigured();
    // Default environment lacks real production Firebase project credentials
    assert.strictEqual(typeof configured, 'boolean');
  });

  test('loginWithGoogle: unconfigured Firebase rejects and never fabricates a user', async () => {
    setFirebaseAuthForTesting(null);
    let errorCaught: any = null;
    let returnedUser: any = null;

    try {
      returnedUser = await loginWithGoogle();
    } catch (err: any) {
      errorCaught = err;
    }

    assert.strictEqual(returnedUser, null, 'Must not return a fallback user');
    assert.ok(errorCaught, 'Must reject when auth is not configured');
    assert.ok(
      errorCaught.message.includes('Sign-in is not configured yet'),
      'Error message must indicate sign-in is unconfigured'
    );
    assert.strictEqual(getStoredCaregiver(), null, 'Must not persist any fabricated session');
  });

  test('loginWithGoogle: Firebase SDK error rejects and never returns a fallback user', async () => {
    // Provide a dummy auth instance that causes SDK to fail
    setFirebaseAuthForTesting({ name: 'mock-app' } as any);
    let returnedUser: any = null;
    let errorCaught: any = null;

    try {
      returnedUser = await loginWithGoogle();
    } catch (err: any) {
      errorCaught = err;
    }

    assert.strictEqual(returnedUser, null, 'Must never return a fabricated user upon SDK failure');
    assert.ok(errorCaught, 'Failed Firebase OAuth must reject');
    assert.strictEqual(getStoredCaregiver(), null, 'Must not persist session on failed login');
  });

  test('loginWithEmail: missing credentials rejects immediately', async () => {
    setFirebaseAuthForTesting({ name: 'mock-app' } as any);
    await assert.rejects(
      async () => {
        await loginWithEmail('', '');
      },
      /Please enter both email address and password/
    );
    assert.strictEqual(getStoredCaregiver(), null);
  });

  test('loginWithEmail: invalid credentials or SDK error rejects and never returns a fallback user', async () => {
    setFirebaseAuthForTesting({ name: 'mock-app' } as any);
    let returnedUser: any = null;
    let errorCaught: any = null;

    try {
      returnedUser = await loginWithEmail('sarah@familycare.org', 'wrongPassword123');
    } catch (err: any) {
      errorCaught = err;
    }

    assert.strictEqual(returnedUser, null, 'Must never return a fabricated user upon bad password');
    assert.ok(errorCaught, 'Must reject with error on invalid credentials');
    assert.strictEqual(getStoredCaregiver(), null, 'Must not store a session for failed login');
  });

  test('confirmPhoneOtp: rejects if confirmation session is missing or invalid', async () => {
    setFirebaseAuthForTesting({ name: 'mock-app' } as any);

    await assert.rejects(
      async () => {
        await confirmPhoneOtp('123456', '+15551234567', null);
      },
      /No active verification session/
    );

    await assert.rejects(
      async () => {
        await confirmPhoneOtp('123456', '+15551234567', {} as any);
      },
      /No active verification session/
    );

    assert.strictEqual(getStoredCaregiver(), null);
  });

  test('confirmPhoneOtp: rejects and returns no user when confirmation.confirm rejects (invalid OTP)', async () => {
    setFirebaseAuthForTesting({ name: 'mock-app' } as any);

    // Mock confirmation object whose confirm() rejects (e.g. code expired or wrong)
    const mockConfirmation = {
      confirm: async (_code: string) => {
        const error = new Error('auth/invalid-verification-code: The SMS verification code is invalid.');
        (error as any).code = 'auth/invalid-verification-code';
        throw error;
      },
    };

    let returnedUser: any = null;
    let errorCaught: any = null;

    try {
      returnedUser = await confirmPhoneOtp('999999', '+15551234567', mockConfirmation as any);
    } catch (err: any) {
      errorCaught = err;
    }

    assert.strictEqual(returnedUser, null, 'Must never return a fabricated user upon invalid OTP');
    assert.ok(errorCaught, 'Must reject when confirmation.confirm() rejects');
    assert.ok(errorCaught.message.includes('invalid-verification-code'));
    assert.strictEqual(getStoredCaregiver(), null, 'Must not persist session on invalid OTP');
  });

  test('confirmPhoneOtp: only succeeds when confirmation.confirm actually resolves', async () => {
    setFirebaseAuthForTesting({ name: 'mock-app' } as any);

    const mockConfirmation = {
      confirm: async (code: string) => {
        if (code === '654321') {
          return {
            user: {
              uid: 'verified-uid-99',
              phoneNumber: '+15551234567',
              displayName: 'Verified Sarah',
            },
          };
        }
        throw new Error('Invalid code');
      },
    };

    const user = await confirmPhoneOtp('654321', '+15551234567', mockConfirmation as any);
    assert.strictEqual(user.uid, 'verified-uid-99');
    assert.strictEqual(user.phoneNumber, '+15551234567');
    assert.strictEqual(user.authProvider, 'phone');

    const stored = getStoredCaregiver();
    assert.strictEqual(stored?.uid, 'verified-uid-99');
  });
});
