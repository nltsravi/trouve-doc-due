import { getDatabase } from './database';

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key);
    return row?.value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    now
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', key);
}
