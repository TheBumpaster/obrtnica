"use client";

import { canWrite } from '@/lib/shell';

import { usePermissions } from '../context/permission-context';

type ModuleLayoutProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  children?: React.ReactNode;
};

export function ModuleLayout({ title, description, actionLabel = 'Create', children }: ModuleLayoutProps) {
  const { permissions } = usePermissions();
  const writeEnabled = canWrite(permissions);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Module</div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-md border border-input px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            disabled
            title="Filters placeholder"
          >
            Filters (scaffold)
          </button>
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!writeEnabled}
            title={!writeEnabled ? 'Requires workspace.data.write' : undefined}
          >
            {actionLabel}
          </button>
        </div>
      </header>

      <div className="rounded-md border border-border">
        <div className="border-b border-border px-4 py-2 text-sm font-semibold">Data view</div>
        <div className="p-4">{children ?? <PlaceholderTable />}</div>
      </div>

      <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
        Details drawer and activity/audit panel coming soon.
      </div>
    </div>
  );
}

function PlaceholderTable() {
  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-3 gap-2 font-medium text-muted-foreground">
        <div>Column A</div>
        <div>Column B</div>
        <div>Status</div>
      </div>
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="grid grid-cols-3 gap-2 rounded-md border border-dashed border-border p-3">
          <div className="font-medium">Row {row}</div>
          <div className="text-muted-foreground">Placeholder data</div>
          <div className="text-muted-foreground">—</div>
        </div>
      ))}
    </div>
  );
}
