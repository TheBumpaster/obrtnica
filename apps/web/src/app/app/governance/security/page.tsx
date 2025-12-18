"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { GovernanceHeader } from '../../../../components/governance-header';
import { PermissionGate } from '../../../../components/permission-gate';
import { useAuth } from '../../../../context/auth-context';

type EmergencyGrant = {
  id: string;
  justificationLength: number;
  expiresAt: string;
  remainingSeconds: number;
};

export default function SecurityPage() {
  const { client } = useAuth();
  const [justification, setJustification] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [activeGrant, setActiveGrant] = useState<EmergencyGrant | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await client.emergencyAccess.getMyEmergencyGrant.query();
    setActiveGrant(result.hasActive ? result.grant : null);
  }, [client]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const activate = async (e: FormEvent) => {
    e.preventDefault();
    await client.emergencyAccess.activateEmergencyAccess.mutate({
      justification,
      durationMinutes,
    });
    setJustification('');
    setMessage('Emergency access activated');
    await load();
  };

  const revoke = async () => {
    if (!activeGrant) return;
    await client.emergencyAccess.revokeEmergencyAccess.mutate({ grantId: activeGrant.id });
    setMessage('Emergency access revoked');
    await load();
  };

  return (
    <PermissionGate permission="org.security.manage">
      <div className="space-y-4">
        <GovernanceHeader
          title="Security"
          description="Manage sensitive controls and break-glass access. Actions are logged."
        />

        <form onSubmit={activate} className="space-y-2 rounded-md border border-border p-4">
          <div className="font-medium">Activate emergency access</div>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Justification (required)"
            value={justification}
            minLength={10}
            onChange={(e) => setJustification(e.target.value)}
            required
          />
          <label className="text-sm">
            Duration (minutes)
            <input
              className="mt-1 w-32 rounded-md border border-input bg-background px-3 py-2"
              type="number"
              min={15}
              max={480}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
            />
          </label>
          <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" type="submit">
            Activate
          </button>
        </form>

        {activeGrant ? (
          <div className="rounded-md border border-border p-4">
            <div className="font-medium">Active emergency access</div>
            <div className="text-sm text-muted-foreground">
              Expires at {new Date(activeGrant.expiresAt).toLocaleString()} (remaining{' '}
              {Math.max(0, activeGrant.remainingSeconds)}s)
            </div>
            <button onClick={revoke} className="mt-3 rounded-md border border-input px-3 py-2 text-sm">
              Revoke now
            </button>
          </div>
        ) : (
          <div className="rounded-md border border-border bg-muted p-4 text-sm text-muted-foreground">
            No active emergency access grants.
          </div>
        )}

        {message ? <div className="text-sm text-green-600">{message}</div> : null}
      </div>
    </PermissionGate>
  );
}
