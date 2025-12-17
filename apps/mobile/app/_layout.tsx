import { Stack } from 'expo-router';
import type { ComponentType } from 'react';

const StackNavigator = Stack as unknown as ComponentType;

export default function RootLayout() {
  return <StackNavigator />;
}
