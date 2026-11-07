// CRUD for cards / folders / tags, always scoped to the approved user.
import { sql, json, cors, requireApprovedUser } from './_auth';

const TABLES: Record<string, string[]> = {
  cards: ['folder_id','title','color','content_blocks','tags','is_favorite','is_smart_card','metadata','order'],
  folders: ['name','color','parent_id','order'],
  tags: ['name','color'],
};
const q = (c: string) => `"${c}"`;
const val = (v: any) => (v && typeof v === 'object' && !(Array.isArray(v) && v.every(x => typeof x !== 'object'))) ? JSON.stringify(v) : v;

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const user = await requireApprovedUser(req);
    const { action, table, id, data = {}, sortBy } = await req.json();
    if (action === 'getProfile') return json(user);
    if (action === 'updateProfile') {
      const [u] = await sql`update users set full_name=${data.full_name ?? null}, updated_date=now()
                            where id=${user.id} returning id, email, full_name`;
      return json(u);
    }
    if (!TABLES[table]) return json({ error: 'Unknown table' }, 400);
    const cols = TABLES[table].filter(c => c in data);
    switch (action) {
      case 'list': {
        const desc = typeof sortBy === 'string' && sortBy.startsWith('-');
        const c = String(sortBy || '-created_date').replace(/^-/, '');
        const col = ['created_date','updated_date','order','name','title'].includes(c) ? c : 'created_date';
        return json(await sql.query(`select * from ${table} where user_id=$1 order by ${q(col)} ${desc ? 'desc' : 'asc'}`, [user.id]));
      }
      case 'get': {
        const r = await sql.query(`select * from ${table} where id=$1 and user_id=$2`, [id, user.id]);
        return r[0] ? json(r[0]) : json({ error: 'Not found' }, 404);
      }
      case 'create': {
        const names = ['user_id', ...cols].map(q).join(',');
        const ph = ['user_id', ...cols].map((_, i) => `$${i + 1}`).join(',');
        const r = await sql.query(`insert into ${table} (${names}) values (${ph}) returning *`, [user.id, ...cols.map(c => val(data[c]))]);
        return json(r[0]);
      }
      case 'update': {
        if (!cols.length) return json({ error: 'Nothing to update' }, 400);
        const set = cols.map((c, i) => `${q(c)}=$${i + 3}`).join(', ');
        const r = await sql.query(`update ${table} set ${set}, updated_date=now() where id=$1 and user_id=$2 returning *`, [id, user.id, ...cols.map(c => val(data[c]))]);
        return r[0] ? json(r[0]) : json({ error: 'Not found' }, 404);
      }
      case 'delete':
        await sql.query(`delete from ${table} where id=$1 and user_id=$2`, [id, user.id]);
        return json({ success: true });
      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (e: any) {
    return json({ error: e.message }, e.status || 500);
  }
}
