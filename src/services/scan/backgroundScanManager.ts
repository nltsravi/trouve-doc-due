import { AppState, AppStateStatus } from 'react-native';
import { ScanFilterConfig, ScanProgress } from '../../types/scan';
import { CloudScanItem, CloudProviderType } from '../../types/cloud';
import { executeGalleryScan, ScannerController, ScanResultSummary } from './scannerService';

type ProgressListener = (progress: ScanProgress) => void;

interface PendingCloudSelection {
  items: CloudScanItem[];
  provider: CloudProviderType;
}

class BackgroundScanManager {
  private activeController: ScannerController | null = null;
  private currentProgress: ScanProgress | null = null;
  private listeners: Set<ProgressListener> = new Set();
  private pendingCloudSelection: PendingCloudSelection | null = null;
  private isScanning = false;
  private appStateSubscription: any = null;

  constructor() {
    this.initAppStateListener();
  }

  private initAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' && this.isScanning) {
        console.log('[BackgroundScanManager] App transitioned to background. Scan continues asynchronously.');
      } else if (nextState === 'active' && this.isScanning) {
        console.log('[BackgroundScanManager] App returned to foreground.');
      }
    });
  }

  setPendingCloudSelection(items: CloudScanItem[], provider: CloudProviderType = 'generic') {
    this.pendingCloudSelection = { items, provider };
  }

  getPendingCloudSelection(): PendingCloudSelection | null {
    return this.pendingCloudSelection;
  }

  clearPendingCloudSelection() {
    this.pendingCloudSelection = null;
  }

  get scanning(): boolean {
    return this.isScanning;
  }

  get progress(): ScanProgress | null {
    return this.currentProgress;
  }

  get controller(): ScannerController | null {
    return this.activeController;
  }

  subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    if (this.currentProgress) {
      listener(this.currentProgress);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitProgress(prog: ScanProgress) {
    this.currentProgress = prog;
    for (const listener of this.listeners) {
      try {
        listener(prog);
      } catch (e) {
        console.warn('[BackgroundScanManager] Listener error:', e);
      }
    }
  }

  async startScan(config: ScanFilterConfig): Promise<ScanResultSummary> {
    if (this.isScanning && this.activeController) {
      console.warn('[BackgroundScanManager] A scan is already running. Cancelling previous.');
      this.activeController.cancel();
    }

    const controller = new ScannerController();
    this.activeController = controller;
    this.isScanning = true;

    try {
      const summary = await executeGalleryScan(config, controller, (prog) => {
        this.emitProgress(prog);
      });
      return summary;
    } finally {
      this.isScanning = false;
      this.activeController = null;
    }
  }

  cancelActiveScan() {
    if (this.activeController) {
      this.activeController.cancel();
    }
    this.isScanning = false;
  }
}

export const scanManager = new BackgroundScanManager();
