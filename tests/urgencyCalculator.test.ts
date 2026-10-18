import { calculateRecordUrgency } from '../src/services/storage/recordsRepo';
import { SavedRecord } from '../src/types/record';

describe('Urgency Calculator', () => {
  const baseRecord: SavedRecord = {
    id: 'test_1',
    title: 'Test Document',
    category: 'identity_travel',
    documentType: 'passport',
    provider: null,
    referenceNumber: null,
    holderName: null,
    issueDate: null,
    startDate: null,
    expiryDate: null,
    renewalDate: null,
    purchaseDate: null,
    warrantyEndDate: null,
    vehicleRegNumber: null,
    notes: null,
    sourceType: 'manual',
    sourceAssetId: null,
    attachmentPath: null,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('marks a document as overdue if expiry date is in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const dateStr = pastDate.toISOString().split('T')[0];

    const result = calculateRecordUrgency({ ...baseRecord, expiryDate: dateStr });
    expect(result.urgency).toBe('overdue');
    expect(result.daysRemaining).toBeLessThan(0);
  });

  it('marks a document as expiring_soon if within 30 days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const dateStr = futureDate.toISOString().split('T')[0];

    const result = calculateRecordUrgency({ ...baseRecord, expiryDate: dateStr });
    expect(result.urgency).toBe('expiring_soon');
    expect(result.daysRemaining).toBeGreaterThanOrEqual(0);
    expect(result.daysRemaining).toBeLessThanOrEqual(30);
  });

  it('marks a document as valid if expiry is > 30 days out', () => {
    const farDate = new Date();
    farDate.setDate(farDate.getDate() + 90);
    const dateStr = farDate.toISOString().split('T')[0];

    const result = calculateRecordUrgency({ ...baseRecord, expiryDate: dateStr });
    expect(result.urgency).toBe('valid');
    expect(result.daysRemaining).toBeGreaterThan(30);
  });

  it('handles records without any date gracefully', () => {
    const result = calculateRecordUrgency(baseRecord);
    expect(result.urgency).toBe('no_date');
    expect(result.daysRemaining).toBeNull();
  });
});
