import { getDatabase } from './database';
import { SavedRecord, RecordFilterOptions, RecordWithUrgency, RecordUrgency } from '../../types/record';
import { DocumentCategory, DocumentType } from '../../types/document';

export function calculateRecordUrgency(record: SavedRecord): {
  urgency: RecordUrgency;
  daysRemaining: number | null;
  effectiveTargetDate: string | null;
} {
  const targetDateStr = record.expiryDate || record.renewalDate || record.warrantyEndDate;
  if (!targetDateStr) {
    return { urgency: 'no_date', daysRemaining: null, effectiveTargetDate: null };
  }

  // Parse YYYY-MM-DD
  const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const diffTime = targetDate.getTime() - todayUtc.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let urgency: RecordUrgency;
  if (daysRemaining < 0) {
    urgency = 'overdue';
  } else if (daysRemaining <= 30) {
    urgency = 'expiring_soon';
  } else {
    urgency = 'valid';
  }

  return { urgency, daysRemaining, effectiveTargetDate: targetDateStr };
}

export async function createRecord(record: Omit<SavedRecord, 'createdAt' | 'updatedAt'>): Promise<SavedRecord> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const newRecord: SavedRecord = {
    ...record,
    createdAt: now,
    updatedAt: now,
  };

  await db.runAsync(
    `INSERT INTO records (
      id, title, category, document_type, provider, reference_number,
      holder_name, issue_date, start_date, expiry_date, renewal_date,
      purchase_date, warranty_end_date, vehicle_reg_number, notes,
      source_type, source_asset_id, attachment_path, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newRecord.id,
    newRecord.title,
    newRecord.category,
    newRecord.documentType,
    newRecord.provider,
    newRecord.referenceNumber,
    newRecord.holderName,
    newRecord.issueDate,
    newRecord.startDate,
    newRecord.expiryDate,
    newRecord.renewalDate,
    newRecord.purchaseDate,
    newRecord.warrantyEndDate,
    newRecord.vehicleRegNumber,
    newRecord.notes,
    newRecord.sourceType,
    newRecord.sourceAssetId,
    newRecord.attachmentPath,
    newRecord.status,
    newRecord.createdAt,
    newRecord.updatedAt
  );

  return newRecord;
}

export async function getRecordById(id: string): Promise<RecordWithUrgency | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM records WHERE id = ?', id);
  if (!row) return null;

  const record: SavedRecord = mapRowToRecord(row);
  const urgency = calculateRecordUrgency(record);
  return { ...record, ...urgency };
}

export async function getAllRecords(options: RecordFilterOptions = {}): Promise<RecordWithUrgency[]> {
  const db = await getDatabase();
  const params: any[] = [];
  let query = 'SELECT * FROM records WHERE status = "active"';

  if (options.category && options.category !== 'all') {
    query += ' AND category = ?';
    params.push(options.category);
  }

  if (options.searchQuery && options.searchQuery.trim().length > 0) {
    const term = `%${options.searchQuery.trim().toLowerCase()}%`;
    query += ' AND (LOWER(title) LIKE ? OR LOWER(provider) LIKE ? OR LOWER(reference_number) LIKE ? OR LOWER(vehicle_reg_number) LIKE ?)';
    params.push(term, term, term, term);
  }

  // Sort strategy
  switch (options.sortBy) {
    case 'expiry_desc':
      query += ' ORDER BY COALESCE(expiry_date, renewal_date, warranty_end_date) DESC NULLS LAST';
      break;
    case 'title_asc':
      query += ' ORDER BY title ASC';
      break;
    case 'created_desc':
      query += ' ORDER BY created_at DESC';
      break;
    case 'expiry_asc':
    default:
      query += ' ORDER BY COALESCE(expiry_date, renewal_date, warranty_end_date) ASC NULLS LAST';
      break;
  }

  const rows = await db.getAllAsync<any>(query, params);
  const recordsWithUrgency = rows.map((r) => {
    const record = mapRowToRecord(r);
    const urgency = calculateRecordUrgency(record);
    return { ...record, ...urgency };
  });

  if (options.urgency && options.urgency !== 'all') {
    return recordsWithUrgency.filter((r) => r.urgency === options.urgency);
  }

  return recordsWithUrgency;
}

export async function updateRecord(
  id: string,
  updates: Partial<Omit<SavedRecord, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<SavedRecord | null> {
  const db = await getDatabase();
  const existing = await getRecordById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: SavedRecord = {
    ...existing,
    ...updates,
    updatedAt: now,
  };

  await db.runAsync(
    `UPDATE records SET
      title = ?, category = ?, document_type = ?, provider = ?, reference_number = ?,
      holder_name = ?, issue_date = ?, start_date = ?, expiry_date = ?, renewal_date = ?,
      purchase_date = ?, warranty_end_date = ?, vehicle_reg_number = ?, notes = ?,
      attachment_path = ?, status = ?, updated_at = ?
    WHERE id = ?`,
    updated.title,
    updated.category,
    updated.documentType,
    updated.provider,
    updated.referenceNumber,
    updated.holderName,
    updated.issueDate,
    updated.startDate,
    updated.expiryDate,
    updated.renewalDate,
    updated.purchaseDate,
    updated.warrantyEndDate,
    updated.vehicleRegNumber,
    updated.notes,
    updated.attachmentPath,
    updated.status,
    updated.updatedAt,
    id
  );

  return updated;
}

export async function deleteRecord(id: string): Promise<boolean> {
  const db = await getDatabase();
  // Foreign keys ON will delete associated reminder_rules and attachments
  const result = await db.runAsync('DELETE FROM records WHERE id = ?', id);
  return result.changes > 0;
}

export async function findDuplicateRecordCandidates(
  referenceNumber?: string | null,
  category?: DocumentCategory | null,
  provider?: string | null,
  expiryDate?: string | null,
  title?: string | null
): Promise<SavedRecord[]> {
  const db = await getDatabase();
  const candidates: SavedRecord[] = [];

  // 1. Direct reference number match
  if (referenceNumber && referenceNumber.trim().length >= 4) {
    const normalizedRef = referenceNumber.trim().toLowerCase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM records WHERE LOWER(reference_number) = ? AND status = "active"',
      normalizedRef
    );
    for (const r of rows) {
      candidates.push(mapRowToRecord(r));
    }
  }

  // 2. Same category, same provider, and same expiry date
  if (category && provider && expiryDate && candidates.length === 0) {
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM records WHERE category = ? AND LOWER(provider) = ? AND expiry_date = ? AND status = "active"',
      category,
      provider.trim().toLowerCase(),
      expiryDate
    );
    for (const r of rows) {
      candidates.push(mapRowToRecord(r));
    }
  }

  // 3. Similar title and exact expiry date
  if (title && expiryDate && candidates.length === 0) {
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM records WHERE LOWER(title) = ? AND expiry_date = ? AND status = "active"',
      title.trim().toLowerCase(),
      expiryDate
    );
    for (const r of rows) {
      candidates.push(mapRowToRecord(r));
    }
  }

  return candidates;
}

export async function getDashboardStats(): Promise<{
  totalCount: number;
  expiringCount: number;
  overdueCount: number;
  renewalCount: number;
}> {
  const records = await getAllRecords();
  let expiringCount = 0;
  let overdueCount = 0;
  let renewalCount = 0;

  for (const r of records) {
    if (r.urgency === 'overdue') overdueCount++;
    if (r.urgency === 'expiring_soon') expiringCount++;
    if (r.renewalDate && r.urgency !== 'overdue') renewalCount++;
  }

  return {
    totalCount: records.length,
    expiringCount,
    overdueCount,
    renewalCount,
  };
}

function mapRowToRecord(row: any): SavedRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category as DocumentCategory,
    documentType: row.document_type as DocumentType,
    provider: row.provider,
    referenceNumber: row.reference_number,
    holderName: row.holder_name,
    issueDate: row.issue_date,
    startDate: row.start_date,
    expiryDate: row.expiry_date,
    renewalDate: row.renewal_date,
    purchaseDate: row.purchase_date,
    warrantyEndDate: row.warranty_end_date,
    vehicleRegNumber: row.vehicle_reg_number,
    notes: row.notes,
    sourceType: row.source_type,
    sourceAssetId: row.source_asset_id,
    attachmentPath: row.attachment_path,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
