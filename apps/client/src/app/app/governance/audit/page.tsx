"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { GovernanceHeader } from '../../../../components/governance-header';
import { PermissionGate } from '../../../../components/permission-gate';
import { useAuth } from '../../../../context/auth-context';

type AuditEvent = {
  id: string;
  occurredAt: string;
  eventType: string;
  severity: string;
  actorDisplay?: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  requestId?: string;
  dataClassification?: string;
  dataCategories?: string[];
};

export default function AuditPage() {
  const { client } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'SUCCESS' | 'FAILURE' | ''>('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await client.audit.listEvents.query({
        limit: 50,
        offset: 0,
        q: q || undefined,
        status: status || undefined,
      });
      setEvents(result.items);
    } finally {
      setLoading(false);
    }
  }, [client, q, status]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await load();
  };

  return (
    <PermissionGate permission="org.audit.read">
      <div className="space-y-4">
        <GovernanceHeader
          title="Audit Logs"
          description="Read-only audit timeline. Sensitive metadata is redacted in UI."
        />

        <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
          <input
            className="w-64 rounded-md border border-input bg-background px-3 py-2"
            placeholder="Search text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="w-48 rounded-md border border-input bg-background px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'SUCCESS' | 'FAILURE' | '')}
          >
            <option value="">Any status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
          <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Filter'}
          </button>
        </form>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Actor</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Classification</th>
                <th className="px-3 py-2 text-left">Resource</th>
                <th className="px-3 py-2 text-left">Request</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-border">
                  <td className="px-3 py-2">{new Date(event.occurredAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{event.eventType}</td>
                  <td className="px-3 py-2">{event.actorDisplay || '—'}</td>
                  <td className="px-3 py-2">{event.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                        {event.dataClassification || '—'}
                      </span>
                      {event.dataCategories && event.dataCategories.length > 0 ? (
                        event.dataCategories.map((cat) => (
                          <span key={cat} className="rounded-full border border-border px-2 py-0.5 text-[11px]">
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">no categories</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {event.resourceType} {event.resourceId}
                  </td>
                  <td className="px-3 py-2">{event.requestId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGate>
  );
}
