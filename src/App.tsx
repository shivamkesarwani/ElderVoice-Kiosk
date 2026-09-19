/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScreenView } from './types';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { ListeningScreen } from './components/ListeningScreen';
import { SosScreen } from './components/SosScreen';
import { SimulationToast } from './components/SimulationToast';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('home');
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Keyboard shortcut support for accessibility and testing (e.g. Escape to return home)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentScreen !== 'home') {
          handleReturnHome();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen]);

  return (
    <div className="min-h-screen bg-[#FBF7EF] text-[#2B2A28] flex flex-col font-sans select-none antialiased">
      {/* Top Header - Always visible with Wordmark, Clock, and Red SOS Button */}
      <Header
        onSosClick={handleTriggerSos}
        onHomeClick={handleReturnHome}
        isSosActive={currentScreen === 'sos'}
      />

      {/* Screen Views - Smooth client-side switching under 300ms */}
      <div className="flex-1 flex flex-col transition-opacity duration-200">
        {currentScreen === 'home' && (
          <HomeDashboard
            onStartListening={handleStartListening}
            onShowToast={showToast}
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
            onCallPlaced={() => {
              showToast("Emergency alert simulated: Dispatch & Sarah have been notified.");
            }}
          />
        )}
      </div>

      {/* Simulation Feedback Toast */}
      {toastMessage && (
        <SimulationToast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
