import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ScanCandidate } from '../../types/scan';
import { SavedRecord } from '../../types/record';
import { DocumentCategory, DocumentType, CATEGORIES, CandidateDate } from '../../types/document';
import { STANDARD_REMINDER_OFFSETS } from '../../types/reminder';
import { getCandidateById, updateCandidateReviewStatus, deleteCandidate } from '../../services/storage/candidatesRepo';
import { createRecord, getRecordById, updateRecord } from '../../services/storage/recordsRepo';
import { saveAttachment } from '../../services/storage/attachmentsRepo';
import { scheduleRemindersForRecord } from '../../services/notifications/reminderService';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { ConfidencePill } from '../../components/common/ConfidencePill';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export default function ReviewCandidateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [candidate, setCandidate] = useState<ScanCandidate | null>(null);
  const [duplicateRecord, setDuplicateRecord] = useState<SavedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [docType, setDocType] = useState<DocumentType>('other_document');
  const [provider, setProvider] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Reminder toggles (default: 30d, 7d, 0d)
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([30, 7, 0]);

  // Keep image copy in app
  const [keepAttachment, setKeepAttachment] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const item = await getCandidateById(id);
        if (item) {
          setCandidate(item);
          setTitle(item.title);
          setCategory(item.category);
          setDocType(item.documentType);
          setProvider(item.extractedFields.provider || '');
          setReferenceNumber(item.extractedFields.referenceNumber || '');
          setHolderName(item.extractedFields.holderName || '');
          setExpiryDate(item.extractedFields.expiryDate || '');
          setRenewalDate(item.extractedFields.renewalDate || '');
          setVehicleRegNumber(item.extractedFields.vehicleRegNumber || '');
          setNotes(item.extractedFields.notes || '');

          if (item.duplicateOfRecordId) {
            const dup = await getRecordById(item.duplicateOfRecordId);
            if (dup) setDuplicateRecord(dup);
          }
        }
      } catch (e) {
        console.error('[ReviewDetail] Load error:', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const toggleOffset = (offset: number) => {
    setSelectedOffsets((prev) =>
      prev.includes(offset) ? prev.filter((o) => o !== offset) : [...prev, offset]
    );
  };

  const handleApplyCandidateDate = (cd: CandidateDate, targetField: 'expiry' | 'renewal') => {
    if (targetField === 'expiry') {
      setExpiryDate(cd.date);
    } else {
      setRenewalDate(cd.date);
    }
  };

  const handleSaveRecord = async (overrideExistingId?: string) => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please provide a document title.');
      return;
    }

    setSaving(true);
    try {
      const recordId = overrideExistingId || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let attachmentPath: string | null = null;

      // Copy image into private app storage only if user checked "Keep a copy in the app"
      if (keepAttachment && candidate?.sourceAssetUri) {
        try {
          attachmentPath = await saveAttachment(recordId, candidate.sourceAssetUri);
        } catch (e) {
          console.warn('[ReviewDetail] Could not save attachment copy:', e);
        }
      }

      let savedRecord: SavedRecord;
      if (overrideExistingId) {
        const updated = await updateRecord(overrideExistingId, {
          title: title.trim(),
          category,
          documentType: docType,
          provider: provider.trim() || null,
          referenceNumber: referenceNumber.trim() || null,
          holderName: holderName.trim() || null,
          expiryDate: expiryDate.trim() || null,
          renewalDate: renewalDate.trim() || null,
          vehicleRegNumber: vehicleRegNumber.trim() || null,
          notes: notes.trim() || null,
          attachmentPath: attachmentPath || undefined,
        });
        savedRecord = updated!;
      } else {
        savedRecord = await createRecord({
          id: recordId,
          title: title.trim(),
          category,
          documentType: docType,
          provider: provider.trim() || null,
          referenceNumber: referenceNumber.trim() || null,
          holderName: holderName.trim() || null,
          issueDate: candidate?.extractedFields.issueDate || null,
          startDate: candidate?.extractedFields.startDate || null,
          expiryDate: expiryDate.trim() || null,
          renewalDate: renewalDate.trim() || null,
          purchaseDate: candidate?.extractedFields.purchaseDate || null,
          warrantyEndDate: candidate?.extractedFields.warrantyEndDate || null,
          vehicleRegNumber: vehicleRegNumber.trim() || null,
          notes: notes.trim() || null,
          sourceType: 'gallery_scan',
          sourceAssetId: candidate?.sourceAssetIdentifier || null,
          attachmentPath,
          status: 'active',
        });
      }

      // Schedule user-selected local notification reminders
      if (expiryDate || renewalDate) {
        await scheduleRemindersForRecord(savedRecord, selectedOffsets);
      }

      // Mark candidate approved & cleanup
      if (candidate) {
        await updateCandidateReviewStatus(candidate.id, 'imported');
        await deleteCandidate(candidate.id);
      }

      Alert.alert(
        'Document Imported',
        `"${savedRecord.title}" has been saved to your records. Reminders have been scheduled.`,
        [
          {
            text: 'View Record',
            onPress: () => router.replace(`/records/${savedRecord.id}`),
          },
          {
            text: 'Review Next',
            onPress: () => router.replace('/review'),
          },
        ]
      );
    } catch (e: any) {
      console.error('[ReviewDetail] Save error:', e);
      Alert.alert('Save Failed', e?.message || 'Could not save record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async () => {
    if (!candidate) return;
    Alert.alert(
      'Ignore This Photo?',
      'This will dismiss the detected candidate. Your original photo in your gallery will remain completely untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ignore Photo',
          style: 'destructive',
          onPress: async () => {
            await deleteCandidate(candidate.id);
            router.replace('/review');
          },
        },
      ]
    );
  };

  if (loading || !candidate) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading document details...</Text>
      </View>
    );
  }

  const categoryMeta = CATEGORIES[category] || CATEGORIES.other;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Photo Preview & Source Metadata */}
      <View style={styles.imageCard}>
        {candidate.sourceAssetUri &&
        !candidate.sourceAssetUri.toLowerCase().endsWith('.pdf') &&
        !candidate.title.toLowerCase().endsWith('.pdf') ? (
          <Image
            source={{ uri: candidate.sourceAssetUri }}
            style={styles.sourceImage}
            contentFit="contain"
          />
        ) : (
          <View style={[styles.sourceImage, styles.imagePlaceholder]}>
            <Ionicons name="document-text" size={56} color={Colors.primaryLight} />
            <Text style={{ color: '#94A3B8', marginTop: 8, fontSize: 13, fontWeight: '600' }}>
              PDF Document
            </Text>
          </View>
        )}

        <View style={styles.imageOverlay}>
          <ConfidencePill score={candidate.confidenceScores.overall} />
          <Badge label={categoryMeta.label} variant="primary" />
        </View>
      </View>

      {/* Duplicate Alert & Comparison (if found) */}
      {duplicateRecord && (
        <View style={styles.duplicateAlertBox}>
          <View style={styles.duplicateHeader}>
            <Ionicons name="alert-circle" size={20} color={Colors.warning} />
            <Text style={styles.duplicateTitle}>Possible Duplicate Detected</Text>
          </View>
          <Text style={styles.duplicateDesc}>
            {candidate.duplicateReason || 'A similar document already exists in your saved records:'}
          </Text>
          <View style={styles.existingRecordCard}>
            <Text style={styles.existingRecordTitle}>{duplicateRecord.title}</Text>
            <Text style={styles.existingRecordMeta}>
              Category: {duplicateRecord.category} • Expiry: {duplicateRecord.expiryDate || 'N/A'}
            </Text>
          </View>
          <View style={styles.duplicateActionsRow}>
            <Button
              title="Update Existing"
              variant="secondary"
              size="sm"
              onPress={() => handleSaveRecord(duplicateRecord.id)}
              style={{ flex: 1 }}
            />
            <Button
              title="Save as New"
              variant="outline"
              size="sm"
              onPress={() => handleSaveRecord()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      {/* Candidate Dates Quick-Select Bar */}
      {candidate.candidateDates.length > 0 && (
        <View style={styles.candidateDatesBox}>
          <Text style={styles.sectionTitle}>Detected Dates from Photo</Text>
          <Text style={styles.candidateDatesHint}>
            Tap a date below to set as Expiry or Renewal:
          </Text>
          <View style={styles.candidateDateList}>
            {candidate.candidateDates.map((cd, idx) => (
              <View key={`${cd.date}_${idx}`} style={styles.candidateDateItem}>
                <View style={styles.candidateDateTextWrap}>
                  <Text style={styles.candidateDateIso}>{cd.date}</Text>
                  <Text style={styles.candidateDateLabel}>
                    {cd.label} ({Math.round(cd.confidence * 100)}%)
                    {cd.isAmbiguous ? ' • Ambiguous format' : ''}
                  </Text>
                </View>

                <View style={styles.candidateDateBtns}>
                  <TouchableOpacity
                    onPress={() => handleApplyCandidateDate(cd, 'expiry')}
                    style={[styles.applyDateBtn, expiryDate === cd.date && styles.applyDateBtnActive]}
                  >
                    <Text style={styles.applyDateBtnText}>Set Expiry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleApplyCandidateDate(cd, 'renewal')}
                    style={[styles.applyDateBtn, renewalDate === cd.date && styles.applyDateBtnActive]}
                  >
                    <Text style={styles.applyDateBtnText}>Set Renewal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Editable Fields Form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Document Details</Text>

        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Display Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Passport, Motor Insurance"
            placeholderTextColor="#64748B"
            style={styles.input}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPickerRow}>
            {(Object.keys(CATEGORIES) as DocumentCategory[]).map((catKey) => {
              const cat = CATEGORIES[catKey];
              const isSelected = category === catKey;
              return (
                <TouchableOpacity
                  key={catKey}
                  onPress={() => setCategory(catKey)}
                  style={[styles.catChip, isSelected && { backgroundColor: cat.color, borderColor: cat.color }]}
                >
                  <Text style={[styles.catChipText, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Expiry Date */}
        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Expiry Date (YYYY-MM-DD)</Text>
            <TextInput
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="2028-12-31"
              placeholderTextColor="#64748B"
              style={styles.input}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Renewal Date (YYYY-MM-DD)</Text>
            <TextInput
              value={renewalDate}
              onChangeText={setRenewalDate}
              placeholder="2027-06-15"
              placeholderTextColor="#64748B"
              style={styles.input}
            />
          </View>
        </View>

        {/* Provider */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Issuing Organization / Provider</Text>
          <TextInput
            value={provider}
            onChangeText={setProvider}
            placeholder="e.g. Passport Office, HDFC ERGO"
            placeholderTextColor="#64748B"
            style={styles.input}
          />
        </View>

        {/* Reference / Policy Number */}
        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Policy / Reference #</Text>
            <TextInput
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="e.g. POL-8392019"
              placeholderTextColor="#64748B"
              style={styles.input}
            />
          </View>

          {/* Vehicle Reg (if vehicle) */}
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Vehicle Reg #</Text>
            <TextInput
              value={vehicleRegNumber}
              onChangeText={setVehicleRegNumber}
              placeholder="e.g. DL01AB1234"
              placeholderTextColor="#64748B"
              style={styles.input}
            />
          </View>
        </View>

        {/* Holder Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Holder / Insured Name</Text>
          <TextInput
            value={holderName}
            onChangeText={setHolderName}
            placeholder="e.g. John Doe"
            placeholderTextColor="#64748B"
            style={styles.input}
          />
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notes / Ambiguities</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes"
            placeholderTextColor="#64748B"
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={2}
          />
        </View>
      </View>

      {/* Reminder Schedule Section */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Reminders & Alerts</Text>
        <Text style={styles.candidateDatesHint}>
          Select when to receive local reminder alerts before expiry:
        </Text>

        <View style={styles.offsetChipRow}>
          {STANDARD_REMINDER_OFFSETS.map((off) => {
            const isSelected = selectedOffsets.includes(off.days);
            return (
              <TouchableOpacity
                key={off.days}
                onPress={() => toggleOffset(off.days)}
                style={[styles.offsetChip, isSelected && styles.offsetChipActive]}
              >
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#94A3B8'}
                />
                <Text style={[styles.offsetChipText, isSelected && styles.offsetChipTextActive]}>
                  {off.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Attachment Option */}
      <View style={styles.attachmentCard}>
        <View style={styles.attachmentTextWrap}>
          <Text style={styles.attachmentTitle}>Keep a copy in the app</Text>
          <Text style={styles.attachmentSubtitle}>
            Copy photo into private app storage. By default, only extracted metadata is saved.
          </Text>
        </View>
        <Switch
          value={keepAttachment}
          onValueChange={setKeepAttachment}
          trackColor={{ false: '#334155', true: Colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Explicit Consent Declaration */}
      <View style={styles.consentBox}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primaryLight} />
        <Text style={styles.consentDeclarationText}>
          Importing will save these verified details to your local database and schedule your chosen
          reminders. Your original photo in your gallery remains unchanged.
        </Text>
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <Button
          title="Save Record"
          icon="checkmark-outline"
          size="lg"
          loading={saving}
          onPress={() => handleSaveRecord()}
          style={styles.saveBtn}
        />

        <Button
          title="Ignore This Photo"
          variant="ghost"
          size="md"
          onPress={handleDismiss}
          style={styles.dismissBtn}
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
    paddingBottom: Spacing.xxxl,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
  },
  imageCard: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  sourceImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.cardElevated,
  },
  imageOverlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duplicateAlertBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.warning,
    marginBottom: Spacing.lg,
  },
  duplicateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  duplicateTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.warning,
  },
  duplicateDesc: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  existingRecordCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  existingRecordTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  existingRecordMeta: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  duplicateActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  candidateDatesBox: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  candidateDatesHint: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  candidateDateList: {
    gap: Spacing.sm,
  },
  candidateDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  candidateDateTextWrap: {
    flex: 1,
  },
  candidateDateIso: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  candidateDateLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  candidateDateBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  applyDateBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  applyDateBtnActive: {
    backgroundColor: Colors.primary,
  },
  applyDateBtnText: {
    ...Typography.caption,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  fieldLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.dark.inputBackground,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    fontSize: 14,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  categoryPickerRow: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark.cardElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  catChipText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  offsetChipRow: {
    gap: Spacing.sm,
  },
  offsetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dark.cardElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  offsetChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  offsetChipText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
  },
  offsetChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  attachmentTextWrap: {
    flex: 1,
    marginRight: Spacing.md,
  },
  attachmentTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  attachmentSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  consentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  consentDeclarationText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  actionButtonsRow: {
    gap: Spacing.sm,
  },
  saveBtn: {
    width: '100%',
  },
  dismissBtn: {
    width: '100%',
  },
});
