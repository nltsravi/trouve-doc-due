import { SavedRecord } from '../../types/record';
import { ExtractedFields } from '../../types/document';
import { findDuplicateRecordCandidates } from '../storage/recordsRepo';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchingRecord: SavedRecord | null;
  matchReason: string | null;
  confidence: number;
}

export async function checkForDuplicateRecord(
  fields: ExtractedFields,
  assetHash?: string | null
): Promise<DuplicateCheckResult> {
  const existingMatches = await findDuplicateRecordCandidates(
    fields.referenceNumber,
    fields.category,
    fields.provider,
    fields.expiryDate || fields.renewalDate,
    fields.title
  );

  if (existingMatches.length === 0) {
    return {
      isDuplicate: false,
      matchingRecord: null,
      matchReason: null,
      confidence: 0,
    };
  }

  // Evaluate candidate matches
  for (const record of existingMatches) {
    // 1. Exact Reference / Policy Number Match
    if (
      fields.referenceNumber &&
      record.referenceNumber &&
      fields.referenceNumber.trim().toLowerCase() === record.referenceNumber.trim().toLowerCase()
    ) {
      return {
        isDuplicate: true,
        matchingRecord: record,
        matchReason: `Matches existing record with Reference/Policy #${record.referenceNumber}`,
        confidence: 0.95,
      };
    }

    // 2. Same Category, Provider, and Expiry Date
    const targetDate = fields.expiryDate || fields.renewalDate;
    const recordTargetDate = record.expiryDate || record.renewalDate;
    if (
      fields.category === record.category &&
      fields.provider &&
      record.provider &&
      fields.provider.trim().toLowerCase() === record.provider.trim().toLowerCase() &&
      targetDate &&
      recordTargetDate &&
      targetDate === recordTargetDate
    ) {
      return {
        isDuplicate: true,
        matchingRecord: record,
        matchReason: `Matches ${record.provider} ${record.category} expiring on ${recordTargetDate}`,
        confidence: 0.9,
      };
    }

    // 3. Same Vehicle Registration Number (for vehicle docs)
    if (
      fields.vehicleRegNumber &&
      record.vehicleRegNumber &&
      fields.vehicleRegNumber === record.vehicleRegNumber &&
      fields.documentType === record.documentType
    ) {
      return {
        isDuplicate: true,
        matchingRecord: record,
        matchReason: `Matches existing ${record.title} for vehicle ${record.vehicleRegNumber}`,
        confidence: 0.85,
      };
    }

    // 4. Same Title and Expiry Date
    if (
      fields.title.trim().toLowerCase() === record.title.trim().toLowerCase() &&
      targetDate &&
      recordTargetDate &&
      targetDate === recordTargetDate
    ) {
      return {
        isDuplicate: true,
        matchingRecord: record,
        matchReason: `Matches record "${record.title}" with same expiry date`,
        confidence: 0.8,
      };
    }
  }

  // Fallback if returned from DB query
  const firstMatch = existingMatches[0];
  return {
    isDuplicate: true,
    matchingRecord: firstMatch,
    matchReason: `Possible duplicate of "${firstMatch.title}"`,
    confidence: 0.65,
  };
}
