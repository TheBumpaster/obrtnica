"use client";

import { canWrite } from '@serp/shell-core';

import { ModuleLayout } from '../../../components/module-layout';
import { PermissionGate } from '../../../components/permission-gate';
import { usePermissions } from '../../../context/permission-context';

export default function ProjectsPage() {
  const { permissions } = usePermissions();
  const writeEnabled = canWrite(permissions);

  return (
    <PermissionGate permission="workspace.data.read">
      <ModuleLayout
        title="Projects"
        description="Operational projects overview. Actions require workspace.data.write."
        actionLabel="New project"
      >
        <div className="space-y-3 text-sm">
          <div className="rounded-md border border-dashed border-border p-3">
            <div className="font-medium">Sample project</div>
            <div className="text-muted-foreground">Placeholder list item</div>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded-md border border-input px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!writeEnabled}
              >
                Edit (requires write)
              </button>
              <button className="rounded-md border border-input px-3 py-1 text-xs" disabled>
                Open details (coming soon)
              </button>
            </div>
          </div>
          {!writeEnabled ? (
            <div className="rounded-md border border-border bg-muted p-3 text-muted-foreground">
              Write actions are disabled — grant <code>workspace.data.write</code> to enable.
            </div>
          ) : null}
        </div>
      </ModuleLayout>
    </PermissionGate>
  );
}
