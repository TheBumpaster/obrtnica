"use client";

import { ModuleLayout } from '@/components/module-layout';
import { PermissionGate } from '@/components/permission-gate';

export default function SellingPage() {
  return (
    <PermissionGate permission="workspace.data.read">
      <ModuleLayout
        title="Prodaja"
        description="Prodaja modul je u pripremi. Akcije su ograničene dozvolama."
        actionLabel="Novi račun"
      />
    </PermissionGate>
  );
}
