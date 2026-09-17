import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerCharacterHouseRoutes } from '../character_house_routes';
const state = { blueprint:null, progress:{completedDays:0,totalDays:365,todayContributed:false,currentUserCompletedToday:false,lastBlockDate:null},day:'2026-09-17' };
const dependencies = {getUserFromToken:vi.fn(),rpc:vi.fn()};
let app:Hono;
type Action = 'get' | 'start' | 'update';
const request = (action:Action='get',body?:unknown) => app.request(`/make-server-6d579fee/character-house${action === 'get' ? '' : `/${action}`}`,{
  method:action === 'get' ? 'GET' : 'POST', headers:{Authorization:'Bearer verified-token','Content-Type':'application/json'},
  ...(action === 'get' ? {} : {body:JSON.stringify(body)}),
});
describe('shared character house HTTP boundary',()=>{
  beforeEach(()=>{
    vi.clearAllMocks(); dependencies.getUserFromToken.mockResolvedValue('verified-user');
    dependencies.rpc.mockResolvedValue({data:state,error:null}); app=new Hono(); registerCharacterHouseRoutes(app,dependencies);
  });
  it.each<Action>(['get','start','update'])('requires verified identity before %s',async(action)=>{
    dependencies.getUserFromToken.mockResolvedValue(null);
    expect((await request(action,{homeType:'house',bedrooms:2})).status).toBe(401); expect(dependencies.rpc).not.toHaveBeenCalled();
  });
  it('loads only the authenticated pair with caching disabled',async()=>{
    const response=await request(); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual(state);
    expect(dependencies.rpc).toHaveBeenCalledWith('character_house',{p_user_id:'verified-user',p_action:'get',p_payload:{}});
  });
  it.each<Action>(['start','update'])('sends only the two design fields for %s',async(action)=>{
    await request(action,{homeType:'villa',bedrooms:4,userId:'victim',partnerId:'stranger',completedDays:365,startedAt:'2000-01-01',legacy_blueprint:{approvedBy:'me'}});
    expect(dependencies.rpc).toHaveBeenCalledWith('character_house',{p_user_id:'verified-user',p_action:action,p_payload:{homeType:'villa',bedrooms:4}});
  });
  it('rejects invalid start and update designs before persistence',async()=>{
    const invalid=[null,[],{},{homeType:'villa'},{bedrooms:4},{homeType:'castle',bedrooms:2},{homeType:'villa',bedrooms:2},{homeType:'house',bedrooms:6},
      {homeType:'house',bedrooms:'2'},{homeType:'house',bedrooms:2.5},{homeType:'apartment',bedrooms:5},
      {homeType:'townhouse',bedrooms:1},{homeType:'duplex',bedrooms:7},{homeType:'penthouse',bedrooms:1}];
    for(const action of ['start','update'] as const) for(const body of invalid) {
      const response=await request(action,body); expect(response.status).toBe(400);
    }
    expect(dependencies.rpc).not.toHaveBeenCalled();
  });
  it('preserves partner conflict',async()=>{
    dependencies.rpc.mockResolvedValue({data:{code:'partner_required'},error:null});
    expect((await request()).status).toBe(409);
  });
  it('reports an update before setup as a conflict',async()=>{
    dependencies.rpc.mockResolvedValue({data:{code:'house_not_started'},error:null});
    const response=await request('update',{homeType:'villa',bedrooms:4});
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({error:'Start your shared house before changing its design.',code:'house_not_started'});
  });
  it('fails closed without exposing database details when migration is missing',async()=>{
    dependencies.rpc.mockResolvedValue({data:null,error:{message:'private schema details'}});
    const response=await request(); expect(response.status).toBe(503);
    expect(await response.json()).toEqual({error:'Your shared house is temporarily unavailable. Please try again.',code:'unavailable'});
  });
});
