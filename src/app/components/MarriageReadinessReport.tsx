import { useState, useEffect } from 'react';
import {
  ArrowLeft, RefreshCw, Printer, Heart, BookOpen, MessageCircle,
  Star, Activity, CheckCircle2, Lock, Award, Loader2, AlertCircle,
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
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 1.2s ease' }} />
          </div>
        </div>
      </div>
      {insight && (
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0 0 42px', lineHeight: 1.5 }}>{insight}</p>
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
      if (force) toast.success('Report refreshed!');
    } catch (err: any) {
      const msg = err.message || 'Failed to load report';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--background)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Loader2 style={{ width: 40, height: 40, color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>Analysing your journey together…</p>
      <p style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>This may take up to 30 seconds</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: 'var(--background)' }}>
      <AlertCircle style={{ width: 40, height: 40, color: 'var(--destructive, #ef4444)' }} />
      <p style={{ color: 'var(--foreground)', fontWeight: 600, margin: 0 }}>Could not load report</p>
      <p style={{ color: 'var(--muted-foreground)', fontSize: 13, textAlign: 'center', maxWidth: 300 }}>{error}</p>
      <button onClick={() => fetchReport()} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Try Again</button>
      <button onClick={onBack} style={{ padding: '10px 24px', borderRadius: 8, background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>Go Back</button>
    </div>
  );

  if (!result) return null;

  const { score, eligible, categories, couple, report } = result;
  const accent = scoreAccent(score);
  const label = readinessLabel(score);
  const certDate = new Date(result.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="marriage-report-print-root" style={{ minHeight: '100vh', background: 'var(--background)' }}>
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
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowLeft style={{ width: 18, height: 18, color: 'var(--foreground)' }} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>Marriage Readiness Report</h1>
        <button onClick={() => fetchReport(true)} disabled={regenerating} title="Regenerate" style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RefreshCw style={{ width: 15, height: 15, color: 'var(--muted-foreground)', animation: regenerating ? 'spin 1s linear infinite' : 'none' }} />
        </button>
        <button onClick={() => window.print()} title="Print" style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Printer style={{ width: 15, height: 15, color: 'var(--muted-foreground)' }} />
        </button>
      </div>

      <div className="report-print-content" style={{ maxWidth: 640, margin: '0 auto', padding: '0 0 56px' }}>

        {/* Hero score card */}
        <div className="report-section" style={{ margin: '16px 16px 0', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card, var(--background))' }}>
          <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <ScoreRing score={score} size={140} accent={accent} />
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--foreground)' }}>
              {couple.userName} & {couple.partnerName}
            </h2>
            <span style={{
              display: 'inline-block', padding: '3px 14px', borderRadius: 20,
              background: 'var(--muted)', fontSize: 13, fontWeight: 600, color: accent,
            }}>{label}</span>
            {report?.headline && (
              <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--muted-foreground)', fontStyle: 'italic', lineHeight: 1.6 }}>
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
            <p style={{ margin: 0, fontSize: 12, color: 'var(--foreground)', lineHeight: 1.5 }}>
              {eligible
                ? 'Certificate eligible — you have demonstrated readiness for marriage.'
                : `Certificate unlocks at 75% overall + 80% modules. Currently: ${score}% overall, ${categories.modules.score}% modules.`}
            </p>
          </div>
        </div>

        {/* Narrative */}
        {report?.overallNarrative && (
          <div className="report-section" style={{ margin: '12px 16px 0', padding: '18px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--background)' }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--foreground)', lineHeight: 1.75 }}>{report.overallNarrative}</p>
          </div>
        )}

        {/* Category breakdown */}
        <div style={{ margin: '12px 16px 0', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--background)' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Activity Breakdown</p>
          </div>
          <CategoryBar label="Daily Devotions" score={categories.devotional.score} icon={BookOpen} color="var(--primary)" insight={report?.devotionalInsight} />
          <CategoryBar label="Prayer Life Together" score={categories.prayer.score} icon={Heart} color="var(--chart-2, #8b5cf6)" insight={report?.prayerInsight} />
          <CategoryBar label="Knowing Each Other (Q&A)" score={categories.qa.score} icon={MessageCircle} color="var(--chart-3, #059669)" insight={report?.qaInsight} />
          <CategoryBar label="Pre-Marriage Modules" score={categories.modules.score} icon={Star} color="var(--chart-4, #d97706)" insight={report?.moduleInsight} />
          <div style={{ borderBottom: 'none' }}>
            <CategoryBar label="Daily Spiritual Activity" score={categories.activity.score} icon={Activity} color="var(--chart-5, #0891b2)" insight={report?.activityInsight} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="report-section" style={{ margin: '12px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Avg Streak', value: `${categories.devotional.streak}d`, sub: 'devotional' },
            { label: 'Prayers', value: `${categories.prayer.total}`, sub: `${categories.prayer.answered} answered` },
            { label: 'Q&A Answered', value: `${categories.qa.totalUser + categories.qa.totalPartner}`, sub: `${categories.qa.shared} shared` },
            { label: 'Lessons Done', value: `${categories.modules.completed}/${categories.modules.total}`, sub: 'pre-marriage' },
            { label: 'Devotions', value: `${categories.devotional.completions}`, sub: 'completed' },
            { label: 'Daily Entries', value: `${categories.activity.entries}`, sub: 'mood + journal' },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ padding: '12px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--foreground)', marginTop: 3 }}>{label}</div>
              <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 1 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Strengths & Growth areas */}
        {(report?.strengths?.length || report?.growthAreas?.length) && (
          <div className="report-section" style={{ margin: '12px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {report?.strengths?.length ? (
              <div style={{ padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)' }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Strengths</p>
                {report.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--foreground)', marginBottom: 5, lineHeight: 1.4, display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>•</span>{s}
                  </div>
                ))}
              </div>
            ) : null}
            {report?.growthAreas?.length ? (
              <div style={{ padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)' }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>Growth Areas</p>
                {report.growthAreas.map((g, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--foreground)', marginBottom: 5, lineHeight: 1.4, display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>•</span>{g}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Bible verse */}
        {report?.bibleVerse && (
          <div className="report-section" style={{ margin: '12px 16px 0', padding: '18px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--muted)', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontStyle: 'italic', color: 'var(--foreground)', lineHeight: 1.7 }}>"{report.bibleVerse}"</p>
          </div>
        )}

        {/* Closing encouragement */}
        {report?.closingEncouragement && (
          <div className="report-section" style={{ margin: '12px 16px 0', padding: '16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--background)' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.7 }}>{report.closingEncouragement}</p>
          </div>
        )}

        {/* Certificate */}
        <div className="print-page" style={{
          margin: '20px 16px 0',
          borderRadius: 16, overflow: 'hidden',
          border: `2px solid ${eligible ? accent : 'var(--border)'}`,
          background: 'var(--background)',
        }}>
          <div style={{
            padding: '24px 24px 18px', textAlign: 'center',
            borderBottom: '1px solid var(--border)', background: 'var(--muted)',
          }}>
            <Award style={{ width: 38, height: 38, color: eligible ? accent : 'var(--muted-foreground)', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 6 }}>
              {eligible ? 'Certificate of Marriage Readiness' : 'Progress Certificate'}
            </div>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>
              {couple.userName} & {couple.partnerName}
            </h2>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--muted-foreground)' }}>{certDate}</p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 16px', borderRadius: 20,
              background: eligible ? accent : 'var(--muted-foreground)',
              color: 'var(--background)', fontWeight: 700, fontSize: 13,
            }}>
              <CheckCircle2 style={{ width: 14, height: 14 }} />
              {score}% Readiness Score
            </div>
          </div>

          <div style={{ padding: '18px 24px' }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--foreground)', textAlign: 'center', lineHeight: 1.7 }}>
              {report?.certificateMessage || (eligible
                ? `This certifies that ${couple.userName} and ${couple.partnerName} have demonstrated sincere commitment and intentional preparation for the covenant of marriage.`
                : `${couple.userName} and ${couple.partnerName} are actively building a strong spiritual foundation for marriage. Keep growing together.`)}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
              {[
                ['Devotions', categories.devotional.score],
                ['Prayer', categories.prayer.score],
                ['Q&A', categories.qa.score],
                ['Modules', categories.modules.score],
                ['Activity', categories.activity.score],
              ].map(([name, val]) => (
                <div key={name} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{val}%</div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{name}</div>
                </div>
              ))}
            </div>

            <p style={{ margin: 0, fontSize: 10, color: 'var(--muted-foreground)', textAlign: 'center' }}>
              Generated by TwoBeOne · {certDate}
            </p>
          </div>
        </div>

        <p className="no-print" style={{ margin: '12px 16px 0', fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center' }}>
          Report cached for 24 hours. Use ↺ to regenerate after new activity.
        </p>
      </div>
    </div>
  );
}
