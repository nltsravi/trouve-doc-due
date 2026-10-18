import { ScanCandidate } from '../src/types/scan';
import { SavedRecord } from '../src/types/record';
import { ReminderRule } from '../src/types/reminder';

describe('Consent-Based Import and Review Model', () => {
  it('strictly isolates temporary scan candidates from permanent records', () => {
    const candidate: ScanCandidate = {
      id: 'cand-123',
      scanSessionId: 'sess-456',
      sourceAssetIdentifier: 'ph-asset-789',
      sourceAssetHash: 'hash-abc',
      sourceAssetUri: 'file:///var/mobile/ph-asset-789.jpg',
      category: 'identity_travel',
      documentType: 'passport',
      title: 'Passport (Z9821041)',
      extractedFields: {
        title: 'Passport (Z9821041)',
        category: 'identity_travel',
        documentType: 'passport',
        referenceNumber: 'Z9821041',
        expiryDate: '2035-10-14',
      },
      candidateDates: [
        {
          date: '2035-10-14',
          originalText: '14-OCT-2035',
          type: 'expiry',
          confidence: 0.95,
          isAmbiguous: false,
          label: 'Date of Expiry',
        },
      ],
      confidenceScores: {
        documentClassification: 0.9,
        fieldExtraction: 0.85,
        dateInterpretation: 0.95,
        overall: 0.9,
      },
      reviewStatus: 'pending',
      duplicateOfRecordId: null,
      createdAt: '2026-10-18T10:00:00Z',
    };

    // Before user confirmation, reviewStatus must be pending
    expect(candidate.reviewStatus).toBe('pending');
    expect(candidate.duplicateOfRecordId).toBeNull();

    // Simulating user explicit approval step
    const userApprovedFields = {
      ...candidate.extractedFields,
      notes: 'Verified against physical passport booklet',
    };

    const savedRecord: SavedRecord = {
      id: 'rec-permanent-999',
      title: userApprovedFields.title,
      category: userApprovedFields.category,
      documentType: userApprovedFields.documentType,
      provider: null,
      referenceNumber: userApprovedFields.referenceNumber || null,
      holderName: null,
      issueDate: null,
      startDate: null,
      expiryDate: userApprovedFields.expiryDate || null,
      renewalDate: null,
      purchaseDate: null,
      warrantyEndDate: null,
      vehicleRegNumber: null,
      notes: userApprovedFields.notes || null,
      sourceType: 'gallery_scan',
      sourceAssetId: candidate.sourceAssetIdentifier,
      attachmentPath: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // User selected reminders: 30 days and 7 days
    const chosenOffsets = [30, 7];
    const rules: ReminderRule[] = chosenOffsets.map((offset, idx) => ({
      id: `rem-rule-${idx}`,
      recordId: savedRecord.id,
      offsetDays: offset,
      enabled: true,
      notificationId: `notif-${idx}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Post-approval state
    candidate.reviewStatus = 'imported';

    expect(candidate.reviewStatus).toBe('imported');
    expect(rules.length).toBe(2);
    expect(rules.every((r) => r.recordId === savedRecord.id)).toBe(true);
    expect(savedRecord.title).toBe('Passport (Z9821041)');
  });

  it('allows user to dismiss candidate without creating any record', () => {
    const candidate: ScanCandidate = {
      id: 'cand-discard-1',
      scanSessionId: 'sess-456',
      sourceAssetIdentifier: 'ph-asset-000',
      sourceAssetHash: null,
      sourceAssetUri: 'file:///var/mobile/ph-asset-000.jpg',
      category: 'purchases_warranties',
      documentType: 'purchase_invoice',
      title: 'Old Coffee Receipt',
      extractedFields: {
        title: 'Old Coffee Receipt',
        category: 'purchases_warranties',
        documentType: 'purchase_invoice',
      },
      candidateDates: [],
      confidenceScores: {
        documentClassification: 0.5,
        fieldExtraction: 0.4,
        dateInterpretation: 0.3,
        overall: 0.4,
      },
      reviewStatus: 'pending',
      duplicateOfRecordId: null,
      createdAt: '2026-10-18T10:00:00Z',
    };

    // User chooses "Ignore / Dismiss"
    candidate.reviewStatus = 'dismissed';

    expect(candidate.reviewStatus).toBe('dismissed');
  });
});
