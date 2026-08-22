import { useState } from 'react';
import { Question } from '../data/questions';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar } from './ui/avatar';
import { MessageCircle, User, Send, Lock, Unlock, Reply } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Answer {
  id: string;
  userId: string;
  questionId: string;
  response: string;
  isPrivate: boolean;
  createdAt: string;
}

interface QAResultsViewProps {
  question: Question;
  userProfile: any;
  partner: any;
  userAnswers: Answer[];
  partnerAnswers: Answer[];
  onDiscuss: () => void;
  onSubmitAnswer: (promptIndex: number, response: string, isPrivate: boolean) => Promise<void>;
  isSubmitting: boolean;
  projectId: string;
  accessToken: string;
}

export function QAResultsView({
  question,
  userProfile,
  partner,
  userAnswers,
  partnerAnswers,
  onDiscuss,
  onSubmitAnswer,
  isSubmitting,
  projectId,
  accessToken
}: QAResultsViewProps) {
  const { t } = useLanguage();
  const [activeAnswers, setActiveAnswers] = useState<{ [key: number]: string }>({});
  const [isPrivateAnswers, setIsPrivateAnswers] = useState<{ [key: number]: boolean }>({});
  const [replyMode, setReplyMode] = useState<{ [key: number]: boolean }>({});
  const [replyTexts, setReplyTexts] = useState<{ [key: number]: string }>({});
  
  const getAnswerForPrompt = (promptIndex: number, isPartner: boolean): Answer | undefined => {
    const answersArray = isPartner ? partnerAnswers : userAnswers;
    return answersArray.find(
      a => a.questionId === `${question.id}:prompt:${promptIndex}`
    );
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const handleSubmit = async (promptIndex: number) => {
    const answer = activeAnswers[promptIndex];
    if (!answer?.trim()) return;
    
    await onSubmitAnswer(promptIndex, answer, isPrivateAnswers[promptIndex] || false);
    
    // Clear the input after successful submission
    setActiveAnswers(prev => ({ ...prev, [promptIndex]: '' }));
  };

  const handleReply = async (promptIndex: number) => {
    const reply = replyTexts[promptIndex];
    if (!reply?.trim()) return;
    
    await onSubmitAnswer(promptIndex, reply, false); // Replies are always shared
    
    // Clear the reply input and close reply mode
    setReplyTexts(prev => ({ ...prev, [promptIndex]: '' }));
    setReplyMode(prev => ({ ...prev, [promptIndex]: false }));
  };

  const getRepliesForPrompt = (promptIndex: number): Answer[] => {
    const questionId = `${question.id}:prompt:${promptIndex}`;
    const allAnswers = [...userAnswers, ...partnerAnswers];
    
    // Get all answers for this question, sorted by creation time
    return allAnswers
      .filter(a => a.questionId === questionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  return (
    <div className="space-y-4">
      {/* Question Cards */}
      {question.prompts.map((prompt, index) => {
        const userAnswer = getAnswerForPrompt(index, false);
        const partnerAnswer = getAnswerForPrompt(index, true);

        return (
          <Card key={index} className="border-2 border-border overflow-hidden bg-card shadow-sm">
            <div className="p-5 space-y-4">
              {/* Question */}
              <h3 className="text-foreground leading-relaxed">
                <span className="font-semibold">{index + 1}. </span>{prompt}
              </h3>

              {/* Side-by-side Answers OR Answer Input */}
              {userAnswer || partnerAnswer ? (
                <div className="space-y-3">
                  {/* Show all replies in conversation thread */}
                  {getRepliesForPrompt(index).map((reply, replyIdx) => {
                    const isCurrentUser = reply.userId === userProfile.id;
                    const isPrivateReply = reply.isPrivate;
                    
                    return (
                      <div key={reply.id} className={`flex items-start gap-3 ${isCurrentUser ? '' : 'justify-end'}`}>
                        {isCurrentUser ? (
                          <>
                            <Avatar className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center text-sm">
                              {userProfile.profilePicture ? (
                                <img 
                                  src={userProfile.profilePicture} 
                                  alt={userProfile.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span>{getInitials(userProfile.name)}</span>
                              )}
                            </Avatar>
                            <div className={`flex-1 max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 ${
                              isPrivateReply 
                                ? 'bg-sky-50 border border-sky-200' 
                                : 'bg-muted'
                            }`}>
                              {isPrivateReply && (
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Lock className="w-3 h-3 text-sky-600" />
                                  <span className="text-xs text-sky-600 font-medium">{t.questions.private}</span>
                                </div>
                              )}
                              <p className="text-foreground text-sm leading-relaxed">
                                {reply.response}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(reply.createdAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 max-w-[75%] bg-muted rounded-2xl rounded-tr-sm px-4 py-3">
                              <p className="text-foreground text-sm leading-relaxed">
                                {reply.response}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 text-right">
                                {new Date(reply.createdAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                            <Avatar className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm">
                              {partner?.profilePicture ? (
                                <img 
                                  src={partner.profilePicture} 
                                  alt={partner.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span>{getInitials(partner?.name || 'Partner')}</span>
                              )}
                            </Avatar>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Reply Input Section */}
                  {partner && getRepliesForPrompt(index).length > 0 && (
                    <div className="pl-11">
                      {!replyMode[index] ? (
                        <Button
                          onClick={() => setReplyMode(prev => ({ ...prev, [index]: true }))}
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Reply className="w-4 h-4 mr-1.5" />
                          {t.questions.reply}
                        </Button>
                      ) : (
                        <div className="space-y-2 bg-muted rounded-lg p-3 border border-border">
                          <Textarea
                            value={replyTexts[index] || ''}
                            onChange={(e) => setReplyTexts(prev => ({ 
                              ...prev, 
                              [index]: e.target.value 
                            }))}
                            placeholder={t.questions.writeAReply}
                            className="min-h-[80px] resize-none text-sm bg-card"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleReply(index)}
                              disabled={isSubmitting || !replyTexts[index]?.trim()}
                              size="sm"
                              className="bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:opacity-90"
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                              {t.common.save}
                            </Button>
                            <Button
                              onClick={() => {
                                setReplyMode(prev => ({ ...prev, [index]: false }));
                                setReplyTexts(prev => ({ ...prev, [index]: '' }));
                              }}
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                            >
                              {t.common.cancel}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Answer Input Form - when no one has answered yet */
                <div className="space-y-3 bg-muted rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{t.questions.shareYourAnswer}</span>
                    <button
                      onClick={() => setIsPrivateAnswers(prev => ({ 
                        ...prev, 
                        [index]: !prev[index] 
                      }))}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isPrivateAnswers[index] ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          {t.questions.private}
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          {t.questions.shared}
                        </>
                      )}
                    </button>
                  </div>
                  <Textarea
                    value={activeAnswers[index] || ''}
                    onChange={(e) => setActiveAnswers(prev => ({ 
                      ...prev, 
                      [index]: e.target.value 
                    }))}
                    placeholder={t.questions.shareYourThoughts}
                    className="min-h-[100px] resize-none text-sm bg-card"
                  />
                  <Button
                    onClick={() => handleSubmit(index)}
                    disabled={isSubmitting || !activeAnswers[index]?.trim()}
                    size="sm"
                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:opacity-90"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isPrivateAnswers[index] ? t.questions.savePriva : t.questions.sendAndSave}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* Single Discuss Button for the entire category */}
      <div className="pt-2">
        <Button
          onClick={onDiscuss}
          variant="outline"
          className="w-full text-foreground hover:text-foreground hover:bg-muted border-2"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {t.questions.discuss} "{question.category}"
        </Button>
      </div>
    </div>
  );
}