export interface OCRLine {
  text: string;
  frame?: { left: number; top: number; right: number; bottom: number };
}

export interface OCRBlock {
  text: string;
  lines: OCRLine[];
}

export interface OCRResult {
  rawText: string;
  blocks: OCRBlock[];
  lines: string[];
  executionTimeMs: number;
}
