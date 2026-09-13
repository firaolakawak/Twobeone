import { BrandLoader, LoadingMark } from './BrandLoader';
import { useUiCopy, UI_LOCALES } from '../utils/uiTranslation';
import { useCurrentLanguage } from '../utils/languageStore';
import { formatUiDateTime } from '../utils/uiDateTime';
import { systemDiagnosticsMessages } from '../locales/systemDiagnostics';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {  RefreshCw, Database } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';

const supabase = createClient();

export function DebugQuestions() {
  const tr = useUiCopy(systemDiagnosticsMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(0);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || publicAnonKey;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/debug/questions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        setCount(data.count || 0);
        console.log('Debug - All questions in database:', data);
      } else {
        const error = await response.json();
        console.error('Failed to fetch debug questions:', error);
      }
    } catch (error) {
      console.error('Debug fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-sky-600" />
            <h2 className="tbo-section-title">{tr("Debug: Questions Database")}</h2>
          </div>
          <Button onClick={fetchQuestions} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingMark className="w-4 h-4 mr-2 " />
                 {tr("Loading...")} </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                 {tr("Fetch Questions")} </>
            )}
          </Button>
        </div>

        <div className="mb-4">
          <Badge variant="secondary" className="tbo-caption">
             {tr("Total Questions in Database:")} {count}
          </Badge>
        </div>

        <div className="space-y-4">
          {questions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
               {tr("Click \"Fetch Questions\" to load data from database")} </p>
          ) : (
            questions.map((q, index) => (
              <Card key={q.id || index} className="p-4 border-l-4 border-sky-500">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="tbo-card-title">{q.title || tr("No Title")}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{q.category || tr("No Category")}</Badge>
                        <Badge 
                          variant={q.status === 'active' ? 'default' : 'secondary'}
                          className={q.status === 'active' ? 'bg-success-500' : 'bg-neutral-400'}
                        >
                          {q.status || tr("No Status")}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="secondary">{tr("ID:")} {q.id}</Badge>
                  </div>

                  {q.verse && (
                    <div className="bg-primary-50 p-3 rounded-lg">
                      <p className="tbo-supporting italic">"{q.verse}"</p>
                      <p className="tbo-caption text-muted-foreground mt-1">— {q.verseReference}</p>
                    </div>
                  )}

                  {q.prompts && q.prompts.length > 0 && (
                    <div>
                      <p className="tbo-label text-foreground mb-1">
                         {tr("Prompts (")}{q.prompts.length}):
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        {q.prompts.map((prompt: any, i: number) => (
                          <li key={i} className="tbo-supporting text-muted-foreground">
                            {typeof prompt === 'string' ? prompt : prompt.text || tr("Empty prompt")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="tbo-caption flex gap-4 text-muted-foreground">
                    <span>{tr("Created:")} {q.createdAt ? formatUiDateTime(new Date(q.createdAt), locale) : tr("Unknown")}</span>
                    {q.updatedAt && <span>{tr("Updated:")} {formatUiDateTime(new Date(q.updatedAt), locale)}</span>}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <Card className="p-4 bg-warning-50 border-warning-500/30">
        <h3 className="tbo-card-title mb-2">{tr("⚠️ Troubleshooting Tips:")}</h3>
        <ul className="tbo-supporting list-disc list-inside space-y-1 text-foreground">
          <li>{tr("Check if questions have")} <code className="bg-warning-50 px-1">status: 'active'</code></li>
          <li>{tr("Verify the category matches what you're filtering for")}</li>
          <li>{tr("Make sure prompts array is not empty")}</li>
          <li>{tr("Check browser console for detailed logs")}</li>
        </ul>
      </Card>
    </div>
  );
}
