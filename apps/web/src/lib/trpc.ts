import type { AppRouter } from '@serp/api';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/trpc';

export type ApiClient = ReturnType<typeof createTrpcClient>;

export const createTrpcClient = (token?: string) =>
  createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: getApiUrl(),
        headers: () => ({
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }),
      }),
    ],
  });
