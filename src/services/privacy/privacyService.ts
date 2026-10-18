import { clearTemporaryCandidates } from '../storage/candidatesRepo';
import { getAllRecords } from '../storage/recordsRepo';
import { clearAllAttachments } from '../storage/attachmentsRepo';
import { getDatabase } from '../storage/database';

export interface ExportData {
  appName: string;
  exportDate: string;
  version: string;
  records: any[];
}

/**
 * Clears temporary scan results and cached data
 */
export async function clearTemporaryScanData(): Promise<number> {
  const deletedCount = await clearTemporaryCandidates();
  return deletedCount;
}

/**
 * Exports all user-saved records as formatted JSON for backup/data portability
 */
export async function exportUserRecords(): Promise<string> {
  const records = await getAllRecords();
  const exportPayload: ExportData = {
    appName: 'TrouveDocDue',
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    records,
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Permanently erases all saved records, attachments, temporary candidates,
 * and resets database. Complete local wipe.
 */
export async function eraseAllUserData(): Promise<void> {
  try {
    // 1. Delete all attachments from disk
    await clearAllAttachments();

    // 2. Clear tables
    const db = await getDatabase();
    await db.execAsync(`
      DELETE FROM attachments;
      DELETE FROM reminder_rules;
      DELETE FROM scan_candidates;
      DELETE FROM scan_sessions;
      DELETE FROM records;
      DELETE FROM app_settings;
    `);

    console.log('[Privacy] All user data wiped successfully.');
  } catch (error) {
    console.error('[Privacy] Error wiping user data:', error);
    throw error;
  }
}
