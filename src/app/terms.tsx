import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

const HOSTED_TERMS_URL = 'https://nltsravi.github.io/trouve-doc-due/terms.html';

export default function TermsScreen() {
  const handleOpenHosted = async () => {
    try {
      await WebBrowser.openBrowserAsync(HOSTED_TERMS_URL);
    } catch {
      await Linking.openURL(HOSTED_TERMS_URL).catch(() => {});
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-text" size={36} color={Colors.primaryLight} />
        </View>
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.subtitle}>Effective Date: October 2026 • Version 1.0</Text>

        <TouchableOpacity activeOpacity={0.8} onPress={handleOpenHosted} style={styles.webLinkBtn}>
          <Ionicons name="globe-outline" size={16} color={Colors.primaryLight} />
          <Text style={styles.webLinkText}>View on GitHub Pages</Text>
          <Ionicons name="open-outline" size={14} color={Colors.primaryLight} />
        </TouchableOpacity>
      </View>

      {/* Verification Warning Box */}
      <View style={styles.warningCard}>
        <View style={styles.warningHeaderRow}>
          <Ionicons name="alert-circle" size={20} color={Colors.warning} />
          <Text style={styles.warningTitle}>User Verification Required</Text>
        </View>
        <Text style={styles.warningBody}>
          Trouvé DocDue provides on-device Optical Character Recognition (OCR) as an assistive convenience tool.
          OCR results may occasionally misread characters, fold creases, or unusual fonts. You must always review and verify
          all extracted dates, policy numbers, and document details before relying on them for renewals.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By installing, opening, or utilizing the Trouvé DocDue mobile application (&ldquo;the App&rdquo;),
          you agree to be legally bound by these Terms and Conditions (&ldquo;Terms&rdquo;) and our Privacy Policy.
        </Text>
        <Text style={styles.paragraph}>
          Before accessing document discovery or whole-gallery scanning features, you must review and explicitly agree to these Terms.
          If you do not agree to these Terms, you may not use the App.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Description of the Service</Text>
        <Text style={styles.paragraph}>
          Trouvé DocDue is an offline mobile productivity tool designed to help you locate important personal documents
          (such as passports, driving licences, motor/health/life insurance policies, and vehicle registrations)
          that already exist on your phone, extract renewal dates locally, and schedule local expiry reminders.
        </Text>
        <Text style={styles.paragraph}>
          All text recognition and document classification execute exclusively on your device hardware without transmitting data to any remote servers.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. OCR Accuracy & Limitations</Text>
        <Text style={styles.paragraph}>
          Optical Character Recognition and machine learning heuristics are inherently probabilistic:
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>No Guarantee of Completeness:</Text> We do not warrant that all documents in your library will be discovered or that every field will be detected.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Review Responsibility:</Text> You are required to review extracted dates and policy details in the Review Queue prior to approving them into your vault.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Manual Edits:</Text> You have full ability to correct or manually enter document information at any time.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted under applicable law, the authors, developers, and contributors of Trouvé DocDue shall not be held liable for:
        </Text>
        <Text style={styles.bullet}>
          • Any missed renewals, policy lapses, coverage cancellations, or reinstatement fees;
        </Text>
        <Text style={styles.bullet}>
          • Fines, traffic tickets, or legal penalties resulting from expired driving licences, permits, or vehicle registrations;
        </Text>
        <Text style={styles.bullet}>
          • Travel disruptions, border delays, or visa denials resulting from passport expiry;
        </Text>
        <Text style={styles.bullet}>
          • Delayed or suppressed notifications caused by device battery optimizations, OS doze modes, or notification settings.
        </Text>
        <Text style={[styles.paragraph, { marginTop: 8 }]}>
          The App is an assistive reminder aid and does not substitute for your own calendar vigilance or legal obligations.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Read-Only Gallery Guarantee</Text>
        <Text style={styles.paragraph}>
          The App requests read-only photo library access. Trouvé DocDue will never delete, move, alter, or overwrite your original photographs.
          Non-document photos evaluated during a discovery scan are released from device RAM immediately.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>6. Intellectual Property & License</Text>
        <Text style={styles.paragraph}>
          We grant you a personal, non-exclusive, revocable, non-transferable license to use the App for personal document tracking.
          You retain all right, title, and interest in and to your personal documents, photos, and records.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>7. Termination & Complete Erasure</Text>
        <Text style={styles.paragraph}>
          You may terminate your agreement with these Terms at any time by wiping your data using the &ldquo;Erase All App Data&rdquo; button in Settings and uninstalling the App.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>8. Contact & Open Source</Text>
        <Text style={styles.paragraph}>
          Trouvé DocDue is developed as an open source privacy-first project. For inquiries or questions regarding these Terms:
        </Text>
        <Text style={styles.paragraph}>
          GitHub:{' '}
          <Text style={{ color: Colors.primaryLight }} onPress={handleOpenHosted}>
            https://github.com/nltsravi/trouve-doc-due
          </Text>
        </Text>
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
    backgroundColor: Colors.primaryGhost,
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
    borderColor: Colors.dark.border,
    marginTop: Spacing.md,
  },
  webLinkText: {
    ...Typography.caption,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: Spacing.lg,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  warningTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.warning,
  },
  warningBody: {
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
