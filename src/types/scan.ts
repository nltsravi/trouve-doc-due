import { CandidateDate, DocumentCategory, DocumentType, ExtractedFields, ConfidenceScores } from './document';

export type ScanMode = 'all' | 'selected' | 'screenshots' | 'recent';

export type ScanSessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';

export interface ScanSession {
  id: string;
  startedAt: string;
  completedAt: string | null;
  scanMode: ScanMode;
  status: ScanSessionStatus;
  processedCount: number;
  detectedCount: number;
  permissionScope: string | null;
}

export type CandidateReviewStatus = 'pending' | 'approved' | 'dismissed' | 'imported';

export interface ScanCandidate {
  id: string;
  scanSessionId: string;
  sourceAssetIdentifier: string;
  sourceAssetUri: string;
  sourceAssetHash: string | null;
  category: DocumentCategory;
  documentType: DocumentType;
  title: string;
  extractedFields: ExtractedFields;
  confidenceScores: ConfidenceScores;
  candidateDates: CandidateDate[];
  reviewStatus: CandidateReviewStatus;
  duplicateOfRecordId: string | null;
  duplicateReason?: string | null;
  createdAt: string;
}

export interface ScanProgress {
  sessionId: string;
  status: ScanSessionStatus;
  totalAssets: number;
  processedCount: number;
  detectedCount: number;
  skippedCount: number;
  currentAssetUri?: string | null;
  error?: string | null;
}

export interface ScanFilterConfig {
  scanMode: ScanMode;
  maxScanCount?: number;
  recentMonths?: number;
  includeScreenshotsOnly?: boolean;
}
