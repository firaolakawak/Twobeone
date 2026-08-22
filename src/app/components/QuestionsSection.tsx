import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { MessageCircleHeart, Send, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Question, QuestionResponse } from '../types';

interface QuestionsSectionProps {
  responses: {
    user: QuestionResponse[];
    partner: QuestionResponse[];
  };
  onSaveResponse: (questionId: string, response: string) => Promise<void>;
}

export function QuestionsSection({ responses, onSaveResponse }: QuestionsSectionProps) {
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
      toast.success('Response saved successfully!');
    } catch (error) {
      console.error('Failed to save response:', error);
      toast.error('Failed to save response. Please try again.');
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
        <h2 className="text-2xl">Know Each Other</h2>
      </div>

      {/* Empty State - Questions managed through Admin Panel */}
      <Card className="p-12 text-center">
        <MessageCircleHeart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Questions Managed by Admin</h3>
        <p className="text-muted-foreground mb-4">
          All Q&A questions are now created and managed through the Admin Panel.
          Use the Q&A Discussion Hub to answer questions.
        </p>
      </Card>

      <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby={selectedQuestion?.verseReference ? undefined : "dialog-description-none"}>
          <DialogHeader>
            <DialogTitle className="leading-snug pr-6">
              {selectedQuestion?.verse}
            </DialogTitle>
            {selectedQuestion?.verseReference ? (
              <DialogDescription>
                {selectedQuestion.verseReference}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only" id="dialog-description-none">
                Question for discussion
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Response</Label>
                <Textarea
                  placeholder="Share your thoughts..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                />
              </div>

              {getPartnerResponse(selectedQuestion.id) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Partner's Response</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPartnerResponse(!showPartnerResponse)}
                    >
                      {showPartnerResponse ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>
                  {showPartnerResponse && (
                    <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveResponse}
                  disabled={isLoading || !responseText.trim()}
                  className="flex-1"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Save Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}