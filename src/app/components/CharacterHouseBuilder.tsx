import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Check,
  Hammer,
  Home,
  Layers3,
  Minus,
  Plus,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

export type HomeType = 'house' | 'villa' | 'townhouse' | 'apartment' | 'duplex' | 'penthouse';
type InteriorStyle = 'warm-modern' | 'ethiopian-heritage' | 'peaceful-minimalist';
type ViewerMode = 'current' | 'blueprint';

interface HomeDefinition {
  id: HomeType;
  name: string;
  description: string;
  floorRange: [number, number];
  bedroomRange: [number, number];
  bathroomRange: [number, number];
  defaults: Pick<HouseConfig, 'floors' | 'bedrooms' | 'bathrooms'>;
  shape: 'pitched' | 'villa' | 'narrow' | 'tower' | 'split' | 'terrace';
}

interface HouseConfig {
  homeType: HomeType;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  interiorStyle: InteriorStyle;
  homeName: string;
  completedDays: number;
  lastBlockDate?: string;
}

export interface Room {
  id: string;
  name: string;
  meaning: string;
  kind: 'living' | 'bedroom' | 'service' | 'faith' | 'outdoor';
  span?: number;
}

const CharacterHouse3D = lazy(() => import('./CharacterHouse3D').then(module => ({ default: module.CharacterHouse3D })));

export const HOME_DEFINITIONS: HomeDefinition[] = [
  { id: 'house', name: 'House', description: 'Warm and welcoming', floorRange: [1, 2], bedroomRange: [1, 5], bathroomRange: [1, 4], defaults: { floors: 2, bedrooms: 3, bathrooms: 2 }, shape: 'pitched' },
  { id: 'villa', name: 'Villa', description: 'Spacious and hospitable', floorRange: [1, 3], bedroomRange: [3, 7], bathroomRange: [2, 6], defaults: { floors: 2, bedrooms: 5, bathrooms: 4 }, shape: 'villa' },
  { id: 'townhouse', name: 'Townhouse', description: 'Compact vertical living', floorRange: [2, 3], bedroomRange: [2, 5], bathroomRange: [2, 4], defaults: { floors: 3, bedrooms: 3, bathrooms: 2 }, shape: 'narrow' },
  { id: 'apartment', name: 'Apartment', description: 'Peaceful urban home', floorRange: [1, 1], bedroomRange: [1, 4], bathroomRange: [1, 3], defaults: { floors: 1, bedrooms: 2, bathrooms: 2 }, shape: 'tower' },
  { id: 'duplex', name: 'Duplex', description: 'Two lives, one home', floorRange: [2, 3], bedroomRange: [3, 6], bathroomRange: [2, 5], defaults: { floors: 2, bedrooms: 4, bathrooms: 3 }, shape: 'split' },
  { id: 'penthouse', name: 'Penthouse', description: 'Light-filled rooftop home', floorRange: [1, 2], bedroomRange: [2, 5], bathroomRange: [2, 5], defaults: { floors: 1, bedrooms: 3, bathrooms: 3 }, shape: 'terrace' },
];

const INTERIOR_STYLES: Array<{ id: InteriorStyle; name: string; colors: string[] }> = [
  { id: 'warm-modern', name: 'Warm Modern', colors: ['#e8d8c2', '#c69b6d', '#7a5135', '#6e846a'] },
  { id: 'ethiopian-heritage', name: 'Ethiopian Heritage', colors: ['#d7a05d', '#a64f32', '#695044', '#d6c1a4'] },
  { id: 'peaceful-minimalist', name: 'Peaceful Minimalist', colors: ['#eeeae2', '#c8c2b7', '#8f9692', '#4d5b58'] },
];

const STAGES = [
  { end: 40, name: 'Foundation', verse: 'Psalm 127:1' },
  { end: 70, name: 'Floors', verse: 'Luke 6:48' },
  { end: 115, name: 'Framework', verse: 'Proverbs 24:3' },
  { end: 170, name: 'Walls', verse: 'Nehemiah 2:18' },
  { end: 200, name: 'Doors & Windows', verse: 'Colossians 4:3' },
  { end: 240, name: 'Roof', verse: 'Psalm 91:1' },
  { end: 295, name: 'Rooms', verse: 'Romans 12:10' },
  { end: 325, name: 'Light & Water', verse: 'Matthew 5:14' },
  { end: 350, name: 'Interior & Garden', verse: 'Galatians 5:22–23' },
  { end: 365, name: 'Dedication', verse: 'Joshua 24:15' },
] as const;

const STORAGE_KEY = 'twobeone_character_house_prototype_v1';

const DEFAULT_CONFIG: HouseConfig = {
  homeType: 'villa',
  floors: 2,
  bedrooms: 4,
  bathrooms: 3,
  interiorStyle: 'warm-modern',
  homeName: 'House of Grace',
  completedDays: 14,
};

export function clampToRange(value: number, range: [number, number]) {
  return Math.min(range[1], Math.max(range[0], value));
}

export function getConstructionStage(completedDays: number) {
  const safeDays = Math.min(365, Math.max(0, Math.floor(completedDays)));
  const index = STAGES.findIndex(stage => safeDays < stage.end);
  return STAGES[index === -1 ? STAGES.length - 1 : index];
}

export function createFloorRooms(config: Pick<HouseConfig, 'floors' | 'bedrooms' | 'bathrooms' | 'homeType'>): Room[][] {
  const floors = Array.from({ length: config.floors }, () => [] as Room[]);
  const add = (floor: number, room: Room) => floors[Math.min(floors.length - 1, floor)].push(room);

  add(0, { id: 'living', name: 'Living Room', meaning: 'Fellowship and communication', kind: 'living', span: 2 });
  add(0, { id: 'kitchen', name: 'Kitchen', meaning: 'Service and daily provision', kind: 'service' });
  add(0, { id: 'prayer', name: config.homeType === 'apartment' ? 'Prayer Corner' : 'Prayer Room', meaning: 'Worship and dependence on God', kind: 'faith' });
  if (config.homeType !== 'apartment') add(0, { id: 'entry', name: 'Welcome', meaning: 'Hospitality and openness', kind: 'outdoor' });

  for (let index = 0; index < config.bedrooms; index += 1) {
    const floor = config.floors === 1 ? 0 : 1 + (index % (config.floors - 1));
    add(floor, { id: `bed-${index}`, name: index === 0 ? 'Primary Bedroom' : `Bedroom ${index + 1}`, meaning: 'Trust, rest, and care', kind: 'bedroom' });
  }
  for (let index = 0; index < config.bathrooms; index += 1) {
    const floor = index % config.floors;
    add(floor, { id: `bath-${index}`, name: index === 0 ? 'Bathroom' : `Bathroom ${index + 1}`, meaning: 'Renewal and healthy care', kind: 'service' });
  }
  if (config.homeType === 'villa' || config.homeType === 'penthouse') {
    add(config.floors - 1, { id: 'terrace', name: 'Terrace', meaning: 'Vision and shared dreams', kind: 'outdoor', span: 2 });
  }
  if (config.homeType === 'duplex') {
    add(0, { id: 'family', name: 'Family Room', meaning: 'Unity across generations', kind: 'living' });
  }
  return floors;
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function loadConfig(): HouseConfig {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || !HOME_DEFINITIONS.some(home => home.id === parsed.homeType)) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...parsed, completedDays: clampToRange(Number(parsed.completedDays) || 0, [0, 365]) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function MiniHome({ home, selected }: { home: HomeDefinition; selected: boolean }) {
  const isFlat = home.shape === 'tower' || home.shape === 'terrace';
  const isNarrow = home.shape === 'narrow';
  const isSplit = home.shape === 'split';
  return (
    <div className="relative mx-auto h-24 w-full max-w-[9rem]" aria-hidden="true">
      <div className="absolute inset-x-2 bottom-1 h-4 rounded-[50%] bg-emerald-900/10 blur-sm" />
      {home.shape === 'tower' && <div className="absolute bottom-3 left-1/2 h-[4.6rem] w-[6.5rem] -translate-x-1/2 rounded-t-lg border border-stone-300 bg-stone-100 shadow-lg" />}
      <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 border border-stone-300 bg-gradient-to-br from-amber-50 to-stone-200 shadow-lg ${isNarrow ? 'h-16 w-14' : isSplit ? 'h-12 w-28' : 'h-14 w-24'} ${isFlat ? 'rounded-t-md' : ''}`}>
        <div className="grid h-full grid-cols-3 gap-1 p-2">
          {Array.from({ length: isNarrow ? 6 : 5 }).map((_, index) => <span key={index} className={`rounded-sm ${selected ? 'bg-amber-300/80' : 'bg-sky-200/80'}`} />)}
        </div>
      </div>
      {!isFlat && <div className={`absolute left-1/2 -translate-x-1/2 rotate-45 border-l border-t border-rose-900/20 bg-gradient-to-br from-rose-700 to-amber-700 ${isNarrow ? 'bottom-[4.15rem] h-10 w-10' : isSplit ? 'bottom-[3.45rem] h-11 w-20' : 'bottom-[3.8rem] h-14 w-14'}`} />}
      {home.shape === 'terrace' && <div className="absolute bottom-[4.3rem] left-1/2 h-3 w-24 -translate-x-1/2 rounded-sm border border-emerald-800/20 bg-emerald-300" />}
      {home.shape === 'villa' && <div className="absolute bottom-3 left-1/2 h-7 w-4 -translate-x-1/2 rounded-t-full bg-amber-900/75" />}
    </div>
  );
}

function Counter({ label, icon: Icon, value, range, onChange }: { label: string; icon: typeof Layers3; value: number; range: [number, number]; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/85 p-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-800"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-stone-500">{label}</p><p className="font-black text-stone-900">{value}</p></div>
      <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" disabled={value <= range[0]} onClick={() => onChange(value - 1)} aria-label={`Remove one ${label}`}><Minus className="h-4 w-4" /></Button>
      <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full" disabled={value >= range[1]} onClick={() => onChange(value + 1)} aria-label={`Add one ${label}`}><Plus className="h-4 w-4" /></Button>
    </div>
  );
}

export function CharacterHouseBuilder({ onBack }: { onBack: () => void }) {
  const [config, setConfig] = useState<HouseConfig>(loadConfig);
  const [floor, setFloor] = useState(() => Math.max(0, loadConfig().floors - 1));
  const [showRoof, setShowRoof] = useState(false);
  const [mode, setMode] = useState<ViewerMode>('blueprint');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const selectedHome = HOME_DEFINITIONS.find(home => home.id === config.homeType) || HOME_DEFINITIONS[0];
  const floors = useMemo(() => createFloorRooms(config), [config]);
  const stage = getConstructionStage(config.completedDays);
  const reveal = mode === 'blueprint' ? 1 : Math.min(1, config.completedDays / 295);
  const alreadyPlacedToday = config.lastBlockDate === todayKey();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (floor >= config.floors) setFloor(config.floors - 1);
  }, [config.floors, floor]);

  const updateHome = (home: HomeDefinition) => {
    setConfig(current => ({ ...current, homeType: home.id, ...home.defaults }));
    setFloor(home.defaults.floors - 1);
    setSelectedRoom(null);
  };

  const placeBlock = () => {
    if (alreadyPlacedToday) return;
    setConfig(current => ({ ...current, completedDays: Math.min(365, current.completedDays + 1), lastBlockDate: todayKey() }));
    setMode('current');
    toast.success('Today’s block has been placed. Keep building together!');
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full bg-white" onClick={onBack} aria-label="Back to dashboard"><ArrowLeft className="h-5 w-5" /></Button>
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-700">Character development</p><h1 className="text-2xl font-black tracking-tight text-stone-950">Build the House That Honors God</h1></div>
      </div>

      <Card className="overflow-hidden rounded-[2rem] border-amber-200 bg-gradient-to-br from-[#fffdf8] to-[#f3e8d8] shadow-xl shadow-amber-900/5">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Home className="h-5 w-5 text-rose-700" /> Choose your home</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {HOME_DEFINITIONS.map(home => {
            const selected = config.homeType === home.id;
            return <button key={home.id} type="button" onClick={() => updateHome(home)} aria-pressed={selected} className={`relative rounded-2xl border p-2 text-left transition-all ${selected ? 'border-amber-500 bg-white shadow-lg ring-2 ring-amber-300' : 'border-stone-200 bg-white/65 hover:-translate-y-0.5 hover:bg-white'}`}>
              {selected && <span className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-white"><Check className="h-4 w-4" /></span>}
              <MiniHome home={home} selected={selected} /><p className="font-black text-stone-900">{home.name}</p><p className="text-[11px] text-stone-500">{home.description}</p>
            </button>;
          })}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-stone-200 bg-white shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Building2 className="h-5 w-5 text-amber-700" /> Design your {selectedHome.name.toLowerCase()}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Counter label="Floors" icon={Layers3} value={config.floors} range={selectedHome.floorRange} onChange={value => { setConfig(current => ({ ...current, floors: value })); setFloor(value - 1); }} />
            <Counter label="Bedrooms" icon={BedDouble} value={config.bedrooms} range={selectedHome.bedroomRange} onChange={value => setConfig(current => ({ ...current, bedrooms: value }))} />
            <Counter label="Bathrooms" icon={Bath} value={config.bathrooms} range={selectedHome.bathroomRange} onChange={value => setConfig(current => ({ ...current, bathrooms: value }))} />
          </div>
          <div><p className="mb-2 text-sm font-black text-stone-800">Interior design</p><div className="grid gap-2 sm:grid-cols-3">{INTERIOR_STYLES.map(style => <button key={style.id} type="button" onClick={() => setConfig(current => ({ ...current, interiorStyle: style.id }))} className={`rounded-2xl border p-3 text-left ${config.interiorStyle === style.id ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' : 'border-stone-200'}`}><div className="mb-2 flex gap-1">{style.colors.map(color => <span key={color} className="h-6 flex-1 rounded-md" style={{ backgroundColor: color }} />)}</div><span className="text-xs font-bold text-stone-800">{style.name}</span></button>)}</div></div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border-amber-200 bg-white shadow-xl shadow-stone-900/5">
        <CardHeader className="space-y-3 border-b border-stone-100 bg-amber-50/45">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">{stage.name} · {stage.verse}</p><CardTitle className="mt-1 text-xl">{config.homeName}</CardTitle></div><div className="flex rounded-xl bg-stone-100 p-1"><button type="button" onClick={() => setMode('current')} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'current' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`}>Current build</button><button type="button" onClick={() => setMode('blueprint')} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'blueprint' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`}>Blueprint</button></div></div>
          <div><div className="mb-1 flex justify-between text-xs font-bold text-stone-600"><span>{config.completedDays} of 365 blocks</span><span>{Math.round(config.completedDays / 365 * 100)}%</span></div><Progress value={config.completedDays / 365 * 100} className="h-2.5" /></div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">{floors.map((_, index) => <button key={index} type="button" onClick={() => { setFloor(index); setSelectedRoom(null); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${floor === index ? 'bg-stone-800 text-white shadow' : 'text-stone-600'}`}>{index === floors.length - 1 && floors.length > 1 ? `All ${floors.length} floors` : `Through floor ${index + 1}`}</button>)}</div>
            <Button type="button" variant="outline" className="h-10 rounded-xl bg-white text-xs font-bold" onClick={() => setShowRoof(value => !value)}>{showRoof ? 'Remove roof' : 'Show roof'}</Button>
          </div>
          <Suspense fallback={<div className="grid h-[34rem] place-items-center rounded-[2rem] bg-stone-100 text-sm font-semibold text-stone-500">Preparing the 3D house…</div>}>
            <CharacterHouse3D
              homeType={config.homeType}
              floors={floors}
              activeFloor={floor}
              interiorStyle={config.interiorStyle}
              reveal={reveal}
              showRoof={showRoof}
              selectedRoom={selectedRoom?.id}
              onRoomSelect={setSelectedRoom}
            />
          </Suspense>
          {selectedRoom && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm"><Sparkles className="h-5 w-5" /></span><div><p className="font-black text-stone-900">{selectedRoom.name}</p><p className="text-sm text-stone-600">{selectedRoom.meaning}</p></div></div>}
          <Button type="button" onClick={placeBlock} disabled={alreadyPlacedToday || config.completedDays >= 365} className="h-14 w-full rounded-2xl bg-gradient-to-r from-rose-700 to-amber-700 text-base font-black text-white shadow-lg shadow-rose-900/15 hover:from-rose-800 hover:to-amber-800">
            {config.completedDays >= 365 ? <><Check className="mr-2 h-5 w-5" /> House completed</> : alreadyPlacedToday ? <><Check className="mr-2 h-5 w-5" /> Today’s block is placed</> : <><Hammer className="mr-2 h-5 w-5" /> Place Today’s Block</>}
          </Button>
          <p className="text-center text-xs text-stone-500">One activity earns one block. Missing a day never removes progress.</p>
        </CardContent>
      </Card>
    </div>
  );
}
