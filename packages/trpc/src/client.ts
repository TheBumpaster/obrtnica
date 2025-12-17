import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AnyRouter } from '@trpc/server';

export function createClient<TRouter extends AnyRouter>(options: {
  url: string;
  headers?: Record<string, string>;
}) {
  return createTRPCClient<TRouter>({
    links: [
      httpBatchLink({
        url: options.url,
        headers: options.headers,
      } as any), // eslint-disable-line @typescript-eslint/no-explicit-any
    ],
  });
}
