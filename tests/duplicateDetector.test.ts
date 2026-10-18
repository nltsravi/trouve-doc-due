import { checkForDuplicateRecord } from '../src/services/duplicate/duplicateDetector';
import * as recordsRepo from '../src/services/storage/recordsRepo';
import { ExtractedFields } from '../src/types/document';
import { SavedRecord } from '../src/types/record';

jest.mock('../src/services/storage/recordsRepo');

describe('Duplicate Detector', () => {
  const mockFind = jest.spyOn(recordsRepo, 'findDuplicateRecordCandidates');

  const sampleRecord: SavedRecord = {
    id: 'rec-1',
    title: 'HDFC Ergo Private Car Policy',
    category: 'insurance_finance',
    documentType: 'motor_insurance',
    provider: 'HDFC Ergo',
    referenceNumber: '2311-9482-1029-00',
    holderName: 'Rahul Sharma',
    issueDate: '2026-08-15',
    startDate: '2026-08-15',
    expiryDate: '2027-08-14',
    renewalDate: null,
    purchaseDate: null,
    warrantyEndDate: null,
    vehicleRegNumber: 'DL01AB1234',
    notes: null,
    sourceType: 'gallery_scan',
    sourceAssetId: 'asset-1',
    attachmentPath: null,
    status: 'active',
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects duplicate by exact policy / reference number', async () => {
    mockFind.mockResolvedValueOnce([sampleRecord]);

    const fields: ExtractedFields = {
      title: 'Car Insurance Schedule',
      category: 'insurance_finance',
      documentType: 'motor_insurance',
      provider: 'HDFC Ergo',
      referenceNumber: '2311-9482-1029-00',
      expiryDate: '2027-08-14',
    };

    const result = await checkForDuplicateRecord(fields);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchingRecord?.id).toBe('rec-1');
    expect(result.matchReason).toContain('2311-9482-1029-00');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('detects duplicate by matching Category, Provider and Expiry Date', async () => {
    mockFind.mockResolvedValueOnce([sampleRecord]);

    const fields: ExtractedFields = {
      title: 'HDFC Ergo Vehicle Policy Renewed',
      category: 'insurance_finance',
      documentType: 'motor_insurance',
      provider: 'HDFC Ergo',
      referenceNumber: 'NEW-REF-999',
      expiryDate: '2027-08-14',
    };

    const result = await checkForDuplicateRecord(fields);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchingRecord?.id).toBe('rec-1');
    expect(result.matchReason).toContain('2027-08-14');
  });

  it('returns false when no duplicate matches exist in the database', async () => {
    mockFind.mockResolvedValueOnce([]);

    const fields: ExtractedFields = {
      title: 'Passport - Republic of India',
      category: 'identity_travel',
      documentType: 'passport',
      referenceNumber: 'Z9821041',
      expiryDate: '2036-05-12',
    };

    const result = await checkForDuplicateRecord(fields);
    expect(result.isDuplicate).toBe(false);
    expect(result.matchingRecord).toBeNull();
    expect(result.confidence).toBe(0);
  });
});
