import { extractFieldsFromOCR } from '../src/services/extraction/fieldExtractor';
import { classifyDocument } from '../src/services/classification/classifier';
import { createOCRResultFromText } from '../src/services/ocr/ocrService';

describe('Field Extractor', () => {
  it('extracts provider, policy number, vehicle reg, and expiry date from motor insurance', () => {
    const text = `
      HDFC ERGO GENERAL INSURANCE COMPANY LIMITED
      PRIVATE CAR PACKAGE POLICY
      POLICY NUMBER: 2311-9482-1029-00
      NAME OF THE INSURED: RAHUL SHARMA
      REGISTRATION NO: DL01AB1234
      PERIOD OF INSURANCE: 15/08/2026 TO 14/08/2027
    `;
    const ocr = createOCRResultFromText(text);
    const classification = classifyDocument(ocr);
    const result = extractFieldsFromOCR(ocr, classification);

    expect(result.fields.provider).toBe('HDFC ERGO');
    expect(result.fields.referenceNumber).toContain('2311-9482-1029-00');
    expect(result.fields.vehicleRegNumber).toBe('DL01AB1234');
    expect(result.fields.expiryDate).toBe('2027-08-14');
    expect(result.confidenceScores.overall).toBeGreaterThanOrEqual(0.7);
  });

  it('builds context-rich display titles', () => {
    const text = `
      ICICI LOMBARD HEALTH CARE POLICY
      POLICY NUMBER: 4015-8291-00
      VALID TILL: 30/11/2027
    `;
    const ocr = createOCRResultFromText(text);
    const classification = classifyDocument(ocr);
    const result = extractFieldsFromOCR(ocr, classification);

    expect(result.fields.title).toContain('ICICI Lombard');
  });
});
