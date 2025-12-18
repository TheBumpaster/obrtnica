import { Stack } from 'expo-router';
import type { ComponentProps, ComponentType } from 'react';

import { Providers } from '../providers';

type StackProps = ComponentProps<typeof Stack>;
const StackNavigator = Stack as unknown as ComponentType<StackProps>;

export default function RootLayout() {
  return (
    <Providers>
      <StackNavigator />
    </Providers>
  );
}
