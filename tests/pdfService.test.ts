import { isPdfDocument, extractTextFromPdf } from '../src/services/ocr/pdfService';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
}));

// Mock expo-pdf-text-extract for unit tests
jest.mock('expo-pdf-text-extract', () => ({
  extractTextWithInfo: jest.fn(),
}));

describe('PDF Extraction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isPdfDocument helper', () => {
    it('detects PDF by extension', () => {
      expect(isPdfDocument('document.pdf')).toBe(true);
      expect(isPdfDocument('INSURANCE_POLICY.PDF')).toBe(true);
      expect(isPdfDocument('photo.jpg')).toBe(false);
      expect(isPdfDocument('passport.png')).toBe(false);
    });

    it('detects PDF by MIME type', () => {
      expect(isPdfDocument('unknown_file', 'application/pdf')).toBe(true);
      expect(isPdfDocument('file', 'application/x-pdf')).toBe(true);
      expect(isPdfDocument('file', 'image/jpeg')).toBe(false);
    });
  });

  describe('Native Extraction', () => {
    it('returns formatted OCR result when native extractor succeeds', async () => {
      const PdfExtract = require('expo-pdf-text-extract');
      PdfExtract.extractTextWithInfo.mockResolvedValueOnce({
        success: true,
        text: 'PASSPORT\nRepublic of India\nExpires: 2030-05-15',
        pageCount: 1,
        isEncrypted: false,
      });

      const result = await extractTextFromPdf('file:///test.pdf');
      expect(result.rawText).toContain('PASSPORT');
      expect(result.lines).toHaveLength(3);
      expect(result.blocks.length).toBeGreaterThan(0);
      expect(result.isEncrypted).toBe(false);
      expect(result.pageCount).toBe(1);
    });

    it('handles password protected / encrypted PDFs safely without crashing', async () => {
      const PdfExtract = require('expo-pdf-text-extract');
      PdfExtract.extractTextWithInfo.mockResolvedValueOnce({
        success: false,
        text: '',
        pageCount: 1,
        isEncrypted: true,
        passwordRequired: true,
      });

      const result = await extractTextFromPdf('file:///locked.pdf');
      expect(result.isEncrypted).toBe(true);
      expect(result.passwordRequired).toBe(true);
      expect(result.errorMessage).toContain('password protected');
      expect(result.lines).toHaveLength(0);
    });
  });

  describe('Stream Fallback', () => {
    it('extracts digital text operators if native module falls back', async () => {
      const PdfExtract = require('expo-pdf-text-extract');
      PdfExtract.extractTextWithInfo.mockRejectedValueOnce(new Error('Native module not available'));

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(`
        %PDF-1.4
        BT
        /F1 12 Tf
        (Vehicle Registration Certificate) Tj
        (Expires: 2028-11-20) Tj
        ET
      `);

      const result = await extractTextFromPdf('file:///stream.pdf');
      expect(result.rawText).toContain('Vehicle Registration Certificate');
      expect(result.rawText).toContain('Expires: 2028-11-20');
      expect(result.isEncrypted).toBe(false);
    });

    it('detects /Encrypt in raw PDF streams as encrypted', async () => {
      const PdfExtract = require('expo-pdf-text-extract');
      PdfExtract.extractTextWithInfo.mockRejectedValueOnce(new Error('Native module not available'));

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(`
        %PDF-1.4
        1 0 obj
        << /Encrypt 2 0 R >>
        endobj
      `);

      const result = await extractTextFromPdf('file:///locked_raw.pdf');
      expect(result.isEncrypted).toBe(true);
      expect(result.passwordRequired).toBe(true);
    });
  });
});
