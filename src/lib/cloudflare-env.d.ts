interface CloudflareEnv {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
}

declare module '@cloudflare/next-on-pages' {
  export function getRequestContext(): {
    env: CloudflareEnv;
    ctx: ExecutionContext;
    cf: IncomingRequestCfProperties;
  };
}
