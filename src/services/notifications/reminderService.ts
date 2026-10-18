import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { ReminderRule } from '../../types/reminder';
import { SavedRecord } from '../../types/record';
import {
  createReminderRule,
  deleteReminderRulesForRecord,
  getReminderRulesForRecord,
  updateReminderNotificationId,
} from '../storage/remindersRepo';
import { getAllRecords } from '../storage/recordsRepo';

// Configure how notifications appear when app is in foreground
if (process.env.NODE_ENV !== 'test') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Checks notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Requests notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted' && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('document-reminders', {
        name: 'Document Renewals & Expiries',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('[Notifications] Failed to request permission:', error);
    return false;
  }
}

/**
 * Calculates the exact trigger Date for a given offset from an ISO date string (YYYY-MM-DD).
 * Fires at 9:00 AM local time on the target day.
 */
export function calculateTriggerDate(targetDateIso: string, offsetDays: number): Date | null {
  const parts = targetDateIso.split('-').map(Number);
  if (parts.length !== 3) return null;

  const [year, month, day] = parts;
  // Create date at 9:00 AM local time
  const target = new Date(year, month - 1, day, 9, 0, 0, 0);

  // Subtract offset
  target.setDate(target.getDate() - offsetDays);

  // If already in the past, return null (cannot trigger past notification)
  if (target.getTime() <= Date.now()) {
    return null;
  }

  return target;
}

/**
 * Schedules reminders for an approved saved record.
 * Never schedules for unapproved records!
 */
export async function scheduleRemindersForRecord(
  record: SavedRecord,
  selectedOffsets: number[]
): Promise<ReminderRule[]> {
  const targetDateStr = record.expiryDate || record.renewalDate || record.warrantyEndDate;
  if (!targetDateStr) {
    return [];
  }

  // Remove existing reminders for this record first
  await cancelRemindersForRecord(record.id);

  const hasPermission = await getNotificationPermissionStatus();
  const createdRules: ReminderRule[] = [];

  for (const offset of selectedOffsets) {
    const ruleId = `rule_${record.id}_${offset}`;
    let notificationId: string | null = null;

    if (hasPermission) {
      const triggerDate = calculateTriggerDate(targetDateStr, offset);
      if (triggerDate) {
        const title = offset === 0 ? `🚨 Expiring Today: ${record.title}` : `⚠️ Renewal Alert: ${record.title}`;
        const offsetLabel = offset === 0 ? 'today' : `in ${offset} days`;
        const body = `${record.title} expires ${offsetLabel} (${targetDateStr}). Open TrouveDocDue to view details.`;

        try {
          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { recordId: record.id },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });
        } catch (e) {
          console.warn('[Notifications] Failed to schedule notification:', e);
        }
      }
    }

    const rule = await createReminderRule(ruleId, record.id, offset, notificationId);
    createdRules.push(rule);
  }

  return createdRules;
}

/**
 * Cancels all scheduled local notifications and removes rules for a record.
 */
export async function cancelRemindersForRecord(recordId: string): Promise<void> {
  const rules = await getReminderRulesForRecord(recordId);
  for (const r of rules) {
    if (r.notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(r.notificationId);
      } catch (e) {
        console.warn('[Notifications] Failed to cancel notification:', r.notificationId, e);
      }
    }
  }
  await deleteReminderRulesForRecord(recordId);
}

/**
 * Reconciles notifications on app launch:
 * - Checks active records
 * - Cleans up notifications for deleted or past records
 * - Re-schedules missing notifications if permission was granted
 */
export async function reconcileNotifications(): Promise<void> {
  const hasPermission = await getNotificationPermissionStatus();
  if (!hasPermission) return;

  const records = await getAllRecords();
  for (const record of records) {
    const rules = await getReminderRulesForRecord(record.id);
    const targetDateStr = record.expiryDate || record.renewalDate || record.warrantyEndDate;

    if (!targetDateStr) continue;

    for (const rule of rules) {
      if (!rule.enabled) continue;

      const triggerDate = calculateTriggerDate(targetDateStr, rule.offsetDays);
      if (!triggerDate) {
        // Trigger is now in the past
        if (rule.notificationId) {
          await updateReminderNotificationId(rule.id, null);
        }
        continue;
      }

      // Check if notification is already scheduled
      if (!rule.notificationId) {
        const title = rule.offsetDays === 0 ? `🚨 Expiring Today: ${record.title}` : `⚠️ Renewal Alert: ${record.title}`;
        const offsetLabel = rule.offsetDays === 0 ? 'today' : `in ${rule.offsetDays} days`;
        const body = `${record.title} expires ${offsetLabel} (${targetDateStr}).`;

        try {
          const newNotifId = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { recordId: record.id },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
            },
          });
          await updateReminderNotificationId(rule.id, newNotifId);
        } catch (e) {
          console.warn('[Notifications] Reconciliation schedule failed:', e);
        }
      }
    }
  }
}
