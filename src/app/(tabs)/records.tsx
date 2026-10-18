import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RecordWithUrgency } from '../../types/record';
import { DocumentCategory } from '../../types/document';
import { getAllRecords } from '../../services/storage/recordsRepo';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { RecordCard } from '../../components/common/RecordCard';
import { EmptyState } from '../../components/common/EmptyState';

export default function RecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<RecordWithUrgency[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'expiry_asc' | 'created_desc' | 'title_asc'>('expiry_asc');

  const loadRecords = useCallback(async () => {
    try {
      const results = await getAllRecords({
        category: selectedCategory,
        searchQuery,
        sortBy,
      });
      setRecords(results);
    } catch (e) {
      console.error('[Records] Error fetching records:', e);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  const categoryChips: { id: DocumentCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'identity_travel', label: 'Identity & Travel' },
    { id: 'insurance_finance', label: 'Insurance & Finance' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'personal_professional', label: 'Personal & Professional' },
    { id: 'purchases_warranties', label: 'Purchases & Warranties' },
  ];

  return (
    <View style={styles.container}>
      {/* Top Search & Actions Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            placeholder="Search records, policies, vehicle reg..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/records/new')}
          style={styles.addBtn}
          accessibilityLabel="Add new record"
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Category Filter Bar */}
      <View style={styles.filterScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {categoryChips.map((chip) => {
            const isSelected = selectedCategory === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setSelectedCategory(chip.id)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Records Count & Sort Indicator */}
      <View style={styles.statusRow}>
        <Text style={styles.countText}>
          {records.length} {records.length === 1 ? 'document' : 'documents'}
        </Text>

        <TouchableOpacity
          onPress={() => {
            if (sortBy === 'expiry_asc') setSortBy('created_desc');
            else if (sortBy === 'created_desc') setSortBy('title_asc');
            else setSortBy('expiry_asc');
          }}
          style={styles.sortToggle}
        >
          <Ionicons name="swap-vertical" size={14} color={Colors.primaryLight} />
          <Text style={styles.sortToggleText}>
            Sort: {sortBy === 'expiry_asc' ? 'Expiry Soonest' : sortBy === 'created_desc' ? 'Recently Added' : 'Title (A-Z)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Records List */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordCard record={item} onPress={() => router.push(`/records/${item.id}`)} />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open-outline"
            title="No Matching Records"
            description={
              searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search terms or category filter.'
                : 'You have not imported any documents yet.'
            }
            actionTitle={searchQuery || selectedCategory !== 'all' ? 'Reset Filters' : 'Find in Photos'}
            actionIcon={searchQuery || selectedCategory !== 'all' ? 'refresh' : 'scan-outline'}
            onAction={() => {
              if (searchQuery || selectedCategory !== 'all') {
                setSearchQuery('');
                setSelectedCategory('all');
              } else {
                router.push('/scan-intro');
              }
            }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScrollWrap: {
    marginTop: Spacing.md,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  countText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortToggleText: {
    ...Typography.caption,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
});
