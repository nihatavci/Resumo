// Cloudflare KV-backed cache replacing Redis.
// Provides the same hash-like interface used by the rate limiter.

interface KVCache {
  hgetall(key: string): Promise<Record<string, string> | null>;
  hset(key: string, data: Record<string, string>): Promise<void>;
  expire(key: string, seconds: number): Promise<void>;
}

function getKV(): KVNamespace | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    return (getRequestContext().env as Record<string, KVNamespace>).CACHE;
  } catch {
    return null;
  }
}

function createKVCache(): KVCache {
  return {
    async hgetall(key: string) {
      const kv = getKV();
      if (!kv) return null;
      const raw = await kv.get(key, 'json') as Record<string, string> | null;
      return raw;
    },
    async hset(key: string, data: Record<string, string>) {
      const kv = getKV();
      if (!kv) return;
      const existing = await kv.get(key, 'json') as Record<string, string> | null;
      const merged = { ...(existing ?? {}), ...data };
      // Store with a default TTL; expire() will update it
      await kv.put(key, JSON.stringify(merged), { expirationTtl: 7200 });
    },
    async expire(key: string, seconds: number) {
      const kv = getKV();
      if (!kv) return;
      // KV doesn't support changing TTL without rewriting — read and rewrite
      const raw = await kv.get(key, 'text');
      if (raw) {
        await kv.put(key, raw, { expirationTtl: seconds });
      }
    },
  };
}

const cache = createKVCache();
export default cache;
