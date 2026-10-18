import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordWithUrgency } from '../../types/record';
import { CATEGORIES } from '../../types/document';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { DateBadge } from './DateBadge';

interface RecordCardProps {
  record: RecordWithUrgency;
  onPress: () => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({ record, onPress }) => {
  const categoryMeta = CATEGORIES[record.category] || CATEGORIES.other;

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <View style={[styles.categoryIconWrap, { backgroundColor: `${categoryMeta.color}20` }]}>
            <Ionicons name="document-text" size={16} color={categoryMeta.color} />
          </View>
          <View style={styles.titleTextWrap}>
            <Text style={styles.title} numberOfLines={1}>
              {record.title}
            </Text>
            {record.provider && (
              <Text style={styles.provider} numberOfLines={1}>
                {record.provider}
              </Text>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      </View>

      <View style={styles.bottomRow}>
        <DateBadge
          targetDate={record.effectiveTargetDate}
          urgency={record.urgency}
          daysRemaining={record.daysRemaining}
        />

        {record.referenceNumber && (
          <Text style={styles.refText} numberOfLines={1}>
            #{record.referenceNumber}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  titleTextWrap: {
    flex: 1,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  provider: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    fontFamily: 'monospace',
  },
});
