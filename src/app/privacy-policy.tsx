import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

const HOSTED_PRIVACY_URL = 'https://nltsravi.github.io/trouve-doc-due/privacy.html';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleOpenHosted = async () => {
    try {
      await WebBrowser.openBrowserAsync(HOSTED_PRIVACY_URL);
    } catch {
      await Linking.openURL(HOSTED_PRIVACY_URL).catch(() => {});
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={36} color={Colors.success} />
        </View>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>Effective Date: October 2026 • Version 1.0</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={handleOpenHosted} style={styles.webLinkBtn}>
          <Ionicons name="globe-outline" size={16} color={Colors.success} />
          <Text style={styles.webLinkText}>View on GitHub Pages</Text>
          <Ionicons name="open-outline" size={14} color={Colors.success} />
        </TouchableOpacity>
      </View>

      {/* Guarantee Card */}
      <View style={styles.guaranteeCard}>
        <View style={styles.guaranteeHeaderRow}>
          <Ionicons name="lock-closed" size={20} color={Colors.success} />
          <Text style={styles.guaranteeTitle}>Zero-Storage Privacy Guarantee</Text>
        </View>
        <Text style={styles.guaranteeBody}>
          Trouvé DocDue operates completely on your physical device. We operate no cloud databases,
          no remote OCR endpoints, and no server telemetry. Your images and documents are never uploaded
          or stored apart from your device.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Privacy-First Architecture</Text>
        <Text style={styles.paragraph}>
          Trouvé DocDue (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the app&rdquo;) is built on local-first processing principles.
          We do not operate an application backend, user accounts, remote databases, or cloud analytics.
          All personal data remains exclusively on your device.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. On-Device OCR & Document Discovery</Text>
        <Text style={styles.paragraph}>
          When you grant photo access and initiate a discovery scan:
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>100% On-Device ML:</Text> Text recognition runs locally using Google ML Kit. No raw image bytes, pixels, or extracted strings ever leave your device.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Immediate Memory Release:</Text> Non-document images are immediately cleared from volatile RAM upon classification.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Read-Only Access:</Text> Your photo gallery is strictly read-only. We never modify, delete, rename, or overwrite original photos.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. Target Document Discovery</Text>
        <Text style={styles.paragraph}>
          The app specifically searches for personal documents with expiry or renewal timelines:
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Passports & Visas:</Text> Extracts MRZ codes, passport numbers, and expiry dates.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Driving Licences:</Text> Identifies state/national licence numbers and validity dates.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Insurance Documents:</Text> Identifies Motor, Health, Life, and General Insurance policies, policy numbers, and renewal due dates.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Consent-Based Document Vault</Text>
        <Text style={styles.paragraph}>
          Scanning your photos never automatically stores documents into your vault.
          Detected items are placed in a temporary Review Queue. Only documents you explicitly approve
          are written to the app&rsquo;s local SQLite database.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Local Notification Reminders</Text>
        <Text style={styles.paragraph}>
          Renewal and expiry reminders are scheduled directly with your device&rsquo;s local operating system
          notification manager. No third-party push notification services or remote notification tokens are utilized.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>6. Zero Geolocation Tracking</Text>
        <Text style={styles.paragraph}>
          Trouvé DocDue intentionally does not request or use ACCESS_MEDIA_LOCATION. We do not track, read,
          or record where your photos were captured.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>7. Complete Data Erasure & Ownership</Text>
        <Text style={styles.paragraph}>
          You maintain full ownership of your data:
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Export:</Text> Export all saved records at any time as JSON via Settings.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Clear Cache:</Text> Discard unapproved candidate documents with one tap.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Wipe Everything:</Text> Permanently erase all database records, attachments, and settings in Settings.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>8. Terms & Conditions</Text>
        <Text style={styles.paragraph}>
          Use of this application is also governed by our Terms and Conditions.
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/terms' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}
        >
          <Text style={{ color: Colors.primaryLight, fontWeight: '600', fontSize: 14 }}>
            Read Terms & Conditions
          </Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primaryLight} />
        </TouchableOpacity>
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
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  webLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginTop: Spacing.md,
  },
  webLinkText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
  },
  guaranteeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: Spacing.lg,
  },
  guaranteeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  guaranteeTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.success,
  },
  guaranteeBody: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  bullet: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
    paddingLeft: Spacing.sm,
  },
  bold: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
});
