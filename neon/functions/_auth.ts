// Shared: verify Neon Auth (Better Auth) JWT + approved check. Server-side only.
import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export const sql = neon(process.env.DATABASE_URL!);
const JWKS = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL!));

export const cors = {
  'Access-Control-Allow-Origin': process.env.APP_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
export const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
export const fail = (m: string, status: number) => Object.assign(new Error(m), { status });

export async function requireApprovedUser(req: Request) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw fail('Not authenticated', 401);
  const { payload } = await jwtVerify(token, JWKS);
  const id = String(payload.sub);
  await sql`insert into users (id, email, full_name)
            values (${id}, ${String(payload.email || '')}, ${(payload as any).name ?? null})
            on conflict (id) do nothing`;
  const [u] = await sql`select id, email, full_name, approved, is_admin from users where id = ${id}`;
  if (!u?.approved) throw fail('PENDING_APPROVAL', 403);
  return u;
}
