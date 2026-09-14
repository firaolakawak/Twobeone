import { LoadingMark } from './BrandLoader';
import { useUiCopy } from '../utils/uiTranslation';
import { questionsUiMessages } from '../locales/questionsUi';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { MessageCircleHeart, Send, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Question, QuestionResponse } from '../types';

interface QuestionsSectionProps {
  responses: {
    user: QuestionResponse[];
    partner: QuestionResponse[];
  };
  onSaveResponse: (questionId: string, response: string) => Promise<void>;
}

export function QuestionsSection({ responses, onSaveResponse }: QuestionsSectionProps) {
  const tr = useUiCopy(questionsUiMessages);
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPartnerResponse, setShowPartnerResponse] = useState(false);

  // Note: Questions are now managed through the Admin Panel
  // This component is deprecated - use QADiscussionHub or QADisplay instead
  const questions: Question[] = [];
  const categories: string[] = [];

  const filteredQuestions = selectedCategory
    ? questions.filter(q => q.category === selectedCategory)
    : questions;

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    const existingResponse = responses.user.find(r => r.questionId === question.id);
    setResponseText(existingResponse?.response || '');
    setShowPartnerResponse(false);
  };

  const handleSaveResponse = async () => {
    if (!selectedQuestion || !responseText.trim()) return;

    setIsLoading(true);
    try {
      await onSaveResponse(selectedQuestion.id, responseText);
      setSelectedQuestion(null);
      setResponseText('');
      toast.success(tr("Response saved successfully!"));
    } catch (error) {
      console.error('Failed to save response:', error);
      toast.error(tr("Failed to save response. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const getUserResponse = (questionId: string) => {
    return responses.user.find(r => r.questionId === questionId);
  };

  const getPartnerResponse = (questionId: string) => {
    return responses.partner.find(r => r.questionId === questionId);
  };

  const getQuestionStatus = (questionId: string) => {
    const userAnswered = getUserResponse(questionId);
    const partnerAnswered = getPartnerResponse(questionId);

    if (userAnswered && partnerAnswered) return 'both';
    if (userAnswered) return 'you';
    if (partnerAnswered) return 'partner';
    return 'none';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircleHeart className="w-6 h-6 text-sky-500" />
        <h2 className="tbo-page-title">{tr("Know Each Other")}</h2>
      </div>

      {/* Empty State - Questions managed through Admin Panel */}
      <Card className="tbo-glass p-12 text-center">
        <MessageCircleHeart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="tbo-card-title mb-2">{tr("Questions Managed by Admin")}</h3>
        <p className="tbo-body text-muted-foreground mb-4">

          {tr("All Q&A questions are now created and managed through the Admin Panel. Use the Q&A Discussion Hub to answer questions.")}
        </p>
      </Card>

      <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby={selectedQuestion?.verseReference ? undefined : "dialog-description-none"}>
          <DialogHeader>
            <DialogTitle className="tbo-dialog-title pr-6">
              {selectedQuestion?.verse}
            </DialogTitle>
            {selectedQuestion?.verseReference ? (
              <DialogDescription className="tbo-supporting">
                {selectedQuestion.verseReference}
              </DialogDescription>
            ) : (
              <DialogDescription className="tbo-supporting sr-only" id="dialog-description-none">

                {tr("Question for discussion")}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="tbo-label">{tr("Your Response")}</Label>
                <Textarea className="tbo-field"
                  placeholder={tr("Share your thoughts...")}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                />
              </div>

              {getPartnerResponse(selectedQuestion.id) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="tbo-label">{tr("Partner's Response")}</Label>
                    <Button className="tbo-action"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPartnerResponse(!showPartnerResponse)}
                    >
                      {showPartnerResponse ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />

                          {tr("Hide")}
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />

                          {tr("Show")}
                        </>
                      )}
                    </Button>
                  </div>
                  {showPartnerResponse && (
                    <div className="p-4 bg-sky-50 rounded-lg border border-[var(--glass-border)]">
                      <p className="tbo-supporting text-muted-foreground whitespace-pre-wrap">
                        {getPartnerResponse(selectedQuestion.id)?.response}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedQuestion(null)}
                  className="tbo-action flex-1"
                >

                  {tr("Cancel")}
                </Button>
                <Button
                  onClick={handleSaveResponse}
                  disabled={isLoading || !responseText.trim()}
                  className="tbo-action flex-1"
                >
                  {isLoading && <LoadingMark className="mr-2" />}
                  <Send className="mr-2 h-4 w-4" />

                  {tr("Save Response")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
