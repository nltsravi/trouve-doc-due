import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../theme/colors';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={40} color={Colors.success} />
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>Last updated: October 2026</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Privacy-First Architecture</Text>
        <Text style={styles.paragraph}>
          {'Trouvé DocDue ("we", "our", or "the app") was engineered from the ground up with local-only processing principles. We do not operate an application backend, user accounts, remote databases, or cloud analytics. All personal data remains exclusively on your device.'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. On-Device OCR & Document Discovery</Text>
        <Text style={styles.paragraph}>
          When you explicitly trigger a discovery scan, the app accesses images in your device photo library
          using platform-supported APIs (Apple Photos Framework on iOS, Scoped Storage Photo Picker on Android).
        </Text>
        <Text style={styles.paragraph}>
          Optical Character Recognition (OCR) and document classification are executed 100% on-device
          using local machine learning libraries (Google ML Kit). No image bytes, extracted text, or document
          contents are ever transmitted to any external server or cloud AI service.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. Consent-Based Data Storage</Text>
        <Text style={styles.paragraph}>
          {"Scanning your photos never automatically creates records or schedules reminders. Detected documents are held in temporary local cache until you review and explicitly approve them. Only approved documents are written to the app's local SQLite database."}
        </Text>
        <Text style={styles.paragraph}>
          {'By default, the app saves only extracted metadata (such as document title, provider, and expiry date). Original images in your gallery are never deleted, moved, modified, or overwritten. An optional image copy is saved in app-private storage only if you explicitly toggle "Keep a copy in the app".'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Local Notification Reminders</Text>
        <Text style={styles.paragraph}>
          {"Renewal and expiry reminders are scheduled directly with your device's local operating system notification manager. No third-party push notification services or remote notification tokens are utilized."}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Data Portability & Complete Erasure</Text>
        <Text style={styles.paragraph}>
          You maintain full ownership and control over your data:
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Export:</Text> You can export all your saved records at any time as standard JSON.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Clear Temporary Data:</Text> You can discard unapproved scan candidates at any time.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Complete Erasure:</Text> You can permanently wipe all records, attachments, and the local database with one tap in Settings.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>6. Third-Party Trackers & Advertising</Text>
        <Text style={styles.paragraph}>
          Trouvé DocDue contains zero third-party advertising SDKs, zero user tracking SDKs, and zero telemetry frameworks.
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
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginTop: Spacing.sm,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 4,
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
