"use client";

import { ModuleLayout } from '@/components/module-layout';
import { PermissionGate } from '@/components/permission-gate';

export default function StockPage() {
  return (
    <PermissionGate permission="workspace.data.read">
      <ModuleLayout
        title="Zalihe"
        description="Zalihe modul je u pripremi. Akcije su ograničene dozvolama."
        actionLabel="Nova stavka"
      />
    </PermissionGate>
  );
}
