/**
 * Isolated PostgreSQL integration checks. Does not use credentials or network.
 * Install @electric-sql/pglite in a temporary directory, then run:
 * node supabase/functions/server/__tests__/faith_challenge_sql.mjs <absolute path to its dist/index.js>
 * PGlite has a single database connection: retry bursts are exercised, but this
 * is not a replacement for a multi-session production PostgreSQL lock test.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

if (!process.argv[2]) throw new Error('Pass the local PGlite module path; no live database is used.');
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const migration = await readFile(new URL('../../../migrations/20260917220000_daily_faith_challenges.sql', import.meta.url), 'utf8');
const houseMigration = await readFile(new URL('../../../migrations/20260917230000_character_house_daily_progress.sql', import.meta.url), 'utf8');
const completionMigration = await readFile(new URL('../../../migrations/20260917233000_character_house_completion_and_design_updates.sql', import.meta.url), 'utf8');
const partnerStatusMigration = await readFile(new URL('../../../migrations/20260927120000_character_house_partner_completion_status.sql', import.meta.url), 'utf8');
const abuDhabiMidnightMigration = await readFile(new URL('../../../migrations/20260928120000_daily_faith_challenge_abu_dhabi_midnight.sql', import.meta.url), 'utf8');
const ids = ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004'];
const [a, b, c, d] = ids;
let checks = 0;
const check = (name, fn) => async () => { await fn(); checks++; console.log(`PASS ${name}`); };
const rpc = async (user, action = 'today', payload = {}) => (
  await db.query('select public.daily_faith_challenge($1::uuid, $2, $3::jsonb) as value', [user, action, JSON.stringify(payload)])
).rows[0].value;
const count = async (table) => Number((await db.query(`select count(*) as count from public.${table}`)).rows[0].count);
const profile = async (user, partner, name = 'Partner') => db.query(
  'insert into public.user_profiles(id, kv_payload) values ($1::uuid, $2::jsonb) on conflict(id) do update set kv_payload = excluded.kv_payload',
  [user, JSON.stringify({ id: user, partnerId: partner, name })],
);
const clock = async (value) => db.query("select set_config('test.daily_faith_now', $1, false)", [value]);
const submit = (user, day = '2026-09-17', missionId = 'quest-01', choice = 1, extra = { guess: 2 }) => rpc(user, 'submit', { day, missionId, choice, ...extra });

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create table public.user_profiles (id uuid primary key, kv_payload jsonb not null);
    create table public.app_records (
      domain text not null, source_key text not null, record_type text not null,
      owner_id text, couple_id text, payload jsonb not null,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
      primary key (domain, source_key)
    ) partition by list(domain);
    create table public.app_notifications partition of public.app_records for values in ('notifications');
  `);
  // Execute the current migration chain first, including the real PostgreSQL clock.
  await db.exec(migration);
  await db.exec(houseMigration);
  await db.exec(completionMigration);
  await db.exec(partnerStatusMigration);
  await db.exec(abuDhabiMidnightMigration);
  await profile(a, b, 'Firaol'); await profile(b, a, 'Keti');
  await profile(c, d, 'Other A'); await profile(d, c, 'Other B');

  await check('current migration chain compiles and uses the Abu Dhabi civil date', async () => {
    const result = await rpc(a);
    const actual = (await db.query("select (clock_timestamp() at time zone 'Asia/Dubai')::date::text as day")).rows[0].day;
    assert.equal(result.challenge.day, actual);
    assert.equal(result.challenge.own, null);
    const expectedReset = (await db.query(
      "select (($1::date + 1)::timestamp at time zone 'Asia/Dubai')::text as reset",
      [result.challenge.day],
    )).rows[0].reset;
    assert.equal(new Date(result.challenge.resetsAt).toISOString(), new Date(expectedReset).toISOString());
  })();

  // Inject only the clock read in this disposable database to cover all days,
  // Abu Dhabi midnight boundaries and three mission modes without waiting.
  const currentDefinition = (await db.query(
    "select pg_get_functiondef('public.daily_faith_challenge_answers(uuid,text,jsonb)'::regprocedure) as definition",
  )).rows[0].definition;
  const testDefinition = currentDefinition.replace(
    'v_now := clock_timestamp();',
    "v_now := current_setting('test.daily_faith_now')::timestamptz;",
  );
  assert.notEqual(testDefinition, currentDefinition);
  await db.exec(testDefinition);
  await clock('2026-09-17T12:00:00Z');

  await check('private table and RPC are accessible only to service role', async () => {
    const result = (await db.query(`select
      has_table_privilege('authenticated', 'public.daily_faith_challenges', 'select') as table_read,
      has_table_privilege('anon', 'public.daily_faith_challenges', 'insert') as table_write,
      has_function_privilege('authenticated', 'public.daily_faith_challenge(uuid,text,jsonb)', 'execute') as rpc_user,
      has_function_privilege('anon', 'public.daily_faith_challenge(uuid,text,jsonb)', 'execute') as rpc_anon,
      has_function_privilege('service_role', 'public.daily_faith_challenge(uuid,text,jsonb)', 'execute') as rpc_service
    `)).rows[0];
    assert.deepEqual(result, { table_read: false, table_write: false, rpc_user: false, rpc_anon: false, rpc_service: true });
  })();

  await check('mutual links are required even with a valid user identity', async () => {
    await profile(a, null);
    assert.equal((await rpc(a)).code, 'partner_required');
    assert.equal((await rpc(b)).code, 'partner_required');
    await profile(a, 'not-a-uuid');
    assert.equal((await rpc(a)).code, 'partner_required');
    await profile(a, a);
    assert.equal((await rpc(a)).code, 'partner_required');
    await profile(a, b, 'Firaol');
  })();

  await check('stale day, wrong mission and incomplete heart answer do not write', async () => {
    assert.equal((await submit(a, '2026-09-16')).code, 'day_changed');
    assert.equal((await submit(a, '2026-09-17', 'quest-02')).code, 'mission_changed');
    assert.equal((await submit(a, '2026-09-17', 'quest-01', 0, {})).code, 'invalid_submission');
    assert.equal((await submit(a, '2026-09-17', 'quest-01', '1')).code, 'invalid_submission');
    assert.equal((await submit(a, '2026-09-17', 'quest-01', 4)).code, 'invalid_submission');
    assert.equal(await count('daily_faith_challenges'), 0);
    assert.equal(await count('app_records'), 0);
  })();

  await check('failed notification persistence rolls back the answer', async () => {
    await db.exec("alter table public.app_records add constraint test_reject_notification check (record_type <> 'notification')");
    await assert.rejects(() => submit(a));
    assert.equal(await count('daily_faith_challenges'), 0);
    await db.exec('alter table public.app_records drop constraint test_reject_notification');
  })();

  await check('first submission sends one waiting notice and hides answer from partner', async () => {
    const result = await submit(a);
    assert.equal(result.challenge.own.choice, 1);
    assert.equal(result.notification.recipientId, b);
    assert.equal(result.notification.data.readyToReveal, false);
    assert.match(result.notification.message, /waiting for you/);
    const partnerView = (await rpc(b)).challenge;
    assert.equal(partnerView.own, null);
    assert.equal(partnerView.partner.submitted, true);
    assert.equal(Object.hasOwn(partnerView.partner, 'choice'), false);
    assert.equal(Object.hasOwn(partnerView.partner, 'guess'), false);
    assert.equal(await count('app_notifications'), 1);
    const stored = (await db.query("select source_key, payload from public.app_records where domain = 'notifications'")).rows[0];
    assert.equal(stored.source_key, `notification:${b}:${result.notification.id}`);
    assert.equal(stored.payload.isRead, false);
    assert.equal(stored.payload.type, 'faith_challenge');
  })();

  await check('retry bursts preserve immutable first choice and deduplicate notices', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, (_, index) => submit(a, '2026-09-17', 'quest-01', index % 3)));
    for (const result of results) {
      assert.equal(result.challenge.own.choice, 1);
      assert.equal(result.notification, null);
    }
    assert.equal(await count('daily_faith_challenges'), 1);
    assert.equal(await count('app_records'), 1);
  })();

  await check('other couples cannot see answers or complete someone else’s round', async () => {
    const other = (await rpc(c)).challenge;
    assert.equal(other.own, null);
    assert.equal(other.partner.submitted, false);
    assert.equal((await rpc(c, 'complete', { day: '2026-09-17', missionId: 'quest-01' })).code, 'waiting_for_partner');
    assert.equal((await rpc(a, 'complete', { day: '2026-09-17', missionId: 'quest-01' })).code, 'waiting_for_partner');
  })();

  await check('second answer reveals both choices and sends one ready notice', async () => {
    const result = await submit(b, '2026-09-17', 'quest-01', 0, { guess: 1 });
    assert.equal(result.challenge.bothSubmitted, true);
    assert.equal(result.challenge.partner.choice, 1);
    assert.equal(result.challenge.partner.guess, 2);
    assert.equal(result.notification.data.readyToReveal, true);
    assert.match(result.notification.message, /ready to reveal/);
    const first = (await rpc(a)).challenge;
    assert.equal(first.partner.choice, 0);
    assert.equal(first.partner.guess, 1);
    await submit(b);
    assert.equal(await count('app_records'), 2);
  })();

  await check('completion is personal and idempotent', async () => {
    const body = { day: '2026-09-17', missionId: 'quest-01' };
    const first = (await rpc(a, 'complete', body)).challenge;
    assert.ok(first.own.completedAt);
    assert.equal(first.partner.completed, false);
    await clock('2026-09-17T15:00:00Z');
    const again = (await rpc(a, 'complete', body)).challenge;
    assert.equal(again.own.completedAt, first.own.completedAt);
    assert.equal((await rpc(b)).challenge.partner.completed, true);
    assert.equal(await count('app_records'), 2);
  })();

  await check('disconnect immediately revokes access to previously shared answers', async () => {
    await profile(b, null);
    assert.equal((await rpc(a)).code, 'partner_required');
    assert.equal((await submit(a)).code, 'partner_required');
    assert.equal((await rpc(b)).code, 'partner_required');
    await profile(b, a, 'Keti');
  })();

  await check('Abu Dhabi midnight resets the challenge and rejects stale open cards', async () => {
    await clock('2026-09-17T19:59:59.999Z');
    assert.equal((await rpc(a)).challenge.day, '2026-09-17');
    await clock('2026-09-17T20:00:00Z');
    const today = (await rpc(a)).challenge;
    assert.equal(today.day, '2026-09-18');
    assert.equal(today.missionId, 'quest-02');
    assert.equal(today.own, null);
    assert.equal(today.partner.submitted, false);
    assert.equal(new Date(today.resetsAt).toISOString(), '2026-09-18T20:00:00.000Z');
    assert.equal((await submit(a)).code, 'day_changed');
    assert.equal((await rpc(a, 'complete', { day: '2026-09-17', missionId: 'quest-01' })).code, 'day_changed');
  })();

  await check('grace saves without a guess and kindness requires an actual-action acknowledgement', async () => {
    const grace = await submit(a, '2026-09-18', 'quest-02', 2, {});
    assert.equal(grace.challenge.own.choice, 2);
    assert.equal(Object.hasOwn(grace.challenge.own, 'guess'), false);
    await clock('2026-09-19T12:00:00Z');
    assert.equal((await submit(a, '2026-09-19', 'quest-03', 1, {})).code, 'invalid_submission');
    assert.equal((await submit(a, '2026-09-19', 'quest-03', 1, { kindnessDone: 'true' })).code, 'invalid_submission');
    assert.equal((await submit(a, '2026-09-19', 'quest-03', 1, { kindnessDone: true })).challenge.own.choice, 1);
  })();

  await check('rotation covers 30 missions and wraps on Abu Dhabi civil dates', async () => {
    const seen = new Set();
    for (let day = 0; day <= 30; day++) {
      const time = new Date(Date.UTC(2026, 8, 17 + day, 2)).toISOString();
      await clock(time);
      const mission = (await rpc(c)).challenge.missionId;
      assert.equal(mission, `quest-${String(day % 30 + 1).padStart(2, '0')}`);
      seen.add(mission);
    }
    assert.equal(seen.size, 30);
  })();
  console.log(JSON.stringify({ passed: checks, liveDatabaseAccess: false, engine: 'PGlite PostgreSQL (single connection)' }));
} finally {
  await db.close();
}
