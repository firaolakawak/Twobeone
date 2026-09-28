/** Isolated PostgreSQL checks; pass a temporary @electric-sql/pglite dist/index.js. No live database. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const base = await readFile(new URL('../../../migrations/20260917220000_daily_faith_challenges.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../../../migrations/20260917230000_character_house_daily_progress.sql', import.meta.url), 'utf8');
const followup = await readFile(new URL('../../../migrations/20260917233000_character_house_completion_and_design_updates.sql', import.meta.url), 'utf8');
const partnerStatus = await readFile(new URL('../../../migrations/20260927120000_character_house_partner_completion_status.sql', import.meta.url), 'utf8');
const abuDhabiMidnight = await readFile(new URL('../../../migrations/20260928120000_daily_faith_challenge_abu_dhabi_midnight.sql', import.meta.url), 'utf8');
const ids = Array.from({ length: 18 }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`);
const [a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r] = ids;
const pair = (one,two) => [one,two].sort().join(':');
let checks = 0;
const check = async (name, fn) => { await fn(); checks++; console.log(`PASS ${name}`); };
const call = async (rpc, user, action, payload = {}) => (await db.query(`select public.${rpc}($1::uuid,$2,$3::jsonb) as value`, [user,action,JSON.stringify(payload)])).rows[0].value;
const house = (user, action = 'get', payload = {}) => call('character_house', user, action, payload);
const daily = (user, action = 'today', payload = {}) => call('daily_faith_challenge', user, action, payload);
const setClockAt = (instant) => db.query("select set_config('test.daily_faith_now', $1, false)", [instant]);
const setClock = (day) => setClockAt(`${day}T12:00:00Z`);
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
  await db.exec(followup);
  await db.exec(partnerStatus);
  // Model a house that earned its first block after a 21:00 UTC start under
  // the former UTC-day convention. The timezone migration must preserve it.
  await db.query(`insert into public.character_house_goals(
      couple_key,member_a,member_b,home_type,bedrooms,started_at
    ) values ($1,$2::uuid,$3::uuid,'house',2,'2026-09-17T21:00:00Z')`,[pair(m,n),m,n]);
  await db.query(`insert into public.daily_faith_challenges(
      couple_key,challenge_day,user_id,partner_id,mission_id,choice,guess,submitted_at,completed_at
    ) values
      ($1,'2026-09-17',$2::uuid,$3::uuid,'quest-01',1,2,'2026-09-17T21:01:00Z','2026-09-17T21:02:00Z'),
      ($1,'2026-09-17',$3::uuid,$2::uuid,'quest-01',2,1,'2026-09-17T21:01:00Z','2026-09-17T21:02:00Z')`,[pair(m,n),m,n]);
  await db.exec(abuDhabiMidnight);
  await check('migration chain compiles and only imports independently approved shared designs', async () => {
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
  for (const signature of [
    'public.daily_faith_challenge_answers(uuid,text,jsonb)',
    'public.character_house(uuid,text,jsonb)',
  ]) {
    const currentDefinition = (await db.query(
      'select pg_get_functiondef($1::regprocedure) as definition',
      [signature],
    )).rows[0].definition;
    const testDefinition = currentDefinition.replace(
      'v_now := clock_timestamp();',
      "v_now := current_setting('test.daily_faith_now')::timestamptz;",
    );
    assert.notEqual(testDefinition,currentDefinition);
    await db.exec(testDefinition);
  }
  await setClock('2026-09-17');
  await db.query("update public.character_house_goals set started_at='2026-09-17T08:00:00Z',started_challenge_day='2026-09-17' where couple_key <> $1",[pair(m,n)]);
  await check('private house table and helpers reject direct client access',async () => {
    for (const role of ['anon','authenticated']) {
      assert.equal((await db.query(`select has_table_privilege('${role}','public.character_house_goals','select') as allowed`)).rows[0].allowed,false);
      for (const signature of ['character_house(uuid,text,jsonb)','character_house_state(text,date)','character_house_legacy(uuid,uuid,text)','daily_faith_challenge_answers(uuid,text,jsonb)']) {
        assert.equal((await db.query('select has_function_privilege($1,$2,$3) as allowed',[role,`public.${signature}`,'execute'])).rows[0].allowed,false);
      }
      assert.equal((await db.query(
        "select has_function_privilege($1,'public.character_house_set_started_challenge_day()',$2) as allowed",
        [role,'execute'],
      )).rows[0].allowed,false);
    }
  });
  await check('timezone rollout preserves a first block earned under the former UTC day',async () => {
    await setClockAt('2026-09-17T20:00:00Z');
    const stored=(await db.query('select started_at::text,started_challenge_day::text from public.character_house_goals where couple_key=$1',[pair(m,n)])).rows[0];
    assert.equal(new Date(stored.started_at).toISOString(),'2026-09-17T21:00:00.000Z');
    assert.equal(stored.started_challenge_day,'2026-09-17');
    const state=await house(m);
    assert.equal(state.day,'2026-09-18');
    assert.equal(state.progress.completedDays,1);
    assert.equal(state.progress.lastBlockDate,'2026-09-17');
    await setClock('2026-09-17');
  });
  await check('unconfigured pair has no invented house or construction credit',async () => {
    assert.equal((await house(c)).blueprint,null);
    assert.equal((await daily(c)).challenge.house,null);
    assert.equal((await house(c)).progress.todayContributed,false);
    assert.equal((await house(c)).progress.currentUserCompletedToday,false);
    assert.equal((await house(c)).progress.partnerCompletedToday,false);
  });
  await check('invalid plans and forged progress are rejected or ignored',async () => {
    for (const action of ['start','update']) for (const plan of [{},{homeType:'villa'},{bedrooms:4},{homeType:'castle',bedrooms:2},{homeType:'house',bedrooms:0},{homeType:'villa',bedrooms:1.5},{homeType:'house',bedrooms:'2'},
      {homeType:'house',bedrooms:6},{homeType:'villa',bedrooms:2},{homeType:'apartment',bedrooms:5},{homeType:'duplex',bedrooms:2},
      {homeType:'townhouse',bedrooms:1},{homeType:'penthouse',bedrooms:6},null]) {
      assert.equal((await house(c,action,plan)).code,'invalid_house');
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
    assert.equal((await house(e,'update',{homeType:'townhouse',bedrooms:3})).code,'house_not_started');
  });
  await check('answers and one completed activity do not contribute; both completions earn exactly one',async () => {
    await answer(c); await answer(d);
    assert.equal((await daily(c)).challenge.house.completedDays,0);
    assert.equal((await house(c)).progress.currentUserCompletedToday,false);
    assert.equal((await house(c)).progress.partnerCompletedToday,false);
    const firstCompletion = await finish(c);
    assert.equal(firstCompletion.challenge.house.completedDays,0);
    assert.equal(firstCompletion.challenge.house.currentUserCompletedToday,true);
    assert.equal(firstCompletion.challenge.house.partnerCompletedToday,false);
    assert.equal((await house(c)).progress.currentUserCompletedToday,true);
    assert.equal((await house(c)).progress.partnerCompletedToday,false);
    assert.equal((await house(d)).progress.currentUserCompletedToday,false);
    assert.equal((await house(d)).progress.partnerCompletedToday,true);
    assert.equal((await daily(d)).challenge.house.currentUserCompletedToday,false);
    assert.equal((await daily(d)).challenge.house.partnerCompletedToday,true);
    const result = await finish(d);
    assert.equal(result.challenge.house.completedDays,1);
    assert.equal(result.challenge.house.todayContributed,true);
    assert.equal(result.challenge.house.currentUserCompletedToday,true);
    assert.equal(result.challenge.house.partnerCompletedToday,true);
    assert.equal((await daily(c)).challenge.house.completedDays,1);
    assert.equal((await daily(c)).challenge.house.partnerCompletedToday,true);
    assert.equal((await house(d)).progress.lastBlockDate,'2026-09-17');
  });
  await check('completion retries cannot create more than one shared block',async () => {
    for(let n=0;n<8;n++) await finish(n%2?c:d);
    assert.equal((await house(c)).progress.completedDays,1);
    assert.equal(Number((await db.query('select count(*) as count from public.daily_faith_challenges where couple_key=$1',[pair(c,d)])).rows[0].count),2);
  });
  await check('design updates preserve the shared start and all earned progress',async () => {
    const before=await house(c);
    const storedBefore=(await db.query('select started_at::text,baseline_days,baseline_last_day,legacy_blueprint from public.character_house_goals where couple_key=$1',[pair(c,d)])).rows[0];
    const updated=await house(c,'update',{homeType:'villa',bedrooms:4,completedDays:365,startedAt:'2000-01-01'});
    assert.equal(updated.blueprint.homeType,'villa');
    assert.equal(updated.blueprint.bedrooms,4);
    assert.equal(updated.blueprint.challengeStartedAt,before.blueprint.challengeStartedAt);
    assert.deepEqual(updated.progress,before.progress);
    assert.deepEqual((await db.query('select started_at::text,baseline_days,baseline_last_day,legacy_blueprint from public.character_house_goals where couple_key=$1',[pair(c,d)])).rows[0],storedBefore);
    assert.equal((await house(d)).blueprint.homeType,'villa');
    assert.equal((await house(d)).blueprint.bedrooms,4);
    assert.equal((await house(c,'update',{homeType:'villa',bedrooms:2})).code,'invalid_house');
    assert.equal((await house(c)).blueprint.bedrooms,4);
  });
  await check('missed days preserve progress and next shared completion adds one',async () => {
    await setClock('2026-09-18');
    assert.equal((await house(c)).progress.currentUserCompletedToday,false);
    assert.equal((await house(c)).progress.partnerCompletedToday,false);
    assert.equal((await daily(c)).challenge.house.currentUserCompletedToday,false);
    assert.equal((await daily(c)).challenge.house.partnerCompletedToday,false);
    await setClock('2026-09-20');
    assert.equal((await house(c)).progress.completedDays,1);
    assert.equal((await house(c)).progress.todayContributed,false);
    assert.equal((await house(c)).progress.currentUserCompletedToday,false);
    const result = await both(c,d);
    assert.equal(result.challenge.house.completedDays,2);
    assert.equal(result.challenge.house.currentUserCompletedToday,true);
  });
  await check('legacy credited day is not counted again, but next day adds to preserved baseline',async () => {
    await setClock('2026-09-17');
    const baselineToday=await house(a);
    assert.equal(baselineToday.progress.todayContributed,true);
    assert.equal(baselineToday.progress.currentUserCompletedToday,false);
    assert.equal(baselineToday.progress.partnerCompletedToday,false);
    assert.equal((await daily(a)).challenge.house.partnerCompletedToday,false);
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
  await check('Abu Dhabi midnight advances both challenge and house status at 20:00 UTC',async () => {
    await setClockAt('2026-09-17T19:59:59.999Z');
    const beforeMidnight=await daily(o);
    assert.equal(beforeMidnight.challenge.day,'2026-09-17');
    assert.equal(new Date(beforeMidnight.challenge.resetsAt).toISOString(),'2026-09-17T20:00:00.000Z');
    await house(o,'start',{homeType:'house',bedrooms:2});
    assert.equal((await both(o,p)).challenge.house.completedDays,1);
    assert.equal((await house(o)).progress.todayContributed,true);
    await both(q,r);

    await setClockAt('2026-09-17T20:00:00Z');
    const afterMidnight=await daily(o);
    assert.equal(afterMidnight.challenge.day,'2026-09-18');
    assert.equal(afterMidnight.challenge.missionId,'quest-02');
    assert.equal(new Date(afterMidnight.challenge.resetsAt).toISOString(),'2026-09-18T20:00:00.000Z');
    assert.equal(afterMidnight.challenge.own,null);
    assert.equal(afterMidnight.challenge.house.completedDays,1);
    assert.equal(afterMidnight.challenge.house.todayContributed,false);
    assert.equal((await house(o)).progress.currentUserCompletedToday,false);
    assert.equal((await house(o)).progress.partnerCompletedToday,false);
    assert.equal((await daily(o,'complete',{day:'2026-09-17',missionId:'quest-01'})).code,'day_changed');
    assert.equal((await both(o,p)).challenge.house.completedDays,2);
    const startedAfterMidnight=await house(q,'start',{homeType:'house',bedrooms:2});
    assert.equal(startedAfterMidnight.progress.completedDays,0);
    assert.equal((await db.query(
      'select started_challenge_day::text as day from public.character_house_goals where couple_key=$1',
      [pair(q,r)],
    )).rows[0].day,'2026-09-18');
  });
  await check('disconnection revokes house reads and writes and daily house access',async () => {
    await db.query("update public.user_profiles set kv_payload = kv_payload - 'partnerId' where id=$1::uuid",[c]);
    assert.equal((await house(d)).code,'partner_required');
    assert.equal((await house(c,'start',{homeType:'house',bedrooms:2})).code,'partner_required');
    assert.equal((await house(d,'update',{homeType:'house',bedrooms:2})).code,'partner_required');
    assert.equal((await daily(d)).code,'partner_required');
  });
  console.log(`\n${checks} isolated house SQL checks passed. PGlite uses one connection; true multi-session contention was not exercised.`);
} finally { await db.close(); }
