import { useMemo, useState } from 'react';
import {
  Bath,
  BedDouble,
  Blocks,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Gamepad2,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CharacterHouse3D } from '../CharacterHouse3D';
import {
  HOME_DEFINITIONS,
  FINISH_PRESETS,
  clampToRange,
  createFloorRooms,
  getConstructionStage,
  type HomeType,
  type InteriorStyle,
  type Room,
} from '../CharacterHouseBuilder';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

interface PreviewConfig {
  homeType: HomeType;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  interiorStyle: InteriorStyle;
}

const DEFAULT_PREVIEW: PreviewConfig = {
  homeType: 'villa',
  floors: 2,
  bedrooms: 5,
  bathrooms: 4,
  interiorStyle: 'ethiopian-heritage',
};

const MILESTONES = [
  { day: 0, label: 'Empty site' },
  { day: 40, label: 'Foundation' },
  { day: 115, label: 'Framework' },
  { day: 200, label: 'Windows' },
  { day: 295, label: 'Rooms' },
  { day: 365, label: 'Final house' },
];

const STYLE_OPTIONS: Array<{ id: InteriorStyle; label: string }> = [
  { id: 'warm-modern', label: 'Warm Modern' },
  { id: 'ethiopian-heritage', label: 'Ethiopian Heritage' },
  { id: 'peaceful-minimalist', label: 'Peaceful Minimalist' },
];

function AdminCounter({ label, icon: Icon, value, range, onChange }: { label: string; icon: typeof Layers3; value: number; range: [number, number]; onChange: (value: number) => void }) {
  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-600"><Icon className="h-4 w-4 text-violet-600" />{label}</span>
      <input className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-950 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" type="number" min={range[0]} max={range[1]} value={value} onChange={event => onChange(clampToRange(Number(event.target.value) || range[0], range))} />
    </label>
  );
}

export function CharacterHouseAdminPreview() {
  const [config, setConfig] = useState<PreviewConfig>(DEFAULT_PREVIEW);
  const [day, setDay] = useState(365);
  const [showRoof, setShowRoof] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState<'house' | 'room'>('house');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const selectedHome = HOME_DEFINITIONS.find(home => home.id === config.homeType) || HOME_DEFINITIONS[0];
  const floors = useMemo(() => createFloorRooms(config), [config]);
  const stage = getConstructionStage(day);
  const progress = day / 365 * 100;
  const reveal = Math.min(1, day / 295);

  const selectHome = (homeType: HomeType) => {
    const home = HOME_DEFINITIONS.find(item => item.id === homeType) || HOME_DEFINITIONS[0];
    setConfig(current => ({ ...current, homeType, ...home.defaults }));
    setSelectedRoom(null);
  };

  const resetPreview = () => {
    setConfig(DEFAULT_PREVIEW);
    setDay(365);
    setShowRoof(false);
    setAutoRotate(true);
    setViewMode('house');
    setSelectedRoom(null);
  };

  return (
    <main className="space-y-5 pb-10">
      <header className="overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-br from-slate-950 via-violet-950 to-rose-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-violet-100"><ShieldCheck className="h-4 w-4" /> Administrator-only preview</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight">Character House Game Studio</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-violet-100/80">Inspect the complete 365-day experience, test construction milestones, and compare every architectural configuration without changing a couple’s real progress.</p>
          </div>
          <Button type="button" variant="outline" onClick={resetPreview} className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"><RotateCcw className="mr-2 h-4 w-4" /> Reset final preview</Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Game preview summary">
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white"><Blocks className="h-5 w-5" /></span><div><strong className="text-xl font-black text-emerald-950">{day} / 365</strong><p className="text-xs font-semibold text-emerald-700">Blocks completed</p></div></CardContent></Card>
        <Card className="rounded-2xl border-violet-200 bg-violet-50"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600 text-white"><Building2 className="h-5 w-5" /></span><div><strong className="text-xl font-black text-violet-950">{stage.name}</strong><p className="text-xs font-semibold text-violet-700">Current construction stage</p></div></CardContent></Card>
        <Card className="rounded-2xl border-amber-200 bg-amber-50"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-600 text-white"><CheckCircle2 className="h-5 w-5" /></span><div><strong className="text-xl font-black text-amber-950">{day === 365 ? 'Dedicated' : 'In progress'}</strong><p className="text-xs font-semibold text-amber-700">Final game state</p></div></CardContent></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="rounded-[1.5rem] border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Gamepad2 className="h-5 w-5 text-violet-600" /> Preview controls</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Home design</span><select value={config.homeType} onChange={event => selectHome(event.target.value as HomeType)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900">{HOME_DEFINITIONS.map(home => <option key={home.id} value={home.id}>{home.name}</option>)}</select></label>
              <div className="grid grid-cols-3 gap-2 xl:grid-cols-1">
                <AdminCounter label="Floors" icon={Layers3} value={config.floors} range={selectedHome.floorRange} onChange={floors => setConfig(current => ({ ...current, floors }))} />
                <AdminCounter label="Bedrooms" icon={BedDouble} value={config.bedrooms} range={selectedHome.bedroomRange} onChange={bedrooms => setConfig(current => ({ ...current, bedrooms }))} />
                <AdminCounter label="Bathrooms" icon={Bath} value={config.bathrooms} range={selectedHome.bathroomRange} onChange={bathrooms => setConfig(current => ({ ...current, bathrooms }))} />
              </div>
              <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600">Interior style</span><select value={config.interiorStyle} onChange={event => setConfig(current => ({ ...current, interiorStyle: event.target.value as InteriorStyle }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900">{STYLE_OPTIONS.map(style => <option key={style.id} value={style.id}>{style.label}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowRoof(value => !value)}>{showRoof ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{showRoof ? 'Hide roof' : 'Show roof'}</Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAutoRotate(value => !value)}>{autoRotate ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{autoRotate ? 'Pause' : 'Rotate'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-amber-200 bg-amber-50/70">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="h-4 w-4 text-amber-700" /> Selected room</CardTitle></CardHeader>
            <CardContent>{selectedRoom ? <><p className="font-black text-slate-950">{selectedRoom.name}</p><p className="mt-1 text-xs leading-5 text-slate-600">{selectedRoom.meaning}</p><Button type="button" size="sm" className="mt-3 w-full rounded-xl" onClick={() => setViewMode(value => value === 'house' ? 'room' : 'house')}>{viewMode === 'house' ? 'Open room detail' : 'Return to full house'}</Button></> : <p className="text-xs leading-5 text-slate-600">Select any room inside the 3D model to inspect its character-development meaning.</p>}</CardContent>
          </Card>
        </aside>

        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden rounded-[2rem] border-slate-200 shadow-lg">
            <CardHeader className="space-y-4 border-b border-slate-100 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-violet-600">{stage.name} · {stage.verse}</p><CardTitle className="mt-1">Day {day} administrator preview</CardTitle></div><Button type="button" onClick={() => setDay(365)} className="rounded-xl bg-violet-700 hover:bg-violet-800"><CheckCircle2 className="mr-2 h-4 w-4" /> Show final result</Button></div>
              <div><div className="mb-1.5 flex justify-between text-xs font-bold text-slate-600"><span>Construction timeline</span><span>{Math.round(progress)}%</span></div><Progress value={progress} className="h-2.5" /></div>
              <input aria-label="Preview construction day" type="range" min="0" max="365" value={day} onChange={event => { setDay(Number(event.target.value)); setSelectedRoom(null); }} className="w-full accent-violet-700" />
              <div className="flex flex-wrap gap-2">{MILESTONES.map(milestone => <button key={milestone.day} type="button" onClick={() => { setDay(milestone.day); setSelectedRoom(null); }} className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${day === milestone.day ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'}`}>{milestone.day}: {milestone.label}</button>)}</div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <CharacterHouse3D homeType={config.homeType} floors={floors} activeFloor={floors.length - 1} interiorStyle={config.interiorStyle} finishes={FINISH_PRESETS[config.interiorStyle]} reveal={reveal} showRoof={showRoof} selectedRoom={selectedRoom?.id} onRoomSelect={setSelectedRoom} autoRotate={autoRotate} viewMode={viewMode} />
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-900"><strong>Safe preview:</strong> controls in this studio are local simulation tools. They do not grant blocks, alter completion dates, or update any member or couple record.</div>
        </div>
      </section>
    </main>
  );
}
