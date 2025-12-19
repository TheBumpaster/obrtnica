"use client";

import { ModuleLayout } from '@/components/module-layout';
import { PermissionGate } from '@/components/permission-gate';

export default function SettingsPage() {
  return (
    <PermissionGate permission="org.update">
      <ModuleLayout
        title="Postavke Obrtnice"
        description="Postavke organizacije i workspace-a."
        actionLabel="Uredi"
      />
    </PermissionGate>
  );
}
