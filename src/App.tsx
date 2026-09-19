/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScreenView, AccessibilitySettings } from './types';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { SimulationToast } from './components/SimulationToast';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { ListeningScreen } from './components/ListeningScreen';
import { SosScreen } from './components/SosScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('home');
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isA11yOpen, setIsA11yOpen] = useState(false);
  const [a11ySettings, setA11ySettings] = useState<AccessibilitySettings>({
    largeText: false,
    highContrast: false,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
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
        if (isA11yOpen) {
          setIsA11yOpen(false);
        } else if (currentScreen !== 'home') {
          handleReturnHome();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, isA11yOpen]);

  const handleSosCallPlaced = useCallback(() => {
    showToast("Emergency alert simulated: Dispatch & Sarah have been notified.");
  }, [showToast]);

  return (
    <div
      className={`min-h-screen bg-[#FBF7EF] text-[#2B2A28] flex flex-col font-sans select-none antialiased ${
        a11ySettings.largeText ? 'large-text-mode' : ''
      } ${a11ySettings.highContrast ? 'high-contrast-mode' : ''}`}
    >
      {/* Top Header - Always visible with Wordmark, Clock, PWA install, View Settings, and SOS Button */}
      <Header
        onSosClick={handleTriggerSos}
        onHomeClick={handleReturnHome}
        onOpenAccessibility={() => setIsA11yOpen(true)}
        isSosActive={currentScreen === 'sos'}
        onShowToast={showToast}
      />

      {/* Screen Views - Smooth client-side switching under 300ms */}
      <div className="flex-1 flex flex-col transition-opacity duration-200">
        {currentScreen === 'home' && (
          <HomeDashboard
            onStartListening={handleStartListening}
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

        {currentScreen === 'sos' && (
          <SosScreen
            onCancel={handleReturnHome}
            onCallPlaced={handleSosCallPlaced}
          />
        )}
      </div>

      {/* Accessibility & View Preferences Panel */}
      <AccessibilityPanel
        isOpen={isA11yOpen}
        onClose={() => setIsA11yOpen(false)}
        settings={a11ySettings}
        onUpdateSettings={handleUpdateA11y}
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
