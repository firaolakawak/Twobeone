import { formatUiDate } from '../utils/uiDateTime';
import { UI_LOCALES, useUiCopy } from '../utils/uiTranslation';
import { useCurrentLanguage } from '../utils/languageStore';
import { BrandLoader, LoadingMark } from './BrandLoader';
import { guidanceMessages } from '../locales/guidance';
import { BackButton } from './BackButton';
import { useState, useEffect } from 'react';
import {
  RefreshCw, Printer, Heart, BookOpen, MessageCircle,
  Star, Activity, CheckCircle2, Lock, Award, AlertCircle,
} from 'lucide-react';
import { marriageReadiness } from '../utils/api';
import { toast } from 'sonner';

interface ReadinessResult {
  score: number;
  eligible: boolean;
  categories: {
    devotional: { score: number; streak: number; completions: number };
    prayer:     { score: number; total: number; answered: number };
    qa:         { score: number; shared: number; totalUser: number; totalPartner: number };
    modules:    { score: number; completed: number; total: number };
    activity:   { score: number; entries: number };
  };
  couple: { userName: string; partnerName: string };
  report: {
    headline: string;
    overallNarrative: string;
    devotionalInsight: string;
    prayerInsight: string;
    qaInsight: string;
    moduleInsight: string;
    activityInsight: string;
    strengths: string[];
    growthAreas: string[];
    bibleVerse: string;
    closingEncouragement: string;
    certificateMessage: string;
  } | null;
  generatedAt: string;
}

interface Props {
  onBack: () => void;
}

function ScoreRing({ score, size = 140, accent }: { score: number; size?: number; accent: string }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={accent} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.22} fontWeight={700} fill="var(--foreground)">{score}</text>
      <text x="50%" y="68%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.1} fill="var(--muted-foreground)">/ 100</text>
    </svg>
  );
}

function CategoryBar({ label, score, icon: Icon, insight, color }: {
  label: string; score: number; icon: any; insight?: string; color: string;
}) {
  return (
    <div className="report-category-row" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: insight ? 8 : 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--muted)', flexShrink: 0,
        }}>
          <Icon style={{ width: 15, height: 15, color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="tbo-label" style={{   color: 'var(--foreground)' }}>{label}</span>
            <span className="tbo-label" style={{   color }}>{score}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 1.2s ease' }} />
          </div>
        </div>
      </div>
      {insight && (
        <p className="tbo-caption" style={{  color: 'var(--muted-foreground)', margin: '4px 0 0 42px',  }}>{insight}</p>
      )}
    </div>
  );
}

const readinessLabel = (score: number) =>
  score >= 90 ? 'Deeply Prepared' :
  score >= 75 ? 'Marriage Ready' :
  score >= 60 ? 'Growing Together' :
  score >= 45 ? 'Building Foundation' :
  'Beginning the Journey';

const scoreAccent = (score: number) =>
  score >= 75 ? 'var(--success-500, #22c55e)' :
  score >= 50 ? 'var(--primary)' :
  'var(--warning-500, #f59e0b)';

export function MarriageReadinessReport({ onBack }: Props) {
  const tr = useUiCopy(guidanceMessages);
  const language = useCurrentLanguage();
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (force = false) => {
    if (force) { setRegenerating(true); } else { setLoading(true); }
    setError(null);
    try {
      const data = await marriageReadiness.get(force);
      setResult(data.result);
      if (force) toast.success(tr("Report refreshed!"));
    } catch (err: any) {
      const msg = 'Failed to load report';
      setError(msg);
      toast.error(tr(msg));
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) return (
    <div className="relative" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--background)' }}>
      <BackButton label={tr("Back")} onClick={onBack} className="absolute left-4 top-4" />
      <BrandLoader label={tr("Analysing your journey together…")} />
      <p className="tbo-caption" style={{ color: 'var(--muted-foreground)',  }}>{tr("This may take up to 30 seconds")}</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: 'var(--background)' }}>
      <AlertCircle style={{ width: 40, height: 40, color: 'var(--destructive, #ef4444)' }} />
      <p className="tbo-card-title" style={{ color: 'var(--foreground)',  margin: 0 }}>{tr("Could not load report")}</p>
      <p className="tbo-supporting" style={{ color: 'var(--muted-foreground)',  textAlign: 'center', maxWidth: 300 }}>{tr(error)}</p>
      <button className="tbo-action" onClick={() => fetchReport()} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer',  }}>{tr("Try Again")}</button>
      <BackButton label={tr("Back")} onClick={onBack} showLabel />
    </div>
  );

  if (!result) return null;

  const { score, eligible, categories, couple, report } = result;
  const accent = scoreAccent(score);
  const label = tr(readinessLabel(score));
  const certDate = formatUiDate(new Date(result.generatedAt), UI_LOCALES[language], { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="marriage-report-print-root" style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @page {
          size: A4 portrait;
          margin: 14mm 14mm 16mm;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }

          body * {
            visibility: hidden !important;
          }

          .marriage-report-print-root,
          .marriage-report-print-root * {
            visibility: visible !important;
          }

          .marriage-report-print-root {
            --background: #ffffff;
            --card: #ffffff;
            --foreground: #111827;
            --muted: #f8fafc;
            --muted-foreground: #4b5563;
            --border: #d7dde5;
            --primary: #e11d48;
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-print-content {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .report-section,
          .report-category-row {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-section {
            box-shadow: none !important;
          }

          .print-page {
            break-before: page;
            page-break-before: always;
            break-inside: avoid;
            page-break-inside: avoid;
            margin-top: 0 !important;
          }
        }
      `}</style>

      {/* Sticky header */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--background)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <BackButton label={tr("Back")} onClick={onBack} />
        <h1 className="tbo-page-title" style={{ flex: 1, margin: 0,   color: 'var(--foreground)' }}>{tr("Marriage Readiness Report")}</h1>
        <button onClick={() => fetchReport(true)} disabled={regenerating} title={tr("Regenerate")} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {regenerating ? <LoadingMark /> : <RefreshCw style={{ width: 15, height: 15, color: 'var(--muted-foreground)' }} />}
        </button>
        <button onClick={() => window.print()} title={tr("Print")} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Printer style={{ width: 15, height: 15, color: 'var(--muted-foreground)' }} />
        </button>
      </div>

      <div className="report-print-content" style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 56px' }}>

        {/* Hero score card */}
        <div className="tbo-glass report-section" style={{ margin: '16px 16px 0', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden',  }}>
          <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <ScoreRing score={score} size={140} accent={accent} />
            </div>
            <h2 className="tbo-section-title" style={{ margin: '0 0 6px',   color: 'var(--foreground)' }}>
              {couple.userName} & {couple.partnerName}
            </h2>
            <span className="tbo-label" style={{
              display: 'inline-block', padding: '3px 14px', borderRadius: 20,
              background: 'var(--muted)',   color: accent,
            }}>{label}</span>
            {report?.headline && (
              <p className="tbo-supporting" style={{ margin: '12px 0 0',  color: 'var(--muted-foreground)', fontStyle: 'italic',  }}>
                "{report.headline}"
              </p>
            )}
          </div>

          {/* Eligibility banner */}
          <div style={{
            padding: '12px 18px', borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
            background: eligible ? 'var(--muted)' : 'var(--muted)',
          }}>
            {eligible
              ? <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--success-500, #22c55e)', flexShrink: 0 }} />
              : <Lock style={{ width: 18, height: 18, color: 'var(--muted-foreground)', flexShrink: 0 }} />}
            <p className="tbo-caption" style={{ margin: 0,  color: 'var(--foreground)',  }}>
              {eligible
                ? tr('Certificate eligible — you have demonstrated readiness for marriage.')
                : tr('Certificate unlocks at 75% overall + 80% modules. Currently: {score}% overall, {modules}% modules.', { score, modules: categories.modules.score })}
            </p>
          </div>
        </div>

        {/* Narrative */}
        {report?.overallNarrative && (
          <div className="tbo-glass report-section" style={{ margin: '12px 16px 0', padding: '18px', borderRadius: 14, border: '1px solid var(--border)',  }}>
            <p className="tbo-supporting" style={{ margin: 0,  color: 'var(--foreground)',  }}>{report.overallNarrative}</p>
          </div>
        )}

        {/* Category breakdown */}
        <div className="tbo-glass" style={{ margin: '12px 16px 0', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden',  }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
            <p className="tbo-card-title" style={{ margin: 0,   color: 'var(--foreground)' }}>{tr("Activity Breakdown")}</p>
          </div>
          <CategoryBar label={tr("Daily Devotions")} score={categories.devotional.score} icon={BookOpen} color="var(--primary)" insight={report?.devotionalInsight} />
          <CategoryBar label={tr("Prayer Life Together")} score={categories.prayer.score} icon={Heart} color="var(--chart-2, #8b5cf6)" insight={report?.prayerInsight} />
          <CategoryBar label={tr("Knowing Each Other (Q&A)")} score={categories.qa.score} icon={MessageCircle} color="var(--chart-3, #059669)" insight={report?.qaInsight} />
          <CategoryBar label={tr("Pre-Marriage Modules")} score={categories.modules.score} icon={Star} color="var(--chart-4, #d97706)" insight={report?.moduleInsight} />
          <div style={{ borderBottom: 'none' }}>
            <CategoryBar label={tr("Daily Spiritual Activity")} score={categories.activity.score} icon={Activity} color="var(--chart-5, #0891b2)" insight={report?.activityInsight} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="report-section" style={{ margin: '12px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: tr('Avg Streak'), value: tr('{count} days', { count: categories.devotional.streak }), sub: tr('devotional') },
            { label: tr('Prayers'), value: `${categories.prayer.total}`, sub: tr('{count} answered', { count: categories.prayer.answered }) },
            { label: tr('Q&A Answered'), value: `${categories.qa.totalUser + categories.qa.totalPartner}`, sub: tr('{count} shared', { count: categories.qa.shared }) },
            { label: tr('Lessons Done'), value: `${categories.modules.completed}/${categories.modules.total}`, sub: tr('pre-marriage') },
            { label: tr("Devotions"), value: `${categories.devotional.completions}`, sub: tr('completed') },
            { label: tr('Daily Entries'), value: `${categories.activity.entries}`, sub: tr('mood + journal') },
          ].map(({ label, value, sub }) => (
            <div className="tbo-glass" key={label} style={{ padding: '12px 10px', borderRadius: 10, border: '1px solid var(--border)',  textAlign: 'center' }}>
              <div className="tbo-card-title" style={{   color: 'var(--foreground)',  }}>{value}</div>
              <div className="tbo-caption" style={{   color: 'var(--foreground)', marginTop: 3 }}>{label}</div>
              <div className="tbo-caption" style={{  color: 'var(--muted-foreground)', marginTop: 1 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Strengths & Growth areas */}
        {(report?.strengths?.length || report?.growthAreas?.length) && (
          <div className="report-section" style={{ margin: '12px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {report?.strengths?.length ? (
              <div className="tbo-glass-inset" style={{ padding: '14px', borderRadius: 12, border: '1px solid var(--border)',  }}>
                <p className="tbo-label" style={{ margin: '0 0 8px',   color: 'var(--foreground)' }}>{tr("Strengths")}</p>
                {report.strengths.map((s, i) => (
                  <div className="tbo-caption" key={i} style={{  color: 'var(--foreground)', marginBottom: 5,  display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>•</span>{s}
                  </div>
                ))}
              </div>
            ) : null}
            {report?.growthAreas?.length ? (
              <div className="tbo-glass-inset" style={{ padding: '14px', borderRadius: 12, border: '1px solid var(--border)',  }}>
                <p className="tbo-label" style={{ margin: '0 0 8px',   color: 'var(--foreground)' }}>{tr("Growth Areas")}</p>
                {report.growthAreas.map((g, i) => (
                  <div className="tbo-caption" key={i} style={{  color: 'var(--foreground)', marginBottom: 5,  display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>•</span>{g}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Bible verse */}
        {report?.bibleVerse && (
          <div className="tbo-glass-inset report-section" style={{ margin: '12px 16px 0', padding: '18px 20px', borderRadius: 12, border: '1px solid var(--border)',  textAlign: 'center' }}>
            <p  style={{ margin: 0, fontSize: 14, fontStyle: 'italic', color: 'var(--foreground)', lineHeight: 1.7 }}>"{report.bibleVerse}"</p>
          </div>
        )}

        {/* Closing encouragement */}
        {report?.closingEncouragement && (
          <div className="tbo-glass report-section" style={{ margin: '12px 16px 0', padding: '16px', borderRadius: 12, border: '1px solid var(--border)',  }}>
            <p className="tbo-supporting" style={{ margin: 0,  color: 'var(--muted-foreground)',  }}>{report.closingEncouragement}</p>
          </div>
        )}

        {/* Certificate */}
        <div className="tbo-glass print-page" style={{
          margin: '20px 16px 0',
          borderRadius: 16, overflow: 'hidden',
          border: `2px solid ${eligible ? accent : 'var(--border)'}`,

        }}>
          <div style={{
            padding: '24px 24px 18px', textAlign: 'center',
            borderBottom: '1px solid var(--border)', background: 'var(--muted)',
          }}>
            <Award style={{ width: 38, height: 38, color: eligible ? accent : 'var(--muted-foreground)', margin: '0 auto 10px' }} />
            <div className="tbo-label" style={{     color: 'var(--muted-foreground)', marginBottom: 6 }}>
              {eligible ? tr('Certificate of Marriage Readiness') : tr('Progress Certificate')}
            </div>
            <h2 className="tbo-section-title" style={{ margin: '0 0 4px',   color: 'var(--foreground)' }}>
              {couple.userName} & {couple.partnerName}
            </h2>
            <p className="tbo-caption" style={{ margin: '0 0 10px',  color: 'var(--muted-foreground)' }}>{certDate}</p>
            <div className="tbo-label" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 16px', borderRadius: 20,
              background: eligible ? accent : 'var(--muted-foreground)',
              color: 'var(--background)',
            }}>
              <CheckCircle2 style={{ width: 14, height: 14 }} />
              {score}{tr("% Readiness Score")} </div>
          </div>

          <div style={{ padding: '18px 24px' }}>
            <p className="tbo-supporting" style={{ margin: '0 0 14px',  color: 'var(--foreground)', textAlign: 'center',  }}>
              {report?.certificateMessage || (eligible
                ? tr('This certifies that {user} and {partner} have demonstrated sincere commitment and intentional preparation for the covenant of marriage.', { user: couple.userName, partner: couple.partnerName })
                : tr('{user} and {partner} are actively building a strong spiritual foundation for marriage. Keep growing together.', { user: couple.userName, partner: couple.partnerName }))}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
              {[
                [tr("Devotions"), categories.devotional.score],
                [tr("Prayer"), categories.prayer.score],
                [tr("Q&A"), categories.qa.score],
                [tr("Modules"), categories.modules.score],
                [tr("Activity"), categories.activity.score],
              ].map(([name, val]) => (
                <div key={name} style={{ textAlign: 'center' }}>
                  <div className="tbo-label" style={{   color: 'var(--foreground)' }}>{val}%</div>
                  <div className="tbo-caption" style={{  color: 'var(--muted-foreground)' }}>{name}</div>
                </div>
              ))}
            </div>

            <p className="tbo-caption" style={{ margin: 0,  color: 'var(--muted-foreground)', textAlign: 'center' }}>{tr("Generated by TwoBeOne ·")} {certDate}
            </p>
          </div>
        </div>

        <p className="tbo-caption no-print" style={{ margin: '12px 16px 0',  color: 'var(--muted-foreground)', textAlign: 'center' }}>{tr("Report cached for 24 hours. Use ↺ to regenerate after new activity.")} </p>
      </div>
    </div>
  );
}
