import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ScanMode, ScanProgress } from '../types/scan';
import { executeGalleryScan, ScannerController } from '../services/scan/scannerService';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';

export default function ScanActiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const scanMode: ScanMode = (params.mode as ScanMode) || 'all';

  const controllerRef = useRef(new ScannerController());
  const [progress, setProgress] = useState<ScanProgress>({
    sessionId: '',
    status: 'running',
    totalAssets: 0,
    processedCount: 0,
    detectedCount: 0,
    skippedCount: 0,
    currentAssetUri: null,
  });
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const controller = controllerRef.current;

    async function runScan() {
      try {
        await executeGalleryScan(
          {
            scanMode,
            maxScanCount: 150,
          },
          controller,
          (prog) => {
            if (isMounted) {
              setProgress(prog);
            }
          }
        );

        if (isMounted) {
          router.replace('/review');
        }
      } catch (error) {
        console.error('[ScanActive] Error running scan:', error);
        if (isMounted) {
          router.replace('/review');
        }
      }
    }

    runScan();

    return () => {
      isMounted = false;
      controller.cancel();
    };
  }, [scanMode, router]);

  const togglePause = () => {
    const controller = controllerRef.current;
    if (isPaused) {
      controller.resume();
      setIsPaused(false);
    } else {
      controller.pause();
      setIsPaused(true);
    }
  };

  const handleStopAndReview = () => {
    controllerRef.current.cancel();
    router.replace('/review');
  };

  const total = progress.totalAssets || 50;
  const progressRatio = Math.min(1, progress.processedCount / Math.max(1, total));

  return (
    <View style={styles.container}>
      {/* Current Photo Preview / Radar */}
      <View style={styles.previewContainer}>
        {progress.currentAssetUri ? (
          <Image
            source={{ uri: progress.currentAssetUri }}
            style={styles.previewImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.previewImage, styles.placeholderPreview]}>
            <Ionicons name="scan" size={48} color={Colors.primaryLight} />
          </View>
        )}

        <View style={styles.scanLine} />
      </View>

      {/* Progress Metric Header */}
      <Text style={styles.statusTitle}>
        {isPaused ? 'Scan Paused' : 'Analyzing Accessible Photos...'}
      </Text>
      <Text style={styles.statusSubtitle}>
        Running on-device OCR and document classification
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressWrap}>
        <ProgressBar progress={progressRatio} height={8} />
      </View>

      {/* Metrics Row */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>{progress.processedCount}</Text>
          <Text style={styles.statLabel}>Examined</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={[styles.statNumber, { color: Colors.success }]}>
            {progress.detectedCount}
          </Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statNumber}>{progress.skippedCount}</Text>
          <Text style={styles.statLabel}>Skipped</Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        <Button
          title={isPaused ? 'Resume' : 'Pause'}
          icon={isPaused ? 'play' : 'pause'}
          variant="secondary"
          onPress={togglePause}
          style={styles.controlBtn}
        />

        <Button
          title="Stop & Review"
          icon="checkmark-circle-outline"
          variant="primary"
          onPress={handleStopAndReview}
          style={styles.controlBtn}
        />
      </View>

      <Text style={styles.disclaimerText}>
        Photos stay on your phone. Nothing is imported until you review and approve.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  previewContainer: {
    width: 180,
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    marginBottom: Spacing.xl,
    position: 'relative',
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.cardElevated,
  },
  scanLine: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primaryLight,
    shadowColor: Colors.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  statusTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  statusSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  progressWrap: {
    width: '100%',
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    marginBottom: Spacing.xl,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.dark.border,
  },
  statNumber: {
    ...Typography.h2,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    maxWidth: 340,
    marginBottom: Spacing.lg,
  },
  controlBtn: {
    flex: 1,
  },
  disclaimerText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
