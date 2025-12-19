"use client";

import { ModuleLayout } from '@/components/module-layout';
import { PermissionGate } from '@/components/permission-gate';

export default function BuyingPage() {
  return (
    <PermissionGate permission="workspace.data.read">
      <ModuleLayout
        title="Kupovina"
        description="Kupovina modul je u pripremi. Akcije su ograničene dozvolama."
        actionLabel="Nova nabavka"
      />
    </PermissionGate>
  );
}
