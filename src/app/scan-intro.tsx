import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { requestGalleryPermission } from '../services/gallery/galleryService';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { Button } from '../components/common/Button';

export default function ScanIntroScreen() {
  const router = useRouter();
  const [hasConsented, setHasConsented] = useState(false);

  const handleScanEntireGallery = async () => {
    if (!hasConsented) {
      Alert.alert(
        'Consent Required',
        'Please confirm your consent by checking the box below to allow TrouveDocDue to inspect your photos locally.',
        [{ text: 'OK' }]
      );
      return;
    }

    const perm = await requestGalleryPermission();

    if (perm.granted) {
      // Permission granted: scan entire gallery in bounded background batches
      router.replace({
        pathname: '/scan-active',
        params: { mode: 'all' },
      });
    } else if (perm.isExpoGoRestricted) {
      // In Expo Go sandbox on Android, broad camera roll enumeration is restricted
      Alert.alert(
        'Expo Go Sandbox Notice',
        'Android does not permit broad media library enumeration inside the Expo Go app client.\n\nWould you like to select photos using the Android Photo Picker (which works without broad permissions), or run in a development build?',
        [
          {
            text: 'Use Photo Picker',
            onPress: () => {
              router.replace({
                pathname: '/scan-active',
                params: { mode: 'selected' },
              });
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      // Standard permission denied: offer photo picker fallback
      Alert.alert(
        'Photo Access Needed',
        'To scan all photos automatically, please enable photo access in Settings, or use the Photo Picker to choose specific documents.',
        [
          {
            text: 'Select Photos',
            onPress: () => {
              router.replace({
                pathname: '/scan-active',
                params: { mode: 'selected' },
              });
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleSelectPhotos = () => {
    router.replace({
      pathname: '/scan-active',
      params: { mode: 'selected' },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Icon Graphic */}
      <View style={styles.iconCircle}>
        <Ionicons name="shield-checkmark" size={44} color={Colors.primaryLight} />
      </View>

      <Text style={styles.title}>Consent to Scan Gallery</Text>
      <Text style={styles.tagline}>
        Find documents you already have. Extract dates that matter. Never miss a renewal.
      </Text>

      {/* Zero Storage Privacy Contract */}
      <View style={styles.pledgeCard}>
        <View style={styles.pledgeHeaderRow}>
          <Ionicons name="lock-closed" size={20} color={Colors.success} />
          <Text style={styles.pledgeTitle}>Zero-Storage Privacy Guarantee</Text>
        </View>
        <Text style={styles.pledgeBody}>
          TrouveDocDue operates with 100% on-device OCR. Your photos are NEVER uploaded to any remote server or stored apart from your device. Scanned images are processed purely in local memory and are never modified or deleted from your gallery.
        </Text>
      </View>

      {/* Target Document Types */}
      <View style={styles.docsBanner}>
        <Text style={styles.docsBannerTitle}>DOCUMENTS WE SEARCH FOR:</Text>
        <View style={styles.docTypesGrid}>
          <View style={styles.docTypePill}>
            <Ionicons name="airplane-outline" size={16} color={Colors.primaryLight} />
            <Text style={styles.docTypeText}>Passports</Text>
          </View>
          <View style={styles.docTypePill}>
            <Ionicons name="card-outline" size={16} color={Colors.primaryLight} />
            <Text style={styles.docTypeText}>Driving Licences</Text>
          </View>
          <View style={styles.docTypePill}>
            <Ionicons name="shield-outline" size={16} color={Colors.success} />
            <Text style={styles.docTypeText}>Insurance (Motor/Health/Life)</Text>
          </View>
        </View>
      </View>

      {/* Three Pillars */}
      <View style={styles.pillarList}>
        <View style={styles.pillarItem}>
          <View style={styles.pillarIconWrap}>
            <Ionicons name="hardware-chip-outline" size={18} color={Colors.primaryLight} />
          </View>
          <View style={styles.pillarTextWrap}>
            <Text style={styles.pillarTitle}>100% On-Device Processing</Text>
            <Text style={styles.pillarSubtitle}>
              On-device OCR extracts dates and policy details locally. Zero cloud APIs.
            </Text>
          </View>
        </View>

        <View style={styles.pillarItem}>
          <View style={styles.pillarIconWrap}>
            <Ionicons name="hand-left-outline" size={18} color={Colors.success} />
          </View>
          <View style={styles.pillarTextWrap}>
            <Text style={styles.pillarTitle}>Consent-Based Vault</Text>
            <Text style={styles.pillarSubtitle}>
              Nothing is saved or scheduled until you review and explicitly approve it.
            </Text>
          </View>
        </View>

        <View style={styles.pillarItem}>
          <View style={styles.pillarIconWrap}>
            <Ionicons name="sync-outline" size={18} color={Colors.warning} />
          </View>
          <View style={styles.pillarTextWrap}>
            <Text style={styles.pillarTitle}>Background Batch Processing</Text>
            <Text style={styles.pillarSubtitle}>
              Examines photos in bounded batches without freezing your device.
            </Text>
          </View>
        </View>
      </View>

      {/* Explicit Consent Checkbox Card */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setHasConsented(!hasConsented)}
        style={[styles.consentCard, hasConsented && styles.consentCardActive]}
      >
        <View style={[styles.checkbox, hasConsented && styles.checkboxActive]}>
          {hasConsented && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
        <Text style={styles.consentText}>
          I consent to scanning my gallery photos locally on this device under the Zero-Storage Guarantee.
        </Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionGroup}>
        <Button
          title="Scan Entire Gallery at Once"
          icon="images-outline"
          size="lg"
          onPress={handleScanEntireGallery}
          style={styles.primaryAction}
        />

        <Button
          title="Select Photos to Scan (Photo Picker)"
          icon="checkbox-outline"
          variant="secondary"
          size="md"
          onPress={handleSelectPhotos}
          style={styles.secondaryAction}
        />

        <Button
          title="Not Now (Add Manually Instead)"
          variant="ghost"
          size="sm"
          onPress={() => router.replace('/records/new')}
          style={styles.ghostAction}
        />
      </View>
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
    alignItems: 'center',
    paddingBottom: Spacing.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  pledgeCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: Spacing.md,
    width: '100%',
  },
  pledgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pledgeTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.success,
  },
  pledgeBody: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  docsBanner: {
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  docsBannerTitle: {
    ...Typography.overline,
    color: Colors.primaryLight,
    marginBottom: 8,
  },
  docTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  docTypeText: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  pillarList: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  pillarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  pillarTextWrap: {
    flex: 1,
  },
  pillarTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  pillarSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    lineHeight: 15,
  },
  consentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  consentCardActive: {
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.dark.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  consentText: {
    ...Typography.bodySmall,
    color: Colors.dark.text,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionGroup: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryAction: {
    width: '100%',
  },
  secondaryAction: {
    width: '100%',
  },
  ghostAction: {
    width: '100%',
    marginTop: Spacing.xs,
  },
});
