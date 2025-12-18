"use client";

import { GovernanceHeader } from '../../../../components/governance-header';
import { PermissionGate } from '../../../../components/permission-gate';

export default function OrgPage() {
  return (
    <PermissionGate permission="org.view">
      <div className="space-y-4">
        <GovernanceHeader
          title="Organization"
          description="Organization settings surface. Update operations require org.update."
        />
        <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
          Placeholder: connect to org profile endpoint when available.
        </div>
      </div>
    </PermissionGate>
  );
}
