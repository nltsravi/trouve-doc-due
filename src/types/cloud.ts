import { Ionicons } from '@expo/vector-icons';

export type CloudProviderType =
  | 'gdrive'
  | 'onedrive'
  | 'icloud'
  | 'dropbox'
  | 'terabox'
  | 'generic';

export interface CloudProviderInfo {
  id: CloudProviderType;
  name: string;
  tagline: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  badge?: string;
  pickerHint: string;
}

export const CLOUD_PROVIDERS: CloudProviderInfo[] = [
  {
    id: 'gdrive',
    name: 'Google Drive',
    tagline: 'Scan files & PDFs stored on Google Drive',
    icon: 'logo-google',
    accentColor: '#3B82F6',
    pickerHint: 'Select "Google Drive" from the file picker sidebar or menu.',
  },
  {
    id: 'onedrive',
    name: 'Microsoft OneDrive',
    tagline: 'Scan Office & personal documents on OneDrive',
    icon: 'cloud-outline',
    accentColor: '#0EA5E9',
    pickerHint: 'Select "OneDrive" from the location list in the file browser.',
  },
  {
    id: 'icloud',
    name: 'iCloud Drive',
    tagline: 'Scan documents synced with Apple iCloud',
    icon: 'cloud-circle-outline',
    accentColor: '#6366F1',
    pickerHint: 'Select "iCloud Drive" or "On My iPhone" from the Files list.',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    tagline: 'Scan files, scans, and PDFs on Dropbox',
    icon: 'file-tray-full-outline',
    accentColor: '#0284C7',
    pickerHint: 'Choose "Dropbox" from your available storage providers.',
  },
  {
    id: 'terabox',
    name: 'TeraBox & Cloud Apps',
    tagline: 'Scan large backups, TeraBox, and local drives',
    icon: 'server-outline',
    accentColor: '#10B981',
    pickerHint: 'Choose TeraBox, Nextcloud, or device folders from the picker.',
  },
];

export interface CloudScanItem {
  id: string;
  uri: string;
  filename: string;
  mimeType?: string;
  size?: number;
  provider: CloudProviderType;
  isPdf: boolean;
  creationTime: number;
}

export interface CloudValidationResult {
  valid: boolean;
  error?: string;
}
