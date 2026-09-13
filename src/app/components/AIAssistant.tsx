import { BrandLoader, LoadingMark } from './BrandLoader';
import { useUiCopy } from '../utils/uiTranslation';
import { systemMessages } from '../locales/system';
import { useState } from 'react';
import { Sparkles,  BookOpen, MessageCircle, Lightbulb, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { useLanguage } from '../contexts/LanguageContext';

interface Question {
  id: string;
  category: string;
  title: string;
  verse: string;
  verseReference: string;
  prompts: Array<{ id: string; text: string } | string>;
  userAnswers?: Record<string, unknown>;
  partnerAnswers?: Record<string, unknown>;
}

interface AIAssistantProps {
  questions: Question[];
  onClose: () => void;
}

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

interface AIResponse {
  result: string;
  aiPowered: boolean;
}

export function hasAnswers(answers?: Record<string, unknown>): boolean {
  if (!answers) return false;
  return Object.values(answers).some(value => {
    const answer = value && typeof value === 'object' && 'response' in value
      ? (value as { response?: unknown }).response
      : value;
    return Array.isArray(answer) ? answer.length > 0 : answer !== undefined && answer !== null && answer !== '';
  });
}

async function callAI(feature: string, questions: Question[], customPrompt?: string): Promise<AIResponse> {
  const token = await getAccessToken();
  if (!token) throw new Error('Please sign in again to use AI analysis.');
  const questionPayload = feature === 'summarize'
    ? questions
    : feature === 'verse'
      ? questions.slice(0, 5).map(({ title, category }) => ({ title, category }))
      : undefined;
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/ai/analyze`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ feature, questions: questionPayload, customPrompt }),
    }
  );

  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'AI request failed');
  return { result: data.result, aiPowered: data.aiPowered !== false };
}

export function AIAssistant({ questions, onClose }: AIAssistantProps) {
  const tr = useUiCopy(systemMessages);
  const { t } = useLanguage();
  const [activeFeature, setActiveFeature] = useState<'generate' | 'summarize' | 'verse' | 'custom' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const answeredQuestions = questions.filter(q => hasAnswers(q.userAnswers) && hasAnswers(q.partnerAnswers));

  async function handleFeature(feature: 'generate' | 'summarize' | 'verse') {
    setActiveFeature(feature);
    setIsLoading(true);
    setResult(null);

    try {
      const response = await callAI(feature, questions);
      setResult(response.result);
      setIsAIPowered(response.aiPowered);
      const labels: Record<string, string> = {
        generate: 'New questions generated!',
        summarize: 'Discussion summary ready!',
        verse: 'Verse recommendation ready!',
      };
      toast.success(t.messages.savedSuccessfully);
    } catch (error: any) {
      toast.error(error.message ? tr(error.message) : t.messages.tryAgainLater);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCustomPrompt() {
    if (!customPrompt.trim()) return;
    setActiveFeature('custom');
    setIsLoading(true);
    setResult(null);

    try {
      const response = await callAI('custom', questions, customPrompt);
      setResult(response.result);
      setIsAIPowered(response.aiPowered);
      toast.success(t.messages.savedSuccessfully);
    } catch (error: any) {
      toast.error(error.message ? tr(error.message) : t.messages.tryAgainLater);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: 'var(--spacing-6)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflowWrap: 'anywhere',
        gap: 'var(--spacing-5)',
        background: 'var(--primary-50)',
        border: '2px solid var(--primary-200)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <div className="min-w-0 break-words">
            <h3 className="tbo-card-title"
              style={{

                color: 'var(--foreground)',
                margin: 0,
              }}
            >
               {tr("AI Assistant")} </h3>
            <p className="tbo-supporting" style={{  color: 'var(--muted-foreground)', margin: 0 }}>
               {tr("Faith-centred insights — powered by Gemini")} </p>
          </div>
        </div>
        <Button className="tbo-action" variant="ghost" size="icon" aria-label={tr("Close")} onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {[
          {
            feature: 'generate' as const,
            icon: <Lightbulb className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning-500)' }} />,
            label: tr("Generate 3 New Questions"),
            sub: tr("AI-powered faith-based topics"),
            disabled: isLoading,
          },
          {
            feature: 'summarize' as const,
            icon: <MessageCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--secondary-500)' }} />,
            label: tr("Summarise Our Discussions"),
            sub: answeredQuestions.length > 0
              ? tr("{count} discussions to analyse", { count: answeredQuestions.length })
              : tr("No discussions yet — start answering together!"),
            disabled: isLoading || answeredQuestions.length === 0,
          },
          {
            feature: 'verse' as const,
            icon: <BookOpen className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary-600)' }} />,
            label: tr("Recommend a Verse"),
            sub: tr("Personalised for your current journey"),
            disabled: isLoading,
          },
        ].map(({ feature, icon, label, sub, disabled }) => (
          <button
            key={feature}
            onClick={() => handleFeature(feature)}
            disabled={disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-3)',
              padding: 'var(--spacing-4)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.55 : 1,
              textAlign: 'left',
              width: '100%',
              transition: 'opacity 150ms',
            }}
          >
            {icon}
            <div>
              <p className="tbo-body" style={{   color: 'var(--foreground)', margin: 0 }}>
                {label}
              </p>
              <p className="tbo-supporting" style={{  color: 'var(--muted-foreground)', margin: 0 }}>
                {sub}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Prompt */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        <label className="tbo-label" style={{   color: 'var(--foreground)' }}>
           {tr("Ask AI Assistant")} </label>
        <Textarea className="tbo-field"
          placeholder={tr("E.g. 'Help us think through career decisions' or 'Suggest questions about financial planning'…")}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          style={{ background: 'var(--card)' }}
        />
        <Button className="tbo-action min-h-10 h-auto whitespace-normal py-2"
          onClick={handleCustomPrompt}
          disabled={isLoading || !customPrompt.trim()}
          style={{ width: '100%' }}
        >
          {isLoading && activeFeature === 'custom' ? (
            <><LoadingMark className="w-4 h-4 mr-2 " />{tr("Processing…")}</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />{tr("Ask AI")}</>
          )}
        </Button>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
          <BrandLoader label={tr("Processing…")} />
        </div>
      )}

      {/* Result */}
      {result && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <div className="tbo-caption"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)',
              padding: 'var(--spacing-1) var(--spacing-3)',
              background: 'var(--primary-600)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-full)',

              width: 'fit-content',
            }}
          >
            <Sparkles className="w-3 h-3" />
            {isAIPowered ? tr("Gemini AI Response") : tr("Basic Summary (AI unavailable)")}
          </div>
          <ScrollArea className="h-96">
            <div
              style={{
                background: 'var(--card)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-4)',
                border: '1px solid var(--border)',
              }}
            >
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: 'var(--text-callout)',
                  color: 'var(--foreground)',
                  fontWeight: 'var(--font-weight-normal)',
                  margin: 0,
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                }}
              >
                {result}
              </pre>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Disclaimer */}
      <p className="tbo-caption" style={{  color: 'var(--muted-foreground)', textAlign: 'center', margin: 0 }}>
         {tr("💡 AI suggestions are meant to inspire conversation and should be prayerfully considered together")} </p>
    </div>
  );
}
