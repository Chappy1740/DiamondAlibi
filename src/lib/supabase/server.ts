import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServer(timeoutMs?: number) {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase configuration is missing");
  return createServerClient(url, key, {
    ...(timeoutMs && {
      global: { fetch: (input, init) => {
        const timeout = AbortSignal.timeout(timeoutMs);
        const callerSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
        return fetch(input, { ...init, signal: callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout });
      } },
    }),
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Server components cannot write cookies; proxy refreshes them. */
        }
      },
    },
  });
}
