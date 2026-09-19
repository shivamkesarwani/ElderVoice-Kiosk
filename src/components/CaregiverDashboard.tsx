import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Pill,
  LogOut,
  User,
  Mic,
  Activity,
  Lock,
} from './Icons';
import {
  CaregiverUser,
  MedicationEscalationLog,
  LostItemLogEntry,
  SystemHealthReport,
} from '../types';
import {
  initialMedicationLogs,
  initialLostItemLogs,
  runSystemHealthCheck,
} from '../services/caregiverData';
import { logoutCaregiver } from '../services/firebaseAuth';

interface CaregiverDashboardProps {
  user: CaregiverUser;
  onLogout: () => void;
  onBackToKiosk: () => void;
  onShowToast: (msg: string) => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  user,
  onLogout,
  onBackToKiosk,
  onShowToast,
}) => {
  const [medLogs] = useState<MedicationEscalationLog[]>(initialMedicationLogs);
  const [itemLogs] = useState<LostItemLogEntry[]>(initialLostItemLogs);
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Run initial health check on mount
  useEffect(() => {
    let isMounted = true;
    setIsCheckingHealth(true);
    runSystemHealthCheck()
      .then((report) => {
        if (isMounted) {
          setHealthReport(report);
          setIsCheckingHealth(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsCheckingHealth(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const report = await runSystemHealthCheck();
      setHealthReport(report);
      onShowToast('System health diagnostic completed.');
    } catch {
      onShowToast('Diagnostic check encountered an error.');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSignOut = async () => {
    await logoutCaregiver();
    onLogout();
    onShowToast('Signed out of Caregiver Companion.');
  };

  const getStatusBadge = (status: MedicationEscalationLog['status']) => {
    switch (status) {
      case 'taken_on_time':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#2E5D57]/10 text-[#2E5D57]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Taken On Time</span>
          </span>
        );
      case 'gentle_nudge':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Gentle Nudge</span>
          </span>
        );
      case 'urgent_reminder':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#D9714B]/10 text-[#D9714B] border border-[#D9714B]/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Urgent Visual Alert</span>
          </span>
        );
      case 'caregiver_notified':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#C2401F]/10 text-[#C2401F] border border-[#C2401F]/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Caregiver SMS Alert</span>
          </span>
        );
    }
  };

  return (
    <div
      id="caregiver-dashboard-surface"
      className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6"
    >
      {/* Top Header & Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-[#EAE1D0]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToKiosk}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#EAE1D0] bg-white text-[#2B2A28] font-bold text-sm hover:border-[#2E5D57] active:scale-95 transition-transform"
            aria-label="Return to kiosk"
          >
            <ArrowLeft className="w-4 h-4 text-[#2E5D57]" />
            <span>Return to Kiosk</span>
          </button>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2A28]">
              Caregiver Companion
            </h1>
            <p className="text-xs sm:text-sm text-[#2B2A28]/70">
              Remote wellbeing monitoring for Eleanor&apos;s residence
            </p>
          </div>
        </div>

        {/* User profile & Sign Out */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-white border border-[#EAE1D0] px-4 py-2 rounded-2xl">
          <div className="w-9 h-9 rounded-full bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57]">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="text-left pr-2">
            <p className="text-xs sm:text-sm font-bold text-[#2B2A28] leading-tight">
              {user.displayName || user.email || user.phoneNumber || 'Caregiver'}
            </p>
            <span className="text-[11px] text-[#2E5D57] font-semibold capitalize">
              Via {user.authProvider} auth
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-[#2B2A28]/70 hover:text-[#C2401F] hover:bg-black/5"
            title="Sign out of caregiver companion"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Read-Only Safety Banner */}
      <div className="bg-[#2E5D57]/10 border border-[#2E5D57]/30 rounded-2xl p-4 flex items-center gap-3 text-xs sm:text-sm text-[#2B2A28]">
        <Lock className="w-5 h-5 text-[#2E5D57] shrink-0" />
        <span>
          <strong>Read-Only Monitoring Mode:</strong> This view is for family peace of mind and observation. Remote commands or triggers cannot interrupt Eleanor&apos;s physical kiosk display.
        </span>
      </div>

      {/* SECTION 1: SYSTEM HEALTH CHECK (Pass/Fail plain language) */}
      <section
        id="caregiver-system-health-panel"
        className="bg-white border-2 border-[#EAE1D0] rounded-3xl p-5 sm:p-6 shadow-sm"
        aria-label="System Health Check"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE1D0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E5D57]/10 text-[#2E5D57] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2A28]">
                System Health Check
              </h2>
              <p className="text-xs sm:text-sm text-[#2B2A28]/70">
                Simple pass/fail operational verification of tablet hardware &amp; voice agent
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualHealthCheck}
            disabled={isCheckingHealth}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FBF7EF] border border-[#EAE1D0] hover:border-[#2E5D57] text-[#2B2A28] font-bold text-xs sm:text-sm active:scale-95 transition-transform shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-[#2E5D57] ${isCheckingHealth ? 'animate-spin' : ''}`} />
            <span>{isCheckingHealth ? 'Testing System…' : 'Run Diagnostic'}</span>
          </button>
        </div>

        {/* 3 Status Check Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* 1. Microphone Permission */}
          <div className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#EAE1D0] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2B2A28]/70">
                Microphone Access
              </span>
              <Mic className="w-4 h-4 text-[#2E5D57]" />
            </div>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    healthReport?.micPermission === 'granted' || healthReport?.micPermission === 'prompt'
                      ? 'bg-[#2E5D57]'
                      : 'bg-[#C2401F]'
                  }`}
                />
                <span className="font-serif text-lg font-bold text-[#2B2A28]">
                  {healthReport?.micPermission === 'granted'
                    ? 'Permission Granted'
                    : healthReport?.micPermission === 'prompt'
                    ? 'Ready on Demand (Tap to Speak)'
                    : 'Permission Blocked'}
                </span>
              </div>
              <p className="text-xs text-[#2B2A28]/70 mt-1">
                Hardware audio input enabled for voice questions.
              </p>
            </div>
          </div>

          {/* 2. Last Voice Interaction */}
          <div className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#EAE1D0] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2B2A28]/70">
                Last Voice Interaction
              </span>
              <Clock className="w-4 h-4 text-[#2E5D57]" />
            </div>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#2E5D57]" />
                <span className="font-serif text-lg font-bold text-[#2B2A28]">
                  Today at 9:15 AM
                </span>
              </div>
              <p className="text-xs text-[#2B2A28]/70 mt-1">
                Query: &ldquo;Where are my reading glasses?&rdquo; (Answered)
              </p>
            </div>
          </div>

          {/* 3. Gemini Voice Agent API */}
          <div className="p-4 rounded-2xl bg-[#FBF7EF] border border-[#EAE1D0] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2B2A28]/70">
                Gemini Voice Agent
              </span>
              <ShieldCheck className="w-4 h-4 text-[#2E5D57]" />
            </div>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    healthReport?.geminiApiStatus === 'pass' ? 'bg-[#2E5D57]' : 'bg-[#C2401F]'
                  }`}
                />
                <span className="font-serif text-lg font-bold text-[#2B2A28]">
                  {healthReport?.geminiMessage || 'Voice agent: responding normally'}
                </span>
              </div>
              <p className="text-xs text-[#2B2A28]/70 mt-1">
                Tested via cloud server. Reassuring senior persona active.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MEDICATION HISTORY & ESCALATION LOG */}
      <section
        id="caregiver-medication-logs-panel"
        className="bg-white border-2 border-[#EAE1D0] rounded-3xl p-5 sm:p-6 shadow-sm"
        aria-label="Medication Reminders & Escalation Log"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE1D0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E5D57]/10 text-[#2E5D57] flex items-center justify-center shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2A28]">
                Medicine Reminder History &amp; Escalation Log
              </h2>
              <p className="text-xs sm:text-sm text-[#2B2A28]/70">
                Chronological record of daily doses, progressive nudges, and caregiver SMS notifications
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#2E5D57] bg-[#2E5D57]/10 px-3 py-1 rounded-full">
            {medLogs.length} Records
          </span>
        </div>

        <div className="divide-y divide-[#EAE1D0] mt-2">
          {medLogs && medLogs.length > 0 ? (
            medLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-base text-[#2B2A28]">{log.medicineName}</span>
                    <span className="text-xs text-[#2B2A28]/60">({log.dosage})</span>
                    {getStatusBadge(log.status)}
                  </div>
                  <p className="text-xs sm:text-sm text-[#2B2A28]/80">{log.notes}</p>
                </div>
                <div className="text-xs font-medium text-[#2B2A28]/70 whitespace-nowrap self-start sm:self-center">
                  {log.timestamp}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-[#2B2A28]/70">
              No medication reminder logs recorded yet today.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: LOST-ITEM LOG */}
      <section
        id="caregiver-lost-items-panel"
        className="bg-white border-2 border-[#EAE1D0] rounded-3xl p-5 sm:p-6 shadow-sm"
        aria-label="Lost Item Search Log"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE1D0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2E5D57]/10 text-[#2E5D57] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2A28]">
                Lost-Item Finder Activity Log
              </h2>
              <p className="text-xs sm:text-sm text-[#2B2A28]/70">
                Room-level beacon updates and queries asked by Eleanor
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#2E5D57] bg-[#2E5D57]/10 px-3 py-1 rounded-full">
            {itemLogs.length} Items Located
          </span>
        </div>

        <div className="divide-y divide-[#EAE1D0] mt-2">
          {itemLogs && itemLogs.length > 0 ? (
            itemLogs.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#2B2A28]">{item.itemName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                      {item.queryType === 'voice_query'
                        ? 'Spoken Voice Query'
                        : item.queryType === 'manual_search'
                        ? 'Screen Tap'
                        : 'Beacon Ping'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#2B2A28]/80 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2E5D57] shrink-0" />
                    <span>{item.location}</span>
                  </p>
                </div>
                <div className="text-xs font-medium text-[#2B2A28]/70 whitespace-nowrap self-start sm:self-center">
                  {item.timestamp}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-[#2B2A28]/70">
              No item queries or beacon pings recorded.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CaregiverDashboard;
