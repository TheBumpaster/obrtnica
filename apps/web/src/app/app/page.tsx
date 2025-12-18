"use client";

import { moduleCatalog } from '@serp/shell-core';
import Link from 'next/link';


export default function AppHome() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Workspace Shell</h1>
      <p className="text-muted-foreground">
        Navigation is generated from the platform-owned module catalog and filtered by your permissions.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {moduleCatalog.map((node) => (
          <Link
            key={node.id}
            href={node.route || '#'}
            className="rounded-lg border border-border bg-card p-4 hover:bg-muted"
          >
            <div className="text-lg font-semibold">{node.label}</div>
            <div className="text-sm text-muted-foreground">
              Requires: {(node.requiredPermissions || []).join(', ') || 'none'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
