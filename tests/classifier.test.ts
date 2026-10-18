import { classifyDocument } from '../src/services/classification/classifier';
import { createOCRResultFromText } from '../src/services/ocr/ocrService';

describe('Document Classifier', () => {
  it('identifies Passport documents and assigns high confidence', () => {
    const text = `
      PASSPORT / PASSEPORT
      SURNAME: SMITH
      GIVEN NAMES: JOHN ALEXANDER
      NATIONALITY: BRITISH CITIZEN
      DATE OF EXPIRY: 14 DEC 2031
      P<GBRSMITH<<JOHN<ALEXANDER<<<<<<<<<<<<<<<<<<
    `;
    const ocr = createOCRResultFromText(text);
    const result = classifyDocument(ocr);

    expect(result.isDocument).toBe(true);
    expect(result.category).toBe('identity_travel');
    expect(result.documentType).toBe('passport');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('identifies Driving Licence documents', () => {
    const text = `
      DRIVING LICENCE
      UNION OF INDIA
      DL NO: DL-0420110023456
      AUTHORIZATION TO DRIVE: LMV, MCWG
      VALID TILL: 20/08/2035
    `;
    const ocr = createOCRResultFromText(text);
    const result = classifyDocument(ocr);

    expect(result.isDocument).toBe(true);
    expect(result.category).toBe('identity_travel');
    expect(result.documentType).toBe('driving_licence');
  });

  it('identifies Motor Vehicle Insurance policies', () => {
    const text = `
      HDFC ERGO GENERAL INSURANCE COMPANY
      PRIVATE CAR PACKAGE POLICY SCHEDULE
      POLICY NUMBER: 2312 2019 4821 0000
      INSURED DECLARED VALUE (IDV): 650000
      PERIOD OF INSURANCE: FROM 15/09/2026 TO 14/09/2027
      NO CLAIM BONUS (NCB): 35%
    `;
    const ocr = createOCRResultFromText(text);
    const result = classifyDocument(ocr);

    expect(result.isDocument).toBe(true);
    expect(result.category).toBe('insurance_finance');
    expect(result.documentType).toBe('motor_insurance');
  });

  it('identifies Pollution Under Control (PUC) certificates', () => {
    const text = `
      TRANSPORT DEPARTMENT
      POLLUTION UNDER CONTROL CERTIFICATE
      PUC CERTIFICATE NO: DL012903120
      REGISTRATION NUMBER: DL-01-AB-1234
      TESTED ON: 10/10/2026
      VALID UPTO: 09/10/2027
      EMISSION NORMS: BHARAT STAGE VI
    `;
    const ocr = createOCRResultFromText(text);
    const result = classifyDocument(ocr);

    expect(result.isDocument).toBe(true);
    expect(result.category).toBe('vehicles');
    expect(result.documentType).toBe('pollution_certificate');
  });

  it('identifies Product Warranty certificates', () => {
    const text = `
      SAMSUNG ELECTRONICS LIMITED WARRANTY CERTIFICATE
      MODEL NO: QN65Q80BAFXZA
      SERIAL NO: 49201928401
      WARRANTY PERIOD: 24 MONTHS
      DATE OF PURCHASE: 01/05/2026
      WARRANTY EXPIRES: 30/04/2028
    `;
    const ocr = createOCRResultFromText(text);
    const result = classifyDocument(ocr);

    expect(result.isDocument).toBe(true);
    expect(result.category).toBe('purchases_warranties');
    expect(result.documentType).toBe('product_warranty');
  });

  it('rejects non-document text such as casual photos or chat screenshots', () => {
    const text = 'Hey what time are we meeting for dinner tonight?';
    const ocr = createOCRResultFromText(text);
    const result = classifyDocument(ocr);

    expect(result.isDocument).toBe(false);
  });
});
