export type AccessIdentity = {
  email: string;
  name?: string | null;
  id?: string | null;
  jwt?: string | null;
};

export type Env = {
  DB: D1Database;
  R2_ARTICLES: R2Bucket;
  CACHE_KV: KVNamespace;
  ENVIRONMENT?: string;
  DEV_BYPASS_AUTH?: string;
  DEV_USER_EMAIL?: string;
  CRON_REFRESH_LIMIT?: string;
};
