export type ReminderOffsetDays = 90 | 30 | 7 | 1 | 0;

export const STANDARD_REMINDER_OFFSETS: { days: ReminderOffsetDays; label: string }[] = [
  { days: 90, label: '90 days before' },
  { days: 30, label: '30 days before' },
  { days: 7, label: '7 days before' },
  { days: 1, label: '1 day before' },
  { days: 0, label: 'On expiry date' },
];

export interface ReminderRule {
  id: string;
  recordId: string;
  offsetDays: number;
  enabled: boolean;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledNotificationInfo {
  notificationId: string;
  recordId: string;
  recordTitle: string;
  targetDate: string;
  offsetDays: number;
  triggerDate: Date;
}
