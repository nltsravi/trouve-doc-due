import * as FileSystem from 'expo-file-system/legacy';
import * as PdfExtract from 'expo-pdf-text-extract';
import { OCRResult, OCRBlock } from './types';

// Maximum size for on-device PDF processing (50 MB)
export const MAX_PDF_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export interface PdfProcessResult extends OCRResult {
  pageCount: number;
  isEncrypted: boolean;
  passwordRequired?: boolean;
  errorMessage?: string;
}

/**
 * Checks if a filename or MIME type corresponds to a PDF document
 */
export function isPdfDocument(filename: string, mimeType?: string): boolean {
  if (mimeType && mimeType.toLowerCase().includes('pdf')) {
    return true;
  }
  return filename.toLowerCase().endsWith('.pdf');
}

/**
 * Extracts text from a PDF file using native PDFKit (iOS) / PDFBox (Android),
 * falling back gracefully if running in a mock/test environment.
 */
export async function extractTextFromPdf(pdfUri: string): Promise<PdfProcessResult> {
  const startTime = Date.now();

  try {
    if (typeof PdfExtract?.extractTextWithInfo === 'function') {
      try {
        const info = await PdfExtract.extractTextWithInfo(pdfUri);

        if (info.isEncrypted || info.passwordRequired) {
          return {
            rawText: '',
            blocks: [],
            lines: [],
            pageCount: info.pageCount || 1,
            isEncrypted: true,
            passwordRequired: true,
            executionTimeMs: Date.now() - startTime,
            errorMessage: 'PDF is password protected and cannot be scanned without unlocking.',
          };
        }

        if (info.success && typeof info.text === 'string' && info.text.trim().length > 0) {
          const rawText = info.text.trim();
          const lines = rawText
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0);

          const blocks: OCRBlock[] = lines.map((line: string) => ({
            text: line,
            lines: [{ text: line }],
          }));

          return {
            rawText,
            blocks,
            lines,
            pageCount: info.pageCount || 1,
            isEncrypted: false,
            executionTimeMs: Date.now() - startTime,
          };
        }
      } catch {
        // Fall through to stream fallback if native module fails or rejects
      }
    }

    // Fallback: Read text streams from the raw file if digital PDF
    const fallbackResult = await extractTextFromPdfStreamFallback(pdfUri);
    return {
      ...fallbackResult,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.warn('[PdfService] Error processing PDF:', error);
    return {
      rawText: '',
      blocks: [],
      lines: [],
      pageCount: 1,
      isEncrypted: false,
      executionTimeMs: Date.now() - startTime,
      errorMessage: error?.message || 'Failed to extract text from PDF',
    };
  }
}

/**
 * Lightweight stream fallback for testing and digital PDFs without native module
 */
async function extractTextFromPdfStreamFallback(pdfUri: string): Promise<Omit<PdfProcessResult, 'executionTimeMs'>> {
  try {
    const content = await FileSystem.readAsStringAsync(pdfUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (content.includes('/Encrypt')) {
      return {
        rawText: '',
        blocks: [],
        lines: [],
        pageCount: 1,
        isEncrypted: true,
        passwordRequired: true,
        errorMessage: 'PDF is password protected.',
      };
    }

    // Extract text between parenthesis inside text objects (Tj or TJ operators)
    const textMatches: string[] = [];
    const textOperatorRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let match: RegExpExecArray | null;

    while ((match = textOperatorRegex.exec(content)) !== null) {
      const decoded = match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, ' ')
        .replace(/\\([()\\])/g, '$1')
        .trim();
      if (decoded.length > 1) {
        textMatches.push(decoded);
      }
    }

    const rawText = textMatches.join(' ');
    const lines = textMatches;
    const blocks: OCRBlock[] = lines.map((l) => ({ text: l, lines: [{ text: l }] }));

    return {
      rawText,
      blocks,
      lines,
      pageCount: 1,
      isEncrypted: false,
    };
  } catch {
    return {
      rawText: '',
      blocks: [],
      lines: [],
      pageCount: 1,
      isEncrypted: false,
    };
  }
}
