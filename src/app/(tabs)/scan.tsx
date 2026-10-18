import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScanMode, ScanSession } from '../../types/scan';
import { GalleryPermissionState } from '../../types/permission';
import { getGalleryPermissionState } from '../../services/gallery/galleryService';
import { countPendingCandidates } from '../../services/storage/candidatesRepo';
import { getLatestScanSessions } from '../../services/storage/sessionsRepo';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export default function FindDocsScreen() {
  const router = useRouter();
  const [permission, setPermission] = useState<GalleryPermissionState | null>(null);
  const [selectedMode, setSelectedMode] = useState<ScanMode>('all');
  const [pendingCount, setPendingCount] = useState(0);
  const [sessions, setSessions] = useState<ScanSession[]>([]);

  const loadStatus = useCallback(async () => {
    const [perm, pending, recentSessions] = await Promise.all([
      getGalleryPermissionState(),
      countPendingCandidates(),
      getLatestScanSessions(5),
    ]);
    setPermission(perm);
    setPendingCount(pending);
    setSessions(recentSessions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  const handleStartScan = () => {
    // Navigate to scan-active with selected mode
    router.push({
      pathname: '/scan-active',
      params: { mode: selectedMode },
    });
  };

  const SCAN_MODES: {
    id: ScanMode;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
  }[] = [
    {
      id: 'all',
      title: 'All Accessible Photos',
      description: 'Scans your camera roll and device photos for personal documents.',
      icon: 'images-outline',
      badge: 'Recommended',
    },
    {
      id: 'selected',
      title: 'Selected Photos Only',
      description: 'Choose specific photos using the system photo picker. No broad permission needed.',
      icon: 'checkbox-outline',
    },
    {
      id: 'screenshots',
      title: 'Screenshots Only',
      description: 'Fast scan focusing on captured digital cards, policies, and receipts.',
      icon: 'phone-portrait-outline',
    },
    {
      id: 'recent',
      title: 'Recent Photos (Past 6 Months)',
      description: 'Quick scan of recent documents without analyzing your whole library.',
      icon: 'time-outline',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Onboarding & Privacy Promise Banner */}
      <View style={styles.privacyBanner}>
        <View style={styles.shieldIconWrap}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
        </View>
        <View style={styles.privacyTextWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={styles.privacyTitle}>100% On-Device & Private</Text>
            {permission && (
              <Badge
                label={permission.granted ? 'Access Ready' : 'Permission Needed'}
                variant={permission.granted ? 'success' : 'neutral'}
                size="sm"
              />
            )}
          </View>
          <Text style={styles.privacyText}>
            Scanning looks through photos on your device using local OCR. No photos or document contents
            are ever uploaded to any cloud or server.
          </Text>
        </View>
      </View>

      {/* Review Queue Shortcut (If candidates awaiting review) */}
      {pendingCount > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/review')}
          style={styles.reviewBanner}
        >
          <View style={styles.reviewTextWrap}>
            <Text style={styles.reviewTitle}>
              {pendingCount} Candidates Awaiting Review
            </Text>
            <Text style={styles.reviewSubtitle}>
              You have previously detected documents. Review and choose which ones to import.
            </Text>
          </View>
          <Button
            title="Review"
            size="sm"
            onPress={() => router.push('/review')}
            style={styles.reviewBtn}
          />
        </TouchableOpacity>
      )}

      {/* Mode Selection */}
      <Text style={styles.sectionHeading}>Choose Discovery Mode</Text>

      {SCAN_MODES.map((mode) => {
        const isSelected = selectedMode === mode.id;
        return (
          <TouchableOpacity
            key={mode.id}
            activeOpacity={0.75}
            onPress={() => setSelectedMode(mode.id)}
            style={[styles.modeCard, isSelected && styles.modeCardSelected]}
          >
            <View style={styles.modeIconWrap}>
              <Ionicons
                name={mode.icon}
                size={22}
                color={isSelected ? Colors.primaryLight : '#94A3B8'}
              />
            </View>

            <View style={styles.modeTextWrap}>
              <View style={styles.modeTitleRow}>
                <Text style={[styles.modeTitle, isSelected && styles.modeTitleSelected]}>
                  {mode.title}
                </Text>
                {mode.badge && (
                  <Badge label={mode.badge} variant="primary" size="sm" />
                )}
              </View>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </View>

            <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
              {isSelected && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Primary Action Button */}
      <Button
        title={`Start Scanning (${selectedMode === 'all' ? 'All Photos' : selectedMode === 'selected' ? 'Select Photos' : selectedMode === 'screenshots' ? 'Screenshots' : 'Recent'})`}
        icon="scan-circle-outline"
        size="lg"
        onPress={handleStartScan}
        style={styles.scanBtn}
      />

      {/* Scan History Section */}
      {sessions.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionHeading}>Recent Scans</Text>
          {sessions.map((sess) => (
            <View key={sess.id} style={styles.historyItem}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>
                  {new Date(sess.startedAt).toLocaleDateString()} at{' '}
                  {new Date(sess.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.historyMeta}>
                  Examined {sess.processedCount} photos • Found {sess.detectedCount} documents
                </Text>
              </View>
              <Badge
                label={sess.status === 'completed' ? 'Completed' : sess.status}
                variant={sess.status === 'completed' ? 'success' : 'neutral'}
                size="sm"
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  privacyBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  shieldIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  privacyTextWrap: {
    flex: 1,
  },
  privacyTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    marginBottom: Spacing.lg,
  },
  reviewTextWrap: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  reviewTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  reviewSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  reviewBtn: {
    paddingHorizontal: 14,
  },
  sectionHeading: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  modeCardSelected: {
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  modeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  modeTextWrap: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  modeTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  modeTitleSelected: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  modeDescription: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primaryLight,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryLight,
  },
  scanBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  historySection: {
    marginTop: Spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  historyInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  historyDate: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  historyMeta: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
});
