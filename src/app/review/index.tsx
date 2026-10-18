import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScanCandidate } from '../../types/scan';
import { getAllPendingCandidates, clearTemporaryCandidates } from '../../services/storage/candidatesRepo';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { CandidateCard } from '../../components/common/CandidateCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';

type FilterGroup = 'all' | 'date_found' | 'needs_verification' | 'duplicate' | 'no_date';

export default function ReviewListScreen() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FilterGroup>('all');

  const loadCandidates = useCallback(async () => {
    try {
      const pending = await getAllPendingCandidates();
      setCandidates(pending);
    } catch (e) {
      console.error('[ReviewList] Error loading candidates:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCandidates();
    }, [loadCandidates])
  );

  const handleClearAll = () => {
    Alert.alert(
      'Discard All Candidates?',
      'This will remove all detected document candidates without saving them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await clearTemporaryCandidates();
            setCandidates([]);
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  // Group filter logic
  const filteredCandidates = candidates.filter((c) => {
    const hasTargetDate = Boolean(c.extractedFields.expiryDate || c.extractedFields.renewalDate || c.extractedFields.warrantyEndDate);
    const isAmbiguous = c.candidateDates.some((d) => d.isAmbiguous);
    const isDuplicate = Boolean(c.duplicateOfRecordId);

    switch (selectedGroup) {
      case 'date_found':
        return hasTargetDate && !isAmbiguous && !isDuplicate;
      case 'needs_verification':
        return isAmbiguous || c.confidenceScores.overall < 0.7;
      case 'duplicate':
        return isDuplicate;
      case 'no_date':
        return !hasTargetDate;
      case 'all':
      default:
        return true;
    }
  });

  const filterTabs: { id: FilterGroup; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: candidates.length },
    {
      id: 'date_found',
      label: 'Date Found',
      count: candidates.filter(
        (c) => (c.extractedFields.expiryDate || c.extractedFields.renewalDate) && !c.candidateDates.some((d) => d.isAmbiguous) && !c.duplicateOfRecordId
      ).length,
    },
    {
      id: 'needs_verification',
      label: 'Needs Verification',
      count: candidates.filter((c) => c.candidateDates.some((d) => d.isAmbiguous) || c.confidenceScores.overall < 0.7).length,
    },
    {
      id: 'duplicate',
      label: 'Duplicates',
      count: candidates.filter((c) => Boolean(c.duplicateOfRecordId)).length,
    },
    {
      id: 'no_date',
      label: 'No Expiry',
      count: candidates.filter((c) => !c.extractedFields.expiryDate && !c.extractedFields.renewalDate).length,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Banner explaining Consent-Based Import */}
      <View style={styles.consentBanner}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primaryLight} />
        <Text style={styles.consentText}>
          Nothing is saved yet. Tap each document to review extracted dates and explicitly approve import.
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filterTabs.map((tab) => {
            const isSelected = selectedGroup === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedGroup(tab.id)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Candidates List */}
      <FlatList
        data={filteredCandidates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CandidateCard
            candidate={item}
            onPress={() => router.push(`/review/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-circle-outline"
            title={candidates.length === 0 ? 'No Documents Awaiting Review' : 'No Matching Candidates'}
            description={
              candidates.length === 0
                ? 'All detected candidates have been reviewed or dismissed.'
                : 'No documents match the selected filter group.'
            }
            actionTitle={candidates.length === 0 ? 'Find More in Photos' : 'Show All'}
            onAction={() => {
              if (candidates.length === 0) {
                router.push('/scan-intro');
              } else {
                setSelectedGroup('all');
              }
            }}
          />
        }
      />

      {/* Bottom Footer Actions */}
      {candidates.length > 0 && (
        <View style={styles.footer}>
          <Button
            title="Discard All Candidates"
            variant="ghost"
            size="sm"
            onPress={handleClearAll}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  consentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: Spacing.sm,
  },
  consentText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  filterWrap: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  filterRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.card,
    alignItems: 'center',
  },
});
