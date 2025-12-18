"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { GovernanceHeader } from '../../../../components/governance-header';
import { PermissionGate } from '../../../../components/permission-gate';
import { useAuth } from '../../../../context/auth-context';
import { usePermissions } from '../../../../context/permission-context';

type Workspace = { id: string; name: string; description?: string | null };

export default function WorkspacesPage() {
  const { client } = useAuth();
  const { refresh } = usePermissions();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    const result = await client.workspaces.listWorkspaces.query();
    setWorkspaces(result.workspaces);
  }, [client]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    await client.workspaces.createWorkspace.mutate({ name, description });
    setName('');
    setDescription('');
    await load();
    await refresh();
  };

  return (
    <PermissionGate permission="org.workspaces.create">
      <div className="space-y-4">
        <GovernanceHeader title="Workspaces" description="Manage organization workspaces." />

        <form onSubmit={onCreate} className="space-y-2 rounded-md border border-border p-4">
          <div className="font-medium">Create workspace</div>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" type="submit">
            Create
          </button>
        </form>

        <div className="rounded-md border border-border">
          <div className="border-b border-border px-4 py-2 text-sm font-semibold">Existing</div>
          <ul>
            {workspaces.map((ws) => (
              <li key={ws.id} className="border-b border-border px-4 py-3 last:border-b-0">
                <div className="font-medium">{ws.name}</div>
                {ws.description ? <div className="text-sm text-muted-foreground">{ws.description}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PermissionGate>
  );
}
