import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle2, RotateCcw, AlertTriangle, Bell, Clock } from './Icons';
import { MedicineItem, ReminderItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

export interface CardRemindersProps {
  onShowToast: (msg: string) => void;
  initialMedicines?: MedicineItem[];
  initialAppointments?: ReminderItem[];
  initialNudgeStage?: 'none' | 'gentle' | 'second_nudge' | 'notified_caregiver';
  onNudgeStageChange?: (stage: 'none' | 'gentle' | 'second_nudge' | 'notified_caregiver') => void;
}

export const defaultInitialMedicines: MedicineItem[] = [
  {
    id: 'med-1',
    name: 'Lisinopril',
    dosage: '20 mg with breakfast & water',
    photoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
    schedules: [
      { time: '8:00 AM', taken: false },
    ],
    caregiverName: 'Sarah (Daughter)',
    nudgeStage: 'none',
  },
  {
    id: 'med-2',
    name: 'Donepezil',
    dosage: '10 mg evening memory support',
    photoUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=120&auto=format&fit=crop&q=80',
    schedules: [
      { time: '8:00 AM', taken: true },
      { time: '8:00 PM', taken: false },
    ],
    caregiverName: 'Sarah (Daughter)',
    nudgeStage: 'none',
  },
  {
    id: 'med-3',
    name: 'Calcium + Vit D',
    dosage: '600 mg chewable tablet with lunch',
    photoUrl: 'https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=120&auto=format&fit=crop&q=80',
    schedules: [
      { time: '1:00 PM', taken: false },
    ],
    caregiverName: 'Sarah (Daughter)',
    nudgeStage: 'none',
  },
];

export const defaultInitialAppointments: ReminderItem[] = [
  {
    id: 'rem-appt-1',
    time: '2:30 PM',
    title: 'Book Club Video Call',
    category: 'appointment',
    description: 'Discussion of chapters 4-6 with Martha & Ruth',
    completed: false,
  },
];

export const CardReminders: React.FC<CardRemindersProps> = ({
  onShowToast,
  initialMedicines,
  initialAppointments,
  initialNudgeStage,
  onNudgeStageChange,
}) => {
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState<MedicineItem[]>(
    initialMedicines !== undefined ? initialMedicines : defaultInitialMedicines
  );
  const [appointments, setAppointments] = useState<ReminderItem[]>(
    initialAppointments !== undefined ? initialAppointments : defaultInitialAppointments
  );

  // Active nudge simulation state for the 8:00 AM Lisinopril
  // Stages: 'none' -> 'gentle' -> 'second_nudge' -> 'notified_caregiver'
  const [nudgeStage, setNudgeStage] = useState<'none' | 'gentle' | 'second_nudge' | 'notified_caregiver'>(
    initialNudgeStage !== undefined
      ? initialNudgeStage
      : medicines.length > 0
      ? 'gentle'
      : 'none'
  );
  const [activeNudgeMedId, setActiveNudgeMedId] = useState<string>(
    medicines[0]?.id || 'med-1'
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20);

  // Sync stage to parent callback if registered
  const updateNudgeStage = (stage: 'none' | 'gentle' | 'second_nudge' | 'notified_caregiver') => {
    setNudgeStage(stage);
    if (onNudgeStageChange) {
      onNudgeStageChange(stage);
    }
  };

  // Gentle reminder automatic countdown progression simulation
  useEffect(() => {
    if (nudgeStage !== 'gentle' && nudgeStage !== 'second_nudge') return;
    if (medicines.length === 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [nudgeStage, medicines.length]);

  // Handle stage transitions and toast announcements safely
  useEffect(() => {
    if (medicines.length === 0) return;

    if (secondsRemaining <= 0) {
      if (nudgeStage === 'gentle') {
        updateNudgeStage('second_nudge');
        setSecondsRemaining(15);
        onShowToast('Second reminder: Lisinopril is still pending!');
      } else if (nudgeStage === 'second_nudge') {
        updateNudgeStage('notified_caregiver');
        onShowToast('Simulated Alert: Notifying caregiver Sarah that 8:00 AM Lisinopril was unconfirmed.');
      }
    }
  }, [secondsRemaining, nudgeStage, medicines.length, onShowToast]);

  const activeMed = medicines.find((m) => m.id === activeNudgeMedId) || medicines[0] || null;

  /**
   * Mark a medication dose taken or toggle status.
   * Marking a dose as taken immediately cancels any pending escalation state.
   */
  const handleMarkDoseTaken = (medId: string, timeStr: string) => {
    let willBeTaken = false;

    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id !== medId) return med;
        const updatedSchedules = med.schedules.map((s) => {
          if (s.time === timeStr) {
            willBeTaken = !s.taken;
            return { ...s, taken: willBeTaken };
          }
          return s;
        });
        return { ...med, schedules: updatedSchedules };
      })
    );

    const targetMed = medicines.find((m) => m.id === medId);
    const targetDose = targetMed?.schedules.find((s) => s.time === timeStr);
    const resolvedWillBeTaken = !targetDose?.taken;

    if (resolvedWillBeTaken) {
      // Marking reminder done cancels any pending escalation state
      updateNudgeStage('none');
      onShowToast(`Recorded: ${targetMed?.name || 'Medication'} (${timeStr}) taken!`);
    } else {
      onShowToast(`Marked ${targetMed?.name || 'Medication'} (${timeStr}) as pending.`);
    }
  };

  /**
   * Toggle appointment completion.
   * Marking an appointment done cancels any pending escalation state.
   */
  const handleToggleAppointment = (apptId: string) => {
    setAppointments((prev) =>
      prev.map((appt) => {
        if (appt.id !== apptId) return appt;
        const willBeCompleted = !appt.completed;
        if (willBeCompleted) {
          updateNudgeStage('none');
          onShowToast(`Completed: ${appt.title}`);
        }
        return { ...appt, completed: willBeCompleted };
      })
    );
  };

  const handleRestartSimulation = () => {
    updateNudgeStage('gentle');
    setSecondsRemaining(20);
    setActiveNudgeMedId(medicines[0]?.id || 'med-1');
    onShowToast('Restarted scheduled reminder demonstration.');
  };

  return (
    <article
      id="card-reminders-health"
      className="bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-colors min-h-[340px]"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#2E5D57]/10 flex items-center justify-center text-[#2E5D57] shrink-0">
              <Pill className="w-6 h-6 stroke-[2.25]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#2B2A28]">
                {t ? t('cardRemindersTitle') : 'Daily Reminders & Care'}
              </h2>
              <span className="text-sm font-medium text-[#2B2A28]/80">
                {t ? t('cardRemindersSubtitle') : 'Eleanor’s routine'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestartSimulation}
            className="text-xs sm:text-sm font-semibold text-[#2E5D57] bg-white border border-[#EAE1D0] hover:border-[#2E5D57] px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
            title="Demonstrate gentle nudge to caregiver notification flow"
          >
            Simulate Flow
          </button>
        </div>

        {/* Nudge Stage Banners (Visual Alert for low-hearing support) */}
        {activeMed && nudgeStage === 'gentle' && (
          <div
            id="nudge-gentle-banner"
            className="mb-4 p-3.5 rounded-xl bg-[#2E5D57]/10 border-2 border-[#2E5D57] flex items-start gap-3 text-[#2B2A28]"
            role="alert"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2E5D57] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 text-sm sm:text-base">
              <span className="font-bold text-[#2E5D57]">Gentle Scheduled Reminder:</span>
              <p className="mt-0.5">
                Time for <strong>8:00 AM {activeMed.name}</strong> ({activeMed.dosage}).
              </p>
              <span className="text-xs text-[#2B2A28]/70 block mt-1 font-medium">
                Next nudge in {secondsRemaining}s if unconfirmed.
              </span>
            </div>
          </div>
        )}

        {activeMed && nudgeStage === 'second_nudge' && (
          <div
            id="nudge-second-banner"
            className="mb-4 p-3.5 rounded-xl bg-[#D9714B]/15 border-2 border-[#D9714B] flex items-start gap-3 text-[#2B2A28] animate-pulse"
            role="alert"
          >
            <div className="w-8 h-8 rounded-lg bg-[#D9714B] text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 text-sm sm:text-base">
              <span className="font-bold text-[#C2401F]">Second Reminder (Attention Needed):</span>
              <p className="mt-0.5">
                <strong>{activeMed.name}</strong> was due at 8:00 AM and is still unconfirmed.
              </p>
              <span className="text-xs text-[#C2401F] block mt-1 font-bold">
                Caregiver {activeMed.caregiverName || 'Sarah'} will be notified in {secondsRemaining}s.
              </span>
            </div>
          </div>
        )}

        {activeMed && nudgeStage === 'notified_caregiver' && (
          <div
            id="nudge-notified-banner"
            className="mb-4 p-3.5 rounded-xl bg-[#C2401F]/15 border-2 border-[#C2401F] flex items-start gap-3 text-[#2B2A28]"
            role="alert"
          >
            <div className="w-8 h-8 rounded-lg bg-[#C2401F] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 text-sm sm:text-base">
              <span className="font-bold text-[#C2401F]">Mock Caregiver Notification Sent:</span>
              <p className="mt-0.5 font-medium">
                Notifying <strong>{activeMed.caregiverName || 'Sarah'}</strong>: 8:00 AM {activeMed.name} unconfirmed.
              </p>
              <span className="text-xs text-[#2B2A28]/70 block mt-1 italic">
                (UI simulation only — no actual SMS or physical dispenser activated)
              </span>
            </div>
          </div>
        )}

        {/* Medicine Entries List */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B2A28]/70">
            Today&apos;s Prescriptions
          </h3>

          <div className="space-y-2.5">
            {medicines.length > 0 ? (
              medicines.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#EAE1D0] hover:border-[#2E5D57]/50 transition-colors"
                >
                  {/* Photo + Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#FBF7EF] border border-[#EAE1D0] shrink-0 flex items-center justify-center">
                      <img
                        src={med.photoUrl}
                        alt={med.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-base sm:text-lg text-[#2B2A28] truncate">
                        {med.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#2B2A28]/80 truncate">
                        {med.dosage}
                      </p>
                    </div>
                  </div>

                  {/* Dose Times & Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {med.schedules.map((dose) => (
                      <button
                        key={dose.time}
                        type="button"
                        onClick={() => handleMarkDoseTaken(med.id, dose.time)}
                        className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 border-2 transition-all active:scale-95 ${
                          dose.taken
                            ? 'bg-[#2E5D57] border-[#2E5D57] text-white shadow-xs'
                            : 'bg-[#FBF7EF] border-[#EAE1D0] text-[#2B2A28] hover:border-[#2E5D57]'
                        }`}
                        aria-label={`${med.name} at ${dose.time}, currently ${
                          dose.taken ? 'Taken' : 'Pending'
                        }. Tap to toggle.`}
                      >
                        {dose.taken ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>{dose.time} {t ? t('taken') : 'Taken'}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-[#2E5D57]" />
                            <span>{dose.time}</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-white border border-[#EAE1D0] text-center text-sm text-[#2B2A28]/70">
                No prescriptions currently scheduled for today.
              </div>
            )}
          </div>

          {/* Other Daily Reminders (e.g. Book club appointment) */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B2A28]/70 mb-2">
              Activities &amp; Appointments
            </h3>
            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <button
                  key={appt.id}
                  type="button"
                  onClick={() => handleToggleAppointment(appt.id)}
                  className={`w-full text-left flex items-center justify-between gap-2.5 text-base sm:text-lg p-2.5 rounded-xl border transition-all ${
                    appt.completed
                      ? 'bg-[#2E5D57]/10 border-[#2E5D57] text-[#2E5D57]'
                      : 'bg-white/60 border-[#EAE1D0] text-[#2B2A28]'
                  }`}
                  aria-label={`${appt.title} at ${appt.time}, ${appt.completed ? 'Completed' : 'Pending'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#2E5D57] font-bold text-xl leading-none select-none">•</span>
                    <span>
                      <strong className="font-semibold text-[#2E5D57]">{appt.time}:</strong> {appt.title}
                    </span>
                  </div>
                  {appt.completed && (
                    <CheckCircle2 className="w-4 h-4 text-[#2E5D57] shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-3 rounded-xl bg-white/60 border border-[#EAE1D0] text-center text-xs sm:text-sm text-[#2B2A28]/70">
                No other appointments scheduled for today.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-4 mt-auto border-t border-[#EAE1D0]/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p className="text-xs text-[#2B2A28]/70">
          Reminder &amp; confirmation only · Simulated notification
        </p>
        <p className="text-xs font-medium text-[#2E5D57]">
          Say &apos;Did I take my morning pills?&apos;
        </p>
      </div>
    </article>
  );
};

export default CardReminders;
