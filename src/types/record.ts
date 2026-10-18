import { DocumentCategory, DocumentType } from './document';

export type RecordSourceType = 'gallery_scan' | 'photo_picker' | 'manual';

export type RecordStatus = 'active' | 'archived' | 'expired';

export interface SavedRecord {
  id: string;
  title: string;
  category: DocumentCategory;
  documentType: DocumentType;
  provider: string | null;
  referenceNumber: string | null;
  holderName: string | null;
  issueDate: string | null; // YYYY-MM-DD
  startDate: string | null; // YYYY-MM-DD
  expiryDate: string | null; // YYYY-MM-DD
  renewalDate: string | null; // YYYY-MM-DD
  purchaseDate: string | null; // YYYY-MM-DD
  warrantyEndDate: string | null; // YYYY-MM-DD
  vehicleRegNumber: string | null;
  notes: string | null;
  sourceType: RecordSourceType;
  sourceAssetId: string | null;
  attachmentPath: string | null;
  status: RecordStatus;
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
}

export type RecordUrgency = 'overdue' | 'expiring_soon' | 'valid' | 'no_date';

export interface RecordWithUrgency extends SavedRecord {
  urgency: RecordUrgency;
  daysRemaining: number | null;
  effectiveTargetDate: string | null; // expiryDate || renewalDate || warrantyEndDate
}

export interface RecordFilterOptions {
  category?: DocumentCategory | 'all';
  searchQuery?: string;
  urgency?: RecordUrgency | 'all';
  sortBy?: 'expiry_asc' | 'expiry_desc' | 'created_desc' | 'title_asc';
}
