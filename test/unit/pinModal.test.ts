import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setupTestEnvironment } from '../setupDom';
import { PinModal } from '../../src/components/PinModal';
import {
  setCaregiverPin,
  verifyPin,
  isPinConfigured,
  clearCaregiverPin,
  hashPin,
} from '../../src/services/pinService';

describe('PinModal & pinService unit tests', () => {
  let container: HTMLElement;
  let root: any;

  beforeEach(() => {
    const env = setupTestEnvironment();
    container = env.container;
    root = createRoot(container);
    localStorage.clear();
  });

  test('pinService: hashPin creates consistent deterministic hashes', async () => {
    const hash1 = hashPin('1234');
    const hash2 = hashPin('1234');
    const hashDifferent = hashPin('4321');

    assert.strictEqual(typeof hash1, 'string');
    assert.strictEqual(hash1.length, 64);
    assert.strictEqual(hash1, hash2);
    assert.notStrictEqual(hash1, hashDifferent);
  });

  test('pinService: sets and verifies caregiver PIN via SHA-256 in localStorage', () => {
    assert.strictEqual(isPinConfigured(), false);

    const saved = setCaregiverPin('7890');
    assert.strictEqual(saved, true);
    assert.strictEqual(isPinConfigured(), true);

    // Verify correct PIN
    assert.strictEqual(verifyPin('7890'), true);

    // Verify incorrect PINs fail
    assert.strictEqual(verifyPin('1234'), false);
    assert.strictEqual(verifyPin('0000'), false);
    assert.strictEqual(verifyPin('7891'), false);
  });

  test('PinModal: correct PIN succeeds and triggers onSuccess callback', async () => {
    setCaregiverPin('4567');
    let successCalled = false;

    await act(async () => {
      root.render(
        React.createElement(PinModal, {
          isOpen: true,
          onSuccess: () => {
            successCalled = true;
          },
          onCancel: () => {},
        })
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const getDigitBtn = (digit: string) =>
      buttons.find((b) => b.textContent?.trim() === digit);

    // Enter 4, 5, 6, 7 sequentially with state updates
    for (const digit of ['4', '5', '6', '7']) {
      await act(async () => {
        getDigitBtn(digit)?.click();
      });
    }

    // Wait for validation timer
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });

    assert.strictEqual(successCalled, true, 'onSuccess should have been invoked for correct PIN');
  });

  test('PinModal: incorrect PIN fails, shows error, and does NOT call onSuccess', async () => {
    setCaregiverPin('4567');
    let successCalled = false;

    await act(async () => {
      root.render(
        React.createElement(PinModal, {
          isOpen: true,
          onSuccess: () => {
            successCalled = true;
          },
          onCancel: () => {},
        })
      );
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const getDigitBtn = (digit: string) =>
      buttons.find((b) => b.textContent?.trim() === digit);

    // Enter wrong PIN: 9, 9, 9, 9
    for (const digit of ['9', '9', '9', '9']) {
      await act(async () => {
        getDigitBtn(digit)?.click();
      });
    }

    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });

    assert.strictEqual(successCalled, false, 'onSuccess must NOT be invoked for incorrect PIN');

    // Verify error message is rendered
    const errorEl = container.textContent;
    assert.ok(
      errorEl?.includes('Incorrect PIN'),
      'UI should display "Incorrect PIN" error message'
    );
  });

  test('PinModal: no hardcoded sequence (1234, 0000) bypasses the check', async () => {
    // Configured PIN is 8392
    setCaregiverPin('8392');

    const bypassAttempts = ['1234', '0000', '1111', '9999'];

    for (const attempt of bypassAttempts) {
      let successCalled = false;

      await act(async () => {
        root.render(
          React.createElement(PinModal, {
            isOpen: true,
            onSuccess: () => {
              successCalled = true;
            },
            onCancel: () => {},
          })
        );
      });

      const buttons = Array.from(container.querySelectorAll('button'));
      const getDigitBtn = (digit: string) =>
        buttons.find((b) => b.textContent?.trim() === digit);

      for (const ch of attempt) {
        await act(async () => {
          getDigitBtn(ch)?.click();
        });
      }

      await act(async () => {
        await new Promise((r) => setTimeout(r, 400));
      });
      assert.strictEqual(
        successCalled,
        false,
        `Attempt '${attempt}' must be rejected and must not bypass authentication`
      );
    }
  });

  test('PinModal UI: contains no hardcoded "default 1234" disclosure text', async () => {
    setCaregiverPin('5678');

    await act(async () => {
      root.render(
        React.createElement(PinModal, {
          isOpen: true,
          onSuccess: () => {},
          onCancel: () => {},
        })
      );
    });

    const modalText = container.textContent || '';
    assert.strictEqual(
      modalText.includes('default 1234'),
      false,
      'Modal text must not mention default 1234'
    );
    assert.strictEqual(
      modalText.includes('Please try 1234'),
      false,
      'Modal text must not suggest 1234'
    );
  });
});
