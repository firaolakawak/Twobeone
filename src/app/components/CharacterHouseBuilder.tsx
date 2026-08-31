import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  Check,
  CalendarDays,
  Hammer,
  HeartHandshake,
  Home,
  Layers3,
  Minus,
  Paintbrush,
  Plus,
  Scan,
  Sparkles,
  LockKeyhole,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

export type HomeType = 'house' | 'villa' | 'townhouse' | 'apartment' | 'duplex' | 'penthouse';
export type InteriorStyle = 'warm-modern' | 'ethiopian-heritage' | 'peaceful-minimalist';
type ViewerMode = 'current' | 'blueprint';
type SceneView = 'house' | 'room';

export interface HouseFinishes {
  wallPaint: string;
  sofaFabric: string;
  livingAccent: string;
  diningWood: string;
  kitchenCabinet: string;
  bathroomTile: string;
  masterBedding: string;
  guestBedding: string;
}

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
  finishes: HouseFinishes;
  lastBlockDate?: string;
  blueprintStatus: 'draft' | 'active';
  blueprintSubmittedAt?: string;
  challengeStartedAt?: string;
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

export const FINISH_PRESETS: Record<InteriorStyle, HouseFinishes> = {
  'warm-modern': { wallPaint: '#fff8e9', sofaFabric: '#9b5960', livingAccent: '#d3a65f', diningWood: '#87532f', kitchenCabinet: '#72836d', bathroomTile: '#c9e0df', masterBedding: '#b87979', guestBedding: '#7c8e73' },
  'ethiopian-heritage': { wallPaint: '#fff1d2', sofaFabric: '#9d4432', livingAccent: '#d9a227', diningWood: '#6e3b22', kitchenCabinet: '#a85a31', bathroomTile: '#d8c0a0', masterBedding: '#b64a35', guestBedding: '#d4a43b' },
  'peaceful-minimalist': { wallPaint: '#f3f0e8', sofaFabric: '#788580', livingAccent: '#b7ab98', diningWood: '#817563', kitchenCabinet: '#a5aaa2', bathroomTile: '#dce5e2', masterBedding: '#8b9791', guestBedding: '#b1a99d' },
};

const FINISH_FIELDS: Array<{ key: keyof HouseFinishes; label: string }> = [
  { key: 'wallPaint', label: 'Wall paint' }, { key: 'sofaFabric', label: 'Sofas' },
  { key: 'livingAccent', label: 'Living room' }, { key: 'diningWood', label: 'Dining table' },
  { key: 'kitchenCabinet', label: 'Kitchen' }, { key: 'bathroomTile', label: 'Bathroom' },
  { key: 'masterBedding', label: 'Master bedroom' }, { key: 'guestBedding', label: 'Guest room' },
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
  completedDays: 0,
  finishes: FINISH_PRESETS['warm-modern'],
  blueprintStatus: 'draft',
};

const DAILY_CHALLENGES = [
  { title: 'Place God at the Center', scripture: 'Psalm 127:1', action: 'Read the verse together and agree on one daily time when you will pray for your home.' },
  { title: 'Build on God’s Word', scripture: 'Matthew 7:24–25', action: 'Choose one biblical value that you want this home and relationship to demonstrate.' },
  { title: 'Speak with Grace', scripture: 'Colossians 4:6', action: 'Give your partner one sincere, specific word of encouragement.' },
  { title: 'Listen Before Speaking', scripture: 'James 1:19', action: 'Give each partner three uninterrupted minutes to share about their day.' },
  { title: 'Practice Practical Love', scripture: '1 Corinthians 13:4–7', action: 'Complete one small act of service requested by your partner.' },
  { title: 'Choose Integrity', scripture: 'Psalm 15:1–2', action: 'Share one honest feeling gently, without blame or accusation.' },
  { title: 'Pray as One', scripture: 'Colossians 4:2', action: 'Each partner prays aloud for one need the other person shared.' },
];

export function isBlueprintNameReady(name: string) {
  return name.trim().length >= 3;
}

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
  add(0, { id: 'dining', name: 'Dining Room', meaning: 'Gratitude and hospitality', kind: 'living' });
  add(0, { id: 'kitchen', name: 'Kitchen', meaning: 'Service and daily provision', kind: 'service' });
  add(0, { id: 'prayer', name: config.homeType === 'apartment' ? 'Prayer Corner' : 'Prayer Room', meaning: 'Worship and dependence on God', kind: 'faith' });
  if (config.homeType !== 'apartment') add(0, { id: 'entry', name: 'Welcome', meaning: 'Hospitality and openness', kind: 'outdoor' });

  for (let index = 0; index < config.bedrooms; index += 1) {
    const floor = config.floors === 1 ? 0 : 1 + (index % (config.floors - 1));
    add(floor, { id: `bed-${index}`, name: index === 0 ? 'Master Bedroom' : index === 1 ? 'Guest Room' : `Bedroom ${index + 1}`, meaning: 'Trust, rest, and care', kind: 'bedroom' });
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
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      blueprintStatus: parsed.blueprintStatus === 'active' ? 'active' : 'draft',
      finishes: { ...DEFAULT_CONFIG.finishes, ...(parsed.finishes || {}) },
      completedDays: clampToRange(Number(parsed.completedDays) || 0, [0, 365]),
    };
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
  const [sceneView, setSceneView] = useState<SceneView>('house');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [coupleApproved, setCoupleApproved] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const selectedHome = HOME_DEFINITIONS.find(home => home.id === config.homeType) || HOME_DEFINITIONS[0];
  const floors = useMemo(() => createFloorRooms(config), [config]);
  const stage = getConstructionStage(config.completedDays);
  const reveal = mode === 'blueprint' ? 1 : Math.min(1, config.completedDays / 295);
  const alreadyPlacedToday = config.lastBlockDate === todayKey();
  const challengeActive = config.blueprintStatus === 'active';
  const todaysChallenge = DAILY_CHALLENGES[config.completedDays % DAILY_CHALLENGES.length];

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
    setSceneView('house');
  };

  const placeBlock = () => {
    if (!challengeActive || alreadyPlacedToday) return;
    setConfig(current => ({ ...current, completedDays: Math.min(365, current.completedDays + 1), lastBlockDate: todayKey() }));
    setMode('current');
    toast.success('Today’s block has been placed. Keep building together!');
  };

  const startChallenge = () => {
    if (!coupleApproved || !isBlueprintNameReady(config.homeName)) return;
    const startedAt = new Date().toISOString();
    setConfig(current => ({ ...current, blueprintStatus: 'active', blueprintSubmittedAt: startedAt, challengeStartedAt: startedAt, completedDays: 0, lastBlockDate: undefined }));
    setMode('current');
    setSceneView('house');
    setSubmitOpen(false);
    toast.success('Blueprint submitted! Your 365-day character challenge starts today.');
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-full bg-white" onClick={onBack} aria-label="Back to dashboard"><ArrowLeft className="h-5 w-5" /></Button>
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-700">Character development</p><h1 className="text-2xl font-black tracking-tight text-stone-950">Build the House That Honors God</h1></div>
      </div>

      {!challengeActive && <>
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
          <div><p className="mb-2 text-sm font-black text-stone-800">Interior design</p><div className="grid gap-2 sm:grid-cols-3">{INTERIOR_STYLES.map(style => <button key={style.id} type="button" onClick={() => setConfig(current => ({ ...current, interiorStyle: style.id, finishes: FINISH_PRESETS[style.id] }))} className={`rounded-2xl border p-3 text-left ${config.interiorStyle === style.id ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200' : 'border-stone-200'}`}><div className="mb-2 flex gap-1">{style.colors.map(color => <span key={color} className="h-6 flex-1 rounded-md" style={{ backgroundColor: color }} />)}</div><span className="text-xs font-bold text-stone-800">{style.name}</span></button>)}</div></div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50/75 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-black text-stone-800"><Paintbrush className="h-4 w-4 text-rose-700" /> Customize colors</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{FINISH_FIELDS.map(field => <label key={field.key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white p-2.5 shadow-sm"><input type="color" value={config.finishes[field.key]} onChange={event => setConfig(current => ({ ...current, finishes: { ...current.finishes, [field.key]: event.target.value } }))} className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" aria-label={`${field.label} color`} /><span className="text-[11px] font-bold leading-tight text-stone-700">{field.label}</span></label>)}</div>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-rose-50 p-4">
            <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wider text-amber-800">Name your home</span><input value={config.homeName} onChange={event => setConfig(current => ({ ...current, homeName: event.target.value }))} maxLength={48} placeholder="House of Grace" className="h-12 w-full rounded-xl border border-amber-200 bg-white px-4 font-bold text-stone-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" /></label>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white bg-white/80 p-3"><input type="checkbox" checked={coupleApproved} onChange={event => setCoupleApproved(event.target.checked)} className="mt-0.5 h-5 w-5 accent-amber-700" /><span><strong className="block text-sm text-stone-900">We reviewed and chose this blueprint together</strong><small className="mt-0.5 block leading-5 text-stone-600">Submitting starts the 365-day challenge and locks this blueprint.</small></span></label>
            <Button type="button" onClick={() => setSubmitOpen(true)} disabled={!coupleApproved || !isBlueprintNameReady(config.homeName)} className="mt-4 h-14 w-full rounded-xl bg-gradient-to-r from-amber-700 to-rose-700 font-black text-white hover:from-amber-800 hover:to-rose-800"><HeartHandshake className="mr-2 h-5 w-5" /> Submit Blueprint & Start Challenge</Button>
          </div>
        </CardContent>
      </Card>
      </>}

      {challengeActive && <Card className="overflow-hidden rounded-[2rem] border-emerald-200 bg-gradient-to-br from-emerald-50 to-amber-50 shadow-sm"><CardContent className="flex flex-wrap items-center gap-4 p-5"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow"><LockKeyhole className="h-6 w-6" /></span><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-widest text-emerald-700">Blueprint submitted · Challenge active</p><h2 className="mt-1 text-lg font-black text-stone-950">{config.homeName}</h2><p className="mt-1 text-xs text-stone-600">{selectedHome.name} · {config.floors} floors · {config.bedrooms} bedrooms · {config.bathrooms} bathrooms</p></div><div className="rounded-xl bg-white/80 px-3 py-2 text-right"><p className="text-xs font-bold text-stone-500">Started</p><p className="text-sm font-black text-stone-900">{config.challengeStartedAt ? new Date(config.challengeStartedAt).toLocaleDateString() : 'Today'}</p></div></CardContent></Card>}

      <Card className="overflow-hidden rounded-[2rem] border-amber-200 bg-white shadow-xl shadow-stone-900/5">
        <CardHeader className="space-y-3 border-b border-stone-100 bg-amber-50/45">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-amber-700">{stage.name} · {stage.verse}</p><CardTitle className="mt-1 text-xl">{config.homeName}</CardTitle></div><div className="flex rounded-xl bg-stone-100 p-1"><button type="button" onClick={() => setMode('current')} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'current' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`}>Current build</button><button type="button" onClick={() => setMode('blueprint')} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'blueprint' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500'}`}>Blueprint</button></div></div>
          <div><div className="mb-1 flex justify-between text-xs font-bold text-stone-600"><span>{config.completedDays} of 365 blocks</span><span>{Math.round(config.completedDays / 365 * 100)}%</span></div><Progress value={config.completedDays / 365 * 100} className="h-2.5" /></div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">{floors.map((_, index) => <button key={index} type="button" onClick={() => { setFloor(index); setSelectedRoom(null); setSceneView('house'); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${floor === index ? 'bg-stone-800 text-white shadow' : 'text-stone-600'}`}>{index === floors.length - 1 && floors.length > 1 ? `All ${floors.length} floors` : `Through floor ${index + 1}`}</button>)}</div>
            <div className="flex gap-1"><Button type="button" variant="outline" className="h-10 rounded-xl bg-white text-xs font-bold" onClick={() => { setSceneView('house'); setSelectedRoom(null); }}><Home className="mr-1.5 h-4 w-4" /> Full house</Button><Button type="button" variant="outline" disabled={!selectedRoom} className="h-10 rounded-xl bg-white text-xs font-bold" onClick={() => setSceneView('room')}><Scan className="mr-1.5 h-4 w-4" /> Room detail</Button><Button type="button" variant="outline" className="h-10 rounded-xl bg-white text-xs font-bold" onClick={() => setShowRoof(value => !value)}>{showRoof ? 'Remove roof' : 'Show roof'}</Button></div>
          </div>
          <Suspense fallback={<div className="grid h-[34rem] place-items-center rounded-[2rem] bg-stone-100 text-sm font-semibold text-stone-500">Preparing the 3D house…</div>}>
            <CharacterHouse3D
              homeType={config.homeType}
              floors={floors}
              activeFloor={floor}
              interiorStyle={config.interiorStyle}
              reveal={reveal}
              showRoof={showRoof}
              finishes={config.finishes}
              viewMode={sceneView}
              selectedRoom={selectedRoom?.id}
              onRoomSelect={(room) => { setSelectedRoom(room); if (sceneView === 'room') setSceneView('room'); }}
            />
          </Suspense>
          {selectedRoom && <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm"><Sparkles className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-black text-stone-900">{selectedRoom.name}</p><p className="text-sm text-stone-600">{selectedRoom.meaning}</p></div><Button type="button" size="sm" onClick={() => setSceneView('room')} className="rounded-xl bg-amber-700 hover:bg-amber-800"><Scan className="mr-1.5 h-4 w-4" /> View room details</Button></div>}
          {challengeActive && config.completedDays < 365 && <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-rose-50 p-4"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-700 font-black text-white">{config.completedDays + 1}</span><div><p className="text-xs font-black uppercase tracking-wider text-violet-700">Today’s character challenge · {todaysChallenge.scripture}</p><h3 className="mt-1 font-black text-stone-950">{todaysChallenge.title}</h3><p className="mt-2 text-sm leading-6 text-stone-600">{todaysChallenge.action}</p></div></div></div>}
          {challengeActive && <Button type="button" onClick={placeBlock} disabled={alreadyPlacedToday || config.completedDays >= 365} className="h-14 w-full rounded-2xl bg-gradient-to-r from-rose-700 to-amber-700 text-base font-black text-white shadow-lg shadow-rose-900/15 hover:from-rose-800 hover:to-amber-800">
            {config.completedDays >= 365 ? <><Check className="mr-2 h-5 w-5" /> House completed</> : alreadyPlacedToday ? <><Check className="mr-2 h-5 w-5" /> Today’s block is placed</> : <><Hammer className="mr-2 h-5 w-5" /> Place Today’s Block</>}
          </Button>}
          <p className="text-center text-xs text-stone-500">{challengeActive ? 'Complete one activity to earn one block. Missing a day never removes progress.' : 'Customize together, submit the blueprint, and Day 1 will unlock.'}</p>
        </CardContent>
      </Card>

      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent className="rounded-[1.75rem] border-amber-200">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white sm:mx-0"><HeartHandshake className="h-7 w-7" /></div>
            <AlertDialogTitle>Submit “{config.homeName.trim()}” and start?</AlertDialogTitle>
            <AlertDialogDescription asChild><div className="space-y-3"><p>This confirms the blueprint as your shared design and starts the 365-day character-development challenge today.</p><ul className="space-y-2 rounded-xl bg-amber-50 p-3 text-left text-stone-700"><li className="flex gap-2"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /> The selected home, rooms, finishes, and colors will be locked.</li><li className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /> Day 1 becomes available immediately.</li><li className="flex gap-2"><Hammer className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /> Only one completed activity can place one block each day.</li></ul></div></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={startChallenge} className="bg-gradient-to-r from-amber-700 to-rose-700 font-black text-white hover:from-amber-800 hover:to-rose-800">Submit & start Day 1</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
