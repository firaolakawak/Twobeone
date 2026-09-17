import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, LockKeyhole, RefreshCw } from 'lucide-react';
import { BackButton } from './BackButton';
import { BrandLoader, LoadingMark } from './BrandLoader';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { CharacterHouseIllustration } from './CharacterHouseIllustration';
import { CHARACTER_HOUSE_GOAL, CHARACTER_HOUSE_STAGES, getHouseJourneyStage, safeHouseBlocks, SIMPLE_HOUSE_OPTIONS } from '../data/characterHouseJourney';
import { HOME_DEFINITIONS, type HomeType } from '../data/legacyCharacterHouse';
import { simpleCharacterHouseMessages } from '../locales/simpleCharacterHouse';
import { useUiCopy } from '../utils/uiTranslation';
import api from '../utils/api';
import '../styles/simple-character-house.css';

// Existing administration previews and saved 3D designs keep their domain helpers.
export { HOME_DEFINITIONS, FINISH_PRESETS, canUserApproveBlueprint, clampToRange, createFloorRooms, getConstructionStage, isBlueprintNameReady } from '../data/legacyCharacterHouse';
export type { HomeType, HouseFinishes, InteriorStyle, Room } from '../data/legacyCharacterHouse';

interface CharacterHouseBuilderProps {
  onBack: () => void;
  onOpenChallenge?: () => void;
  onConnect?: () => void;
  currentUserId?: string;
  partnerId?: string;
  partnerName?: string;
}

export function CharacterHouseBuilder(props: CharacterHouseBuilderProps) {
  return <SharedCharacterHouse key={JSON.stringify([props.currentUserId, props.partnerId])} {...props} />;
}

function SharedCharacterHouse({ onBack, onOpenChallenge, onConnect, currentUserId, partnerId }: CharacterHouseBuilderProps) {
  const tr = useUiCopy(simpleCharacterHouseMessages);
  const [data, setData] = useState<Awaited<ReturnType<typeof api.characterHouse.get>> | null>(null);
  const [homeType, setHomeType] = useState<HomeType>('house');
  const [bedrooms, setBedrooms] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<'load' | 'save' | null>(null);
  const initialized = useRef(false);
  const sequence = useRef(0);
  const mounted = useRef(true);
  const writing = useRef(false);
  const connected = Boolean(currentUserId && partnerId);
  const active = data?.blueprint?.locked === true;
  const blocks = active ? safeHouseBlocks(data?.progress?.completedDays) : 0;
  const stage = getHouseJourneyStage(blocks);
  const definition = HOME_DEFINITIONS.find(home => home.id === homeType) ?? HOME_DEFINITIONS[0];
  const houseLabel = SIMPLE_HOUSE_OPTIONS.find(home => home.id === homeType)?.label ?? 'House';
  const complete = blocks >= CHARACTER_HOUSE_GOAL;

  const accept = useCallback((result: Awaited<ReturnType<typeof api.characterHouse.get>>) => {
    setData(result);
    if (!initialized.current || result.blueprint?.locked === true) {
      const saved = result.blueprint;
      const definition = HOME_DEFINITIONS.find(home => home.id === saved?.homeType);
      if (definition) {
        setHomeType(definition.id);
        setBedrooms(saved?.locked ? saved.bedrooms : Math.max(definition.bedroomRange[0], Math.min(definition.bedroomRange[1], Number(saved?.bedrooms) || definition.defaults.bedrooms)));
      }
      initialized.current = true;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!connected || writing.current) return;
    const request = ++sequence.current;
    setLoading(true);
    try {
      const result = await api.characterHouse.get();
      if (!mounted.current || request !== sequence.current) return;
      accept(result); setError(null);
    } catch {
      if (mounted.current && request === sequence.current) setError('load');
    } finally {
      if (mounted.current && request === sequence.current) setLoading(false);
    }
  }, [connected, accept]);

  useEffect(() => {
    mounted.current = true;
    if (!connected) { setLoading(false); return () => { mounted.current = false; }; }
    void refresh();
    const foregroundRefresh = () => { if (document.visibilityState === 'visible') void refresh(); };
    const interval = window.setInterval(foregroundRefresh, 30000);
    window.addEventListener('focus', foregroundRefresh);
    document.addEventListener('visibilitychange', foregroundRefresh);
    return () => {
      mounted.current = false; sequence.current += 1;
      window.clearInterval(interval);
      window.removeEventListener('focus', foregroundRefresh);
      document.removeEventListener('visibilitychange', foregroundRefresh);
    };
  }, [connected, refresh]);

  const start = async () => {
    if (writing.current || !connected || active || !data) return;
    writing.current = true; const request = ++sequence.current;
    setSaving(true); setError(null);
    try {
      const result = await api.characterHouse.start({ homeType, bedrooms });
      if (!mounted.current || request !== sequence.current) return;
      accept(result);
    } catch {
      if (mounted.current && request === sequence.current) setError('save');
    } finally {
      writing.current = false;
      if (mounted.current && request === sequence.current) { setSaving(false); setLoading(false); }
    }
  };

  return <div className="simple-character-house">
    <header className="simple-house-heading">
      <BackButton label={tr('Back to dashboard')} onClick={onBack} />
      <div><p className="tbo-eyebrow">{tr('Together in Faith')}</p><h1 className="tbo-page-title">{tr('Our character house')}</h1></div>
    </header>

    {!connected ? <section className="tbo-glass simple-house-panel simple-house-empty">
      <span className="simple-house-emoji" aria-hidden="true">🏡</span>
      <h2 className="tbo-section-title">{tr('Build a home together')}</h2>
      <p className="tbo-supporting">{tr('Connect with your partner to choose your house and start building.')}</p>
      {onConnect && <Button variant="glass-primary" onClick={onConnect}>{tr('Connect your partner')}</Button>}
    </section> : loading && !data ? <BrandLoader label={tr('Loading your house…')} className="simple-house-loading" /> : <>
      {error && <div className="tbo-glass-inset simple-house-error" role="alert"><p className="tbo-supporting">{tr(error === 'save' ? 'Your house could not be saved. Your choices are still here.' : 'We could not refresh your house. Please try again.')}</p>{error === 'load' && <Button variant="glass" disabled={loading} onClick={() => void refresh()}><RefreshCw aria-hidden="true" />{tr('Retry')}</Button>}</div>}

      {data && !active && <section className="tbo-glass simple-house-panel simple-house-setup">
        <div className="simple-house-intro"><span className="simple-house-emoji" aria-hidden="true">🏡</span><h2 className="tbo-section-title">{tr('Let’s build your home')}</h2><p className="tbo-supporting">{tr('Two choices. One shared goal.')}</p></div>
        <fieldset disabled={saving} className="simple-house-fieldset"><legend className="tbo-card-title">{tr('1. What kind of house?')}</legend><div className="simple-house-options">
          {SIMPLE_HOUSE_OPTIONS.map(home => <button type="button" key={home.id} aria-pressed={homeType === home.id} className={`tbo-glass-inset simple-house-option ${homeType === home.id ? 'is-selected' : ''}`} onClick={() => {
            const definition = HOME_DEFINITIONS.find(item => item.id === home.id)!;
            setHomeType(home.id); setBedrooms(value => Math.max(definition.bedroomRange[0], Math.min(definition.bedroomRange[1], value)));
          }}><span aria-hidden="true">{home.emoji}</span><span className="tbo-label">{tr(home.label)}</span>{homeType === home.id && <Check className="simple-house-selection" aria-hidden="true" />}</button>)}
        </div></fieldset>
        <fieldset disabled={saving} className="simple-house-fieldset"><legend className="tbo-card-title">{tr('2. How many bedrooms?')}</legend><div className="simple-house-bedrooms">
          {Array.from({ length: definition.bedroomRange[1] - definition.bedroomRange[0] + 1 }, (_, index) => definition.bedroomRange[0] + index).map(number => <button key={number} type="button" aria-label={tr('{count} bedrooms', { count: number })} aria-pressed={bedrooms === number} onClick={() => setBedrooms(number)} className={`tbo-label tbo-glass-inset simple-house-bedroom ${bedrooms === number ? 'is-selected' : ''}`}><span aria-hidden="true">🛏️</span>{number}</button>)}
        </div></fieldset>
        <div className="tbo-glass-inset simple-house-promise"><span aria-hidden="true">🧱</span><p className="tbo-supporting">{tr('When you both finish the daily challenge, one block builds your house. Goal: 365 blocks.')}</p></div>
        <Button variant="glass-primary" className="simple-house-primary" disabled={saving} onClick={() => void start()}>{saving ? <LoadingMark /> : <LockKeyhole aria-hidden="true" />}{tr(saving ? 'Saving your house…' : 'Lock & start building')}</Button>
        <p className="tbo-caption simple-house-note">{tr('This saves your shared design. It stays locked while you build.')}</p>
      </section>}

      {data && active && <>
        <section className="tbo-glass simple-house-panel simple-house-build">
          <div className="simple-house-build-heading"><div><p className="tbo-eyebrow">{tr(complete ? 'Built together' : 'One shared goal')}</p><h2 className="tbo-section-title">{tr(complete ? 'Your home is complete!' : 'Growing in character, together')}</h2></div><span className="tbo-caption simple-house-locked"><LockKeyhole aria-hidden="true" />{tr('Design locked')}</span></div>
          <CharacterHouseIllustration homeType={homeType} bedrooms={bedrooms} completedDays={blocks} />
          <p className="tbo-supporting simple-house-design">{tr('{house} · {bedrooms} bedrooms', { house: tr(houseLabel), bedrooms })}</p>
          <div className="simple-house-progress"><div className="simple-house-progress-label"><strong className="tbo-card-title">{tr('{count} / 365 blocks', { count: blocks })}</strong><span className="tbo-label">{Math.floor(blocks / CHARACTER_HOUSE_GOAL * 100)}%</span></div><Progress value={blocks / CHARACTER_HOUSE_GOAL * 100} aria-label={tr('House construction progress')} /></div>
          <div className="tbo-glass-inset simple-house-purpose"><span className="simple-house-emoji" aria-hidden="true">{stage.emoji}</span><div><p className="tbo-caption">{tr('Building {stage}', { stage: tr(stage.name) })}</p><h3 className="tbo-card-title">{tr(stage.virtue)}</h3><p className="tbo-supporting">{tr(stage.purpose)}</p></div></div>
          <div className="simple-house-today"><p className="tbo-label">{tr(complete ? 'Keep living what you have practised.' : data.progress.todayContributed ? 'Today’s shared block is in place!' : 'Today’s challenge → one shared block')}</p><p className="tbo-supporting">{tr(complete ? '365 shared blocks. Keep choosing love in everyday life.' : 'Finish the game and its activity together. Your block appears after both of you complete it.')}</p></div>
          <Button variant="glass-primary" className="simple-house-primary" onClick={onOpenChallenge} disabled={!onOpenChallenge}>{tr('Open today’s challenge')}<ArrowRight aria-hidden="true" /></Button>
          <p className="tbo-caption simple-house-note">{tr('One shared block per day. Missed days never remove progress.')}</p>
        </section>

        <section className="tbo-glass simple-house-panel"><h2 className="tbo-card-title">{tr('From a foundation to a home')}</h2><ol className="simple-house-milestones">{CHARACTER_HOUSE_STAGES.map(item => {
          const done = blocks >= item.end;
          const current = !complete && stage.id === item.id;
          return <li key={item.id} className={`tbo-glass-inset ${current ? 'is-current' : ''} ${done ? 'is-done' : ''}`} aria-current={current ? 'step' : undefined}><span aria-hidden="true">{done ? '✅' : item.emoji}</span><div><span className="tbo-label">{tr(item.name)}</span><span className="tbo-caption">{tr(item.virtue)}</span></div></li>;
        })}</ol><p className="tbo-caption simple-house-note">{tr('Your house records shared practice, not a score for your character.')}</p></section>
      </>}
    </>}
  </div>;
}
