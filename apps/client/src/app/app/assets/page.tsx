"use client";

import { ModuleLayout } from '@/components/module-layout';
import { PermissionGate } from '@/components/permission-gate';

export default function AssetsPage() {
  return (
    <PermissionGate permission="workspace.data.read">
      <ModuleLayout
        title="Sredstva"
        description="Sredstva modul je u pripremi. Akcije su ograničene dozvolama."
        actionLabel="Novo sredstvo"
      />
    </PermissionGate>
  );
}
