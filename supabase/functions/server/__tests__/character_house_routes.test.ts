import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerCharacterHouseRoutes } from '../character_house_routes';
const state = { blueprint:null, progress:{completedDays:0,totalDays:365,todayContributed:false,lastBlockDate:null},day:'2026-09-17' };
const dependencies = {getUserFromToken:vi.fn(),rpc:vi.fn()};
let app:Hono;
const request = (body?:unknown) => app.request(`/make-server-6d579fee/character-house${body === undefined ? '' : '/start'}`,{
  method:body === undefined ? 'GET' : 'POST', headers:{Authorization:'Bearer verified-token','Content-Type':'application/json'},
  ...(body === undefined ? {} : {body:JSON.stringify(body)}),
});
describe('shared character house HTTP boundary',()=>{
  beforeEach(()=>{
    vi.clearAllMocks(); dependencies.getUserFromToken.mockResolvedValue('verified-user');
    dependencies.rpc.mockResolvedValue({data:state,error:null}); app=new Hono(); registerCharacterHouseRoutes(app,dependencies);
  });
  it.each([undefined,{homeType:'house',bedrooms:2}])('requires verified identity before any read or write: %j',async(body)=>{
    dependencies.getUserFromToken.mockResolvedValue(null);
    expect((await request(body)).status).toBe(401); expect(dependencies.rpc).not.toHaveBeenCalled();
  });
  it('loads only the authenticated pair with caching disabled',async()=>{
    const response=await request(); expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual(state);
    expect(dependencies.rpc).toHaveBeenCalledWith('character_house',{p_user_id:'verified-user',p_action:'get',p_payload:{}});
  });
  it('discards caller identities, block counts, timestamps and legacy blueprint data',async()=>{
    await request({homeType:'villa',bedrooms:4,userId:'victim',partnerId:'stranger',completedDays:365,startedAt:'2000-01-01',legacy_blueprint:{approvedBy:'me'}});
    expect(dependencies.rpc).toHaveBeenCalledWith('character_house',{p_user_id:'verified-user',p_action:'start',p_payload:{homeType:'villa',bedrooms:4}});
  });
  it.each([null,[],{}, {homeType:'castle',bedrooms:2},{homeType:'villa',bedrooms:2},{homeType:'house',bedrooms:6},
    {homeType:'house',bedrooms:'2'},{homeType:'house',bedrooms:2.5},{homeType:'apartment',bedrooms:5},
    {homeType:'townhouse',bedrooms:1},{homeType:'duplex',bedrooms:7},{homeType:'penthouse',bedrooms:1}])('rejects invalid design before persistence: %j',async(body)=>{
      const response=await request(body); expect(response.status).toBe(400); expect(dependencies.rpc).not.toHaveBeenCalled();
  });
  it('preserves partner conflict',async()=>{
    dependencies.rpc.mockResolvedValue({data:{code:'partner_required'},error:null});
    expect((await request()).status).toBe(409);
  });
  it('fails closed without exposing database details when migration is missing',async()=>{
    dependencies.rpc.mockResolvedValue({data:null,error:{message:'private schema details'}});
    const response=await request(); expect(response.status).toBe(503);
    expect(await response.json()).toEqual({error:'Your shared house is temporarily unavailable. Please try again.',code:'unavailable'});
  });
});
