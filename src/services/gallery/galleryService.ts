import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { GalleryPermissionState, GalleryAccessLevel } from '../../types/permission';
import { ScanFilterConfig } from '../../types/scan';

export interface GalleryAssetItem {
  id: string;
  uri: string;
  localUri?: string;
  filename: string;
  creationTime: number;
  width: number;
  height: number;
  mediaType: MediaLibrary.MediaTypeValue;
  assetHash?: string;
}

export interface GalleryPageResult {
  assets: GalleryAssetItem[];
  hasNextPage: boolean;
  endCursor?: string;
  totalCount: number;
}

/**
 * Checks current gallery permission status without prompting
 */
export async function getGalleryPermissionState(): Promise<GalleryPermissionState> {
  try {
    const response = await MediaLibrary.getPermissionsAsync(false, ['photo']);
    return mapMediaLibraryPermission(response);
  } catch (error: any) {
    const isExpoGo = error?.message?.includes("Expo Go can no longer provide full access");
    return {
      granted: false,
      canAskAgain: !isExpoGo,
      accessLevel: 'none',
      status: 'denied',
      isExpoGoRestricted: isExpoGo,
    };
  }
}

/**
 * Requests gallery access permission with read-only scope for photos only
 */
export async function requestGalleryPermission(): Promise<GalleryPermissionState> {
  try {
    // writeOnly = false requests READ permission, ['photo'] requests images only (no audio or video)
    const response = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
    return mapMediaLibraryPermission(response);
  } catch (error: any) {
    const isExpoGo = error?.message?.includes("Expo Go can no longer provide full access");
    return {
      granted: false,
      canAskAgain: false,
      accessLevel: 'none',
      status: 'denied',
      isExpoGoRestricted: isExpoGo,
    };
  }
}

function mapMediaLibraryPermission(
  response: MediaLibrary.PermissionResponse
): GalleryPermissionState {
  let accessLevel: GalleryAccessLevel = 'none';
  let status: 'undetermined' | 'granted' | 'denied' | 'limited' = 'undetermined';

  if (response.status === MediaLibrary.PermissionStatus.GRANTED) {
    // On iOS 14+, accessPrivileges can be 'all' or 'limited'
    if (response.accessPrivileges === 'limited') {
      accessLevel = 'limited';
      status = 'limited';
    } else {
      accessLevel = 'full';
      status = 'granted';
    }
  } else if (response.status === MediaLibrary.PermissionStatus.DENIED) {
    status = 'denied';
    accessLevel = 'none';
  }

  return {
    granted: response.granted,
    canAskAgain: response.canAskAgain,
    accessLevel,
    status,
  };
}

/**
 * Launches system photo picker for user-selected photos (works without broad gallery permission)
 */
export async function pickUserSelectedPhotos(): Promise<GalleryAssetItem[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 25,
    quality: 1,
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  const items: GalleryAssetItem[] = [];
  for (const asset of result.assets) {
    const hash = await computeQuickAssetHash(asset.uri, asset.fileName || 'selected.jpg');
    items.push({
      id: asset.assetId || `picker_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      uri: asset.uri,
      localUri: asset.uri,
      filename: asset.fileName || 'selected_photo.jpg',
      creationTime: Date.now(),
      width: asset.width,
      height: asset.height,
      mediaType: 'photo',
      assetHash: hash,
    });
  }

  return items;
}

/**
 * Fetches accessible photo assets page-by-page from the media library
 */
export async function fetchGalleryPage(
  config: ScanFilterConfig,
  pageSize = 20,
  afterCursor?: string
): Promise<GalleryPageResult> {
  const options: MediaLibrary.AssetsOptions = {
    first: pageSize,
    after: afterCursor,
    mediaType: [MediaLibrary.MediaType.photo],
    sortBy: [[MediaLibrary.SortBy.creationTime, false]], // newest first
  };

  // Filter: Screenshots only
  if (config.scanMode === 'screenshots' || config.includeScreenshotsOnly) {
    try {
      const albums = await MediaLibrary.getAlbumsAsync();
      const screenshotsAlbum = albums.find(
        (a) => a.title.toLowerCase() === 'screenshots' || a.title.toLowerCase() === 'screenshot'
      );
      if (screenshotsAlbum) {
        options.album = screenshotsAlbum.id;
      }
    } catch {
      // Album lookup failed, will filter filenames below
    }
  }

  // Filter: Recent photos (e.g. past 6 or 12 months)
  if (config.scanMode === 'recent' || config.recentMonths) {
    const months = config.recentMonths || 6;
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - months);
    options.createdAfter = pastDate.getTime();
  }

  let page: MediaLibrary.PagedInfo<MediaLibrary.Asset>;
  try {
    page = await MediaLibrary.getAssetsAsync(options);
  } catch {
    // Media library permission not granted or restricted (e.g. in Expo Go on Android)
    return {
      assets: [],
      hasNextPage: false,
      totalCount: 0,
    };
  }
  const items: GalleryAssetItem[] = [];

  for (const asset of page.assets) {
    // If scanning screenshots and album filter wasn't available, filter by filename
    if (
      config.scanMode === 'screenshots' &&
      !options.album &&
      !asset.filename.toLowerCase().includes('screenshot')
    ) {
      continue;
    }

    // Filter out tiny thumbnails or icons (< 250px) that cannot be documents
    if (asset.width < 250 || asset.height < 250) {
      continue;
    }

    const hash = await computeQuickAssetHash(asset.uri, asset.filename);
    items.push({
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      creationTime: asset.creationTime,
      width: asset.width,
      height: asset.height,
      mediaType: asset.mediaType,
      assetHash: hash,
    });
  }

  return {
    assets: items,
    hasNextPage: page.hasNextPage,
    endCursor: page.endCursor,
    totalCount: page.totalCount,
  };
}

/**
 * Checks whether an asset is accessible locally (not cloud-only/offline)
 */
export async function ensureAssetAccessible(
  assetId: string,
  uri: string
): Promise<{ accessible: boolean; localUri: string }> {
  // On Android, MediaStore assets already have a local content:// or file:// URI.
  // Calling getAssetInfoAsync on Android attempts to inspect EXIF metadata, which
  // fails with a SecurityException when ACCESS_MEDIA_LOCATION is not granted.
  // Android photos from MediaStore are directly accessible via their URI.
  if (Platform.OS === 'android') {
    return { accessible: Boolean(uri), localUri: uri };
  }

  // On iOS, iCloud photos may be stored remotely and require getAssetInfoAsync to resolve localUri
  try {
    const info = await MediaLibrary.getAssetInfoAsync(assetId);
    if (info && info.localUri) {
      return { accessible: true, localUri: info.localUri };
    }
    return { accessible: Boolean(uri), localUri: uri };
  } catch (error: any) {
    const message = error?.message || String(error);
    if (message.includes('ACCESS_MEDIA_LOCATION') || message.includes('ExifInterface')) {
      return { accessible: Boolean(uri), localUri: uri };
    }
    console.warn(`[Gallery] Asset ${assetId} not accessible locally (possibly cloud-only):`, error);
    return { accessible: false, localUri: uri };
  }
}

/**
 * Fast content/metadata hash to recognize already processed photos
 */
async function computeQuickAssetHash(uri: string, filename: string): Promise<string> {
  try {
    const input = `${filename}_${uri}`;
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
  } catch {
    return `hash_${Date.now()}`;
  }
}
