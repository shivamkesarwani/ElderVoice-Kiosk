export type ScreenView = 'home' | 'listening' | 'sos';

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
