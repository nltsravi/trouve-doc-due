import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RecordWithUrgency } from '../../types/record';
import { getAllRecords, getDashboardStats } from '../../services/storage/recordsRepo';
import { countPendingCandidates } from '../../services/storage/candidatesRepo';
import { hasAcceptedTermsAndPrivacy } from '../../services/privacy/consentService';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { RecordCard } from '../../components/common/RecordCard';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ConsentGateModal } from '../../components/common/ConsentGateModal';

export default function DashboardScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<RecordWithUrgency[]>([]);
  const [stats, setStats] = useState({ totalCount: 0, expiringCount: 0, overdueCount: 0, renewalCount: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [allRecords, dashboardStats, pending] = await Promise.all([
        getAllRecords({ sortBy: 'expiry_asc' }),
        getDashboardStats(),
        countPendingCandidates(),
      ]);
      setRecords(allRecords);
      setStats(dashboardStats);
      setPendingCount(pending);
    } catch (e) {
      console.error('[Dashboard] Error loading data:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const executeWithConsent = async (action: () => void) => {
    const agreed = await hasAcceptedTermsAndPrivacy();
    if (!agreed) {
      setPendingAction(() => action);
      setShowConsentModal(true);
      return;
    }
    action();
  };

  const urgentRecords = records.filter(
    (r) => r.urgency === 'overdue' || r.urgency === 'expiring_soon'
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryLight} />
      }
    >
      {/* Hero Banner / Tagline */}
      <View style={styles.heroCard}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroPretitle}>Trouvé DocDue</Text>
          <Text style={styles.heroTitle}>Find documents you already have.</Text>
          <Text style={styles.heroSubtitle}>
            Extract the dates that matter. Never miss a renewal.
          </Text>
        </View>

        <View style={styles.heroActionsRow}>
          <Button
            title="Find in Photos"
            icon="scan-outline"
            onPress={() => executeWithConsent(() => router.push('/scan-intro'))}
            style={styles.heroPrimaryBtn}
          />
          <Button
            title="Add Manual"
            icon="add-outline"
            variant="secondary"
            onPress={() => executeWithConsent(() => router.push('/records/new'))}
            style={styles.heroSecondaryBtn}
          />
        </View>
      </View>

      {/* Cloud & Drive Discovery Quick Link */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => executeWithConsent(() => router.push('/(tabs)/scan'))}
        style={styles.cloudDiscoveryBanner}
      >
        <View style={styles.cloudDiscoveryIconWrap}>
          <Ionicons name="cloud-outline" size={22} color={Colors.primaryLight} />
        </View>
        <View style={styles.cloudDiscoveryTextWrap}>
          <Text style={styles.cloudDiscoveryTitle}>Scan Google Drive, OneDrive & iCloud</Text>
          <Text style={styles.cloudDiscoverySubtitle}>
            Scan PDFs & cloud documents with on-device OCR
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      </TouchableOpacity>

      {/* Review Queue Alert (If unapproved candidates exist) */}
      {pendingCount > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/review')}
          style={styles.pendingAlertCard}
        >
          <View style={styles.pendingIconWrap}>
            <Ionicons name="sparkles" size={20} color="#F59E0B" />
          </View>
          <View style={styles.pendingTextWrap}>
            <Text style={styles.pendingTitle}>
              {pendingCount} detected {pendingCount === 1 ? 'document' : 'documents'} ready for review
            </Text>
            <Text style={styles.pendingSubtitle}>
              Tap to verify extracted dates before importing
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
        </TouchableOpacity>
      )}

      {/* Quick Metrics Bar */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, styles.metricCardPrimary]}>
          <Text style={styles.metricNumber}>{stats.totalCount}</Text>
          <Text style={styles.metricLabel}>Total Saved</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardWarning]}>
          <Text style={[styles.metricNumber, { color: Colors.warning }]}>
            {stats.expiringCount}
          </Text>
          <Text style={styles.metricLabel}>Expiring 30d</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardDanger]}>
          <Text style={[styles.metricNumber, { color: Colors.danger }]}>
            {stats.overdueCount}
          </Text>
          <Text style={styles.metricLabel}>Overdue</Text>
        </View>
        <View style={[styles.metricCard, styles.metricCardInfo]}>
          <Text style={[styles.metricNumber, { color: Colors.info }]}>
            {stats.renewalCount}
          </Text>
          <Text style={styles.metricLabel}>Renewals</Text>
        </View>
      </View>

      {/* Needs Attention Section (Overdue or Expiring Soon) */}
      {urgentRecords.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="alert-circle" size={18} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Action Required</Text>
            </View>
            <Text style={styles.sectionCount}>{urgentRecords.length}</Text>
          </View>

          {urgentRecords.map((rec) => (
            <RecordCard
              key={rec.id}
              record={rec}
              onPress={() => router.push(`/records/${rec.id}`)}
            />
          ))}
        </View>
      )}

      {/* All Saved Documents List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Documents</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/records')}>
            <Text style={styles.seeAllText}>See all ({records.length})</Text>
          </TouchableOpacity>
        </View>

        {records.length === 0 ? (
          <EmptyState
            icon="images-outline"
            title="No Documents Yet"
            description="TrouveDocDue can look through accessible photos on your device to discover passports, driving licences, vehicle RC/PUC, and insurance policies."
            actionTitle="Find documents in Photos"
            actionIcon="scan-outline"
            onAction={() => router.push('/scan-intro')}
          />
        ) : (
          records
            .slice(0, 5)
            .map((rec) => (
              <RecordCard
                key={rec.id}
                record={rec}
                onPress={() => router.push(`/records/${rec.id}`)}
              />
            ))
        )}
      </View>

      <ConsentGateModal
        visible={showConsentModal}
        onAgree={() => {
          setShowConsentModal(false);
          if (pendingAction) {
            const act = pendingAction;
            setPendingAction(null);
            act();
          }
        }}
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
  heroCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.lg,
  },
  heroTextWrap: {
    marginBottom: Spacing.lg,
  },
  heroPretitle: {
    ...Typography.caption,
    color: Colors.primaryLight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  heroPrimaryBtn: {
    flex: 1,
  },
  heroSecondaryBtn: {
    flex: 1,
  },
  pendingAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: Spacing.lg,
  },
  pendingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pendingTextWrap: {
    flex: 1,
  },
  pendingTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  pendingSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
  },
  metricCardPrimary: {},
  metricCardWarning: {},
  metricCardDanger: {},
  metricCardInfo: {},
  metricNumber: {
    ...Typography.h2,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  sectionCount: {
    ...Typography.caption,
    backgroundColor: Colors.warningLight,
    color: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    fontWeight: '700',
  },
  seeAllText: {
    ...Typography.caption,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  cloudDiscoveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    marginBottom: Spacing.lg,
  },
  cloudDiscoveryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cloudDiscoveryTextWrap: {
    flex: 1,
  },
  cloudDiscoveryTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  cloudDiscoverySubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
