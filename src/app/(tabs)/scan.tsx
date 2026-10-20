import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScanMode, ScanSession } from '../../types/scan';
import { GalleryPermissionState } from '../../types/permission';
import { CloudProviderInfo, CloudScanItem, CLOUD_PROVIDERS } from '../../types/cloud';
import { getGalleryPermissionState } from '../../services/gallery/galleryService';
import { pickCloudDocuments } from '../../services/cloud/cloudStorageService';
import { scanManager } from '../../services/scan/backgroundScanManager';
import { countPendingCandidates } from '../../services/storage/candidatesRepo';
import { getLatestScanSessions } from '../../services/storage/sessionsRepo';
import { hasAcceptedTermsAndPrivacy } from '../../services/privacy/consentService';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export default function FindDocsScreen() {
  const router = useRouter();
  const [permission, setPermission] = useState<GalleryPermissionState | null>(null);
  const [selectedMode, setSelectedMode] = useState<ScanMode>('all');
  const [pendingCount, setPendingCount] = useState(0);
  const [sessions, setSessions] = useState<ScanSession[]>([]);

  // Cloud picking state
  const [isPickingCloud, setIsPickingCloud] = useState(false);
  const [pickedCloudItems, setPickedCloudItems] = useState<CloudScanItem[] | null>(null);
  const [activeCloudProvider, setActiveCloudProvider] = useState<CloudProviderInfo | null>(null);

  const loadStatus = useCallback(async () => {
    const [perm, pending, recentSessions] = await Promise.all([
      getGalleryPermissionState(),
      countPendingCandidates(),
      getLatestScanSessions(5),
    ]);
    setPermission(perm);
    if (perm.isExpoGoRestricted) {
      setSelectedMode('selected');
    }
    setPendingCount(pending);
    setSessions(recentSessions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  const handleStartScan = async () => {
    const hasAgreed = await hasAcceptedTermsAndPrivacy();
    if (!hasAgreed) {
      router.push('/scan-intro');
      return;
    }

    if (selectedMode !== 'selected' && (!permission || !permission.granted)) {
      router.push('/scan-intro');
      return;
    }

    router.push({
      pathname: '/scan-active',
      params: { mode: selectedMode },
    });
  };

  const handleSelectCloudProvider = async (provider: CloudProviderInfo) => {
    const hasAgreed = await hasAcceptedTermsAndPrivacy();
    if (!hasAgreed) {
      router.push('/scan-intro');
      return;
    }

    try {
      setIsPickingCloud(true);
      setActiveCloudProvider(provider);

      const items = await pickCloudDocuments(provider.id);
      if (items.length > 0) {
        setPickedCloudItems(items);
      } else {
        setActiveCloudProvider(null);
      }
    } catch (e: any) {
      Alert.alert('Error Accessing Files', e?.message || 'Could not access documents.');
      setActiveCloudProvider(null);
    } finally {
      setIsPickingCloud(false);
    }
  };

  const handleConfirmCloudScan = () => {
    if (!pickedCloudItems || pickedCloudItems.length === 0 || !activeCloudProvider) {
      return;
    }

    scanManager.setPendingCloudSelection(pickedCloudItems, activeCloudProvider.id);
    setPickedCloudItems(null);
    setActiveCloudProvider(null);

    router.push({
      pathname: '/scan-active',
      params: { mode: 'cloud' },
    });
  };

  const handleCancelCloudScan = () => {
    setPickedCloudItems(null);
    setActiveCloudProvider(null);
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
      badge: permission?.isExpoGoRestricted ? 'Needs Dev Build' : 'Recommended',
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
                label={permission.granted ? 'Access Ready' : 'Consent Needed'}
                variant={permission.granted ? 'success' : 'neutral'}
                size="sm"
              />
            )}
          </View>
          <Text style={styles.privacyText}>
            Scanning looks through photos and cloud documents using local on-device OCR. No document contents
            are ever uploaded or stored apart from this device.
          </Text>
        </View>
      </View>

      {/* Target Document Types Header */}
      <View style={styles.targetDocsCard}>
        <Text style={styles.targetDocsLabel}>AUTOMATICALLY FINDS & EXTRACTS DATES FOR:</Text>
        <View style={styles.targetDocsRow}>
          <View style={styles.targetDocChip}>
            <Ionicons name="airplane-outline" size={15} color={Colors.primaryLight} />
            <Text style={styles.targetDocText}>Passports (Expiry)</Text>
          </View>
          <View style={styles.targetDocChip}>
            <Ionicons name="card-outline" size={15} color={Colors.primaryLight} />
            <Text style={styles.targetDocText}>Licences (Validity)</Text>
          </View>
          <View style={styles.targetDocChip}>
            <Ionicons name="shield-outline" size={15} color={Colors.success} />
            <Text style={styles.targetDocText}>Insurance (Renewals)</Text>
          </View>
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

      {/* NEW: Cloud Storage Section */}
      <View style={styles.cloudSection}>
        <View style={styles.cloudHeaderRow}>
          <View>
            <Text style={styles.sectionHeading}>Cloud & Storage Drives</Text>
            <Text style={styles.sectionSubheading}>
              Search Google Drive, OneDrive, iCloud, Dropbox, TeraBox & PDF files
            </Text>
          </View>
          <Badge label="New" variant="primary" size="sm" />
        </View>

        <View style={styles.cloudGrid}>
          {CLOUD_PROVIDERS.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              activeOpacity={0.75}
              onPress={() => handleSelectCloudProvider(provider)}
              style={styles.cloudCard}
            >
              <View style={[styles.cloudIconWrap, { backgroundColor: `${provider.accentColor}15` }]}>
                <Ionicons name={provider.icon} size={24} color={provider.accentColor} />
              </View>
              <View style={styles.cloudCardContent}>
                <Text style={styles.cloudCardTitle}>{provider.name}</Text>
                <Text style={styles.cloudCardTagline} numberOfLines={1}>
                  {provider.tagline}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#64748B" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cloudFooterHint}>
          <Ionicons name="information-circle-outline" size={15} color="#94A3B8" />
          <Text style={styles.cloudFooterHintText}>
            Supports images & multi-page PDFs. Leave the app while it scans; get notified on completion.
          </Text>
        </View>
      </View>

      {/* Mode Selection for Device Gallery */}
      <Text style={styles.sectionHeading}>Device Photo Discovery</Text>

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
        title={`Scan Photos (${selectedMode === 'all' ? 'All Photos' : selectedMode === 'selected' ? 'Select Photos' : selectedMode === 'screenshots' ? 'Screenshots' : 'Recent'})`}
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
                  {sess.scanMode === 'cloud' ? 'Cloud Scan' : 'Gallery Scan'} • Examined {sess.processedCount} items • Found {sess.detectedCount} documents
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

      {/* Cloud Selection Confirmation Modal */}
      <Modal
        visible={!!pickedCloudItems && pickedCloudItems.length > 0}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelCloudScan}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: `${activeCloudProvider?.accentColor || '#3B82F6'}20` }]}>
                <Ionicons
                  name={activeCloudProvider?.icon || 'cloud'}
                  size={28}
                  color={activeCloudProvider?.accentColor || Colors.primaryLight}
                />
              </View>
              <View style={styles.modalHeaderTextWrap}>
                <Text style={styles.modalTitle}>
                  {activeCloudProvider?.name || 'Cloud Storage'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Ready to scan {pickedCloudItems?.length || 0} selected document{pickedCloudItems?.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            {/* Document Breakdown */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownNumber}>
                    {pickedCloudItems?.filter((i) => i.isPdf).length || 0}
                  </Text>
                  <Text style={styles.breakdownLabel}>PDF Files</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownNumber}>
                    {pickedCloudItems?.filter((i) => !i.isPdf).length || 0}
                  </Text>
                  <Text style={styles.breakdownLabel}>Images / Scans</Text>
                </View>
              </View>
            </View>

            {/* Privacy & Background Notice */}
            <View style={styles.modalNoticeBox}>
              <View style={styles.modalNoticeRow}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                <Text style={styles.modalNoticeText}>
                  100% on-device OCR. No file contents leave your phone.
                </Text>
              </View>
              <View style={styles.modalNoticeRow}>
                <Ionicons name="trash-outline" size={16} color={Colors.primaryLight} />
                <Text style={styles.modalNoticeText}>
                  Non-documents are purged from memory immediately.
                </Text>
              </View>
              <View style={styles.modalNoticeRow}>
                <Ionicons name="notifications-outline" size={16} color={Colors.warning} />
                <Text style={styles.modalNoticeText}>
                  Runs in background. You will receive a notification when finished.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={handleCancelCloudScan}
                style={styles.modalCancelBtn}
              />
              <Button
                title="Start Background Scan"
                icon="play"
                variant="primary"
                onPress={handleConfirmCloudScan}
                style={styles.modalConfirmBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal while file picker prepares */}
      {isPickingCloud && (
        <Modal transparent={true} visible={isPickingCloud}>
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primaryLight} />
              <Text style={styles.loadingText}>Opening Storage Picker...</Text>
            </View>
          </View>
        </Modal>
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
    borderColor: 'rgba(34, 197, 94, 0.25)',
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  shieldIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  privacyTextWrap: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  privacyText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  targetDocsCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  targetDocsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  targetDocsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  targetDocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.cardElevated,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    gap: 4,
  },
  targetDocText: {
    fontSize: 11,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.xl,
    justifyContent: 'space-between',
  },
  reviewTextWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  reviewTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: Colors.primaryLight,
    marginBottom: 2,
  },
  reviewSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  reviewBtn: {
    minWidth: 80,
  },
  sectionHeading: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  sectionSubheading: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  cloudSection: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cloudHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cloudGrid: {
    gap: Spacing.sm,
  },
  cloudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cloudIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cloudCardContent: {
    flex: 1,
  },
  cloudCardTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  cloudCardTagline: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  cloudFooterHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  cloudFooterHintText: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  modeIconWrap: {
    width: 40,
    height: 40,
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
    gap: Spacing.xs,
    marginBottom: 2,
  },
  modeTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  modeTitleSelected: {
    color: Colors.primaryLight,
  },
  modeDescription: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  scanBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  historySection: {
    marginTop: Spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  historyInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.dark.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  modalHeaderTextWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  breakdownCard: {
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.dark.border,
  },
  breakdownNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  breakdownLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  modalNoticeBox: {
    backgroundColor: '#0F172A',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
  },
  modalConfirmBtn: {
    flex: 2,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.dark.text,
  },
});
