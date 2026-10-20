import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ScanMode, ScanProgress } from '../types/scan';
import { scanManager } from '../services/scan/backgroundScanManager';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { ProgressBar } from '../components/common/ProgressBar';
import { Button } from '../components/common/Button';

export default function ScanActiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const scanMode: ScanMode = (params.mode as ScanMode) || 'all';

  const [progress, setProgress] = useState<ScanProgress>({
    sessionId: '',
    status: 'running',
    totalAssets: 0,
    processedCount: 0,
    detectedCount: 0,
    skippedCount: 0,
    currentAssetUri: null,
    currentAssetTitle: null,
  });
  const [isPaused, setIsPaused] = useState(false);
  const scanStartedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (scanStartedRef.current) return;
    scanStartedRef.current = true;

    // Subscribe to scan manager progress
    const unsubscribe = scanManager.subscribe((prog) => {
      if (isMounted) {
        setProgress(prog);
      }
    });

    async function runScan() {
      try {
        if (scanMode === 'cloud') {
          const cloudSelection = scanManager.getPendingCloudSelection();
          if (!cloudSelection || cloudSelection.items.length === 0) {
            Alert.alert('No Files Selected', 'No cloud documents were selected to scan.', [
              { text: 'OK', onPress: () => router.replace('/(tabs)/scan') },
            ]);
            return;
          }

          await scanManager.startScan({
            scanMode: 'cloud',
            cloudItems: cloudSelection.items,
            cloudProvider: cloudSelection.provider,
          });
        } else {
          await scanManager.startScan({
            scanMode,
            maxScanCount: 150,
          });
        }

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
      unsubscribe();
    };
  }, [scanMode, router]);

  const togglePause = () => {
    const controller = scanManager.controller;
    if (!controller) return;

    if (isPaused) {
      controller.resume();
      setIsPaused(false);
    } else {
      controller.pause();
      setIsPaused(true);
    }
  };

  const handleStopAndReview = () => {
    scanManager.cancelActiveScan();
    router.replace('/review');
  };

  const handleRunInBackground = () => {
    Alert.alert(
      'Scanning in Background',
      'The scan will continue processing your documents. You can safely switch apps or lock your phone.\n\nWe will send you a notification as soon as the scan finishes!',
      [
        {
          text: 'Leave App',
          onPress: () => router.replace('/(tabs)'),
        },
        {
          text: 'Stay on Screen',
          style: 'cancel',
        },
      ]
    );
  };

  const total = progress.totalAssets || (scanMode === 'cloud' ? 10 : 50);
  const progressRatio = Math.min(1, progress.processedCount / Math.max(1, total));
  const isPdf =
    progress.currentAssetTitle?.toLowerCase().endsWith('.pdf') ||
    progress.currentAssetUri?.toLowerCase().endsWith('.pdf');

  return (
    <View style={styles.container}>
      {/* Background Mode Floating Quick Action */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleRunInBackground}
        style={styles.backgroundBadge}
      >
        <Ionicons name="notifications-outline" size={16} color={Colors.primaryLight} />
        <Text style={styles.backgroundBadgeText}>Run in Background & Notify</Text>
      </TouchableOpacity>

      {/* Current Photo / Document Preview Radar */}
      <View style={styles.previewContainer}>
        {isPdf ? (
          <View style={[styles.previewImage, styles.pdfPreview]}>
            <Ionicons name="document-text" size={56} color={Colors.primaryLight} />
            <Text style={styles.pdfBadgeText} numberOfLines={2}>
              {progress.currentAssetTitle || 'PDF Document'}
            </Text>
          </View>
        ) : progress.currentAssetUri ? (
          <Image
            source={{ uri: progress.currentAssetUri }}
            style={styles.previewImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.previewImage, styles.placeholderPreview]}>
            <Ionicons
              name={scanMode === 'cloud' ? 'cloud-download-outline' : 'scan'}
              size={48}
              color={Colors.primaryLight}
            />
          </View>
        )}

        <View style={styles.scanLine} />
      </View>

      {/* Progress Metric Header */}
      <Text style={styles.statusTitle}>
        {isPaused
          ? 'Scan Paused'
          : scanMode === 'cloud'
          ? 'Analyzing Cloud Documents...'
          : 'Analyzing Accessible Photos...'}
      </Text>
      <Text style={styles.statusSubtitle} numberOfLines={1}>
        {progress.currentAssetTitle
          ? `Processing ${progress.currentAssetTitle}`
          : 'Running on-device OCR and document classification'}
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

      {/* Background Notification Advice */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleRunInBackground}
        style={styles.backgroundHintBtn}
      >
        <Ionicons name="exit-outline" size={18} color="#94A3B8" />
        <Text style={styles.backgroundHintText}>
          {"You can safely leave the app. We'll send a notification when finished."}
        </Text>
      </TouchableOpacity>

      <Text style={styles.disclaimerText}>
        100% on-device processing. Non-document files are purged from memory immediately.
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
  backgroundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    marginBottom: Spacing.lg,
  },
  backgroundBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  previewContainer: {
    width: 180,
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    marginBottom: Spacing.lg,
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
  pdfPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: Spacing.md,
  },
  pdfBadgeText: {
    marginTop: Spacing.sm,
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
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
    shadowRadius: 8,
  },
  statusTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  progressWrap: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
  },
  controlBtn: {
    flex: 1,
  },
  backgroundHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  backgroundHintText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 16,
  },
});
