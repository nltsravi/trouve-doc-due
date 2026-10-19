import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { getDatabase } from '../services/storage/database';
import { reconcileNotifications } from '../services/notifications/reminderService';
import { Colors } from '../theme/colors';

// Prevent splash screen from auto-hiding while initializing DB
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize SQLite & apply migrations
        await getDatabase();

        // Reconcile reminders safely (non-blocking for app launch)
        try {
          await reconcileNotifications();
        } catch (e) {
          console.warn('[App] Notifications reconciliation skipped:', e);
        }

        setIsReady(true);
      } catch (error: any) {
        console.error('[App] Initialization error:', error);
        setInitError(error?.message || 'Database initialization error');
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    initializeApp();
  }, []);

  if (!isReady && !initError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primaryLight} />
        <Text style={styles.loadingText}>Initializing TrouveDocDue...</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Initialization Failed</Text>
        <Text style={styles.errorText}>{initError}</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.dark.card,
          },
          headerTintColor: Colors.dark.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: Colors.dark.background,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="scan-intro"
          options={{
            title: 'Privacy & Photo Access',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="scan-active"
          options={{
            title: 'Scanning Gallery',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="review/index"
          options={{
            title: 'Review Detected Documents',
          }}
        />
        <Stack.Screen
          name="review/[id]"
          options={{
            title: 'Review Document',
          }}
        />
        <Stack.Screen
          name="records/[id]"
          options={{
            title: 'Document Details',
          }}
        />
        <Stack.Screen
          name="records/new"
          options={{
            title: 'Add Document Manually',
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            title: 'Privacy Policy',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            title: 'Terms & Conditions',
            presentation: 'modal',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.dark.textSecondary,
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
});
