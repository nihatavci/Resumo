declare global {
  interface CloudflareEnv {
    DB: D1Database;
    CACHE: KVNamespace;
    STORAGE?: R2Bucket;
  }
}

export {};
