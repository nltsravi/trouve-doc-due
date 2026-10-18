import * as FileSystem from 'expo-file-system/legacy';
import { getDatabase } from './database';

export interface AttachmentRecord {
  id: string;
  recordId: string;
  localPath: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

const ATTACHMENTS_DIR = `${FileSystem.documentDirectory || ''}trouvedocdue_attachments/`;

async function ensureDirectoryExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
  }
}

export async function saveAttachment(
  recordId: string,
  sourceUri: string
): Promise<string> {
  await ensureDirectoryExists();

  const fileExt = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const fileName = `attachment_${recordId}_${Date.now()}.${fileExt}`;
  const destinationPath = `${ATTACHMENTS_DIR}${fileName}`;

  try {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationPath,
    });

    const fileInfo = await FileSystem.getInfoAsync(destinationPath);
    const fileSize = fileInfo.exists && !fileInfo.isDirectory ? fileInfo.size : null;
    const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    const now = new Date().toISOString();
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO attachments (id, record_id, local_path, file_size, mime_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      recordId,
      destinationPath,
      fileSize,
      mimeType,
      now
    );

    return destinationPath;
  } catch (error) {
    console.error('[Attachments] Error saving attachment copy:', error);
    throw error;
  }
}

export async function deleteAttachment(recordId: string): Promise<void> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ local_path: string }>(
    'SELECT local_path FROM attachments WHERE record_id = ?',
    recordId
  );

  for (const r of rows) {
    try {
      const info = await FileSystem.getInfoAsync(r.local_path);
      if (info.exists) {
        await FileSystem.deleteAsync(r.local_path, { idempotent: true });
      }
    } catch (e) {
      console.warn('[Attachments] Failed to delete file:', r.local_path, e);
    }
  }

  await db.runAsync('DELETE FROM attachments WHERE record_id = ?', recordId);
}

export async function clearAllAttachments(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(ATTACHMENTS_DIR, { idempotent: true });
    }
  } catch (e) {
    console.warn('[Attachments] Failed to clear attachments directory:', e);
  }
}
