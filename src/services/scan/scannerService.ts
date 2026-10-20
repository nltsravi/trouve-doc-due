import { ScanFilterConfig, ScanProgress, ScanCandidate } from '../../types/scan';
import { CloudScanItem } from '../../types/cloud';
import { createScanSession, updateScanSessionProgress, completeScanSession } from '../storage/sessionsRepo';
import { insertCandidate } from '../storage/candidatesRepo';
import { fetchGalleryPage, pickUserSelectedPhotos, ensureAssetAccessible, GalleryAssetItem } from '../gallery/galleryService';
import { runOnDeviceOCR } from '../ocr/ocrService';
import { extractTextFromPdf } from '../ocr/pdfService';
import { cleanTemporaryCloudFile, getCloudProviderInfo } from '../cloud/cloudStorageService';
import { notifyScanCompleted } from '../notifications/reminderService';
import { classifyDocument } from '../classification/classifier';
import { extractFieldsFromOCR } from '../extraction/fieldExtractor';
import { checkForDuplicateRecord } from '../duplicate/duplicateDetector';
import { OCRResult } from '../ocr/types';

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
 * Runs the end-to-end scan workflow (gallery or cloud storage) in bounded batches
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

  const notifyProgress = (currentUri?: string, currentTitle?: string, totalEstimate?: number) => {
    if (onProgress) {
      onProgress({
        sessionId,
        status: controller.cancelled ? 'cancelled' : 'running',
        totalAssets: totalEstimate ?? (processedCount + skippedCount + 10),
        processedCount,
        detectedCount,
        skippedCount,
        currentAssetUri: currentUri,
        currentAssetTitle: currentTitle,
      });
    }
  };

  try {
    // Mode A: Cloud Storage Scan (Google Drive, OneDrive, iCloud, Dropbox, TeraBox, etc.)
    if (config.scanMode === 'cloud' && config.cloudItems && config.cloudItems.length > 0) {
      const providerInfo = config.cloudProvider ? getCloudProviderInfo(config.cloudProvider) : null;
      const providerLabel = providerInfo ? providerInfo.name : 'Cloud storage';
      const totalCount = config.cloudItems.length;

      for (const item of config.cloudItems) {
        if (controller.cancelled) break;

        while (controller.paused && !controller.cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        notifyProgress(item.uri, item.filename, totalCount);
        const candidate = await processSingleCloudItem(item, sessionId);
        processedCount++;

        if (candidate) {
          detectedCount++;
          detectedCandidates.push(candidate);
          await insertCandidate(candidate);
        } else {
          skippedCount++;
          // Non-candidate: Purge temporary cached cloud copy immediately to preserve zero-storage privacy guarantee
          await cleanTemporaryCloudFile(item.uri);
        }

        if (processedCount % 5 === 0) {
          await updateScanSessionProgress(sessionId, processedCount, detectedCount);
        }
      }

      // Fire completion notification for background awareness
      await notifyScanCompleted(sessionId, processedCount, detectedCount, providerLabel);
    } else if (config.scanMode === 'selected') {
      // Mode B: Selected photos only (via ImagePicker)
      const selectedAssets = await pickUserSelectedPhotos();
      const totalCount = selectedAssets.length;
      for (const asset of selectedAssets) {
        if (controller.cancelled) break;

        notifyProgress(asset.uri, asset.filename, totalCount);
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

      await notifyScanCompleted(sessionId, processedCount, detectedCount, 'Selected photos');
    } else {
      // Mode C: All accessible / Screenshots / Recent gallery photos
      let hasNext = true;
      let cursor: string | undefined = undefined;
      const maxCount = config.maxScanCount || 100;

      while (hasNext && processedCount < maxCount && !controller.cancelled) {
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

          notifyProgress(asset.uri, asset.filename);

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

          if (processedCount % 5 === 0) {
            await updateScanSessionProgress(sessionId, processedCount, detectedCount);
          }
        }
      }

      await notifyScanCompleted(sessionId, processedCount, detectedCount, 'Photo gallery');
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
 * Processes a single cloud item (PDF or image) through the extraction and classification pipeline.
 */
export async function processSingleCloudItem(
  item: CloudScanItem,
  sessionId: string
): Promise<ScanCandidate | null> {
  try {
    let ocrResult: OCRResult;

    if (item.isPdf) {
      const pdfResult = await extractTextFromPdf(item.uri);
      if (pdfResult.isEncrypted) {
        console.warn(`[Scanner] Skipped password-protected PDF: ${item.filename}`);
        return null;
      }
      ocrResult = pdfResult;
    } else {
      ocrResult = await runOnDeviceOCR(item.uri);
    }

    // 1. Classify document
    const classification = classifyDocument(ocrResult);
    if (!classification.isDocument) {
      return null;
    }

    // 2. Extract candidate fields & dates
    const extraction = extractFieldsFromOCR(ocrResult, classification);

    // 3. Duplicate detection against existing records
    const duplicateCheck = await checkForDuplicateRecord(
      extraction.fields,
      item.id
    );

    // 4. Create scan candidate
    const candidateId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const candidate: ScanCandidate = {
      id: candidateId,
      scanSessionId: sessionId,
      sourceAssetIdentifier: item.id,
      sourceAssetUri: item.uri,
      sourceAssetHash: item.id,
      category: extraction.fields.category,
      documentType: extraction.fields.documentType,
      title: extraction.fields.title || item.filename,
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
    console.warn(`[Scanner] Error processing cloud item ${item.filename}:`, error);
    return null;
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
