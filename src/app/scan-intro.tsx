import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { requestGalleryPermission } from '../services/gallery/galleryService';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';
import { Button } from '../components/common/Button';

export default function ScanIntroScreen() {
  const router = useRouter();

  const handleScanAccessible = async () => {
    const perm = await requestGalleryPermission();
    if (perm.granted) {
      router.replace({
        pathname: '/scan-active',
        params: { mode: 'all' },
      });
    } else {
      // Permission was denied or dismissed; offer selected-photo mode or manual entry
      router.replace({
        pathname: '/scan-active',
        params: { mode: 'selected' },
      });
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
        <Ionicons name="shield-checkmark" size={48} color={Colors.primaryLight} />
      </View>

      <Text style={styles.title}>Find Documents in Photos</Text>

      {/* Official Plain Language Privacy Explanation */}
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>
          {'“We can look through accessible photos on your device to find documents and dates such as passport expiry, driving licence expiry, and insurance renewals. Analysis happens on this device. Nothing is imported into your records until you review and approve it.”'}
        </Text>
      </View>

      {/* Value Pillars */}
      <View style={styles.pillarList}>
        <View style={styles.pillarItem}>
          <View style={styles.pillarIconWrap}>
            <Ionicons name="hardware-chip-outline" size={20} color={Colors.primaryLight} />
          </View>
          <View style={styles.pillarTextWrap}>
            <Text style={styles.pillarTitle}>100% On-Device Processing</Text>
            <Text style={styles.pillarSubtitle}>
              Text recognition and classification run locally on your phone using Google ML Kit.
            </Text>
          </View>
        </View>

        <View style={styles.pillarItem}>
          <View style={styles.pillarIconWrap}>
            <Ionicons name="hand-left-outline" size={20} color={Colors.success} />
          </View>
          <View style={styles.pillarTextWrap}>
            <Text style={styles.pillarTitle}>Consent-Based Import Only</Text>
            <Text style={styles.pillarSubtitle}>
              You see every detected document first. Nothing is saved or scheduled without your explicit review.
            </Text>
          </View>
        </View>

        <View style={styles.pillarItem}>
          <View style={styles.pillarIconWrap}>
            <Ionicons name="image-outline" size={20} color={Colors.warning} />
          </View>
          <View style={styles.pillarTextWrap}>
            <Text style={styles.pillarTitle}>Original Photos Never Modified</Text>
            <Text style={styles.pillarSubtitle}>
              Your photo gallery is read-only. Your original images are never deleted, moved, or altered.
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionGroup}>
        <Button
          title="Scan Accessible Gallery"
          icon="images-outline"
          size="lg"
          onPress={handleScanAccessible}
          style={styles.primaryAction}
        />

        <Button
          title="Select Photos to Scan"
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
    padding: Spacing.xl,
    alignItems: 'center',
    paddingBottom: Spacing.xxxl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  quoteCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  quoteText: {
    ...Typography.bodyMedium,
    color: Colors.dark.text,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
  pillarList: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  pillarIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
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
    lineHeight: 16,
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
