import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { RecordWithUrgency } from '../../types/record';
import { ReminderRule } from '../../types/reminder';
import { CATEGORIES } from '../../types/document';
import { getRecordById, deleteRecord } from '../../services/storage/recordsRepo';
import { getReminderRulesForRecord } from '../../services/storage/remindersRepo';
import { cancelRemindersForRecord } from '../../services/notifications/reminderService';
import { deleteAttachment } from '../../services/storage/attachmentsRepo';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { DateBadge } from '../../components/common/DateBadge';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [record, setRecord] = useState<RecordWithUrgency | null>(null);
  const [reminders, setReminders] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [rec, rules] = await Promise.all([
          getRecordById(id),
          getReminderRulesForRecord(id),
        ]);
        setRecord(rec);
        setReminders(rules);
      } catch (e) {
        console.error('[RecordDetail] Error loading record:', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const handleDelete = () => {
    if (!record) return;

    Alert.alert(
      'Delete Document Record?',
      `Are you sure you want to delete "${record.title}"? All scheduled reminders and local attachments will be removed. Your original gallery photo remains safe.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRemindersForRecord(record.id);
              await deleteAttachment(record.id);
              await deleteRecord(record.id);
              Alert.alert('Deleted', 'Document record removed.');
              router.replace('/(tabs)/records');
            } catch (e: any) {
              Alert.alert('Delete Failed', e?.message);
            }
          },
        },
      ]
    );
  };

  if (loading || !record) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading document details...</Text>
      </View>
    );
  }

  const categoryMeta = CATEGORIES[record.category] || CATEGORIES.other;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Info Card */}
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <View style={[styles.categoryIconWrap, { backgroundColor: `${categoryMeta.color}20` }]}>
            <Ionicons name="document-text" size={24} color={categoryMeta.color} />
          </View>
          <View style={styles.titleTextWrap}>
            <Text style={styles.title}>{record.title}</Text>
            <Text style={styles.categoryLabel}>{categoryMeta.label}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <DateBadge
            targetDate={record.effectiveTargetDate}
            urgency={record.urgency}
            daysRemaining={record.daysRemaining}
          />
          <Badge
            label={record.sourceType === 'gallery_scan' ? 'Gallery Scan' : record.sourceType === 'photo_picker' ? 'Photo Picker' : 'Manual Entry'}
            variant="neutral"
          />
        </View>
      </View>

      {/* Attachment Preview (if saved) */}
      {record.attachmentPath && (
        <View style={styles.attachmentCard}>
          <Text style={styles.sectionHeading}>Saved Document Copy</Text>
          <Image
            source={{ uri: record.attachmentPath }}
            style={styles.attachmentImage}
            contentFit="contain"
          />
        </View>
      )}

      {/* Extracted Details Grid */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionHeading}>Document Information</Text>

        {record.provider && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider / Authority</Text>
            <Text style={styles.detailValue}>{record.provider}</Text>
          </View>
        )}

        {record.referenceNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference / Policy #</Text>
            <Text style={[styles.detailValue, styles.monoValue]}>{record.referenceNumber}</Text>
          </View>
        )}

        {record.vehicleRegNumber && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle Reg #</Text>
            <Text style={[styles.detailValue, styles.monoValue]}>{record.vehicleRegNumber}</Text>
          </View>
        )}

        {record.holderName && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Holder / Insured Name</Text>
            <Text style={styles.detailValue}>{record.holderName}</Text>
          </View>
        )}

        {record.issueDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Issue Date</Text>
            <Text style={styles.detailValue}>{record.issueDate}</Text>
          </View>
        )}

        {record.expiryDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expiry Date</Text>
            <Text style={[styles.detailValue, { color: Colors.primaryLight, fontWeight: '700' }]}>
              {record.expiryDate}
            </Text>
          </View>
        )}

        {record.renewalDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Renewal Date</Text>
            <Text style={[styles.detailValue, { color: Colors.warning, fontWeight: '700' }]}>
              {record.renewalDate}
            </Text>
          </View>
        )}

        {record.notes && (
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Notes</Text>
            <Text style={styles.detailValue}>{record.notes}</Text>
          </View>
        )}
      </View>

      {/* Scheduled Reminders Section */}
      <View style={styles.remindersCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Scheduled Reminders</Text>
          <Ionicons name="notifications-outline" size={18} color={Colors.primaryLight} />
        </View>

        {reminders.length === 0 ? (
          <Text style={styles.noRemindersText}>No notification reminders scheduled.</Text>
        ) : (
          reminders.map((r) => (
            <View key={r.id} style={styles.reminderItem}>
              <Ionicons
                name={r.enabled ? 'notifications' : 'notifications-off'}
                size={16}
                color={r.enabled ? Colors.primaryLight : '#64748B'}
              />
              <Text style={styles.reminderLabel}>
                {r.offsetDays === 0 ? 'On expiry date' : `${r.offsetDays} days before expiry`}
              </Text>
              <Badge
                label={r.enabled ? 'Active' : 'Disabled'}
                variant={r.enabled ? 'success' : 'neutral'}
                size="sm"
              />
            </View>
          ))
        )}
      </View>

      {/* Delete Record Action */}
      <Button
        title="Delete Record"
        icon="trash-outline"
        variant="danger"
        onPress={handleDelete}
        style={styles.deleteBtn}
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
  headerCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  titleTextWrap: {
    flex: 1,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  categoryLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  attachmentCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  detailsCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  sectionHeading: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.borderSubtle,
  },
  detailLabel: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.dark.text,
    flex: 1,
    textAlign: 'right',
  },
  monoValue: {
    fontFamily: 'monospace',
  },
  remindersCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xl,
  },
  noRemindersText: {
    ...Typography.bodySmall,
    color: Colors.dark.textMuted,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.borderSubtle,
  },
  reminderLabel: {
    ...Typography.bodySmall,
    color: Colors.dark.text,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  deleteBtn: {
    marginTop: Spacing.sm,
  },
});
