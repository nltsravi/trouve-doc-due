import { ScanFilterConfig, ScanProgress, ScanCandidate } from '../../types/scan';
import { createScanSession, updateScanSessionProgress, completeScanSession } from '../storage/sessionsRepo';
import { insertCandidate } from '../storage/candidatesRepo';
import { fetchGalleryPage, pickUserSelectedPhotos, ensureAssetAccessible, GalleryAssetItem } from '../gallery/galleryService';
import { runOnDeviceOCR } from '../ocr/ocrService';
import { classifyDocument } from '../classification/classifier';
import { extractFieldsFromOCR } from '../extraction/fieldExtractor';
import { checkForDuplicateRecord } from '../duplicate/duplicateDetector';

export class ScannerController {
  private isCancelled = false;
  private isPaused = false;

  cancel() {
    this.isCancelled = true;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  get cancelled() {
    return this.isCancelled;
  }

  get paused() {
    return this.isPaused;
  }
}

export interface ScanResultSummary {
  sessionId: string;
  processedCount: number;
  detectedCount: number;
  skippedCount: number;
  candidates: ScanCandidate[];
  wasCancelled: boolean;
}

/**
 * Runs the end-to-end gallery scan workflow in bounded batches
 */
export async function executeGalleryScan(
  config: ScanFilterConfig,
  controller: ScannerController,
  onProgress?: (progress: ScanProgress) => void
): Promise<ScanResultSummary> {
  const sessionId = `scan_${Date.now()}`;
  await createScanSession(sessionId, config.scanMode);

  let processedCount = 0;
  let detectedCount = 0;
  let skippedCount = 0;
  const detectedCandidates: ScanCandidate[] = [];

  const notifyProgress = (currentUri?: string) => {
    if (onProgress) {
      onProgress({
        sessionId,
        status: controller.cancelled ? 'cancelled' : 'running',
        totalAssets: processedCount + skippedCount + 10,
        processedCount,
        detectedCount,
        skippedCount,
        currentAssetUri: currentUri,
      });
    }
  };

  try {
    // Mode 1: Selected photos only (via ImagePicker)
    if (config.scanMode === 'selected') {
      const selectedAssets = await pickUserSelectedPhotos();
      for (const asset of selectedAssets) {
        if (controller.cancelled) break;

        notifyProgress(asset.uri);
        const candidate = await processSingleAsset(asset, sessionId);
        processedCount++;

        if (candidate) {
          detectedCount++;
          detectedCandidates.push(candidate);
          await insertCandidate(candidate);
        } else {
          skippedCount++;
        }
      }
    } else {
      // Mode 2, 3, 4: All accessible / Screenshots / Recent
      let hasNext = true;
      let cursor: string | undefined = undefined;
      const maxCount = config.maxScanCount || 100; // sensible limit for MVP

      while (hasNext && processedCount < maxCount && !controller.cancelled) {
        // Handle pause
        while (controller.paused && !controller.cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
        if (controller.cancelled) break;

        // Fetch page of 10 assets
        const page = await fetchGalleryPage(config, 10, cursor);
        hasNext = page.hasNextPage;
        cursor = page.endCursor;

        if (page.assets.length === 0) break;

        for (const asset of page.assets) {
          if (controller.cancelled || processedCount >= maxCount) break;

          while (controller.paused && !controller.cancelled) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          notifyProgress(asset.uri);

          // Check if accessible locally (skip cloud-only gracefully)
          const { accessible, localUri } = await ensureAssetAccessible(asset.id, asset.uri);
          if (!accessible) {
            skippedCount++;
            continue;
          }

          const candidate = await processSingleAsset({ ...asset, uri: localUri }, sessionId);
          processedCount++;

          if (candidate) {
            detectedCount++;
            detectedCandidates.push(candidate);
            await insertCandidate(candidate);
          } else {
            skippedCount++;
          }

          // Update DB session progress periodically
          if (processedCount % 5 === 0) {
            await updateScanSessionProgress(sessionId, processedCount, detectedCount);
          }
        }
      }
    }

    const finalStatus = controller.cancelled ? 'cancelled' : 'completed';
    await completeScanSession(sessionId, finalStatus, processedCount, detectedCount);

    return {
      sessionId,
      processedCount,
      detectedCount,
      skippedCount,
      candidates: detectedCandidates,
      wasCancelled: controller.cancelled,
    };
  } catch (error) {
    console.error('[Scanner] Scan execution error:', error);
    await completeScanSession(sessionId, 'failed', processedCount, detectedCount);
    throw error;
  }
}

/**
 * Processes a single photo through the OCR, classification, extraction,
 * and duplicate detection pipeline.
 */
export async function processSingleAsset(
  asset: GalleryAssetItem,
  sessionId: string
): Promise<ScanCandidate | null> {
  try {
    // 1. Run on-device OCR
    const ocrResult = await runOnDeviceOCR(asset.uri);

    // 2. Classify document
    const classification = classifyDocument(ocrResult);
    if (!classification.isDocument) {
      // Non-document photo (filtered out)
      return null;
    }

    // 3. Extract candidate fields & dates
    const extraction = extractFieldsFromOCR(ocrResult, classification);

    // 4. Duplicate detection against existing records
    const duplicateCheck = await checkForDuplicateRecord(
      extraction.fields,
      asset.assetHash
    );

    // 5. Create scan candidate
    const candidateId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const candidate: ScanCandidate = {
      id: candidateId,
      scanSessionId: sessionId,
      sourceAssetIdentifier: asset.id,
      sourceAssetUri: asset.uri,
      sourceAssetHash: asset.assetHash || null,
      category: extraction.fields.category,
      documentType: extraction.fields.documentType,
      title: extraction.fields.title,
      extractedFields: extraction.fields,
      confidenceScores: extraction.confidenceScores,
      candidateDates: extraction.candidateDates,
      reviewStatus: 'pending',
      duplicateOfRecordId: duplicateCheck.isDuplicate && duplicateCheck.matchingRecord ? duplicateCheck.matchingRecord.id : null,
      duplicateReason: duplicateCheck.matchReason,
      createdAt: new Date().toISOString(),
    };

    return candidate;
  } catch (error) {
    console.warn(`[Scanner] Error processing asset ${asset.id}:`, error);
    return null;
  }
}
