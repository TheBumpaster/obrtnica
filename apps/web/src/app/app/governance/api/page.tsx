"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { GovernanceHeader } from '../../../../components/governance-header';
import { PermissionGate } from '../../../../components/permission-gate';
import { useAuth } from '../../../../context/auth-context';

type ApiToken = {
  id: string;
  name: string;
  prefix: string;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
};

export default function ApiTokensPage() {
  const { client } = useAuth();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [newToken, setNewToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await client.tokens.listApiTokens.query();
    setTokens(result.tokens);
  }, [client]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const result = await client.tokens.createApiToken.mutate({
      name,
      scopes: [],
      expiresInDays,
    });
    setNewToken(result.token);
    setName('');
    await load();
  };

  return (
    <PermissionGate permission="org.api_tokens.manage">
      <div className="space-y-4">
        <GovernanceHeader
          title="API Tokens"
          description="Manage service accounts and API tokens. Secrets are shown only once."
        />

        <form onSubmit={onCreate} className="space-y-2 rounded-md border border-border p-4">
          <div className="font-medium">Create token</div>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label className="text-sm">
            Expires in days
            <input
              className="ml-2 w-24 rounded-md border border-input bg-background px-3 py-2"
              type="number"
              min={1}
              max={365}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10))}
            />
          </label>
          <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground" type="submit">
            Create token
          </button>
          {newToken ? (
            <div className="rounded-md border border-border bg-muted p-3 text-sm">
              New token (save now): <code className="font-mono">{newToken}</code>
            </div>
          ) : null}
        </form>

        <div className="rounded-md border border-border">
          <div className="border-b border-border px-4 py-2 text-sm font-semibold">Tokens</div>
          <ul>
            {tokens.map((token) => (
              <li key={token.id} className="border-b border-border px-4 py-3 last:border-b-0">
                <div className="font-medium">{token.name}</div>
                <div className="text-xs text-muted-foreground">Prefix: {token.prefix}</div>
                <div className="text-xs text-muted-foreground">
                  Expires: {token.expiresAt ? new Date(token.expiresAt).toLocaleString() : 'None'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PermissionGate>
  );
}
