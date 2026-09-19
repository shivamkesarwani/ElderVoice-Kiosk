import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { setupTestEnvironment } from '../setupDom';
import { CardLostItems } from '../../src/components/CardLostItems';
import { CardReminders } from '../../src/components/CardReminders';
import { LanguageProvider } from '../../src/context/LanguageContext';
import { MedicineItem, ReminderItem, TrackedItem } from '../../src/types';

describe('CardLostItems and CardReminders unit tests', () => {
  let container: HTMLElement;
  let root: any;

  beforeEach(() => {
    const env = setupTestEnvironment();
    container = env.container;
    root = createRoot(container);
  });

  test('CardLostItems: renders cleanly with empty mock data (items=[])', async () => {
    await act(async () => {
      root.render(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(CardLostItems, {
            items: [],
            onStartListening: () => {},
            onShowToast: () => {},
          })
        )
      );
    });

    const card = container.querySelector('#card-lost-items-finder');
    assert.ok(card, 'Card container should render');

    const cardText = card.textContent || '';
    assert.ok(
      cardText.includes('No tracked items registered currently'),
      'Should display empty state message when items array is empty'
    );
  });

  test('CardLostItems: renders items properly when populated', async () => {
    const mockItems: TrackedItem[] = [
      {
        id: 'test-item-1',
        name: 'Silver Watch',
        room: 'Nightstand',
        relativeTime: '5 minutes ago',
        category: 'accessories',
        iconName: 'other',
      },
    ];

    await act(async () => {
      root.render(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(CardLostItems, {
            items: mockItems,
            onStartListening: () => {},
            onShowToast: () => {},
          })
        )
      );
    });

    const cardText = container.textContent || '';
    assert.ok(cardText.includes('Silver Watch'));
    assert.ok(cardText.includes('Nightstand'));
  });

  test('CardReminders: renders cleanly with empty mock data', async () => {
    await act(async () => {
      root.render(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(CardReminders, {
            initialMedicines: [],
            initialAppointments: [],
            onShowToast: () => {},
          })
        )
      );
    });

    const card = container.querySelector('#card-reminders-health');
    assert.ok(card, 'Reminders card should render');

    const cardText = card.textContent || '';
    assert.ok(
      cardText.includes('No prescriptions currently scheduled for today'),
      'Should display prescriptions empty state'
    );
    assert.ok(
      cardText.includes('No other appointments scheduled for today'),
      'Should display appointments empty state'
    );

    // Banners should not be displayed when empty
    assert.strictEqual(container.querySelector('#nudge-gentle-banner'), null);
    assert.strictEqual(container.querySelector('#nudge-second-banner'), null);
    assert.strictEqual(container.querySelector('#nudge-notified-banner'), null);
  });

  test('CardReminders: marking medication dose done cancels pending escalation state', async () => {
    const mockMeds: MedicineItem[] = [
      {
        id: 'test-med-lisinopril',
        name: 'Lisinopril',
        dosage: '20 mg',
        schedules: [{ time: '8:00 AM', taken: false }],
        caregiverName: 'Sarah',
        nudgeStage: 'second_nudge',
      },
    ];

    let currentStage = 'second_nudge';

    await act(async () => {
      root.render(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(CardReminders, {
            initialMedicines: mockMeds,
            initialAppointments: [],
            initialNudgeStage: 'second_nudge',
            onNudgeStageChange: (stage) => {
              currentStage = stage;
            },
            onShowToast: () => {},
          })
        )
      );
    });

    // Verify second nudge alert banner is rendered
    const secondNudgeBanner = container.querySelector('#nudge-second-banner');
    assert.ok(
      secondNudgeBanner,
      'Active second nudge alert banner should be visible before marking done'
    );

    // Find the 8:00 AM dose button
    const buttons = Array.from(container.querySelectorAll('button'));
    const doseBtn = buttons.find((b) => b.textContent?.includes('8:00 AM'));
    assert.ok(doseBtn, 'Should find dose button for 8:00 AM');

    // Click the dose button to mark it taken
    await act(async () => {
      doseBtn.click();
    });

    // Escalation state must be cancelled immediately
    assert.strictEqual(
      currentStage,
      'none',
      'onNudgeStageChange callback should be invoked with "none"'
    );

    // Banner should be dismissed
    assert.strictEqual(
      container.querySelector('#nudge-second-banner'),
      null,
      'Second nudge banner must be cleared after marking dose done'
    );
    assert.strictEqual(
      container.querySelector('#nudge-gentle-banner'),
      null,
      'Gentle nudge banner must not be active'
    );
  });

  test('CardReminders: marking appointment done cancels pending escalation state', async () => {
    const mockAppointments: ReminderItem[] = [
      {
        id: 'appt-1',
        time: '11:00 AM',
        title: 'Physical Therapy',
        completed: false,
      },
    ];

    let currentStage = 'gentle';

    await act(async () => {
      root.render(
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(CardReminders, {
            initialMedicines: [],
            initialAppointments: mockAppointments,
            initialNudgeStage: 'gentle',
            onNudgeStageChange: (stage) => {
              currentStage = stage;
            },
            onShowToast: () => {},
          })
        )
      );
    });

    // Find the appointment button
    const buttons = Array.from(container.querySelectorAll('button'));
    const apptBtn = buttons.find((b) => b.textContent?.includes('Physical Therapy'));
    assert.ok(apptBtn, 'Should find appointment button');

    await act(async () => {
      apptBtn.click();
    });

    assert.strictEqual(
      currentStage,
      'none',
      'Marking appointment completed must cancel escalation state'
    );
  });
});
