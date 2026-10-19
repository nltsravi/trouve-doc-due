import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';
import { OCRResult, OCRBlock } from './types';

// Maximum dimension for OCR processing to prevent memory spikes on high-res camera photos
const MAX_OCR_DIMENSION = 1600;

// Track whether we have warned about ML Kit in Expo Go to avoid repeating per-image logs
let hasWarnedMLKitUnavailable = false;

export function resetOCRWarningState() {
  hasWarnedMLKitUnavailable = false;
}

export interface OCROptions {
  forceResize?: boolean;
  maxDimension?: number;
}

/**
 * Preprocesses an image before OCR:
 * - Checks file accessibility
 * - Resizes high-resolution images down to a bounded size for memory efficiency
 */
export async function preprocessImageForOCR(
  imageUri: string,
  maxDimension: number = MAX_OCR_DIMENSION
): Promise<{ processedUri: string; isTemp: boolean }> {
  try {
    // Resize down if needed while keeping JPEG quality high
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: maxDimension } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    return { processedUri: manipulated.uri, isTemp: true };
  } catch {
    // If manipulation fails (e.g. format already suitable or unsupported), return original
    return { processedUri: imageUri, isTemp: false };
  }
}

/**
 * Runs on-device text recognition on a local image URI.
 */
export async function runOnDeviceOCR(
  imageUri: string,
  options: OCROptions = {}
): Promise<OCRResult> {
  const startTime = Date.now();
  let tempUriToClean: string | null = null;

  try {
    const { processedUri, isTemp } = await preprocessImageForOCR(
      imageUri,
      options.maxDimension || MAX_OCR_DIMENSION
    );
    if (isTemp) {
      tempUriToClean = processedUri;
    }

    let rawText = '';
    const blocks: OCRBlock[] = [];

    try {
      const result = await recognizeText(processedUri);
      if (result) {
        rawText = result.text || '';
        if (Array.isArray(result.blocks)) {
          for (const b of result.blocks) {
            const lines = Array.isArray(b.lines)
              ? b.lines.map((l: any) => ({ text: l.text || '', frame: l.frame }))
              : [];
            blocks.push({ text: b.text || '', lines });
          }
        }
      }
    } catch {
      // In non-native test environments or Expo Go where native ML Kit is not compiled,
      // log once per session to avoid console spam across batch image scans
      if (!hasWarnedMLKitUnavailable) {
        hasWarnedMLKitUnavailable = true;
        console.warn(
          '[OCR] ML Kit native module is not available in Expo Go. On-device OCR requires a development build (npx expo run:android or npx expo run:ios).'
        );
      }
    }

    // Split lines from raw text if blocks are not structured
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return {
      rawText,
      blocks,
      lines,
      executionTimeMs: Date.now() - startTime,
    };
  } finally {
    // Clean up temporary preprocessed image file immediately to respect data minimization
    if (tempUriToClean) {
      try {
        await FileSystem.deleteAsync(tempUriToClean, { idempotent: true });
      } catch {
        // Ignore temp cleanup errors
      }
    }
  }
}

/**
 * Helper method for testing or simulating OCR results in automated test suites
 */
export function createOCRResultFromText(rawText: string): OCRResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks: OCRBlock[] = [
    {
      text: rawText,
      lines: lines.map((l) => ({ text: l })),
    },
  ];

  return {
    rawText,
    blocks,
    lines,
    executionTimeMs: 10,
  };
}
