import { guidanceLabel } from '../../locales/guidance';
import { useUiCopy } from '../../utils/uiTranslation';
import { adminHousePreviewMessages } from '../../locales/adminHousePreview';
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
    <label className="block min-w-0 rounded-2xl border border-border bg-card p-3 shadow-sm">
      <span className="tbo-label mb-2 flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4 shrink-0 text-violet-600" />{label}</span>
      <input className="h-10 min-w-0 w-full rounded-xl border border-border bg-input-background px-3 tbo-field text-foreground outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" type="number" min={range[0]} max={range[1]} value={value} onChange={event => onChange(clampToRange(Number(event.target.value) || range[0], range))} />
    </label>
  );
}

export function CharacterHouseAdminPreview() {
  const tr = useUiCopy(adminHousePreviewMessages);
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
    <main className="min-w-0 w-full space-y-5 pb-10 [overflow-wrap:anywhere]">
      <header className="overflow-hidden rounded-[2rem] tbo-glass p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-2xl">
            <span className="tbo-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1.5 text-primary"><ShieldCheck className="h-4 w-4 shrink-0" />  {tr("Administrator-only preview")}</span>
            <h1 className="mt-4 tbo-page-title">{tr("Character House Game Studio")}</h1>
            <p className="tbo-supporting mt-2 max-w-xl text-muted-foreground">{tr("Inspect the complete 365-day experience, test construction milestones, and compare every architectural configuration without changing a couple’s real progress.")}</p>
          </div>
          <Button type="button" variant="outline" onClick={resetPreview} className="h-auto min-h-10 max-w-full whitespace-normal "><RotateCcw className="mr-2 h-4 w-4" /><span className="min-w-0">{tr("Reset final preview")}</span></Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label={tr("Game preview summary")}>
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white"><Blocks className="h-5 w-5" /></span><div className="min-w-0"><strong className="tbo-section-title text-emerald-950">{day} / 365</strong><p className="tbo-caption text-emerald-700">{tr("Blocks completed")}</p></div></CardContent></Card>
        <Card className="rounded-2xl border-border bg-accent"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-600 text-white"><Building2 className="h-5 w-5" /></span><div className="min-w-0"><strong className="tbo-section-title text-foreground">{tr(stage.name)}</strong><p className="tbo-caption text-primary">{tr("Current construction stage")}</p></div></CardContent></Card>
        <Card className="rounded-2xl border-amber-200 bg-amber-50"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-600 text-white"><CheckCircle2 className="h-5 w-5" /></span><div className="min-w-0"><strong className="tbo-section-title text-amber-950">{day === 365 ? tr("Dedicated") : tr("In progress")}</strong><p className="tbo-caption text-amber-700">{tr("Final game state")}</p></div></CardContent></Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4">
          <Card className="rounded-[1.5rem] border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Gamepad2 className="h-5 w-5 shrink-0 text-violet-600" />  {tr("Preview controls")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="block min-w-0"><span className="tbo-label mb-1.5 block text-muted-foreground">{tr("Home design")}</span><select value={config.homeType} onChange={event => selectHome(event.target.value as HomeType)} className="tbo-field h-11 min-w-0 max-w-full w-full rounded-xl border border-border bg-card px-3 text-foreground">{HOME_DEFINITIONS.map(home => <option key={home.id} value={home.id}>{tr(home.name)}</option>)}</select></label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <AdminCounter label={tr("Floors")} icon={Layers3} value={config.floors} range={selectedHome.floorRange} onChange={floors => setConfig(current => ({ ...current, floors }))} />
                <AdminCounter label={tr("Bedrooms")} icon={BedDouble} value={config.bedrooms} range={selectedHome.bedroomRange} onChange={bedrooms => setConfig(current => ({ ...current, bedrooms }))} />
                <AdminCounter label={tr("Bathrooms")} icon={Bath} value={config.bathrooms} range={selectedHome.bathroomRange} onChange={bathrooms => setConfig(current => ({ ...current, bathrooms }))} />
              </div>
              <label className="block min-w-0"><span className="tbo-label mb-1.5 block text-muted-foreground">{tr("Interior style")}</span><select value={config.interiorStyle} onChange={event => setConfig(current => ({ ...current, interiorStyle: event.target.value as InteriorStyle }))} className="tbo-field h-11 min-w-0 max-w-full w-full rounded-xl border border-border bg-card px-3 text-foreground">{STYLE_OPTIONS.map(style => <option key={style.id} value={style.id}>{tr(style.label)}</option>)}</select></label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" className="h-auto min-h-11 min-w-0 whitespace-normal rounded-xl py-2" onClick={() => setShowRoof(value => !value)}>{showRoof ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}<span className="min-w-0">{showRoof ? tr("Hide roof") : tr("Show roof")}</span></Button>
                <Button type="button" variant="outline" className="h-auto min-h-11 min-w-0 whitespace-normal rounded-xl py-2" onClick={() => setAutoRotate(value => !value)}>{autoRotate ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}<span className="min-w-0">{autoRotate ? tr("Pause") : tr("Rotate")}</span></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-amber-200 bg-amber-50/70">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 shrink-0 text-amber-700" />  {tr("Selected room")}</CardTitle></CardHeader>
            <CardContent>{selectedRoom ? <><p className="tbo-card-title text-foreground">{guidanceLabel(tr, selectedRoom.name)}</p><p className="mt-1 tbo-supporting text-muted-foreground">{tr(selectedRoom.meaning)}</p><Button type="button" size="sm" className="mt-3 h-auto min-h-9 w-full whitespace-normal rounded-xl" onClick={() => setViewMode(value => value === 'house' ? 'room' : 'house')}>{viewMode === 'house' ? tr("Open room detail") : tr("Return to full house")}</Button></> : <p className="tbo-supporting text-muted-foreground">{tr("Select any room inside the 3D model to inspect its character-development meaning.")}</p>}</CardContent>
          </Card>
        </aside>

        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden rounded-[2rem] border-slate-200 shadow-lg">
            <CardHeader className="space-y-4 border-b border-border bg-accent">
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="tbo-eyebrow uppercase text-violet-600">{tr(stage.name)} · <span lang="en">{stage.verse}</span></p><CardTitle className="mt-1">{tr("Day {day} administrator preview", { day })}</CardTitle></div><Button type="button" onClick={() => setDay(365)} className="h-auto min-h-10 max-w-full whitespace-normal rounded-xl "><CheckCircle2 className="mr-2 h-4 w-4" /><span className="min-w-0">{tr("Show final result")}</span></Button></div>
              <div><div className="tbo-label mb-1.5 flex flex-wrap justify-between gap-2 text-muted-foreground"><span>{tr("Construction timeline")}</span><span>{Math.round(progress)}%</span></div><Progress value={progress} className="h-2.5" /></div>
              <input aria-label={tr("Preview construction day")} type="range" min="0" max="365" value={day} onChange={event => { setDay(Number(event.target.value)); setSelectedRoom(null); }} className="w-full accent-violet-700" />
              <div className="flex flex-wrap gap-2">{MILESTONES.map(milestone => <button key={milestone.day} type="button" onClick={() => { setDay(milestone.day); setSelectedRoom(null); }} className={`rounded-full border px-3 py-1.5 tbo-action transition ${day === milestone.day ? 'border-violet-700 bg-violet-700 text-white' : 'border-border bg-card text-muted-foreground hover:border-violet-300'}`}>{milestone.day}: {tr(milestone.label)}</button>)}</div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <CharacterHouse3D homeType={config.homeType} floors={floors} activeFloor={floors.length - 1} interiorStyle={config.interiorStyle} finishes={FINISH_PRESETS[config.interiorStyle]} reveal={reveal} showRoof={showRoof} selectedRoom={selectedRoom?.id} onRoomSelect={setSelectedRoom} autoRotate={autoRotate} viewMode={viewMode} />
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 tbo-supporting text-sky-900"><strong>{tr("Safe preview:")}</strong>  {tr("controls in this studio are local simulation tools. They do not grant blocks, alter completion dates, or update any member or couple record.")}</div>
        </div>
      </section>
    </main>
  );
}
