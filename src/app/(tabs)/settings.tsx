import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { GalleryPermissionState } from '../../types/permission';
import { getGalleryPermissionState, requestGalleryPermission } from '../../services/gallery/galleryService';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '../../services/notifications/reminderService';
import { clearTemporaryScanData, exportUserRecords, eraseAllUserData } from '../../services/privacy/privacyService';
import { Colors, Radius, Spacing, Typography } from '../../theme/colors';
import { Badge } from '../../components/common/Badge';

export default function SettingsScreen() {
  const router = useRouter();
  const [photoPerm, setPhotoPerm] = useState<GalleryPermissionState | null>(null);
  const [notifPerm, setNotifPerm] = useState<boolean>(false);

  const loadPermissions = useCallback(async () => {
    const [gState, nStatus] = await Promise.all([
      getGalleryPermissionState(),
      getNotificationPermissionStatus(),
    ]);
    setPhotoPerm(gState);
    setNotifPerm(nStatus);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPermissions();
    }, [loadPermissions])
  );

  const handleRequestPhotos = async () => {
    const res = await requestGalleryPermission();
    setPhotoPerm(res);
  };

  const handleRequestNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPerm(res);
  };

  const handleClearTemp = async () => {
    Alert.alert(
      'Clear Temporary Scan Results',
      'This will remove all unimported scan candidates from memory and local cache. Saved records will remain completely untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            const count = await clearTemporaryScanData();
            Alert.alert('Cleared', `Removed ${count} temporary items.`);
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const json = await exportUserRecords();
      await Share.share({
        message: json,
        title: 'TrouveDocDue_Records_Backup.json',
      });
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not share file.');
    }
  };

  const handleEraseAll = () => {
    Alert.alert(
      'Erase All App Data?',
      'This action is irreversible. All saved documents, attachments, and reminders will be completely wiped from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await eraseAllUserData();
              Alert.alert('Reset Complete', 'All app data has been erased.');
              router.replace('/(tabs)');
            } catch (e: any) {
              Alert.alert('Erase Failed', e?.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Privacy Architecture Highlight */}
      <View style={styles.privacyCard}>
        <View style={styles.privacyIconWrap}>
          <Ionicons name="lock-closed" size={24} color={Colors.primaryLight} />
        </View>
        <Text style={styles.privacyTitle}>Local Privacy Architecture</Text>
        <Text style={styles.privacyDescription}>
          TrouveDocDue operates exclusively on your device. There is no account registration, no remote
          database, no advertising tracking, and no cloud processing.
        </Text>
      </View>

      {/* Permissions Section */}
      <Text style={styles.sectionHeader}>Device Permissions</Text>

      <View style={styles.cardGroup}>
        {/* Photo Gallery Permission */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRequestPhotos}
          style={styles.settingRow}
        >
          <View style={styles.settingIconWrap}>
            <Ionicons name="images-outline" size={20} color={Colors.dark.text} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Photo Library Access</Text>
            <Text style={styles.settingSubtitle}>
              {photoPerm?.accessLevel === 'full'
                ? 'Full access granted'
                : photoPerm?.accessLevel === 'limited'
                ? 'Limited access (selected photos only)'
                : 'Not granted (Tap to configure)'}
            </Text>
          </View>
          <Badge
            label={
              photoPerm?.accessLevel === 'full'
                ? 'Full'
                : photoPerm?.accessLevel === 'limited'
                ? 'Limited'
                : 'Denied'
            }
            variant={
              photoPerm?.accessLevel === 'full'
                ? 'success'
                : photoPerm?.accessLevel === 'limited'
                ? 'warning'
                : 'neutral'
            }
            size="sm"
          />
        </TouchableOpacity>

        {/* Notification Permission */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleRequestNotifications}
          style={[styles.settingRow, styles.borderTop]}
        >
          <View style={styles.settingIconWrap}>
            <Ionicons name="notifications-outline" size={20} color={Colors.dark.text} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Renewal Reminders</Text>
            <Text style={styles.settingSubtitle}>
              {notifPerm ? 'Notifications enabled' : 'Disabled (Tap to enable)'}
            </Text>
          </View>
          <Badge
            label={notifPerm ? 'Enabled' : 'Disabled'}
            variant={notifPerm ? 'success' : 'neutral'}
            size="sm"
          />
        </TouchableOpacity>
      </View>

      {/* Data Management Section */}
      <Text style={styles.sectionHeader}>Data Management</Text>

      <View style={styles.cardGroup}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClearTemp}
          style={styles.settingRow}
        >
          <View style={styles.settingIconWrap}>
            <Ionicons name="trash-outline" size={20} color={Colors.warning} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Clear Temporary Scan Results</Text>
            <Text style={styles.settingSubtitle}>
              Removes unimported candidate documents from cache
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleExport}
          style={[styles.settingRow, styles.borderTop]}
        >
          <View style={styles.settingIconWrap}>
            <Ionicons name="download-outline" size={20} color={Colors.primaryLight} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Export Records (JSON)</Text>
            <Text style={styles.settingSubtitle}>
              Backup and export your saved document data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleEraseAll}
          style={[styles.settingRow, styles.borderTop]}
        >
          <View style={styles.settingIconWrap}>
            <Ionicons name="nuclear-outline" size={20} color={Colors.danger} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={[styles.settingTitle, { color: Colors.danger }]}>
              Erase All App Data
            </Text>
            <Text style={styles.settingSubtitle}>
              Permanently delete all records, attachments, and database
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      {/* About & Legal Section */}
      <Text style={styles.sectionHeader}>Legal & About</Text>

      <View style={styles.cardGroup}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/privacy-policy')}
          style={styles.settingRow}
        >
          <View style={styles.settingIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.success} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Privacy Policy</Text>
            <Text style={styles.settingSubtitle}>
              Zero-storage guarantee and on-device processing
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/terms' as any)}
          style={[styles.settingRow, styles.borderTop]}
        >
          <View style={styles.settingIconWrap}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primaryLight} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Terms & Conditions</Text>
            <Text style={styles.settingSubtitle}>
              OCR assistive disclaimer & user responsibilities
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={async () => {
            const url = 'https://nltsravi.github.io/trouve-doc-due';
            try {
              await WebBrowser.openBrowserAsync(url);
            } catch {
              await Linking.openURL(url).catch(() => {});
            }
          }}
          style={[styles.settingRow, styles.borderTop]}
        >
          <View style={styles.settingIconWrap}>
            <Ionicons name="globe-outline" size={20} color={Colors.dark.text} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Legal Portal (GitHub Pages)</Text>
            <Text style={styles.settingSubtitle}>
              View public documentation online
            </Text>
          </View>
          <Ionicons name="open-outline" size={16} color="#64748B" />
        </TouchableOpacity>

        <View style={[styles.settingRow, styles.borderTop]}>
          <View style={styles.settingIconWrap}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.dark.text} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Trouvé DocDue v1.0.0</Text>
            <Text style={styles.settingSubtitle}>
              100% on-device OCR, SQLite vault & local notifications
            </Text>
          </View>
        </View>
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
  privacyCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xl,
  },
  privacyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryGhost,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  privacyTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  privacyDescription: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  sectionHeader: {
    ...Typography.caption,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  cardGroup: {
    backgroundColor: Colors.dark.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingTextWrap: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingTitle: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  settingSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
});
