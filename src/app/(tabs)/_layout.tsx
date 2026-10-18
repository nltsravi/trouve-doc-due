import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Colors } from '../../theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors.dark.card,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors.dark.card,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={String(color || Colors.primaryLight)} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Find Docs',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'scan' : 'scan-outline'} size={24} color={String(color || Colors.primaryLight)} />
          ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'All Records',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'folder' : 'folder-outline'} size={22} color={String(color || Colors.primaryLight)} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Privacy & Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={22}
              color={String(color || Colors.primaryLight)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
