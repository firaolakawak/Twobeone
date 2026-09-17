import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import {getAccessToken} from '../api';
import {characterHouseApi,parseCharacterHouse} from '../characterHouseApi';
vi.mock('../api',()=>({getAccessToken:vi.fn()}));
vi.mock('../supabase/info',()=>({projectId:'test-project'}));
const initial = {blueprint:null,progress:{completedDays:0,totalDays:365,todayContributed:false,lastBlockDate:null},day:'2026-09-17'};
const active = {...initial,blueprint:{homeType:'house',bedrooms:2,homeName:'Our house',blueprintStatus:'active',locked:true,completedDays:1,challengeStartedAt:'2026-09-17T12:00:00Z'},
  progress:{completedDays:1,totalDays:365,todayContributed:true,lastBlockDate:'2026-09-17'}};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
describe('character house client boundary',()=>{
  beforeEach(()=>{
    vi.mocked(getAccessToken).mockReset().mockResolvedValue('verified-token');vi.stubGlobal('fetch',vi.fn().mockResolvedValue(respond(initial)));
  });
  afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
  it('requires authentication and uses the real shared-house route',async()=>{
    expect(await characterHouseApi.get()).toEqual(initial);
    expect(fetch).toHaveBeenCalledWith('https://test-project.supabase.co/functions/v1/make-server-6d579fee/character-house',expect.objectContaining({method:'GET',headers:{Authorization:'Bearer verified-token','Content-Type':'application/json'}}));
    vi.mocked(getAccessToken).mockResolvedValueOnce(null);
    await expect(characterHouseApi.get()).rejects.toMatchObject({code:'unauthorized'});
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('sends only the two setup answers with no automatic retry',async()=>{
    vi.useFakeTimers();vi.mocked(fetch).mockResolvedValueOnce(respond(active));
    await characterHouseApi.start({homeType:'house',bedrooms:2,completedDays:365} as any);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/character-house/start'),expect.objectContaining({method:'POST',body:JSON.stringify({homeType:'house',bedrooms:2})}));
    await vi.advanceTimersByTimeAsync(60_000);expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([null,{}, {...initial,day:'2026-02-30'},{...initial,progress:{...initial.progress,completedDays:5}},
    {...active,progress:{...active.progress,completedDays:366}}, {...active,progress:{...active.progress,lastBlockDate:'2026-09-16'}},
    {...active,blueprint:{...active.blueprint,completedDays:0}}, {...active,blueprint:{...active.blueprint,challengeStartedAt:'tomorrow'}},
    {...active,blueprint:{...active.blueprint,homeType:'castle'}}])('rejects malformed or inconsistent progress: %j',(body)=>{
      expect(()=>parseCharacterHouse(body)).toThrow('invalid_response');
  });
  it('preserves server error codes and does not simulate successful setup',async()=>{
    vi.mocked(fetch).mockResolvedValueOnce(respond({code:'partner_required'},409));
    await expect(characterHouseApi.start({homeType:'house',bedrooms:2})).rejects.toMatchObject({code:'partner_required'});
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('accepts unconfigured legacy design prefill without importing client credits',()=>{
    expect(parseCharacterHouse({...initial,blueprint:{...active.blueprint,blueprintStatus:'pending',locked:false,completedDays:0}}).progress.completedDays).toBe(0);
  });
  it('cancels a stale read',async()=>{
    vi.mocked(fetch).mockImplementationOnce(async(_url,options)=>new Promise((_resolve,reject)=>{
      options!.signal!.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
    }));
    const controller=new AbortController(); const pending=characterHouseApi.get(controller.signal);
    await Promise.resolve();controller.abort();await expect(pending).rejects.toMatchObject({name:'AbortError'});
  });
});
