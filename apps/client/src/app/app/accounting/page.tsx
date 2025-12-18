"use client";

import { ModuleLayout } from '../../../components/module-layout';
import { PermissionGate } from '../../../components/permission-gate';

export default function AccountingPage() {
  return (
    <PermissionGate permission="workspace.data.read">
      <ModuleLayout
        title="Accounting"
        description="Finance workspace scaffold. Actions are disabled until APIs are wired."
        actionLabel="New journal entry"
      >
        <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
          Coming soon — finance data views will respect the same permission gating.
        </div>
      </ModuleLayout>
    </PermissionGate>
  );
}
