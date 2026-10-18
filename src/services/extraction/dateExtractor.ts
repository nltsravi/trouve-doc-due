import { CandidateDate, DateType } from '../../types/document';
import { OCRResult } from '../ocr/types';

// Month names dictionary
const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function formatIso(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (year < 1920 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

interface ParsedRawMatch {
  dateStr: string;
  year: number;
  month: number;
  day: number;
  index: number;
  length: number;
  originalText: string;
  isAmbiguous?: boolean;
  alternativeIso?: string;
}

/**
 * Parses dates matching numeric and text formats:
 * - 25/12/2028, 25-12-2028, 25.12.2028
 * - 2028-12-25
 * - 25 Dec 2028, 25-DEC-2028
 * - December 25, 2028
 */
export function extractRawDates(text: string): ParsedRawMatch[] {
  const matches: ParsedRawMatch[] = [];

  // 1. Text month: DD[- /]Month[- /]YYYY (e.g. 15-AUG-2027, 24 Dec 2028)
  const textMonthRegex = /\b(\d{1,2})[- \/.]([a-zA-Z]{3,9})[- \/.](\d{4})\b/g;
  let match: RegExpExecArray | null;

  while ((match = textMonthRegex.exec(text)) !== null) {
    const day = parseInt(match[1], 10);
    const monthKey = match[2].toLowerCase();
    const year = parseInt(match[3], 10);
    const month = MONTH_MAP[monthKey];

    if (month && isValidDate(year, month, day)) {
      matches.push({
        dateStr: formatIso(year, month, day),
        year,
        month,
        day,
        index: match.index,
        length: match[0].length,
        originalText: match[0],
      });
    }
  }

  // 2. Text month: Month DD, YYYY (e.g. August 15, 2027)
  const monthFirstRegex = /\b([a-zA-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\b/g;
  while ((match = monthFirstRegex.exec(text)) !== null) {
    const monthKey = match[1].toLowerCase();
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const month = MONTH_MAP[monthKey];

    if (month && isValidDate(year, month, day)) {
      matches.push({
        dateStr: formatIso(year, month, day),
        year,
        month,
        day,
        index: match.index,
        length: match[0].length,
        originalText: match[0],
      });
    }
  }

  // 3. ISO format: YYYY-MM-DD or YYYY/MM/DD
  const isoRegex = /\b(\d{4})[- \/.](\d{1,2})[- \/.](\d{1,2})\b/g;
  while ((match = isoRegex.exec(text)) !== null) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    if (isValidDate(year, month, day)) {
      matches.push({
        dateStr: formatIso(year, month, day),
        year,
        month,
        day,
        index: match.index,
        length: match[0].length,
        originalText: match[0],
      });
    }
  }

  // 4. Numeric: DD/MM/YYYY or MM/DD/YYYY
  const numericRegex = /\b(\d{1,2})[- \/.](\d{1,2})[- \/.](\d{4})\b/g;
  while ((match = numericRegex.exec(text)) !== null) {
    const first = parseInt(match[1], 10);
    const second = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Skip if already captured by text month regex at the same position
    const alreadyCaptured = matches.some((m) => Math.abs(m.index - match!.index) < 3);
    if (alreadyCaptured) continue;

    if (first > 12 && second <= 12) {
      // Must be DD/MM/YYYY
      if (isValidDate(year, second, first)) {
        matches.push({
          dateStr: formatIso(year, second, first),
          year,
          month: second,
          day: first,
          index: match.index,
          length: match[0].length,
          originalText: match[0],
        });
      }
    } else if (second > 12 && first <= 12) {
      // Must be MM/DD/YYYY
      if (isValidDate(year, first, second)) {
        matches.push({
          dateStr: formatIso(year, first, second),
          year,
          month: first,
          day: second,
          index: match.index,
          length: match[0].length,
          originalText: match[0],
        });
      }
    } else if (first <= 12 && second <= 12) {
      // Ambiguous! Could be DD/MM or MM/DD
      // Default to DD/MM/YYYY (international standard for personal documents),
      // but flag ambiguity and provide MM/DD alternative
      if (isValidDate(year, second, first)) {
        matches.push({
          dateStr: formatIso(year, second, first),
          year,
          month: second,
          day: first,
          index: match.index,
          length: match[0].length,
          originalText: match[0],
          isAmbiguous: first !== second,
          alternativeIso: first !== second ? formatIso(year, first, second) : undefined,
        });
      }
    }
  }

  return matches;
}

/**
 * Evaluates context around a date occurrence to determine whether it is an
 * expiry date, renewal date, issue date, purchase date, or DOB.
 */
function classifyDateContext(
  text: string,
  dateMatch: ParsedRawMatch
): { type: DateType; confidence: number; label: string; snippet: string } {
  // Extract line context
  const beforeIndex = text.slice(0, dateMatch.index);
  const lastNewline = beforeIndex.lastIndexOf('\n');
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

  const afterIndex = text.slice(dateMatch.index + dateMatch.length);
  const nextNewline = afterIndex.indexOf('\n');
  const lineEnd = nextNewline === -1 ? text.length : dateMatch.index + dateMatch.length + nextNewline;

  const currentLine = text.slice(lineStart, lineEnd).toLowerCase();
  const prefixOnLine = text.slice(lineStart, dateMatch.index).toLowerCase();

  // Also check previous line if date is on its own line
  const prevLineText =
    lastNewline > 0
      ? text.slice(text.slice(0, lastNewline).lastIndexOf('\n') + 1, lastNewline).toLowerCase().trim()
      : '';

  const lineContext = `${prevLineText} ${currentLine}`.trim();

  // Cues definition
  const dobCues = [/\bdate of birth\b/, /\bd\.?o\.?b\b/, /\bborn\b/, /\bbirth date\b/];
  const expiryCues = [
    /\bvalid (till|until|upto|to|through)\b/,
    /\bexpir(es|y|ed|ation)?\b/,
    /\bend date\b/,
    /\bfitness valid\b/,
    /\bcard validity\b/,
    /\bto\s*[:\-]\s*$/,
  ];
  const renewalCues = [/\brenew(al)? (date|due|before|on)\b/, /\bnext renewal\b/, /\bdue date\b/];
  const warrantyCues = [/\bwarranty (till|until|upto|end|valid)\b/, /\bguarantee (till|until|upto|end)\b/];
  const issueCues = [
    /\bdate of issue\b/,
    /\bissue(d)? (on|date)\b/,
    /\bvalid (from|since)\b/,
    /\bcommencement\b/,
    /\beffective (from|date)\b/,
    /\bstart date\b/,
  ];
  const purchaseCues = [/\bdate of purchase\b/, /\bpurchased on\b/, /\binvoice date\b/, /\bbill date\b/];

  // Helper tester
  const testCues = (cues: RegExp[], target: string) => cues.some((c) => c.test(target));

  // Priority 1: Check prefix immediately preceding on the same line
  if (testCues(dobCues, prefixOnLine)) {
    return { type: 'dob', confidence: 0.98, label: 'Date of Birth', snippet: currentLine };
  }
  if (testCues(expiryCues, prefixOnLine)) {
    return { type: 'expiry', confidence: 0.95, label: 'Expiry Date', snippet: currentLine };
  }
  if (testCues(renewalCues, prefixOnLine)) {
    return { type: 'renewal', confidence: 0.95, label: 'Renewal Date', snippet: currentLine };
  }
  if (testCues(warrantyCues, prefixOnLine)) {
    return { type: 'warranty_end', confidence: 0.95, label: 'Warranty End Date', snippet: currentLine };
  }
  if (testCues(issueCues, prefixOnLine)) {
    return { type: 'issue', confidence: 0.95, label: 'Issue Date', snippet: currentLine };
  }
  if (testCues(purchaseCues, prefixOnLine)) {
    return { type: 'purchase', confidence: 0.95, label: 'Purchase Date', snippet: currentLine };
  }

  // Priority 2: Check current line + previous line
  if (testCues(dobCues, lineContext)) {
    return { type: 'dob', confidence: 0.95, label: 'Date of Birth', snippet: lineContext };
  }
  if (testCues(expiryCues, lineContext)) {
    return { type: 'expiry', confidence: 0.9, label: 'Expiry Date', snippet: lineContext };
  }
  if (testCues(renewalCues, lineContext)) {
    return { type: 'renewal', confidence: 0.9, label: 'Renewal Date', snippet: lineContext };
  }
  if (testCues(warrantyCues, lineContext)) {
    return { type: 'warranty_end', confidence: 0.9, label: 'Warranty End Date', snippet: lineContext };
  }
  if (testCues(issueCues, lineContext)) {
    return { type: 'issue', confidence: 0.9, label: 'Issue Date', snippet: lineContext };
  }
  if (testCues(purchaseCues, lineContext)) {
    return { type: 'purchase', confidence: 0.9, label: 'Purchase Date', snippet: lineContext };
  }

  // Priority 3: Future date without explicit cues defaults to candidate expiry
  const now = new Date();
  const todayIso = formatIso(now.getFullYear(), now.getMonth() + 1, now.getDate());

  if (dateMatch.dateStr >= todayIso) {
    return {
      type: 'expiry',
      confidence: 0.6,
      label: 'Possible Expiry Date',
      snippet: currentLine,
    };
  }

  // Past date with no cues -> unknown (likely past issue date)
  return {
    type: 'unknown',
    confidence: 0.35,
    label: 'Date',
    snippet: currentLine,
  };
}

/**
 * Extracts and classifies candidate dates from OCR text.
 */
export function extractCandidateDates(ocr: OCRResult): CandidateDate[] {
  const rawMatches = extractRawDates(ocr.rawText);
  const candidates: CandidateDate[] = [];

  // Deduplicate by ISO date string and choose the best confidence classification
  const seenDates = new Map<string, CandidateDate>();

  for (const m of rawMatches) {
    const { type, confidence, label, snippet } = classifyDateContext(ocr.rawText, m);

    // Filter out date of birth from expiry candidates
    if (type === 'dob') {
      continue;
    }

    const candidate: CandidateDate = {
      date: m.dateStr,
      type,
      label,
      originalText: m.originalText,
      confidence,
      isAmbiguous: m.isAmbiguous,
      alternativeDates: m.alternativeIso ? [m.alternativeIso] : undefined,
      contextSnippet: snippet.trim(),
    };

    const existing = seenDates.get(m.dateStr);
    if (!existing || existing.confidence < candidate.confidence) {
      seenDates.set(m.dateStr, candidate);
    }
  }

  candidates.push(...seenDates.values());

  // Sort candidates by:
  // 1. Expiry / renewal first
  // 2. Highest confidence
  // 3. Chronological
  candidates.sort((a, b) => {
    const typeOrder = { expiry: 0, renewal: 1, warranty_end: 2, issue: 3, purchase: 4, start: 5, unknown: 6, dob: 7 };
    const orderDiff = (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9);
    if (orderDiff !== 0) return orderDiff;
    return b.confidence - a.confidence;
  });

  return candidates;
}
