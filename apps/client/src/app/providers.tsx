"use client";

import { AuthProvider } from '../context/auth-context';
import { IdentityProvider } from '../context/identity-context';
import { PermissionProvider } from '../context/permission-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PermissionProvider>
        <IdentityProvider>{children}</IdentityProvider>
      </PermissionProvider>
    </AuthProvider>
  );
}
