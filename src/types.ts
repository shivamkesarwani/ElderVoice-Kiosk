export type ScreenView = 'home' | 'listening' | 'sos' | 'caregiver' | 'translator';

export interface CaregiverUser {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  authProvider: 'google' | 'phone' | 'password' | 'demo';
}

export interface MedicationEscalationLog {
  id: string;
  timestamp: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  status: 'taken_on_time' | 'gentle_nudge' | 'urgent_reminder' | 'caregiver_notified';
  notes: string;
}

export interface LostItemLogEntry {
  id: string;
  timestamp: string;
  itemName: string;
  location: string;
  queryType: 'voice_query' | 'manual_search' | 'beacon_update';
  resolved: boolean;
}

export interface SystemHealthReport {
  micPermission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  lastVoiceTimestamp: string;
  geminiApiStatus: 'pass' | 'fail' | 'testing';
  geminiMessage: string;
  overallStatus: 'normal' | 'attention_needed';
}

export interface FamilyPhoto {
  id: string;
  title: string;
  sender: string;
  timeAgo: string;
  imageUrl: string;
  caption: string;
}

export interface MealItem {
  meal: string;
  time: string;
  title: string;
  description: string;
  dietaryNote?: string;
}

export interface ReminderItem {
  id: string;
  time: string;
  title: string;
  category: 'medication' | 'appointment' | 'activity';
  description: string;
  completed: boolean;
}

export interface HomeStatusItem {
  id: string;
  location: string;
  time: string;
  summary: string;
  state: 'normal' | 'active' | 'secure';
}

export interface VoiceExchange {
  transcript: string;
  reply: string;
  timestamp: string;
  source: 'gemini' | 'fallback';
}

export interface MedicineSchedule {
  time: string;
  taken: boolean;
}

export interface MedicineItem {
  id: string;
  name: string;
  dosage: string;
  photoUrl: string;
  schedules: MedicineSchedule[];
  // Nudge stage: 'none' | 'gentle' | 'urgent' | 'caregiver_notified'
  nudgeStage?: 'none' | 'gentle' | 'urgent' | 'caregiver_notified';
  caregiverName?: string;
}

export interface TrackedItem {
  id: string;
  name: string;
  room: string;
  relativeTime: string;
  category: 'reading' | 'keys' | 'remote' | 'medication' | 'mobility';
  iconName: 'glasses' | 'key' | 'tv' | 'pill' | 'cane';
}

export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
}

export type LanguageCode = 'en' | 'hi' | 'mr' | 'pa' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
}

