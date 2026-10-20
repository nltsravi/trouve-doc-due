import {
  validateCloudItem,
  getCloudProviderInfo,
  cleanTemporaryCloudFile,
} from '../src/services/cloud/cloudStorageService';
import { CloudScanItem, CLOUD_PROVIDERS } from '../src/types/cloud';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('expo-file-system/legacy', () => ({
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
}));

describe('Cloud Storage Service & Security Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Information', () => {
    it('returns information for all supported major providers', () => {
      const gdrive = getCloudProviderInfo('gdrive');
      expect(gdrive.name).toBe('Google Drive');

      const onedrive = getCloudProviderInfo('onedrive');
      expect(onedrive.name).toBe('Microsoft OneDrive');

      const icloud = getCloudProviderInfo('icloud');
      expect(icloud.name).toBe('iCloud Drive');

      const dropbox = getCloudProviderInfo('dropbox');
      expect(dropbox.name).toBe('Dropbox');

      const terabox = getCloudProviderInfo('terabox');
      expect(terabox.name).toBe('TeraBox & Cloud Apps');
    });

    it('falls back gracefully for unknown providers', () => {
      const generic = getCloudProviderInfo('generic');
      expect(generic.name).toContain('Storage');
    });

    it('contains all 5 requested providers in CLOUD_PROVIDERS array', () => {
      const providerIds = CLOUD_PROVIDERS.map((p) => p.id);
      expect(providerIds).toContain('gdrive');
      expect(providerIds).toContain('onedrive');
      expect(providerIds).toContain('icloud');
      expect(providerIds).toContain('dropbox');
      expect(providerIds).toContain('terabox');
    });
  });

  describe('Security & Path Traversal Validation', () => {
    it('rejects path traversal attempts in filename or URI', () => {
      const maliciousItem: CloudScanItem = {
        id: 'c1',
        filename: '../../../etc/passwd.pdf',
        uri: 'file:///data/user/0/cache/../../../etc/passwd.pdf',
        provider: 'gdrive',
        isPdf: true,
        creationTime: Date.now(),
      };

      const result = validateCloudItem(maliciousItem);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid or unsafe');
    });

    it('rejects executable and non-document file formats', () => {
      const dangerousExtensions = [
        'payload.exe',
        'script.sh',
        'installer.apk',
        'virus.bat',
        'audio.mp3',
        'movie.mp4',
        'code.js',
      ];

      for (const name of dangerousExtensions) {
        const item: CloudScanItem = {
          id: `test_${name}`,
          filename: name,
          uri: `file:///cache/${name}`,
          provider: 'onedrive',
          isPdf: false,
          creationTime: Date.now(),
        };

        const result = validateCloudItem(item);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Unsupported file format');
      }
    });

    it('accepts legitimate document formats (PDFs and Images)', () => {
      const validFiles = [
        { name: 'passport_scan.pdf', isPdf: true },
        { name: 'driver_license.jpg', isPdf: false },
        { name: 'insurance_policy.png', isPdf: false },
        { name: 'registration.heic', isPdf: false },
        { name: 'contract.webp', isPdf: false },
      ];

      for (const file of validFiles) {
        const item: CloudScanItem = {
          id: `valid_${file.name}`,
          filename: file.name,
          uri: `file:///cache/${file.name}`,
          provider: 'icloud',
          isPdf: file.isPdf,
          creationTime: Date.now(),
          size: 1024 * 1024, // 1 MB
        };

        const result = validateCloudItem(item);
        expect(result.valid).toBe(true);
      }
    });

    it('rejects oversized files to prevent Denial of Service', () => {
      const oversizedPdf: CloudScanItem = {
        id: 'huge_pdf',
        filename: 'massive_document.pdf',
        uri: 'file:///cache/massive_document.pdf',
        provider: 'dropbox',
        isPdf: true,
        creationTime: Date.now(),
        size: 75 * 1024 * 1024, // 75 MB (limit is 50MB)
      };

      const result = validateCloudItem(oversizedPdf);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the 50MB security limit');
    });

    it('rejects oversized image files above 25MB limit', () => {
      const oversizedImage: CloudScanItem = {
        id: 'huge_img',
        filename: 'massive_photo.jpg',
        uri: 'file:///cache/massive_photo.jpg',
        provider: 'terabox',
        isPdf: false,
        creationTime: Date.now(),
        size: 30 * 1024 * 1024, // 30 MB (limit is 25MB)
      };

      const result = validateCloudItem(oversizedImage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the 25MB security limit');
    });
  });

  describe('Zero-Storage Temporary Cache Cleanup', () => {
    it('deletes temporary files in cache directories immediately', async () => {
      const tempUri = 'file:///data/user/0/com.app/cache/DocumentPicker/temp_file.pdf';
      await cleanTemporaryCloudFile(tempUri);

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(tempUri, { idempotent: true });
    });

    it('ignores non-cache URIs to avoid accidental file deletion', async () => {
      const permanentUri = 'file:///data/user/0/com.app/files/vault/important_record.jpg';
      await cleanTemporaryCloudFile(permanentUri);

      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it('handles empty or null URIs gracefully without throwing', async () => {
      await expect(cleanTemporaryCloudFile('')).resolves.not.toThrow();
    });
  });
});
