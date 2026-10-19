import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { acceptTermsAndPrivacy } from '../../services/privacy/consentService';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { Button } from './Button';

interface ConsentGateModalProps {
  visible: boolean;
  onAgree: () => void;
}

export function ConsentGateModal({ visible, onAgree }: ConsentGateModalProps) {
  const router = useRouter();
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  const canProceed = agreedPrivacy && agreedTerms;

  const handleAgreeAndContinue = async () => {
    if (!canProceed) return;
    setSaving(true);
    try {
      await acceptTermsAndPrivacy();
      onAgree();
    } catch (e) {
      console.error('[ConsentGate] Error saving consent:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Icon & Title */}
            <View style={styles.header}>
              <View style={styles.shieldIconWrap}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.success} />
              </View>
              <Text style={styles.modalTitle}>Before You Begin</Text>
              <Text style={styles.modalSubtitle}>
                Please review and agree to our Privacy Policy and Terms &amp; Conditions to access Trouvé DocDue features.
              </Text>
            </View>

            {/* Zero-Storage Highlight Box */}
            <View style={styles.pledgeBox}>
              <View style={styles.pledgeRow}>
                <Ionicons name="lock-closed" size={16} color={Colors.success} />
                <Text style={styles.pledgeTitle}>100% On-Device &bull; Zero External Storage</Text>
              </View>
              <Text style={styles.pledgeText}>
                Photos are never uploaded to any cloud server. OCR runs locally, and only documents you explicitly approve are saved into your private local vault.
              </Text>
            </View>

            {/* Checkbox 1: Privacy Policy */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAgreedPrivacy(!agreedPrivacy)}
              style={[styles.consentItem, agreedPrivacy && styles.consentItemActive]}
            >
              <View style={[styles.checkbox, agreedPrivacy && styles.checkboxActive]}>
                {agreedPrivacy && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
              </View>
              <View style={styles.consentTextWrap}>
                <Text style={styles.consentItemTitle}>
                  I agree to the <Text style={styles.highlightText}>Privacy Policy</Text>
                </Text>
                <Text style={styles.consentItemDescription}>
                  Covers on-device ML Kit OCR, read-only gallery access, zero cloud storage, and local reminders.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/privacy-policy')}
                  style={styles.inlineLinkRow}
                >
                  <Text style={styles.inlineLink}>Read Privacy Policy</Text>
                  <Ionicons name="open-outline" size={12} color={Colors.primaryLight} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Checkbox 2: Terms & Conditions */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setAgreedTerms(!agreedTerms)}
              style={[styles.consentItem, agreedTerms && styles.consentItemActive]}
            >
              <View style={[styles.checkbox, agreedTerms && styles.checkboxActive]}>
                {agreedTerms && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
              </View>
              <View style={styles.consentTextWrap}>
                <Text style={styles.consentItemTitle}>
                  I agree to the <Text style={styles.highlightText}>Terms &amp; Conditions</Text>
                </Text>
                <Text style={styles.consentItemDescription}>
                  Acknowledges that OCR is an assistive tool and I must review and verify all detected dates before relying on reminders.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/terms' as any)}
                  style={styles.inlineLinkRow}
                >
                  <Text style={styles.inlineLink}>Read Terms &amp; Conditions</Text>
                  <Ionicons name="open-outline" size={12} color={Colors.primaryLight} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Action Button */}
            <Button
              title="Agree &amp; Continue"
              icon="arrow-forward"
              size="lg"
              disabled={!canProceed || saving}
              onPress={handleAgreeAndContinue}
              style={[styles.submitButton, !canProceed && styles.submitButtonDisabled]}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  shieldIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  pledgeBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: Spacing.md,
  },
  pledgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pledgeTitle: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.success,
  },
  pledgeText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.md,
  },
  consentItemActive: {
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
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
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  consentTextWrap: {
    flex: 1,
  },
  consentItemTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  highlightText: {
    color: Colors.primaryLight,
  },
  consentItemDescription: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  inlineLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineLink: {
    ...Typography.caption,
    color: Colors.primaryLight,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
