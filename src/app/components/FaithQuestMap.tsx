import { useId, useState } from 'react';
import { ArrowRight, Check, CheckCheck, Clock3, Gift, Heart, LockKeyhole, Sparkles } from 'lucide-react';
import { FAITH_QUEST_CHAPTERS, FAITH_QUEST_MISSIONS } from '../data/faithQuest';
import { faithQuestContentMessages } from '../locales/faithQuestContent';
import { faithQuestMapMessages } from '../locales/faithQuestMap';
import { useUiCopy } from '../utils/uiTranslation';
import '../styles/faith-quest-map.css';

const mapMessages = { ...faithQuestContentMessages, ...faithQuestMapMessages };
const modes = {
  heart: { label: 'Know My Heart', Icon: Heart },
  grace: { label: 'Choose with Grace', Icon: Sparkles },
  kindness: { label: 'Secret Kindness', Icon: Gift },
} as const;

export interface FaithQuestMapProps {
  completedMissionIds: readonly string[];
  onMissionSelect: (id: string) => void;
}

/** A browsable map: completing a mission opens the next stop, without a daily reset. */
export function FaithQuestMap({ completedMissionIds, onMissionSelect }: FaithQuestMapProps) {
  const tr = useUiCopy(mapMessages);
  const titleId = useId();
  const chapterTitleId = useId();
  const completed = new Set(completedMissionIds);
  const nextMission = FAITH_QUEST_MISSIONS.find(mission => !completed.has(mission.id));
  const [selectedChapterId, setSelectedChapterId] = useState(
    () => nextMission?.chapterId ?? FAITH_QUEST_CHAPTERS[FAITH_QUEST_CHAPTERS.length - 1].id,
  );
  const chapterIndex = Math.max(0, FAITH_QUEST_CHAPTERS.findIndex(chapter => chapter.id === selectedChapterId));
  const chapter = FAITH_QUEST_CHAPTERS[chapterIndex];
  const missions = FAITH_QUEST_MISSIONS.filter(mission => mission.chapterId === chapter.id);
  const completedCount = missions.filter(mission => completed.has(mission.id)).length;
  const isChapterComplete = completedCount === missions.length;
  const nextChapter = FAITH_QUEST_CHAPTERS[chapterIndex + 1];

  return (
    <section className="faith-quest-map" aria-labelledby={titleId}>
      <header className="faith-quest-map__heading">
        <div>
          <h2 id={titleId} className="tbo-section-title">{tr('Your journey map')}</h2>
          <p className="tbo-supporting">{tr('Small steps. A deeper connection.')}</p>
        </div>
        <span className="faith-quest-map__heading-mark" aria-hidden="true"><Sparkles /></span>
      </header>

      <nav className="faith-quest-map__chapters" aria-label={tr('Choose a chapter')}>
        {FAITH_QUEST_CHAPTERS.map((item, index) => {
          const chapterMissions = FAITH_QUEST_MISSIONS.filter(mission => mission.chapterId === item.id);
          const chapterCompleted = chapterMissions.every(mission => completed.has(mission.id));
          const selected = item.id === chapter.id;
          return (
            <button
              key={item.id}
              type="button"
              className="faith-quest-map__chapter tbo-glass-inset"
              aria-pressed={selected}
              onClick={() => setSelectedChapterId(item.id)}
            >
              <span className="faith-quest-map__chapter-icon" aria-hidden="true">
                {item.emoji}
                {chapterCompleted && <span className="faith-quest-map__chapter-check"><Check size={12} /></span>}
              </span>
              <span className="tbo-caption faith-quest-map__chapter-number">{tr('Chapter {number}', { number: index + 1 })}</span>
              <span className="tbo-action">{tr(item.virtue)}</span>
              {chapterCompleted && <span className="sr-only">{tr('Completed')}</span>}
            </button>
          );
        })}
      </nav>

      <div className="faith-quest-map__landscape tbo-glass" aria-labelledby={chapterTitleId}>
        <div className="faith-quest-map__chapter-intro">
          <div className="faith-quest-map__chapter-emblem" aria-hidden="true">{chapter.emoji}</div>
          <div className="faith-quest-map__chapter-copy">
            <p className="tbo-eyebrow">{tr('Chapter {number}', { number: chapterIndex + 1 })}</p>
            <h3 className="tbo-section-title" id={chapterTitleId}>{tr(chapter.title)}</h3>
            <p className="tbo-supporting">{tr(chapter.description)}</p>
            <span className="tbo-caption faith-quest-map__scripture">{tr(chapter.scripture)}</span>
          </div>
          <span className="faith-quest-map__chapter-progress tbo-caption">
            {isChapterComplete ? <CheckCheck aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
            {tr('{completed} of {total} missions completed', { completed: completedCount, total: missions.length })}
          </span>
        </div>

        <ol className="faith-quest-map__trail">
          {missions.map(mission => {
            const number = FAITH_QUEST_MISSIONS.findIndex(item => item.id === mission.id) + 1;
            const isCompleted = completed.has(mission.id);
            const isNext = !isCompleted && nextMission?.id === mission.id;
            const isLocked = !isCompleted && !isNext;
            const mode = modes[mission.mode];
            const ModeIcon = mode.Icon;
            const status = isCompleted ? 'Play again' : isNext ? 'Ready to play' : 'Locked';
            return (
              <li key={mission.id} className="faith-quest-map__stop" data-state={isCompleted ? 'complete' : isNext ? 'next' : 'locked'}>
                <button
                  type="button"
                  className="faith-quest-map__mission"
                  disabled={isLocked}
                  aria-current={isNext ? 'step' : undefined}
                  onClick={() => onMissionSelect(mission.id)}
                >
                  <span className="faith-quest-map__node" aria-hidden="true">
                    {isCompleted ? <Check /> : isLocked ? <LockKeyhole /> : <ModeIcon />}
                  </span>
                  <span className="faith-quest-map__mission-card tbo-glass-inset">
                    <span className="faith-quest-map__mission-meta tbo-caption">
                      <span>{tr('Mission {number}', { number })}</span>
                      <span><Clock3 aria-hidden="true" />{tr('{minutes} min', { minutes: mission.minutes })}</span>
                    </span>
                    <span className="faith-quest-map__mission-title tbo-card-title">{tr(mission.title)}</span>
                    <span className="faith-quest-map__mode tbo-caption"><ModeIcon aria-hidden="true" />{tr(mode.label)}</span>
                    <span className="faith-quest-map__mission-status tbo-action">
                      {tr(status)}
                      {!isLocked && <ArrowRight aria-hidden="true" />}
                    </span>
                    {isLocked && <span className="faith-quest-map__locked-hint tbo-caption">{tr('Complete the previous mission to unlock.')}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {isChapterComplete && nextChapter && (
          <div className="faith-quest-map__chapter-finish">
            <p className="tbo-label"><CheckCheck aria-hidden="true" />{tr('Chapter complete')}</p>
            <button type="button" className="tbo-glass-action tbo-action" onClick={() => setSelectedChapterId(nextChapter.id)}>
              {tr('Next chapter')}<ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
        {!isChapterComplete && nextMission && chapter.id !== nextMission.chapterId && (
          <div className="faith-quest-map__return">
            <button type="button" className="tbo-glass-action tbo-action" onClick={() => setSelectedChapterId(nextMission.chapterId)}>
              {tr('Your next step')}<ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
