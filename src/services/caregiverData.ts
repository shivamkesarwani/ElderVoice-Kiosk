import { MedicationEscalationLog, LostItemLogEntry, SystemHealthReport } from '../types';

export const initialMedicationLogs: MedicationEscalationLog[] = [
  {
    id: 'med-log-1',
    timestamp: 'Today, 8:05 AM',
    medicineName: 'Lisinopril (Blood Pressure)',
    dosage: '10mg',
    scheduledTime: '8:00 AM',
    status: 'taken_on_time',
    notes: 'Confirmed on kiosk screen by Eleanor at 8:05 AM.',
  },
  {
    id: 'med-log-2',
    timestamp: 'Yesterday, 8:20 AM',
    medicineName: 'Lisinopril (Blood Pressure)',
    dosage: '10mg',
    scheduledTime: '8:00 AM',
    status: 'gentle_nudge',
    notes: 'Gentle chime sounded at 8:15 AM; Eleanor acknowledged at 8:20 AM.',
  },
  {
    id: 'med-log-3',
    timestamp: '2 days ago, 12:45 PM',
    medicineName: 'Metformin (Blood Sugar)',
    dosage: '500mg',
    scheduledTime: '12:00 PM',
    status: 'urgent_reminder',
    notes: 'Visual amber alert shown; marked taken after 45 minutes.',
  },
  {
    id: 'med-log-4',
    timestamp: 'Last week, 8:40 AM',
    medicineName: 'Lisinopril (Blood Pressure)',
    dosage: '10mg',
    scheduledTime: '8:00 AM',
    status: 'caregiver_notified',
    notes: 'SMS escalation sent to Sarah (555-0192). Resolved by Sarah phone call.',
  },
];

export const initialLostItemLogs: LostItemLogEntry[] = [
  {
    id: 'item-log-1',
    timestamp: 'Today, 9:15 AM',
    itemName: 'Reading Glasses',
    location: 'Kitchen island counter next to fruit bowl',
    queryType: 'voice_query',
    resolved: true,
  },
  {
    id: 'item-log-2',
    timestamp: 'Today, 7:45 AM',
    itemName: 'House Keys',
    location: 'Entryway table wooden tray',
    queryType: 'beacon_update',
    resolved: true,
  },
  {
    id: 'item-log-3',
    timestamp: 'Yesterday, 4:20 PM',
    itemName: 'TV Remote',
    location: 'Living room armchair side pouch',
    queryType: 'manual_search',
    resolved: true,
  },
  {
    id: 'item-log-4',
    timestamp: 'Yesterday, 11:30 AM',
    itemName: 'Walking Cane',
    location: 'Front porch coat rack stand',
    queryType: 'voice_query',
    resolved: true,
  },
  {
    id: 'item-log-5',
    timestamp: '2 days ago, 2:10 PM',
    itemName: 'Daily Pill Box',
    location: 'Kitchen counter next to electric kettle',
    queryType: 'voice_query',
    resolved: true,
  },
];

export async function runSystemHealthCheck(): Promise<SystemHealthReport> {
  // Check 1: Microphone Permission
  let micStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
  try {
    if (typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      micStatus = result.state as 'granted' | 'denied' | 'prompt';
    } else if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      micStatus = 'prompt';
    } else {
      micStatus = 'unsupported';
    }
  } catch {
    micStatus = 'prompt';
  }

  // Check 2: Gemini / Voice API status test call
  let geminiApiStatus: 'pass' | 'fail' = 'pass';
  let geminiMessage = 'Voice agent: responding normally';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('/api/voice-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: 'Status check' }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.reply) {
        geminiApiStatus = 'pass';
        geminiMessage = 'Voice agent: responding normally';
      } else {
        geminiApiStatus = 'fail';
        geminiMessage = 'Voice agent: unexpected response format';
      }
    } else {
      geminiApiStatus = 'fail';
      geminiMessage = 'Voice agent: no response, check connection';
    }
  } catch (err: any) {
    geminiApiStatus = 'fail';
    geminiMessage = 'Voice agent: no response, check connection';
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    micPermission: micStatus,
    lastVoiceTimestamp: `Today at ${timeString} (routine check)`,
    geminiApiStatus,
    geminiMessage,
    overallStatus: geminiApiStatus === 'pass' ? 'normal' : 'attention_needed',
  };
}
