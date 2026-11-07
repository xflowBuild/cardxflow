# Neon setup (cardxflow)

1. Schema: `neon/migrations/001_init.sql` (already run).
2. Functions: `neon/functions/data-api.ts`, `neon/functions/ai-chat.ts` (shared `_auth.ts`).
3. Env vars (set in Neon, never in the browser):
   - `DATABASE_URL` – from `neon deploy` / Console
   - `NEON_AUTH_JWKS_URL` – Neon Auth JWKS URL
   - `AI_KEYS_SECRET` – `openssl rand -base64 32`
   - `APP_ORIGIN` – your site URL (CORS)
4. Deploy: `npm i @neondatabase/serverless jose` then `neon deploy`.
5. Approve a user: `update users set approved = true where email = '...';`
