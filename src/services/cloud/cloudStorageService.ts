import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { CloudProviderType, CloudScanItem, CloudValidationResult, CLOUD_PROVIDERS, CloudProviderInfo } from '../../types/cloud';
import { isPdfDocument, MAX_PDF_FILE_SIZE_BYTES } from '../ocr/pdfService';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
const MAX_IMAGE_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Returns provider metadata given provider ID
 */
export function getCloudProviderInfo(providerId: CloudProviderType): CloudProviderInfo {
  const match = CLOUD_PROVIDERS.find((p) => p.id === providerId);
  return (
    match || {
      id: 'generic',
      name: 'Cloud & Network Storage',
      tagline: 'Scan files from cloud drives and file shares',
      icon: 'folder-outline',
      accentColor: '#6B7280',
      pickerHint: 'Select any cloud folder or file in the picker.',
    }
  );
}

/**
 * Validates a single cloud scan item for security and compatibility:
 * - Checks file size limit (DoS prevention)
 * - Checks allowed extension / MIME type
 * - Checks for path traversal risks
 */
export function validateCloudItem(item: CloudScanItem): CloudValidationResult {
  const lowerName = item.filename.toLowerCase();

  // 1. Path traversal check
  if (lowerName.includes('..') || item.uri.includes('..')) {
    return { valid: false, error: 'Invalid or unsafe file path.' };
  }

  // 2. Extension / Format validation
  const isPdf = isPdfDocument(lowerName, item.mimeType);
  const isImage = ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!isPdf && !isImage) {
    return {
      valid: false,
      error: `Unsupported file format: "${item.filename}". Only images (JPG, PNG, HEIC) and PDF files are supported.`,
    };
  }

  // 3. File size check
  if (item.size) {
    const maxLimit = isPdf ? MAX_PDF_FILE_SIZE_BYTES : MAX_IMAGE_FILE_SIZE_BYTES;
    if (item.size > maxLimit) {
      const mbLimit = Math.round(maxLimit / (1024 * 1024));
      return {
        valid: false,
        error: `File "${item.filename}" exceeds the ${mbLimit}MB security limit.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Launches the native system document picker (Storage Access Framework on Android,
 * UIDocumentPicker on iOS) allowing the user to select files from Google Drive,
 * OneDrive, iCloud, Dropbox, TeraBox, or device storage.
 */
export async function pickCloudDocuments(
  provider: CloudProviderType = 'generic'
): Promise<CloudScanItem[]> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return [];
    }

    const items: CloudScanItem[] = [];

    for (const asset of result.assets) {
      const filename = asset.name || 'document';
      const isPdf = isPdfDocument(filename, asset.mimeType);

      const candidateItem: CloudScanItem = {
        id: `cloud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        uri: asset.uri,
        filename,
        mimeType: asset.mimeType,
        size: asset.size,
        provider,
        isPdf,
        creationTime: Date.now(),
      };

      const validation = validateCloudItem(candidateItem);
      if (validation.valid) {
        items.push(candidateItem);
      } else {
        console.warn(`[CloudStorage] Skipping invalid file: ${validation.error}`);
        // Clean up invalid file from cache immediately
        await cleanTemporaryCloudFile(asset.uri);
      }
    }

    return items;
  } catch (error) {
    console.error('[CloudStorage] Error picking cloud documents:', error);
    return [];
  }
}

/**
 * Securely deletes a temporary cached file after it has been inspected
 * by OCR/classification to ensure no private cloud data remains on disk.
 */
export async function cleanTemporaryCloudFile(fileUri: string): Promise<void> {
  try {
    if (!fileUri) return;
    // Only delete files that are located in cache directories
    const isCacheFile =
      fileUri.includes('cache') ||
      fileUri.includes('DocumentPicker') ||
      fileUri.includes('ImagePicker');

    if (isCacheFile) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (error) {
    console.warn('[CloudStorage] Failed to purge temporary file:', error);
  }
}
