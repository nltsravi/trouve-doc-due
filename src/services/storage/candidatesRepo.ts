import { getDatabase } from './database';
import { ScanCandidate, CandidateReviewStatus } from '../../types/scan';
import { DocumentCategory, DocumentType } from '../../types/document';

export async function insertCandidate(candidate: ScanCandidate): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO scan_candidates (
      id, scan_session_id, source_asset_identifier, source_asset_uri,
      source_asset_hash, category, document_type, title,
      extracted_fields_json, confidence_json, candidate_dates_json,
      review_status, duplicate_of_record_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    candidate.id,
    candidate.scanSessionId,
    candidate.sourceAssetIdentifier,
    candidate.sourceAssetUri,
    candidate.sourceAssetHash,
    candidate.category,
    candidate.documentType,
    candidate.title,
    JSON.stringify(candidate.extractedFields),
    JSON.stringify(candidate.confidenceScores),
    JSON.stringify(candidate.candidateDates),
    candidate.reviewStatus,
    candidate.duplicateOfRecordId,
    candidate.createdAt
  );
}

export async function getCandidatesBySession(sessionId: string): Promise<ScanCandidate[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM scan_candidates WHERE scan_session_id = ? ORDER BY created_at ASC',
    sessionId
  );
  return rows.map(mapRowToCandidate);
}

export async function getAllPendingCandidates(): Promise<ScanCandidate[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM scan_candidates WHERE review_status = "pending" ORDER BY created_at DESC'
  );
  return rows.map(mapRowToCandidate);
}

export async function getCandidateById(id: string): Promise<ScanCandidate | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM scan_candidates WHERE id = ?', id);
  if (!row) return null;
  return mapRowToCandidate(row);
}

export async function updateCandidateReviewStatus(
  id: string,
  status: CandidateReviewStatus
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE scan_candidates SET review_status = ? WHERE id = ?', status, id);
}

export async function updateCandidateDetails(
  id: string,
  updates: Partial<ScanCandidate>
): Promise<void> {
  const db = await getDatabase();
  const existing = await getCandidateById(id);
  if (!existing) return;

  const merged = { ...existing, ...updates };
  await db.runAsync(
    `UPDATE scan_candidates SET
      title = ?, category = ?, document_type = ?,
      extracted_fields_json = ?, confidence_json = ?, candidate_dates_json = ?,
      review_status = ?, duplicate_of_record_id = ?
    WHERE id = ?`,
    merged.title,
    merged.category,
    merged.documentType,
    JSON.stringify(merged.extractedFields),
    JSON.stringify(merged.confidenceScores),
    JSON.stringify(merged.candidateDates),
    merged.reviewStatus,
    merged.duplicateOfRecordId,
    id
  );
}

export async function deleteCandidate(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM scan_candidates WHERE id = ?', id);
  return result.changes > 0;
}

export async function clearTemporaryCandidates(): Promise<number> {
  const db = await getDatabase();
  // Clear all candidates that are not approved (e.g. dismissed or pending)
  const result = await db.runAsync(
    'DELETE FROM scan_candidates WHERE review_status IN ("dismissed", "pending", "imported")'
  );
  return result.changes;
}

export async function countPendingCandidates(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM scan_candidates WHERE review_status = "pending"'
  );
  return row?.count ?? 0;
}

function mapRowToCandidate(row: any): ScanCandidate {
  return {
    id: row.id,
    scanSessionId: row.scan_session_id,
    sourceAssetIdentifier: row.source_asset_identifier,
    sourceAssetUri: row.source_asset_uri,
    sourceAssetHash: row.source_asset_hash,
    category: row.category as DocumentCategory,
    documentType: row.document_type as DocumentType,
    title: row.title,
    extractedFields: JSON.parse(row.extracted_fields_json || '{}'),
    confidenceScores: JSON.parse(row.confidence_json || '{}'),
    candidateDates: JSON.parse(row.candidate_dates_json || '[]'),
    reviewStatus: row.review_status as CandidateReviewStatus,
    duplicateOfRecordId: row.duplicate_of_record_id,
    createdAt: row.created_at,
  };
}
