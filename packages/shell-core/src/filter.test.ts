import { describe, expect, it } from 'vitest';

import type { PermissionId } from '@serp/core';

import { canWrite, filterNavByPermissions, guardRoute, hasAll, hasAny } from './index';
import type { NavigationNode, PermissionSet } from './types';

const navTree: NavigationNode[] = [
  {
    id: 'projects',
    label: 'Projects',
    route: '/app/projects',
    requiredPermissions: ['workspace.data.read'] as PermissionId[],
    disabledWhenMissing: ['workspace.data.write'] as PermissionId[],
    platforms: ['web', 'desktop', 'mobile'],
  },
  {
    id: 'governance',
    label: 'Governance',
    requiredPermissions: ['org.view'] as PermissionId[],
    platforms: ['web', 'desktop'],
    children: [
      {
        id: 'audit',
        label: 'Audit',
        route: '/app/governance/audit',
        requiredPermissions: ['org.audit.read'] as PermissionId[],
      },
    ],
  },
];

const asSet = (perms: PermissionId[]): PermissionSet => new Set(perms);

describe('permission helpers', () => {
  it('hasAny/hasAll basic checks', () => {
    const granted = asSet(['workspace.data.read', 'org.view'] as PermissionId[]);
    expect(hasAny(['workspace.data.read' as PermissionId], granted)).toBe(true);
    expect(hasAll(['workspace.data.read' as PermissionId, 'org.view' as PermissionId], granted)).toBe(true);
    expect(hasAny(['missing' as PermissionId], granted)).toBe(false);
    expect(hasAll(['workspace.data.write' as PermissionId], granted)).toBe(false);
  });

  it('guardRoute allows when any required permission is present', () => {
    const granted = asSet(['workspace.data.read'] as PermissionId[]);
    expect(guardRoute(granted, ['workspace.data.read' as PermissionId]).allowed).toBe(true);
    expect(guardRoute(granted, ['workspace.data.write' as PermissionId]).allowed).toBe(false);
  });

  it('filterNavByPermissions hides nodes without permission and respects platform', () => {
    const granted = asSet(['workspace.data.read'] as PermissionId[]);
    const filteredMobile = filterNavByPermissions(navTree, granted, { platform: 'mobile' });
    expect(filteredMobile.map((n) => n.id)).toContain('projects');
    expect(filteredMobile.find((n) => n.id === 'governance')).toBeUndefined();

    const filteredWeb = filterNavByPermissions(granted.has('org.view') ? navTree : navTree, granted, {
      platform: 'web',
    });
    expect(filteredWeb.find((n) => n.id === 'governance')).toBeUndefined();
  });

  it('canWrite uses disabledWhenMissing or defaults to workspace.data.write', () => {
    const grantedReadOnly = asSet(['workspace.data.read'] as PermissionId[]);
    const grantedWrite = asSet(['workspace.data.read', 'workspace.data.write'] as PermissionId[]);
    const node = navTree[0];
    expect(canWrite(grantedReadOnly, node)).toBe(false);
    expect(canWrite(grantedWrite, node)).toBe(true);
  });
});
