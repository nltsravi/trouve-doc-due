import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DocumentCategory, DocumentType, CATEGORIES } from '../../types/document';
import { STANDARD_REMINDER_OFFSETS } from '../../types/reminder';
import { createRecord } from '../../services/storage/recordsRepo';
import { scheduleRemindersForRecord } from '../../services/notifications/reminderService';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { Button } from '../../components/common/Button';

export default function NewRecordScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('identity_travel');
  const [docType, setDocType] = useState<DocumentType>('passport');
  const [provider, setProvider] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Default reminder offsets: 30d, 7d, 0d
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([30, 7, 0]);
  const [saving, setSaving] = useState(false);

  const toggleOffset = (offset: number) => {
    setSelectedOffsets((prev) =>
      prev.includes(offset) ? prev.filter((o) => o !== offset) : [...prev, offset]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for this document.');
      return;
    }

    // Validate ISO date format if entered
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (expiryDate.trim() && !dateRegex.test(expiryDate.trim())) {
      Alert.alert('Invalid Date Format', 'Please enter expiry date as YYYY-MM-DD (e.g. 2028-12-31).');
      return;
    }
    if (renewalDate.trim() && !dateRegex.test(renewalDate.trim())) {
      Alert.alert('Invalid Date Format', 'Please enter renewal date as YYYY-MM-DD (e.g. 2027-06-15).');
      return;
    }

    setSaving(true);
    try {
      const recordId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const savedRecord = await createRecord({
        id: recordId,
        title: title.trim(),
        category,
        documentType: docType,
        provider: provider.trim() || null,
        referenceNumber: referenceNumber.trim() || null,
        holderName: holderName.trim() || null,
        issueDate: null,
        startDate: null,
        expiryDate: expiryDate.trim() || null,
        renewalDate: renewalDate.trim() || null,
        purchaseDate: null,
        warrantyEndDate: null,
        vehicleRegNumber: vehicleRegNumber.trim() || null,
        notes: notes.trim() || null,
        sourceType: 'manual',
        sourceAssetId: null,
        attachmentPath: null,
        status: 'active',
      });

      if (expiryDate || renewalDate) {
        await scheduleRemindersForRecord(savedRecord, selectedOffsets);
      }

      Alert.alert('Document Saved', `"${savedRecord.title}" has been saved.`, [
        {
          text: 'OK',
          onPress: () => router.replace(`/records/${savedRecord.id}`),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerBox}>
        <Ionicons name="create-outline" size={32} color={Colors.primaryLight} />
        <Text style={styles.screenTitle}>Manual Document Entry</Text>
        <Text style={styles.screenSubtitle}>
          Add a document directly without scanning your photo gallery.
        </Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Document Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Passport, Driving Licence, Car Insurance"
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
                  onPress={() => {
                    setCategory(catKey);
                    const defaultTypes: Record<DocumentCategory, DocumentType> = {
                      identity_travel: 'passport',
                      insurance_finance: 'motor_insurance',
                      vehicles: 'vehicle_registration',
                      personal_professional: 'professional_licence',
                      purchases_warranties: 'product_warranty',
                      other: 'other_document',
                    };
                    setDocType(defaultTypes[catKey] || 'other_document');
                  }}
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

        {/* Expiry & Renewal Dates */}
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
          <Text style={styles.fieldLabel}>Issuing Provider / Authority</Text>
          <TextInput
            value={provider}
            onChangeText={setProvider}
            placeholder="e.g. Passport Office, State Farm, RTO"
            placeholderTextColor="#64748B"
            style={styles.input}
          />
        </View>

        {/* Reference Number & Vehicle Reg */}
        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Policy / Document #</Text>
            <TextInput
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="e.g. DL-12345678"
              placeholderTextColor="#64748B"
              style={styles.input}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Vehicle Reg # (if applicable)</Text>
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
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes or details"
            placeholderTextColor="#64748B"
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={2}
          />
        </View>
      </View>

      {/* Reminder Offsets */}
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Renewal Reminders</Text>
        <Text style={styles.reminderSubtitle}>Choose when to be alerted before expiry:</Text>
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

      <Button
        title="Save Document"
        icon="checkmark-outline"
        size="lg"
        loading={saving}
        onPress={handleSave}
        style={styles.saveBtn}
      />
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
  headerBox: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  screenTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  screenSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
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
    marginBottom: 4,
  },
  reminderSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
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
  saveBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
