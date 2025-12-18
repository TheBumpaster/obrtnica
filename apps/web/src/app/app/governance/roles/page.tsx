"use client";

import type { PermissionId } from '@serp/core';
import { FormEvent, useCallback, useEffect, useState } from 'react';


import { GovernanceHeader } from '../../../../components/governance-header';
import { PermissionGate } from '../../../../components/permission-gate';
import { useAuth } from '../../../../context/auth-context';

type OrgRole = { id: string; name: string; description?: string | null; permissions: PermissionId[] };

export default function RolesPage() {
  const { client } = useAuth();
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState('');

  const load = useCallback(async () => {
    const result = await client.rbac.listOrgRoles.query();
    setRoles(result.roles);
  }, [client]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const perms = permissions
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    await client.rbac.createOrgRole.mutate({ name, description, permissions: perms });
    setName('');
    setDescription('');
    setPermissions('');
    await load();
  };

  return (
    <PermissionGate permission="org.members.permissions.assign">
      <div className="space-y-4">
        <GovernanceHeader
          title="Roles & Permissions"
          description="Define organization roles and their permissions."
        />

        <form onSubmit={onCreate} className="space-y-2 rounded-md border border-border p-4">
          <div className="font-medium">Create role</div>
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
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Permissions (comma separated, e.g. org.view,workspace.data.read)"
            value={permissions}
            onChange={(e) => setPermissions(e.target.value)}
          />
          <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" type="submit">
            Create role
          </button>
        </form>

        <div className="rounded-md border border-border">
          <div className="border-b border-border px-4 py-2 text-sm font-semibold">Existing roles</div>
          <ul>
            {roles.map((role) => (
              <li key={role.id} className="border-b border-border px-4 py-3 last:border-b-0">
                <div className="font-medium">{role.name}</div>
                {role.description ? <div className="text-sm text-muted-foreground">{role.description}</div> : null}
                <div className="text-xs text-muted-foreground">
                  Permissions: {role.permissions && role.permissions.length > 0 ? role.permissions.join(', ') : 'None'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PermissionGate>
  );
}
