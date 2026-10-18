// Mock native modules that are not available in Jest Node environment
jest.mock('@infinitered/react-native-mlkit-text-recognition', () => ({
  recognizeText: jest.fn(async (_uri) => ({
    text: '',
    blocks: [],
  })),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async () => 'mock_sha256_hash'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

// Mock expo-media-library/legacy
jest.mock('expo-media-library/legacy', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  getAssetsAsync: jest.fn(async () => ({ assets: [], hasNextPage: false, totalCount: 0 })),
  getAssetInfoAsync: jest.fn(async () => ({ localUri: 'file:///mock/image.jpg' })),
  MediaType: { photo: 'photo' },
  SortBy: { creationTime: 'creationTime' },
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(async (uri) => ({ uri })),
  SaveFormat: { JPEG: 'jpeg' },
}));
