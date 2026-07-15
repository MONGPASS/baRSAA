import { D1Database, R2Bucket } from '@cloudflare/workers-types';

export type Bindings = {
    DB: D1Database;
    BUCKET: R2Bucket;
    SESSION_SECRET: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    BASE_URL?: string;
    ADMIN_USERNAME?: string;
    ADMIN_PASSWORD?: string;
    ASSETS: Fetcher;
};
