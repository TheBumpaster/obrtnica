"use client";

import { GovernanceHeader } from '../../../../components/governance-header';
import { PermissionGate } from '../../../../components/permission-gate';

export default function BillingPage() {
  return (
    <PermissionGate permission="org.billing.read">
      <div className="space-y-4">
        <GovernanceHeader
          title="Billing"
          description="Billing overview. Updates require org.billing.update and may require step-up."
        />
        <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
          Placeholder for billing data (plans, invoices). Ensure sensitive actions are step-up protected.
        </div>
      </div>
    </PermissionGate>
  );
}
