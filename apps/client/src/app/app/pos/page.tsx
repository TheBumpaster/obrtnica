"use client";

import { ModuleLayout } from '@/components/module-layout';
import { PermissionGate } from '@/components/permission-gate';

export default function PosPage() {
  return (
    <PermissionGate permission="workspace.data.read">
      <ModuleLayout
        title="POS"
        description="POS je u pripremi. Akcije su ograničene dozvolama."
        actionLabel="Nova prodaja"
      />
    </PermissionGate>
  );
}
