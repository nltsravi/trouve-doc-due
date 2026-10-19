export type GalleryAccessLevel = 'none' | 'limited' | 'full';

export interface GalleryPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  accessLevel: GalleryAccessLevel;
  status: 'undetermined' | 'granted' | 'denied' | 'limited';
  isExpoGoRestricted?: boolean;
}

export interface NotificationPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: 'undetermined' | 'granted' | 'denied';
}
