import { useId, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCheck, ChevronRight, Gift, Heart, LockKeyhole, Moon, RotateCcw, Sparkles, Sun, Users } from 'lucide-react';
import { BackButton } from './BackButton';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { LanguageProvider } from '../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { FAITH_QUEST_CHAPTERS, FAITH_QUEST_MISSIONS, getFaithQuestMission, type FaithQuestMission } from '../data/faithQuest';
import { faithQuestContentMessages } from '../locales/faithQuestContent';
import { faithQuestUiMessages } from '../locales/faithQuestUi';
import { getFaithQuestVisuals } from '../data/faithQuestVisuals';
import { faithQuestVisualMessages } from '../locales/faithQuestVisuals';
import { useUiCopy } from '../utils/uiTranslation';
import { completeQuestMission, emptyQuestProgress, questStorageKey, readQuestProgress, saveQuestProgress, type QuestPlayMode } from '../utils/faithQuestProgress';
import { FaithQuestMap } from './FaithQuestMap';
import headerLogo from '../../assets/twobeone-header-logo.png';
import '../styles/faith-quest.css';

const copy = { ...faithQuestContentMessages, ...faithQuestUiMessages, ...faithQuestVisualMessages };
const MODE_TITLES = { heart: 'Know My Heart', grace: 'Choose with Grace', kindness: 'Secret Kindness' } as const;
const MODE_DESCRIPTIONS = {
  heart: 'Choose privately, guess each other’s answer, then reveal.',
  grace: 'Explore a situation and discover how each of you would respond.',
  kindness: 'Choose a thoughtful surprise, try it, then share the story.',
} as const;
const MODE_EMOJI = { heart: '💞', grace: '🕊️', kindness: '🎁' } as const;

interface FaithQuestProps {
  onBack: () => void;
  currentUserId?: string;
  partnerId?: string;
  userName?: string;
  partnerName?: string;
}

export function FaithQuest(props: FaithQuestProps) {
  const [playMode, setPlayMode] = useState<QuestPlayMode>('practice');
  const storageKey = questStorageKey(props.currentUserId, props.partnerId, playMode);
  return <QuestJourney key={storageKey} {...props} playMode={playMode} setPlayMode={setPlayMode} storageKey={storageKey} />;
}

function QuestJourney({ onBack, userName, partnerName, playMode, setPlayMode, storageKey }: FaithQuestProps & {
  playMode: QuestPlayMode; setPlayMode: (mode: QuestPlayMode) => void; storageKey: string;
}) {
  const tr = useUiCopy(copy);
  const [progress, setProgress] = useState(() => readQuestProgress(storageKey));
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [firstName, setFirstName] = useState(userName?.trim().split(/\s+/)[0] || '');
  const [secondName, setSecondName] = useState(partnerName?.trim().split(/\s+/)[0] || '');
  const memoriesRef = useRef<HTMLElement>(null);
  const launchRef = useRef<HTMLButtonElement | null>(null);
  const completedIds = progress.completions.map(item => item.id);
  const currentMission = FAITH_QUEST_MISSIONS[completedIds.length];
  const selectedMission = selectedId ? getFaithQuestMission(selectedId) : undefined;
  const chaptersExplored = new Set(progress.completions.map(item => getFaithQuestMission(item.id)?.chapterId)).size;
  const names: [string, string] = [firstName.trim() || tr('You'), playMode === 'practice' ? tr('Practice partner') : secondName.trim() || tr('Partner')];

  const persist = (next: typeof progress) => {
    setProgress(next);
    setStorageUnavailable(!saveQuestProgress(storageKey, next));
  };
  const openMission = (id: string) => {
    if (!completedIds.includes(id) && id !== currentMission?.id) return;
    launchRef.current = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
    setSelectedId(id);
  };

  return <main className="faith-quest" data-faith-quest>
    <header className="quest-page-header">
      <BackButton label={tr('Back to dashboard')} onClick={onBack} />
      <span className="tbo-eyebrow text-[var(--glass-accent)]">{tr('Game preview')}</span>
      <span className="quest-preview-label tbo-caption"><Sparkles aria-hidden="true" />{tr('Playable preview')}</span>
    </header>

    <section className="quest-hero tbo-glass" aria-labelledby="quest-title">
      <div className="quest-hero-art" aria-hidden="true">
        <span className="quest-art-orbit quest-art-orbit-one" /><span className="quest-art-orbit quest-art-orbit-two" />
        <span className="quest-art-heart"><Heart fill="currentColor" /></span>
        <span className="quest-art-spark quest-art-spark-one"><Sparkles /></span>
        <span className="quest-art-spark quest-art-spark-two"><Gift /></span>
        <span className="quest-art-star">✦</span>
      </div>
      <div className="quest-hero-copy">
        <span className="quest-kicker tbo-eyebrow">{tr('30 missions · 6 chapters')}</span>
        <h1 id="quest-title" className="tbo-page-title">{tr('Together in Faith')}</h1>
        <p className="tbo-card-title quest-tagline">{tr('A little play. A deeper connection.')}</p>
        <p className="tbo-supporting text-muted-foreground">{tr('Play, discover, and grow closer through small acts of faith and love.')}</p>
      </div>
      <div className="quest-hero-bottom">
        <div className="quest-couple" aria-label={`${names[0]} & ${names[1]}`}>
          <span className="quest-person quest-person-first" aria-hidden="true">{names[0].slice(0, 1)}</span>
          <Heart className="quest-couple-heart" aria-hidden="true" />
          <span className="quest-person quest-person-second" aria-hidden="true">{playMode === 'practice' ? <Sparkles /> : names[1].slice(0, 1)}</span>
          <span className="tbo-label">{names[0]} <span aria-hidden="true">&</span> {names[1]}</span>
        </div>
        <Button className="quest-main-action" onClick={() => currentMission ? openMission(currentMission.id) : memoriesRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })}>
          {tr(currentMission ? completedIds.length ? 'Continue your journey' : 'Start our first mission' : 'Explore your memories')}<ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </section>

    <section className="quest-play-settings tbo-glass-inset" aria-label={tr('Playable preview')}>
      <div className="quest-mode-switch" role="group" aria-label={tr('Playable preview')}>
        <button className="tbo-action" type="button" aria-pressed={playMode === 'practice'} onClick={() => setPlayMode('practice')}><Sparkles aria-hidden="true" />{tr('Practice')}</button>
        <button className="tbo-action" type="button" aria-pressed={playMode === 'together'} onClick={() => setPlayMode('together')}><Users aria-hidden="true" />{tr('Pass & play')}</button>
      </div>
      <p className="tbo-supporting">{tr(playMode === 'practice' ? 'Try a mission with sample partner choices.' : 'Take turns together on one device.')}</p>
      {playMode === 'together' && <div className="quest-name-fields">
        <label className="tbo-label">{tr('Your name')}<input className="tbo-field" value={firstName} maxLength={40} onChange={event => setFirstName(event.target.value)} /></label>
        <label className="tbo-label">{tr('Partner’s name')}<input className="tbo-field" value={secondName} maxLength={40} onChange={event => setSecondName(event.target.value)} /></label>
      </div>}
      <p className="tbo-caption text-muted-foreground">{tr('Progress stays on this device. Answers are cleared when a mission closes.')}</p>
      {storageUnavailable && <p role="status" className="tbo-supporting text-[var(--glass-warning)]">{tr('Browser storage is unavailable. Progress lasts for this visit.')}</p>}
    </section>

    <section className="quest-progress" aria-label={tr('Your journey')}>
      <div><p className="tbo-section-title">{tr('Your journey')}</p><p className="tbo-caption text-muted-foreground">{tr('{count} chapters explored', { count: chaptersExplored })}</p></div>
      <div className="quest-progress-meter"><span className="tbo-label">{tr('{count} of 30 missions', { count: completedIds.length })}</span><progress value={completedIds.length} max={30} aria-label={tr('Your journey')} /></div>
    </section>
    <FaithQuestMap completedMissionIds={completedIds} onMissionSelect={openMission} />

    <section className="quest-memories" ref={memoriesRef} aria-labelledby="quest-memories-title">
      <div className="quest-section-heading"><h2 className="tbo-section-title" id="quest-memories-title">{tr('Shared memories')}</h2><Button variant="ghost" onClick={() => setResetOpen(true)} disabled={!completedIds.length}><RotateCcw aria-hidden="true" />{tr('Reset preview')}</Button></div>
      {!completedIds.length ? <div className="quest-empty tbo-glass-inset"><Heart aria-hidden="true" /><p className="tbo-supporting text-muted-foreground">{tr('Your completed missions will appear here.')}</p></div> :
        <div className="quest-memory-grid">{[...progress.completions].reverse().map(completion => {
          const mission = getFaithQuestMission(completion.id)!;
          const chapter = FAITH_QUEST_CHAPTERS.find(item => item.id === mission.chapterId)!;
          return <button type="button" key={completion.id} className="quest-memory tbo-glass-inset" onClick={() => openMission(completion.id)} aria-label={`${tr('Replay mission')}: ${tr(mission.title)}`}><span className="quest-memory-icon" aria-hidden="true">{chapter.emoji}</span><span><span className="tbo-caption quest-accent">{tr(chapter.virtue)}</span><strong className="tbo-card-title">{tr(mission.title)}</strong><span className="tbo-caption text-muted-foreground">{tr('Replay mission')}</span></span><ChevronRight aria-hidden="true" /></button>;
        })}</div>}
    </section>

    {selectedMission && <MissionPlayer key={selectedMission.id} mission={selectedMission} names={names} playMode={playMode}
      onClose={() => setSelectedId(null)} onClosedFocus={() => launchRef.current?.isConnected && launchRef.current.focus()}
      onComplete={() => persist(completeQuestMission(progress, selectedMission.id))}
      nextMissionId={FAITH_QUEST_MISSIONS[Math.max(completedIds.length, FAITH_QUEST_MISSIONS.findIndex(item => item.id === selectedMission.id) + 1)]?.id}
      onNext={id => setSelectedId(id)} />}

    <AlertDialog open={resetOpen} onOpenChange={setResetOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{tr('Reset this journey?')}</AlertDialogTitle><AlertDialogDescription>{tr('This clears this play mode’s completed missions on this device.')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{tr('Keep progress')}</AlertDialogCancel><AlertDialogAction onClick={() => persist(emptyQuestProgress())}>{tr('Reset progress')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}

type Phase = 'intro' | 'answer-a' | 'guess-a' | 'handoff' | 'answer-b' | 'guess-b' | 'kindness-a' | 'kindness-b' | 'ready' | 'reveal' | 'action' | 'complete';

function MissionPlayer({ mission, names, playMode, onClose, onClosedFocus, onComplete, nextMissionId, onNext }: {
  mission: FaithQuestMission; names: [string, string]; playMode: QuestPlayMode;
  onClose: () => void; onClosedFocus: () => void; onComplete: () => void; nextMissionId?: string; onNext: (id: string) => void;
}) {
  const tr = useUiCopy(copy);
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<[number | null, number | null]>([null, null]);
  const [guesses, setGuesses] = useState<[number | null, number | null]>([null, null]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const choiceId = useId();
  const practice = playMode === 'practice';
  const missionIndex = FAITH_QUEST_MISSIONS.findIndex(item => item.id === mission.id);
  const chapter = FAITH_QUEST_CHAPTERS.find(item => item.id === mission.chapterId)!;
  const visual = getFaithQuestVisuals(mission.id);
  const visualChoices = visual?.choices ?? mission.options.map(label => ({ emoji: MODE_EMOJI[mission.mode], label }));
  const scene = visual?.prompt ?? mission.prompt;
  const second = phase.endsWith('-b');
  const isGuess = phase === 'guess-a' || phase === 'guess-b';
  const isChoice = phase === 'answer-a' || phase === 'answer-b' || isGuess;
  const isKindnessAction = phase === 'kindness-a' || phase === 'kindness-b';
  const choice = (isGuess ? guesses : answers)[second ? 1 : 0];
  const stage = ['reveal', 'action', 'complete'].includes(phase) ? phase === 'reveal' ? 1 : 2 : 0;

  const go = (next: Phase) => {
    setAcknowledged(false);
    setPhase(next);
    requestAnimationFrame(() => titleRef.current?.focus());
  };
  const afterFirst = () => {
    if (practice) {
      setAnswers(current => [current[0], (missionIndex + 1) % 3]);
      setGuesses(current => [current[0], (missionIndex + 2) % 3]);
      go('ready');
    } else go('handoff');
  };
  const lockChoice = () => {
    if (choice === null) return;
    if (isGuess) { if (second) go('ready'); else afterFirst(); }
    else if (mission.mode === 'heart') go(second ? 'guess-b' : 'guess-a');
    else if (mission.mode === 'kindness') go(second ? 'kindness-b' : 'kindness-a');
    else if (second) go('ready'); else afterFirst();
  };
  const finish = () => { if (acknowledged) { onComplete(); go('complete'); } };
  const requestClose = () => { if (phase === 'intro' || phase === 'complete') onClose(); else setExitOpen(true); };
  const phaseTitle = isChoice ? isGuess ? tr('What would {name} choose?', { name: names[second ? 0 : 1] }) : tr(scene)
    : phase === 'handoff' ? tr('Pass the device to {name}', { name: names[1] })
    : phase === 'ready' ? tr('Ready to discover?') : phase === 'complete' ? tr(practice ? 'Practice complete' : 'Mission complete')
    : phase === 'reveal' ? tr('Your choices')
    : isKindnessAction ? tr('Your secret mission') : phase === 'action' ? tr('Take it into real life') : tr(mission.title);

  return <>
    <Dialog open onOpenChange={open => { if (!open) requestClose(); }}><DialogContent className="quest-dialog" onCloseAutoFocus={event => { event.preventDefault(); onClosedFocus(); }}>
      <DialogHeader className="quest-player-header">
        <div className="quest-player-eyebrow">
          <span className="quest-mission-number tbo-caption" title={tr(MODE_TITLES[mission.mode])}><span aria-hidden="true">{MODE_EMOJI[mission.mode]}</span><span className="sr-only">{tr(MODE_TITLES[mission.mode])} · </span>{tr('Mission {number}', { number: missionIndex + 1 })}</span>
          {practice && <span className="quest-practice-chip tbo-caption" title={tr('Practice uses sample choices, not your partner’s real answers.')}><span aria-hidden="true">🤖</span>{tr('Sample partner')}</span>}
        </div>
        <ol className="quest-player-steps" aria-label={tr('Game steps')}>{['Choose', 'Discover', 'Act'].map((label, index) => <li key={label} className={index <= stage ? 'is-active' : ''} aria-current={index === stage ? 'step' : undefined} title={tr(label)}><span aria-hidden="true">{['👆', '✨', '🤝'][index]}</span><span className="sr-only">{tr(label)}</span></li>)}</ol>
        {(isChoice || phase === 'intro') && <span className="quest-scene-emoji" aria-hidden="true">{visual?.emoji ?? chapter.emoji}</span>}
        {isChoice && !practice && <p className="quest-turn tbo-caption"><span aria-hidden="true">👤</span>{names[second ? 1 : 0]}</p>}
        <DialogTitle className="tbo-section-title" ref={titleRef} tabIndex={-1}>{phaseTitle}</DialogTitle>
        <DialogDescription className={phase === 'handoff' || isKindnessAction ? '' : 'sr-only'}>{tr(phase === 'handoff' ? 'Your answer is hidden. Let your partner take their turn.' : phase === 'ready' ? 'Both choices are ready. Reveal them together.' : phase === 'complete' ? 'A small moment worth remembering.' : phase === 'intro' ? MODE_DESCRIPTIONS[mission.mode] : isKindnessAction ? 'Keep your choice a surprise until you have tried it.' : isChoice ? 'Choose the answer that feels right to you.' : mission.mode === 'heart' ? 'Matching answers are a discovery. Different answers are a conversation.' : 'Notice what each choice tells you about the other person.')}{practice && <span className="sr-only"> {tr('Practice uses sample choices, not your partner’s real answers.')}</span>}</DialogDescription>
      </DialogHeader>

      {phase === 'intro' && <div className="quest-player-body quest-intro"><p className="tbo-supporting">{tr(scene)}</p><p className="tbo-caption quest-accent">{tr(mission.scripture)} · {tr('{count} min', { count: mission.minutes })}</p><details className="quest-help"><summary className="tbo-caption">{tr('How to play')}</summary><p className="tbo-supporting">{tr(MODE_DESCRIPTIONS[mission.mode])}</p></details><Button className="quest-wide-button" onClick={() => go('answer-a')}>{tr('Start mission')}<ArrowRight aria-hidden="true" /></Button></div>}

      {isChoice && <div className="quest-player-body">
        {isGuess && <p className="quest-scene-caption tbo-supporting">{tr(scene)}</p>}
        <fieldset className="quest-options"><legend className="sr-only">{phaseTitle}</legend>{visualChoices.map((option, index) => <label key={mission.options[index]} className={`quest-option ${choice === index ? 'is-selected' : ''}`} title={tr(mission.options[index])}>
          <input type="radio" name={`choice-${phase}`} checked={choice === index} aria-labelledby={`${choiceId}-${index}-label`} aria-describedby={`${choiceId}-${index}-detail`} onChange={() => {
            const setter = isGuess ? setGuesses : setAnswers;
            setter(current => second ? [current[0], index] : [index, current[1]]);
          }} />
          <span className="quest-option-emoji" aria-hidden="true">{option.emoji}</span>
          <span className="tbo-label" id={`${choiceId}-${index}-label`}>{tr(option.label)}</span>
          <span className="sr-only" id={`${choiceId}-${index}-detail`}>{tr(mission.options[index])}</span>
          {choice === index && <Check className="quest-option-check" aria-hidden="true" />}
        </label>)}</fieldset>
        <Button className="quest-wide-button" disabled={choice === null} onClick={lockChoice}><Check aria-hidden="true" />{tr('Confirm')}</Button>
      </div>}

      {phase === 'handoff' && <div className="quest-handoff"><span className="quest-mission-medallion"><LockKeyhole aria-hidden="true" /></span><p className="tbo-label">{names[1]}</p><Button className="quest-wide-button" onClick={() => go('answer-b')}>{tr('I’m ready')}<ArrowRight aria-hidden="true" /></Button></div>}

      {isKindnessAction && <div className="quest-player-body"><div className="quest-secret-card tbo-glass-inset" title={tr(mission.options[answers[second ? 1 : 0]!])}><span className="quest-option-emoji" aria-hidden="true">{visualChoices[answers[second ? 1 : 0]!].emoji}</span><p className="tbo-card-title">{tr(visualChoices[answers[second ? 1 : 0]!].label)}</p></div><p className="tbo-supporting">{tr(mission.action)}</p><label className="quest-confirm tbo-supporting"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />{tr(practice ? 'I explored this practice activity.' : 'I tried this act of kindness.')}</label><Button className="quest-wide-button" disabled={!acknowledged} onClick={() => second ? go('ready') : afterFirst()}>{tr(practice || second ? 'Ready to discover?' : 'Ready for my partner')}<ArrowRight aria-hidden="true" /></Button></div>}

      {phase === 'ready' && <div className="quest-handoff"><div className="quest-sealed-cards" aria-hidden="true"><span><Heart /></span><span><Heart /></span></div><Button className="quest-wide-button" onClick={() => go('reveal')}><Sparkles aria-hidden="true" />{tr('Reveal our cards')}</Button></div>}

      {phase === 'reveal' && <div className="quest-player-body"><div className="quest-reveal-cards">{names.map((name, index) => <div className={`quest-reveal-card quest-reveal-${index}`} key={index}>
        <span className="tbo-caption">{name}</span>
        <span className="quest-option-emoji" aria-hidden="true">{visualChoices[answers[index]!].emoji}</span>
        <strong className="tbo-card-title" title={tr(mission.options[answers[index]!])}>{tr(visualChoices[answers[index]!].label)}</strong>
        {mission.mode === 'heart' && <p className="tbo-caption text-muted-foreground">{tr(index === 1 ? 'Your guess: {answer}' : '{name}’s guess: {answer}', { name: names[1], answer: tr(visualChoices[guesses[index === 0 ? 1 : 0]!].label) })}</p>}
        {mission.followUps && <details className="quest-scenario-followup quest-help"><summary className="tbo-caption"><span aria-hidden="true">💬 </span>{tr('Try saying')}</summary><p className="tbo-supporting">{tr(mission.followUps[answers[index]!])}</p></details>}
      </div>)}</div><Button className="quest-wide-button" onClick={() => go('action')}>{tr('Take it into real life')}<ArrowRight aria-hidden="true" /></Button></div>}

      {phase === 'action' && <div className="quest-player-body"><span className="quest-scene-emoji" aria-hidden="true">🤝</span><p className="tbo-supporting">{tr(mission.mode === 'kindness' ? 'Tell each other what the surprise meant to you.' : mission.action)}</p><details className="quest-reflection quest-help tbo-glass-inset"><summary className="tbo-label"><span aria-hidden="true">💬 </span>{tr('Reflect together')}</summary><p className="tbo-supporting">{tr(mission.reflection)}</p><span className="tbo-caption text-muted-foreground">{tr(mission.scripture)}</span></details><label className="quest-confirm tbo-supporting"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />{tr(practice ? 'I explored this practice activity.' : 'We tried this together.')}</label><Button className="quest-wide-button" disabled={!acknowledged} onClick={finish}><CheckCheck aria-hidden="true" />{tr(practice ? 'Complete practice' : 'Complete mission')}</Button></div>}

      {phase === 'complete' && <div className="quest-complete"><div className="quest-complete-orb" aria-hidden="true">🏆</div><p className="tbo-card-title">{tr(mission.title)}</p><span className="quest-earned-badge tbo-label"><span aria-hidden="true">{chapter.emoji}</span>{tr(chapter.virtue)}</span>{!nextMissionId && <p className="tbo-supporting text-muted-foreground">{tr('You have explored all 30 missions. Revisit a favorite together.')}</p>}{nextMissionId && <Button className="quest-wide-button" onClick={() => onNext(nextMissionId)}>{tr('Next mission')}<ArrowRight aria-hidden="true" /></Button>}<Button variant="ghost" className="quest-wide-button" onClick={onClose}>{tr('Back to the journey')}</Button></div>}
    </DialogContent></Dialog>
    <AlertDialog open={exitOpen} onOpenChange={setExitOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{tr('Exit mission?')}</AlertDialogTitle><AlertDialogDescription>{tr('Your answers will be cleared. Completed missions stay saved.')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{tr('Keep playing')}</AlertDialogCancel><AlertDialogAction onClick={onClose}>{tr('Exit mission')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}

export function FaithQuestPreview() {
  const tr = useUiCopy(copy);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  return <LanguageProvider><div className="quest-preview-page tbo-glass-app"><header className="quest-preview-header tbo-glass-raised"><a href="/" className="quest-brand" aria-label={tr('Back to TwoBeOne')}><img src={headerLogo} alt="" /><span className="tbo-wordmark">TwoBeOne</span></a><div className="quest-preview-tools"><LanguageSelector /><Button variant="glass" size="icon" aria-label={tr(dark ? 'Switch to light theme' : 'Switch to dark theme')} onClick={() => { document.documentElement.classList.toggle('dark', !dark); setDark(!dark); }}>{dark ? <Sun /> : <Moon />}</Button></div></header><div className="quest-preview-main"><FaithQuest onBack={() => { window.location.href = '/'; }} /></div></div></LanguageProvider>;
}
