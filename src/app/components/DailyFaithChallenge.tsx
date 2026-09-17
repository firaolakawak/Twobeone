import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Check, RefreshCw, Target } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { BrandLoader, LoadingMark } from './BrandLoader';
import { useDailyFaithChallenge } from '../hooks/useDailyFaithChallenge';
import { getFaithQuestMission } from '../data/faithQuest';
import { getFaithQuestVisuals } from '../data/faithQuestVisuals';
import { getDailyFaithEncouragement } from '../data/dailyFaithEncouragement';
import { faithQuestContentMessages } from '../locales/faithQuestContent';
import { faithQuestVisualMessages } from '../locales/faithQuestVisuals';
import { faithQuestUiMessages } from '../locales/faithQuestUi';
import { dailyFaithChallengeMessages } from '../locales/dailyFaithChallenge';
import { useUiCopy } from '../utils/uiTranslation';
import type { DailyFaithChallengeState } from '../utils/dailyFaithChallengeApi';
import '../styles/faith-quest.css';
import '../styles/daily-faith-challenge.css';

const messages = { ...faithQuestContentMessages, ...faithQuestVisualMessages, ...faithQuestUiMessages, ...dailyFaithChallengeMessages };
interface DailyFaithChallengeProps {
  userId?: string;
  partnerId?: string;
  userName?: string;
  partnerName?: string;
  authenticated: boolean;
  moodReady: boolean;
  hasMood: boolean;
  openRequest?: number;
  onRequestConsumed?: () => void;
  onRequestMood: () => void;
  onConnect: () => void;
}

export function DailyFaithChallenge(props: DailyFaithChallengeProps) {
  return <DailyChallengeCard key={JSON.stringify([props.userId, props.partnerId])} {...props} />;
}

function DailyChallengeCard({ userId, partnerId, userName, partnerName, authenticated, moodReady, hasMood, openRequest = 0, onRequestConsumed, onRequestMood, onConnect }: DailyFaithChallengeProps) {
  const tr = useUiCopy(messages);
  const enabled = Boolean(userId && partnerId && authenticated);
  const game = useDailyFaithChallenge(enabled);
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const seen = useRef(new Set<string>());
  const lastRequest = useRef(0);
  const moodRequested = useRef(false);
  const launchRef = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();
  const storageKey = game.challenge ? `twobeone:daily-faith:shown:${JSON.stringify([userId, partnerId])}:${game.challenge.day}` : null;
  const alreadyShown = (key: string) => {
    if (seen.current.has(key)) return true;
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  };
  const remember = (key: string) => {
    seen.current.add(key);
    try { localStorage.setItem(key, '1'); } catch { /* The current visit still remembers dismissal. */ }
  };

  useEffect(() => {
    // A manually opened loading dialog may receive its day after it is visible.
    if (open && storageKey) remember(storageKey);
  }, [open, storageKey]);

  useEffect(() => {
    if (!openRequest) { lastRequest.current = 0; return; }
    if (lastRequest.current === openRequest || !enabled) return;
    lastRequest.current = openRequest;
    moodRequested.current = false;
    setRequested(true);
    onRequestConsumed?.();
  }, [openRequest, enabled, moodReady, hasMood, onRequestConsumed, onRequestMood]);

  useEffect(() => {
    if (!requested || hasMood) { moodRequested.current = false; return; }
    if (moodReady && !moodRequested.current) {
      moodRequested.current = true;
      onRequestMood();
    }
  }, [requested, moodReady, hasMood, onRequestMood]);

  useEffect(() => {
    if (!enabled || !moodReady || !hasMood || open) return;
    const automatic = Boolean(storageKey && game.challenge && !game.challenge.own && !alreadyShown(storageKey));
    if (!requested && !automatic) return;
    // Mood saves update the dashboard before its dialog has finished closing.
    // Wait for all existing dialogs so two modal focus traps never compete.
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const consider = () => {
      if (stopped || document.visibilityState === 'hidden') return;
      if (document.querySelector('[role="dialog"]:not([data-state="closed"]), [role="alertdialog"]:not([data-state="closed"])')) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (stopped || document.visibilityState === 'hidden') return;
        if (document.querySelector('[role="dialog"]:not([data-state="closed"]), [role="alertdialog"]:not([data-state="closed"])')) return;
        if (!requested && storageKey && alreadyShown(storageKey)) return;
        if (storageKey) remember(storageKey);
        setRequested(false);
        setOpen(true);
      }, 250);
    };
    const observer = new MutationObserver(consider);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state', 'role'] });
    document.addEventListener('visibilitychange', consider);
    consider();
    return () => { stopped = true; clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', consider); };
  }, [enabled, moodReady, hasMood, open, requested, storageKey, game.challenge?.own]);

  const launch = () => {
    if (!enabled) { onConnect(); return; }
    setRequested(true);
    void game.refresh();
    if (moodReady && !hasMood) { moodRequested.current = true; onRequestMood(); }
  };
  const errorCopy = game.error === 'partner_required' ? 'Connect with your partner to play your daily challenge.'
    : game.error === 'day_changed' || game.error === 'mission_changed' ? 'A new challenge is ready. Open today’s card.'
    : game.error === 'save' ? 'Could not save your choice. Please try again.'
    : game.error === 'complete' ? 'Could not complete this challenge. Please try again.'
    : 'Could not load today’s challenge. Please try again.';
  const cardStatus = game.challenge?.own?.completedAt ? 'Today’s challenge complete'
    : game.challenge?.bothSubmitted ? 'Your cards are ready'
    : game.challenge?.own ? 'Continue today’s challenge'
    : game.challenge?.partner.submitted ? 'Your partner is waiting' : 'One small challenge. Together.';

  return <>
    <Card className="tbo-glass dashboard-quest-card overflow-hidden">
      <CardContent className="dashboard-quest-content p-5">
        <span className="dashboard-quest-icon tbo-glass-orb grid h-14 w-14 shrink-0 place-items-center rounded-2xl"><Target aria-hidden="true" className="h-7 w-7" /></span>
        <div className="dashboard-quest-heading min-w-0"><p className="tbo-eyebrow text-[var(--glass-accent)]">{tr('Daily challenge')}</p><h3 className="tbo-card-title mt-1">{tr('Together in Faith')}</h3></div>
        <p className="dashboard-quest-description tbo-supporting text-muted-foreground">{tr(enabled ? cardStatus : 'Connect with your partner to play your daily challenge.')}</p>
        <Button ref={launchRef} className="dashboard-quest-action min-h-11" onClick={launch}><span>{tr('Open today’s challenge')}</span><ArrowRight aria-hidden="true" /></Button>
        {requested && !hasMood && <p className="daily-faith-mood-hint tbo-caption" role="status">{tr('Save your mood, then your challenge will open.')}</p>}
      </CardContent>
    </Card>
    {open && <Dialog open onOpenChange={next => { if (!next && !game.saving) setOpen(false); }}>
      <DialogContent className="quest-dialog daily-faith-dialog" aria-describedby={descriptionId} showCloseButton={!game.saving}
        onEscapeKeyDown={event => { if (game.saving) event.preventDefault(); }}
        onInteractOutside={event => { if (game.saving) event.preventDefault(); }}
        onCloseAutoFocus={event => { event.preventDefault(); launchRef.current?.focus(); }}>
        {game.challenge ? <DailyChallengePlayer key={game.challenge.day} game={game} descriptionId={descriptionId} userName={userName || tr('You')} partnerName={partnerName || tr('Partner')} onClose={() => setOpen(false)} />
          : <><DialogHeader><DialogTitle>{tr('Daily challenge')}</DialogTitle><DialogDescription id={descriptionId}>{tr('One small challenge. Together.')}</DialogDescription></DialogHeader>
            {game.error ? <div className="quest-player-body"><p role="alert" className="tbo-supporting">{tr(errorCopy)}</p><Button onClick={() => void game.refresh()} disabled={game.loading}>{game.loading && <LoadingMark />}{tr('Retry')}</Button></div> : <BrandLoader />}</>}
      </DialogContent>
    </Dialog>}
  </>;
}

function DailyChallengePlayer({ game, userName, partnerName, descriptionId, onClose }: {
  game: ReturnType<typeof useDailyFaithChallenge> & { challenge: DailyFaithChallengeState | null };
  userName: string; partnerName: string; descriptionId: string; onClose: () => void;
}) {
  const tr = useUiCopy(messages);
  const state = game.challenge!;
  const mission = getFaithQuestMission(state.missionId)!;
  const visual = getFaithQuestVisuals(state.missionId)!;
  const encouragement = getDailyFaithEncouragement(state.missionId);
  const [choice, setChoice] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [step, setStep] = useState<'choice' | 'guess' | 'kindness' | 'reveal' | 'action'>('choice');
  const [acknowledged, setAcknowledged] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const choiceId = useId();
  const completed = Boolean(state.own?.completedAt);
  const waiting = Boolean(state.own && !state.bothSubmitted);
  const ready = state.bothSubmitted && step !== 'reveal' && step !== 'action' && !completed;
  const choosing = !state.own && (step === 'choice' || step === 'guess');
  const selected = step === 'guess' ? guess : choice;
  const title = completed ? tr('Today’s challenge complete') : waiting ? tr('Waiting for {name}', { name: partnerName })
    : ready ? tr('Your cards are ready') : step === 'guess' ? tr('What would {name} choose?', { name: partnerName })
    : step === 'kindness' ? tr('Try this kindness first') : step === 'reveal' ? tr('Your choices')
    : step === 'action' ? tr('Take it into real life') : tr(visual.prompt);
  const transition = (next: typeof step) => { setStep(next); setAcknowledged(false); requestAnimationFrame(() => titleRef.current?.focus()); };
  const sendChoice = async () => {
    if (choice === null || (mission.mode === 'heart' && guess === null)) return;
    await game.submit({ day: state.day, missionId: state.missionId, choice,
      ...(mission.mode === 'heart' ? { guess: guess! } : {}), ...(mission.mode === 'kindness' ? { kindnessDone: true } : {}) });
  };
  const confirm = () => {
    if (selected === null) return;
    if (step === 'choice' && mission.mode === 'heart') transition('guess');
    else if (step === 'choice' && mission.mode === 'kindness') transition('kindness');
    else void sendChoice();
  };
  const error = game.error === 'day_changed' || game.error === 'mission_changed' ? 'A new challenge is ready. Open today’s card.'
    : game.error === 'partner_required' ? 'Connect with your partner to play your daily challenge.'
    : game.errorOperation === 'load' ? 'Could not load today’s challenge. Please try again.'
    : game.errorOperation === 'complete' ? 'Could not complete this challenge. Please try again.' : 'Could not save your choice. Please try again.';

  return <>
    <DialogHeader className="quest-player-header">
      <div className="quest-player-eyebrow"><span className="quest-mission-number tbo-caption"><Target aria-hidden="true" />{tr('Daily challenge')}</span></div>
      {choosing && step === 'choice' && <blockquote className="daily-faith-encouragement tbo-supporting"><span aria-hidden="true">{encouragement.emoji}</span><span><span className="sr-only">{tr('Today’s encouragement')}: </span>{tr(encouragement.text)}</span></blockquote>}
      <span className="quest-scene-emoji" aria-hidden="true">{completed ? '🏆' : waiting ? '💌' : ready ? '🎉' : step === 'reveal' ? '💞' : step === 'action' ? '🤝' : visual.emoji}</span>
      <DialogTitle className="tbo-section-title" ref={titleRef} tabIndex={-1}>{title}</DialogTitle>
      <DialogDescription id={descriptionId} className={waiting || completed ? '' : 'sr-only'}>{tr(completed ? 'Come back tomorrow for a new challenge.' : waiting ? 'Your choice is saved. We’ll reveal your cards when you’ve both played.' : 'Your choice is private until you both finish.')}</DialogDescription>
    </DialogHeader>
    {game.error && <div role="alert" className="daily-faith-error tbo-supporting"><p>{tr(error)}</p><Button variant="ghost" disabled={game.saving || game.loading} onClick={() => void game.refresh()}><RefreshCw aria-hidden="true" />{tr('Refresh')}</Button></div>}
    {choosing && <div className="quest-player-body">
      {step === 'guess' && <p className="quest-scene-caption tbo-supporting">{tr(visual.prompt)}</p>}
      <fieldset className="quest-options" disabled={game.saving}><legend className="sr-only">{title}</legend>{visual.choices.map((option, index) => <label className={`quest-option ${selected === index ? 'is-selected' : ''}`} key={index} title={tr(mission.options[index])}>
        <input type="radio" name={`daily-choice-${step}`} checked={selected === index} aria-labelledby={`${choiceId}-${index}`} aria-describedby={`${choiceId}-${index}-full`} onChange={() => (step === 'guess' ? setGuess : setChoice)(index)} />
        <span className="quest-option-emoji" aria-hidden="true">{option.emoji}</span><span className="tbo-label" id={`${choiceId}-${index}`}>{tr(option.label)}</span><span id={`${choiceId}-${index}-full`} className="sr-only">{tr(mission.options[index])}</span>{selected === index && <Check className="quest-option-check" aria-hidden="true" />}
      </label>)}</fieldset>
      <Button className="quest-wide-button" onClick={confirm} disabled={selected === null || game.saving}>{game.saving ? <LoadingMark /> : <Check aria-hidden="true" />}{tr(step === 'guess' || mission.mode === 'grace' ? 'Save and notify partner' : 'Confirm')}</Button>
    </div>}
    {!state.own && step === 'kindness' && <div className="quest-player-body"><div className="quest-secret-card tbo-glass-inset"><span className="quest-option-emoji" aria-hidden="true">{visual.choices[choice!].emoji}</span><strong className="tbo-card-title">{tr(visual.choices[choice!].label)}</strong></div><p className="tbo-supporting">{tr(mission.action)}</p><label className="quest-confirm tbo-supporting"><input type="checkbox" checked={acknowledged} disabled={game.saving} onChange={event => setAcknowledged(event.target.checked)} />{tr('I tried this act of kindness.')}</label><Button className="quest-wide-button" disabled={!acknowledged || game.saving} onClick={() => void sendChoice()}>{game.saving && <LoadingMark />}{tr('Save and notify partner')}</Button></div>}
    {waiting && <div className="quest-player-body"><Button variant="glass" className="quest-wide-button" onClick={() => void game.refresh()} disabled={game.loading}>{game.loading ? <LoadingMark /> : <RefreshCw aria-hidden="true" />}{tr('Refresh')}</Button><Button variant="ghost" onClick={onClose}>{tr('Close')}</Button></div>}
    {ready && <Button className="quest-wide-button" onClick={() => transition('reveal')}>{tr('Reveal our cards')}<ArrowRight aria-hidden="true" /></Button>}
    {!completed && state.bothSubmitted && step === 'reveal' && <div className="quest-player-body"><div className="quest-reveal-cards">{[state.own!, state.partner].map((answer, index) => <div className={`quest-reveal-card quest-reveal-${index}`} key={index}><span className="tbo-caption">{index === 0 ? userName : partnerName}</span><span className="quest-option-emoji" aria-hidden="true">{visual.choices[answer.choice!].emoji}</span><strong className="tbo-card-title" title={tr(mission.options[answer.choice!])}>{tr(visual.choices[answer.choice!].label)}</strong>{mission.mode === 'heart' && <p className="tbo-caption text-muted-foreground">{tr(index === 0 ? 'Your guess: {answer}' : '{name}’s guess: {answer}', { name: partnerName, answer: tr(visual.choices[answer.guess!]?.label || '') })}</p>}{mission.followUps && <details className="quest-scenario-followup quest-help"><summary className="tbo-caption">💬 {tr('Try saying')}</summary><p className="tbo-supporting">{tr(mission.followUps[answer.choice!])}</p></details>}</div>)}</div><Button className="quest-wide-button" onClick={() => transition('action')}>{tr('Take it into real life')}<ArrowRight aria-hidden="true" /></Button></div>}
    {!completed && state.bothSubmitted && step === 'action' && <div className="quest-player-body"><p className="tbo-supporting">{tr(mission.mode === 'kindness' ? 'Tell each other what the surprise meant to you.' : mission.action)}</p><details className="quest-reflection quest-help tbo-glass-inset"><summary className="tbo-label">💬 {tr('Reflect together')}</summary><p className="tbo-supporting">{tr(mission.reflection)}</p><span className="tbo-caption">{tr(mission.scripture)}</span></details><label className="quest-confirm tbo-supporting"><input type="checkbox" checked={acknowledged} disabled={game.saving} onChange={event => setAcknowledged(event.target.checked)} />{tr('We tried this together.')}</label><Button className="quest-wide-button" disabled={!acknowledged || game.saving} onClick={() => void game.complete({ day: state.day, missionId: state.missionId })}>{game.saving && <LoadingMark />}{tr('Complete today’s challenge')}</Button></div>}
    {completed && <Button className="quest-wide-button" onClick={onClose}>{tr('Close')}</Button>}
    <p className="daily-faith-day-note tbo-caption">{tr('New challenges follow a shared day for both partners.')}</p>
  </>;
}
