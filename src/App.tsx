/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScreenView, AccessibilitySettings, CaregiverUser } from './types';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { SimulationToast } from './components/SimulationToast';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { ListeningScreen } from './components/ListeningScreen';
import { LanguageTranslatorScreen } from './components/LanguageTranslatorScreen';
import { SosScreen } from './components/SosScreen';
import { CaregiverLogin } from './components/CaregiverLogin';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { PinModal } from './components/PinModal';
import { onAuthStateChange } from './services/firebaseAuth';
import { LanguageProvider } from './context/LanguageContext';

function KioskApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('home');
  const [caregiverUser, setCaregiverUser] = useState<CaregiverUser | null>(null);
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [a11ySettings, setA11ySettings] = useState<AccessibilitySettings>({
    largeText: false,
    highContrast: false,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // Listen to Firebase Auth state for companion caregiver view
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCaregiverUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleStartListening = (initialPrompt?: string) => {
    setActiveVoicePrompt(initialPrompt);
    setCurrentScreen('listening');
  };

  const handleTriggerSos = () => {
    setCurrentScreen('sos');
  };

  const handleReturnHome = () => {
    setCurrentScreen('home');
    setActiveVoicePrompt(undefined);
  };

  const handleUpdateA11y = (newSettings: Partial<AccessibilitySettings>) => {
    setA11ySettings((prev) => ({ ...prev, ...newSettings }));
    if (newSettings.largeText !== undefined) {
      showToast(`Large text mode ${newSettings.largeText ? 'enabled' : 'disabled'}.`);
    }
    if (newSettings.highContrast !== undefined) {
      showToast(`High-contrast mode ${newSettings.highContrast ? 'enabled' : 'disabled'}.`);
    }
  };

  // Keyboard shortcut support for accessibility and testing (Escape to return home)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPinModalOpen) {
          setIsPinModalOpen(false);
        } else if (isA11yOpen) {
          setIsA11yOpen(false);
        } else if (currentScreen !== 'home') {
          handleReturnHome();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, isA11yOpen, isPinModalOpen]);

  const handleSosCallPlaced = useCallback(() => {
    showToast("Emergency alert simulated: Dispatch & Sarah have been notified.");
  }, [showToast]);

  return (
    <div
      className={`min-h-screen bg-[#FBF7EF] text-[#2B2A28] flex flex-col font-sans select-none antialiased ${
        a11ySettings.largeText ? 'large-text-mode' : ''
      } ${a11ySettings.highContrast ? 'high-contrast-mode' : ''}`}
    >
      {/* Top Header - Always visible with Wordmark, Clock, PWA install, View Settings, Caregiver Access, Language Dropdown, and SOS Button */}
      <Header
        onSosClick={handleTriggerSos}
        onHomeClick={handleReturnHome}
        onOpenAccessibility={() => setIsA11yOpen(true)}
        onCaregiverClick={() => setCurrentScreen('caregiver')}
        onTranslatorClick={() => setCurrentScreen('translator')}
        isSosActive={currentScreen === 'sos'}
        onShowToast={showToast}
      />

      {/* Screen Views - Smooth client-side switching under 300ms */}
      <div className="flex-1 flex flex-col transition-opacity duration-200">
        {currentScreen === 'home' && (
          <HomeDashboard
            onStartListening={handleStartListening}
            onOpenTranslator={() => setCurrentScreen('translator')}
            onShowToast={showToast}
            onSosClick={handleTriggerSos}
            isSosActive={false}
          />
        )}

        {currentScreen === 'listening' && (
          <ListeningScreen
            initialTranscript={activeVoicePrompt}
            onClose={handleReturnHome}
          />
        )}

        {currentScreen === 'translator' && (
          <LanguageTranslatorScreen
            onClose={handleReturnHome}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'sos' && (
          <SosScreen
            onCancel={handleReturnHome}
            onCallPlaced={handleSosCallPlaced}
          />
        )}

        {/* Caregiver Companion View (Separate surface with Firebase Auth, read-only monitoring) */}
        {currentScreen === 'caregiver' && (
          caregiverUser ? (
            <CaregiverDashboard
              user={caregiverUser}
              onLogout={() => setCaregiverUser(null)}
              onBackToKiosk={handleReturnHome}
              onShowToast={showToast}
            />
          ) : (
            <CaregiverLogin
              onLoginSuccess={(user) => setCaregiverUser(user)}
              onBackToKiosk={handleReturnHome}
              onShowToast={showToast}
            />
          )
        )}
      </div>

      {/* Accessibility & View Preferences Panel */}
      <AccessibilityPanel
        isOpen={isA11yOpen}
        onClose={() => setIsA11yOpen(false)}
        settings={a11ySettings}
        onUpdateSettings={handleUpdateA11y}
      />

      {/* Local Kiosk PIN Modal for on-device config edits */}
      <PinModal
        isOpen={isPinModalOpen}
        onSuccess={() => {
          setIsPinModalOpen(false);
          showToast('Local kiosk unlocked for on-device schedule edits.');
        }}
        onCancel={() => setIsPinModalOpen(false)}
      />

      {/* Simulation Feedback Toast (also provides visual cue for alarms/chimes) */}
      {toastMessage && (
        <SimulationToast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <KioskApp />
    </LanguageProvider>
  );
}
