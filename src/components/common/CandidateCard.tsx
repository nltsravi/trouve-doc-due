import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { ScanCandidate } from '../../types/scan';
import { CATEGORIES } from '../../types/document';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { ConfidencePill } from './ConfidencePill';
import { Badge } from './Badge';

interface CandidateCardProps {
  candidate: ScanCandidate;
  onPress: () => void;
  onDismiss?: () => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onPress,
  onDismiss,
}) => {
  const categoryMeta = CATEGORIES[candidate.category] || CATEGORIES.other;
  const targetDate = candidate.extractedFields.expiryDate || candidate.extractedFields.renewalDate || candidate.extractedFields.warrantyEndDate;
  const hasDuplicateWarning = Boolean(candidate.duplicateOfRecordId);
  const isAmbiguous = candidate.candidateDates.some((d) => d.isAmbiguous);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        hasDuplicateWarning && styles.cardDuplicate,
      ]}
    >
      <View style={styles.thumbnailContainer}>
        {candidate.sourceAssetUri ? (
          <Image
            source={{ uri: candidate.sourceAssetUri }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Ionicons name="document-text-outline" size={28} color="#64748B" />
          </View>
        )}
        <View style={[styles.categoryBadge, { backgroundColor: categoryMeta.color }]}>
          <Ionicons name="shield-outline" size={12} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {candidate.title}
          </Text>
        </View>

        <Text style={styles.categoryLabel}>{categoryMeta.label}</Text>

        {targetDate ? (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.primaryLight} />
            <Text style={styles.dateText}>
              {candidate.extractedFields.expiryDate ? 'Expires: ' : 'Renewal: '}
              <Text style={styles.dateHighlight}>{targetDate}</Text>
            </Text>
          </View>
        ) : (
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.noDateText}>No actionable date found</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <ConfidencePill score={candidate.confidenceScores.overall} compact />
          {hasDuplicateWarning && (
            <Badge label="Possible Duplicate" variant="warning" size="sm" />
          )}
          {isAmbiguous && !hasDuplicateWarning && (
            <Badge label="Verify Date" variant="warning" size="sm" />
          )}
        </View>
      </View>

      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={20} color="#64748B" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardDuplicate: {
    borderColor: Colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: 64,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: '#1E293B',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.dark.card,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
    flex: 1,
  },
  categoryLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  dateHighlight: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
  noDateText: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
