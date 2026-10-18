import { getDatabase } from './database';
import { ScanSession, ScanSessionStatus, ScanMode } from '../../types/scan';

export async function createScanSession(
  id: string,
  scanMode: ScanMode,
  permissionScope?: string
): Promise<ScanSession> {
  const db = await getDatabase();
  const startedAt = new Date().toISOString();

  const session: ScanSession = {
    id,
    startedAt,
    completedAt: null,
    scanMode,
    status: 'running',
    processedCount: 0,
    detectedCount: 0,
    permissionScope: permissionScope || null,
  };

  await db.runAsync(
    `INSERT INTO scan_sessions (
      id, started_at, completed_at, scan_mode, status, processed_count, detected_count, permission_scope
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    session.id,
    session.startedAt,
    session.completedAt,
    session.scanMode,
    session.status,
    session.processedCount,
    session.detectedCount,
    session.permissionScope
  );

  return session;
}

export async function updateScanSessionProgress(
  id: string,
  processedCount: number,
  detectedCount: number,
  status: ScanSessionStatus = 'running'
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE scan_sessions SET processed_count = ?, detected_count = ?, status = ? WHERE id = ?',
    processedCount,
    detectedCount,
    status,
    id
  );
}

export async function completeScanSession(
  id: string,
  status: 'completed' | 'cancelled' | 'failed',
  processedCount: number,
  detectedCount: number
): Promise<void> {
  const db = await getDatabase();
  const completedAt = new Date().toISOString();
  await db.runAsync(
    'UPDATE scan_sessions SET status = ?, completed_at = ?, processed_count = ?, detected_count = ? WHERE id = ?',
    status,
    completedAt,
    processedCount,
    detectedCount,
    id
  );
}

export async function getLatestScanSessions(limit = 10): Promise<ScanSession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM scan_sessions ORDER BY started_at DESC LIMIT ?',
    limit
  );
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    scanMode: r.scan_mode as ScanMode,
    status: r.status as ScanSessionStatus,
    processedCount: r.processed_count,
    detectedCount: r.detected_count,
    permissionScope: r.permission_scope,
  }));
}
