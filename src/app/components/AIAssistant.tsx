import { useState } from 'react';
import { Sparkles, Loader2, BookOpen, MessageCircle, Lightbulb, X } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { useLanguage } from '../contexts/LanguageContext';

interface Question {
  id: string;
  category: string;
  title: string;
  verse: string;
  verseReference: string;
  prompts: string[];
  userAnswer?: string;
  partnerAnswer?: string;
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

async function callAI(feature: string, questions: Question[], customPrompt?: string): Promise<string> {
  const token = await getAccessToken();
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/ai/analyze`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ feature, questions, customPrompt }),
    }
  );

  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'AI request failed');
  return data.result;
}

export function AIAssistant({ questions, onClose }: AIAssistantProps) {
  const { t } = useLanguage();
  const [activeFeature, setActiveFeature] = useState<'generate' | 'summarize' | 'verse' | 'custom' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const answeredQuestions = questions.filter(q => q.userAnswer && q.partnerAnswer);

  async function handleFeature(feature: 'generate' | 'summarize' | 'verse') {
    setActiveFeature(feature);
    setIsLoading(true);
    setResult(null);

    try {
      const text = await callAI(feature, questions);
      setResult(text);
      const labels: Record<string, string> = {
        generate: 'New questions generated!',
        summarize: 'Discussion summary ready!',
        verse: 'Verse recommendation ready!',
      };
      toast.success(t.messages.savedSuccessfully);
    } catch (error: any) {
      toast.error(error.message || t.messages.tryAgainLater);
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
      const text = await callAI('custom', questions, customPrompt);
      setResult(text);
      toast.success(t.messages.savedSuccessfully);
    } catch (error: any) {
      toast.error(error.message || t.messages.tryAgainLater);
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
        gap: 'var(--spacing-5)',
        background: 'var(--primary-50)',
        border: '2px solid var(--primary-200)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
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
          <div>
            <h3
              style={{
                fontSize: 'var(--text-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              AI Assistant
            </h3>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)', margin: 0 }}>
              Faith-centred insights — powered by Gemini
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        {[
          {
            feature: 'generate' as const,
            icon: <Lightbulb className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning-500)' }} />,
            label: 'Generate 3 New Questions',
            sub: 'AI-powered faith-based topics',
            disabled: isLoading,
          },
          {
            feature: 'summarize' as const,
            icon: <MessageCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--secondary-500)' }} />,
            label: 'Summarise Our Discussions',
            sub: answeredQuestions.length > 0
              ? `${answeredQuestions.length} discussion${answeredQuestions.length !== 1 ? 's' : ''} to analyse`
              : 'No discussions yet — start answering together!',
            disabled: isLoading || answeredQuestions.length === 0,
          },
          {
            feature: 'verse' as const,
            icon: <BookOpen className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary-600)' }} />,
            label: 'Recommend a Verse',
            sub: 'Personalised for your current journey',
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
              <p style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)', margin: 0 }}>
                {label}
              </p>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-foreground)', margin: 0 }}>
                {sub}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Custom Prompt */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
        <label style={{ fontSize: 'var(--text-body)', fontWeight: 'var(--font-weight-medium)', color: 'var(--foreground)' }}>
          Ask AI Assistant
        </label>
        <Textarea
          placeholder="E.g. 'Help us think through career decisions' or 'Suggest questions about financial planning'…"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          style={{ background: 'var(--card)' }}
        />
        <Button
          onClick={handleCustomPrompt}
          disabled={isLoading || !customPrompt.trim()}
          style={{ width: '100%' }}
        >
          {isLoading && activeFeature === 'custom' ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Ask AI</>
          )}
        </Button>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-8)' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary-600)' }} />
        </div>
      )}

      {/* Result */}
      {result && !isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)',
              padding: 'var(--spacing-1) var(--spacing-3)',
              background: 'var(--primary-600)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-caption-small)',
              fontWeight: 'var(--font-weight-semibold)',
              width: 'fit-content',
            }}
          >
            <Sparkles className="w-3 h-3" />
            Gemini AI Response
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
      <p style={{ fontSize: 'var(--text-label)', color: 'var(--muted-foreground)', textAlign: 'center', margin: 0 }}>
        💡 AI suggestions are meant to inspire conversation and should be prayerfully considered together
      </p>
    </div>
  );
}
