import type { AppRouter } from '@serp/api';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';


export type ApiClient = ReturnType<typeof createTrpcClient>;

export function createTrpcClient(token?: string) {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: process.env.DESKTOP_API_URL || 'http://localhost:3001/trpc',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    ],
  });
}
