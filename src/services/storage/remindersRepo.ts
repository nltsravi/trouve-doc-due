import { getDatabase } from './database';
import { ReminderRule } from '../../types/reminder';

export async function createReminderRule(
  id: string,
  recordId: string,
  offsetDays: number,
  notificationId?: string | null
): Promise<ReminderRule> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const rule: ReminderRule = {
    id,
    recordId,
    offsetDays,
    enabled: true,
    notificationId: notificationId || null,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO reminder_rules (
      id, record_id, offset_days, enabled, notification_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    rule.id,
    rule.recordId,
    rule.offsetDays,
    rule.enabled ? 1 : 0,
    rule.notificationId,
    rule.createdAt,
    rule.updatedAt
  );

  return rule;
}

export async function getReminderRulesForRecord(recordId: string): Promise<ReminderRule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM reminder_rules WHERE record_id = ? ORDER BY offset_days DESC',
    recordId
  );
  return rows.map((r) => ({
    id: r.id,
    recordId: r.record_id,
    offsetDays: r.offset_days,
    enabled: Boolean(r.enabled),
    notificationId: r.notification_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function getAllActiveReminderRules(): Promise<ReminderRule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM reminder_rules WHERE enabled = 1'
  );
  return rows.map((r) => ({
    id: r.id,
    recordId: r.record_id,
    offsetDays: r.offset_days,
    enabled: Boolean(r.enabled),
    notificationId: r.notification_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function updateReminderNotificationId(
  id: string,
  notificationId: string | null
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE reminder_rules SET notification_id = ?, updated_at = ? WHERE id = ?',
    notificationId,
    now,
    id
  );
}

export async function deleteReminderRulesForRecord(recordId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reminder_rules WHERE record_id = ?', recordId);
}
