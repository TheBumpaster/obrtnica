import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { useTheme } from '../../lib/theme';


export default function ShellTabs() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.cardBorder },
        tabBarActiveTintColor: theme.foreground,
        tabBarInactiveTintColor: theme.mutedText,
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📁</Text>,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color }) => <Text style={{ color }}>📄</Text>,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <Text style={{ color }}>⋯</Text>,
        }}
      />
    </Tabs>
  );
}
