import React, { useState } from 'react';
import { Pill, CheckCircle2, RotateCcw, Calendar } from 'lucide-react';
import { ReminderItem } from '../types';

interface CardRemindersProps {
  onShowToast: (msg: string) => void;
}

const initialReminders: ReminderItem[] = [
  {
    id: 'rem-1',
    time: '10:00 AM',
    title: 'Heart & Blood Pressure Medicine',
    category: 'medication',
    description: 'Amlodipine 5mg (1 tablet with water)',
    completed: false,
  },
  {
    id: 'rem-2',
    time: '2:30 PM',
    title: 'Book Club Video Call',
    category: 'appointment',
    description: 'Discussion of chapters 4-6 with Martha & Ruth',
    completed: false,
  },
];

export const CardReminders: React.FC<CardRemindersProps> = ({ onShowToast }) => {
  const [reminders, setReminders] = useState<ReminderItem[]>(initialReminders);

  const medReminder = reminders.find((r) => r.category === 'medication') || reminders[0];
  const apptReminder = reminders.find((r) => r.category === 'appointment') || reminders[1];

  const handleToggleMedDone = () => {
    const updated = !medReminder.completed;
    setReminders((prev) =>
      prev.map((r) => (r.id === medReminder.id ? { ...r, completed: updated } : r))
    );

    if (updated) {
      onShowToast('Morning medication recorded as taken! (Simulated)');
    } else {
      onShowToast('Medication marked as pending.');
    }
  };

  return (
    <article
      id="card-reminders-health"
      className="bg-[#FBF7EF] border-2 border-[#EAE1D0] rounded-2xl p-6 flex flex-col justify-between transition-colors min-h-[260px]"
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
                Reminders
              </h2>
              <span className="text-sm font-medium text-[#2B2A28]/80">
                Today&apos;s schedule
              </span>
            </div>
          </div>

          {medReminder.completed && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E5D57]/15 text-[#2E5D57] text-sm font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pills Taken</span>
            </span>
          )}
        </div>

        {/* Two lines of sample content: medication and appointment times */}
        <div className="space-y-2.5 text-lg text-[#2B2A28] leading-relaxed">
          <div className="flex items-start gap-2">
            <span
              className={`font-bold text-xl leading-none select-none ${
                medReminder.completed ? 'text-[#2E5D57]' : 'text-[#D9714B]'
              }`}
            >
              •
            </span>
            <span className={medReminder.completed ? 'line-through text-[#2B2A28]/60' : 'font-medium'}>
              <strong className="font-semibold text-[#2E5D57]">10:00 AM:</strong> Blood pressure medication (Amlodipine).
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-[#2E5D57] font-bold text-xl leading-none select-none">•</span>
            <span>
              <strong className="font-semibold text-[#2E5D57]">2:30 PM:</strong> Book club video call with Martha.
            </span>
          </div>
        </div>
      </div>

      {/* Action Button: Mark Done & Voice Caption */}
      <div className="pt-5 mt-auto">
        <button
          type="button"
          id="btn-mark-medication-done"
          onClick={handleToggleMedDone}
          className={`w-full min-h-[56px] px-6 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2.5 border transition-all active:scale-[0.98] ${
            medReminder.completed
              ? 'bg-white border-2 border-[#2E5D57] text-[#2E5D57]'
              : 'bg-[#2E5D57] border-[#234641] text-[#FBF7EF]'
          }`}
        >
          {medReminder.completed ? (
            <>
              <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Mark as Pending</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Mark Medication Done</span>
            </>
          )}
        </button>
        <p className="text-center text-sm font-medium text-[#2B2A28]/70 mt-1.5">
          or say &apos;took my pills&apos;
        </p>
      </div>
    </article>
  );
};
