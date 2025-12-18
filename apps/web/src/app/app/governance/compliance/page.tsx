"use client";

import { GovernanceHeader } from '../../../../components/governance-header';
import { PermissionGate } from '../../../../components/permission-gate';

export default function CompliancePage() {
  return (
    <PermissionGate permission="org.security.manage">
      <div className="space-y-4">
        <GovernanceHeader
          title="Compliance"
          description="Compliance & data classification controls. Actions are audited."
        />
        <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
          Placeholder for compliance configuration UI (policy toggles, data classification).
        </div>
      </div>
    </PermissionGate>
  );
}
