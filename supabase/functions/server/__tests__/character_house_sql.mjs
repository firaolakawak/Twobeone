/** Isolated PostgreSQL checks; pass a temporary @electric-sql/pglite dist/index.js. No live database. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const base = await readFile(new URL('../../../migrations/20260917220000_daily_faith_challenges.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../../../migrations/20260917230000_character_house_daily_progress.sql', import.meta.url), 'utf8');
const ids = Array.from({ length: 12 }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`);
const [a,b,c,d,e,f,g,h,i,j,k,l] = ids;
const pair = (one,two) => [one,two].sort().join(':');
let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS ${name}`); };
const call = async (rpc, user, action, payload = {}) => (await db.query(`select public.${rpc}($1::uuid,$2,$3::jsonb) as value`, [user,action,JSON.stringify(payload)])).rows[0].value;
const house = (user, action = 'get', payload = {}) => call('character_house', user, action, payload);
const daily = (user, action = 'today', payload = {}) => call('daily_faith_challenge', user, action, payload);
const setClock = (day) => db.query("select set_config('test.daily_faith_now', $1, false)", [`${day}T12:00:00Z`]);
const finish = async (user) => {
  const state = (await daily(user)).challenge;
  return daily(user,'complete',{day:state.day,missionId:state.missionId});
};
const answer = async (user) => {
  const state = (await daily(user)).challenge;
  return daily(user,'submit',{day:state.day,missionId:state.missionId,choice:1,guess:2,kindnessDone:true});
};
const both = async (one,two) => { await answer(one); await answer(two); await finish(one); return finish(two); };
const oldRecord = (one,two,status,extra = {}) => ({ homeType:'villa',bedrooms:4,homeName:'Saved home',blueprintStatus:status,
  submittedBy:one,approvedBy:status === 'active' ? two : null,finishes:{wallPaint:'#112233'},completedDays:12,...extra });
const storeLegacy = (one,two,value) => db.query("insert into public.app_records(domain,source_key,record_type,payload) values ('unclassified',$1,'character-house',$2::jsonb)", [`character-house:${pair(one,two)}`,JSON.stringify(value)]);
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create table public.user_profiles(id uuid primary key,kv_payload jsonb not null);
    create table public.app_records(domain text not null,source_key text not null,record_type text not null,owner_id text,
      couple_id text,payload jsonb not null,created_at timestamptz default now(),updated_at timestamptz default now(),primary key(domain,source_key));`);
  for (let n = 0; n < ids.length; n += 2) {
    await db.query('insert into public.user_profiles values ($1::uuid,$2::jsonb),($3::uuid,$4::jsonb)', [ids[n],JSON.stringify({partnerId:ids[n+1],name:'One'}),ids[n+1],JSON.stringify({partnerId:ids[n],name:'Two'})]);
  }
  const preserved = oldRecord(a,b,'active',{lastBlockDate:'2026-09-17'});
  await storeLegacy(a,b,preserved);
  await storeLegacy(e,f,oldRecord(e,f,'pending',{completedDays:88}));
  await storeLegacy(g,h,oldRecord(g,h,'active',{completedDays:5,lastBlockDate:'2026-99-88'}));
  await storeLegacy(i,j,oldRecord(i,j,'active',{approvedBy:i}));
  await storeLegacy(k,l,oldRecord(k,l,'active',{completedDays:5,lastBlockDate:'9999-01-01'}));
  await db.exec(base);
  await db.exec(migration);
  await check('unmodified migration compiles and only imports independently approved shared designs', async () => {
    assert.equal((await house(a)).progress.completedDays,12);
    assert.equal((await house(g)).progress.completedDays,5);
    assert.equal((await house(g)).progress.lastBlockDate,null);
    assert.equal((await house(k)).progress.lastBlockDate,null);
    assert.equal((await house(i)).blueprint,null);
    assert.equal((await house(e)).blueprint.locked,false);
    assert.equal((await house(e)).progress.completedDays,0);
    assert.deepEqual((await db.query('select payload from public.app_records where source_key=$1',[`character-house:${pair(a,b)}`])).rows[0].payload,preserved);
  });
  // Replace only clock reads in this disposable database for deterministic days.
  const core = base.slice(base.indexOf('create or replace function public.daily_faith_challenge('))
    .replaceAll('public.daily_faith_challenge(', 'public.daily_faith_challenge_answers(')
    .replace('v_now := clock_timestamp();', "v_now := current_setting('test.daily_faith_now')::timestamptz;");
  await db.exec(core);
  const houseStart = migration.indexOf('create function public.character_house(p_user_id');
  const houseEnd = migration.indexOf('-- Keep answer privacy',houseStart);
  await db.exec(migration.slice(houseStart,houseEnd).replace('create function','create or replace function').replace('v_now := clock_timestamp();',"v_now := current_setting('test.daily_faith_now')::timestamptz;"));
  await setClock('2026-09-17');
  await db.query("update public.character_house_goals set started_at='2026-09-17T08:00:00Z'");
  await check('private house table and helpers reject direct client access',async () => {
    for (const role of ['anon','authenticated']) {
      assert.equal((await db.query(`select has_table_privilege('${role}','public.character_house_goals','select') as allowed`)).rows[0].allowed,false);
      for (const signature of ['character_house(uuid,text,jsonb)','character_house_state(text,date)','character_house_legacy(uuid,uuid,text)','daily_faith_challenge_answers(uuid,text,jsonb)']) {
        assert.equal((await db.query('select has_function_privilege($1,$2,$3) as allowed',[role,`public.${signature}`,'execute'])).rows[0].allowed,false);
      }
    }
  });
  await check('unconfigured pair has no invented house or construction credit',async () => {
    assert.equal((await house(c)).blueprint,null);
    assert.equal((await daily(c)).challenge.house,null);
    assert.equal((await house(c)).progress.todayContributed,false);
  });
  await check('invalid plans and forged progress are rejected or ignored',async () => {
    for (const plan of [{homeType:'castle',bedrooms:2},{homeType:'house',bedrooms:0},{homeType:'villa',bedrooms:1.5},{homeType:'house',bedrooms:'2'},
      {homeType:'house',bedrooms:6},{homeType:'villa',bedrooms:2},{homeType:'apartment',bedrooms:5},{homeType:'duplex',bedrooms:2},
      {homeType:'townhouse',bedrooms:1},{homeType:'penthouse',bedrooms:6},null]) {
      assert.equal((await house(c,'start',plan)).code,'invalid_house');
    }
    const result = await house(c,'start',{homeType:'house',bedrooms:2,completedDays:365,startedAt:'2000-01-01'});
    assert.equal(result.progress.completedDays,0);
    assert.equal(result.blueprint.locked,true);
    assert.equal(new Date(result.blueprint.challengeStartedAt).toISOString(),'2026-09-17T12:00:00.000Z');
  });
  await check('first plan wins across the two partners and retry bursts',async () => {
    for (let n=0;n<8;n++) {
      const result = await house(n%2?c:d,'start',{homeType:'penthouse',bedrooms:5});
      assert.equal(result.blueprint.homeType,'house');
      assert.equal(result.blueprint.bedrooms,2);
    }
    assert.equal((await house(a,'start',{homeType:'apartment',bedrooms:1})).blueprint.homeType,'villa');
  });
  await check('answers and one completed activity do not contribute; both completions earn exactly one',async () => {
    await answer(c); await answer(d);
    assert.equal((await daily(c)).challenge.house.completedDays,0);
    assert.equal((await finish(c)).challenge.house.completedDays,0);
    const result = await finish(d);
    assert.equal(result.challenge.house.completedDays,1);
    assert.equal(result.challenge.house.todayContributed,true);
    assert.equal((await daily(c)).challenge.house.completedDays,1);
    assert.equal((await house(d)).progress.lastBlockDate,'2026-09-17');
  });
  await check('completion retries cannot create more than one shared block',async () => {
    for(let n=0;n<8;n++) await finish(n%2?c:d);
    assert.equal((await house(c)).progress.completedDays,1);
    assert.equal(Number((await db.query('select count(*) as count from public.daily_faith_challenges where couple_key=$1',[pair(c,d)])).rows[0].count),2);
  });
  await check('missed days preserve progress and next shared completion adds one',async () => {
    await setClock('2026-09-20');
    assert.equal((await house(c)).progress.completedDays,1);
    assert.equal((await house(c)).progress.todayContributed,false);
    assert.equal((await both(c,d)).challenge.house.completedDays,2);
  });
  await check('legacy credited day is not counted again, but next day adds to preserved baseline',async () => {
    await setClock('2026-09-17');
    assert.equal((await both(a,b)).challenge.house.completedDays,12);
    assert.equal((await house(a)).progress.todayContributed,true);
    await setClock('2026-09-18');
    assert.equal((await both(a,b)).challenge.house.completedDays,13);
    assert.deepEqual((await house(a)).blueprint.finishes,{wallPaint:'#112233'});
  });
  await check('starting after today’s activity includes today once and excludes earlier activities',async () => {
    await setClock('2026-09-18'); await both(e,f);
    await setClock('2026-09-20'); await both(e,f);
    const state=await house(e,'start',{homeType:'townhouse',bedrooms:3});
    assert.equal(state.blueprint.locked,true);
    assert.equal(state.progress.completedDays,1);
    assert.equal(state.progress.todayContributed,true);
    assert.equal(state.blueprint.homeType,'townhouse');
    assert.equal((await db.query('select payload from public.app_records where source_key=$1',[`character-house:${pair(e,f)}`])).rows[0].payload.completedDays,88);
  });
  await check('goal caps at365 and later days do not pretend to add another block',async () => {
    await db.query('update public.character_house_goals set baseline_days=364 where couple_key=$1',[pair(g,h)]);
    await setClock('2026-09-20');
    assert.equal((await both(g,h)).challenge.house.completedDays,365);
    await setClock('2026-09-21');
    const result = await both(g,h);
    assert.equal(result.challenge.house.completedDays,365);
    assert.equal(result.challenge.house.todayContributed,false);
    assert.equal(result.challenge.house.lastBlockDate,'2026-09-20');
  });
  await check('future legacy dates cannot freeze progress',async () => {
    await setClock('2026-09-20');
    assert.equal((await both(k,l)).challenge.house.completedDays,6);
  });
  await check('approved legacy data discovered after migration is safely adopted by start',async () => {
    await db.query('update public.app_records set payload=$2::jsonb where source_key=$1',[
      `character-house:${pair(i,j)}`,JSON.stringify(oldRecord(i,j,'active',{completedDays:23,lastBlockDate:'2099-09-17'}))]);
    const before=await house(i);
    assert.equal(before.blueprint.locked,false);
    assert.equal(before.blueprint.blueprintStatus,'pending');
    const started=await house(i,'start',{homeType:'apartment',bedrooms:1});
    assert.equal(started.blueprint.homeType,'villa');
    assert.equal(started.blueprint.bedrooms,4);
    assert.equal(started.progress.completedDays,23);
    assert.equal(started.progress.lastBlockDate,null);
    assert.equal((await both(i,j)).challenge.house.completedDays,24);
  });
  await check('disconnection revokes house reads and writes and daily house access',async () => {
    await db.query("update public.user_profiles set kv_payload = kv_payload - 'partnerId' where id=$1::uuid",[c]);
    assert.equal((await house(d)).code,'partner_required');
    assert.equal((await house(c,'start',{homeType:'house',bedrooms:2})).code,'partner_required');
    assert.equal((await daily(d)).code,'partner_required');
  });
  console.log(`\n${checks} isolated house SQL checks passed. PGlite uses one connection; true multi-session contention was not exercised.`);
} finally { await db.close(); }
