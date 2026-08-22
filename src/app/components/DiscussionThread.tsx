import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { sendNotification } from '../utils/notifications';

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface Question {
  id: string;
  category: string;
  verse: string;
  verseReference: string;
  prompts: string[];
}

interface DiscussionThreadProps {
  questionId: string;
  question: Question;
  promptIndex: number;
  accessToken: string;
  projectId: string;
  currentUserId: string;
  currentUserName: string;
  partner?: {
    id: string;
    name: string;
  };
}

export function DiscussionThread({
  questionId,
  question,
  promptIndex,
  accessToken,
  projectId,
  currentUserId,
  currentUserName,
  partner
}: DiscussionThreadProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Set up polling for real-time updates every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [questionId]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/question-chat/${encodeURIComponent(questionId)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load question chat messages:', response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log('Loaded messages:', data.messages);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    console.log('Sending message:', { questionId, message: newMessage.trim() });
    setIsSending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/question-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            question_id: questionId,
            message: newMessage.trim()
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to send message:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Message sent successfully:', responseData);
      const { message: sentMessage } = responseData;

      // Add message to local state immediately
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');

      toast.success('Message sent!');

      // Send notification to partner
      if (partner) {
        try {
          await sendNotification({
            recipientId: partner.id,
            title: '💬 New Message in Discussion',
            message: `${currentUserName}: ${newMessage.substring(0, 50)}${newMessage.length > 50 ? '...' : ''}`,
            type: 'question_answered',
            projectId,
            accessToken
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      // Reload to sync with server
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Daily Life & Habits': 'from-sky-500 to-sky-600',
      'Intimacy & Lifestyle': 'from-primary-500 to-primary-500',
      'Love & Balance': 'from-primary-500 to-primary-600',
      'Dream Wedding / Dream Home': 'from-warning-500 to-warning-500',
      'Travel & Adventure': 'from-success-500 to-success-700',
      'Relationship Boundaries': 'from-error-500 to-primary-500',
      'Trust & Truth': 'from-sky-500 to-primary-500',
      'Kids & Future': 'from-sky-500 to-sky-500',
      'Finance & Goals': 'from-success-500 to-sky-500',
      'Family Relations': 'from-warning-500 to-warning-500',
      'Bible Convictions': 'from-primary-500 to-primary-500'
    };
    return colors[category] || 'from-neutral-500 to-neutral-500';
  };

  return (
    <Card className="border-2 border-border shadow-md bg-card overflow-hidden">
      {/* Discussion Header */}
      <div className={`px-6 py-4 bg-gradient-to-r ${getCategoryColor(question.category)} bg-opacity-10 border-b border-border`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getCategoryColor(question.category)} flex items-center justify-center shadow-md`}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t.questions.discuss}</h3>
            <p className="text-sm text-muted-foreground">
              Chat about this question with your partner
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getCategoryColor(question.category)} flex items-center justify-center opacity-20`}>
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">{t.questions.notAnsweredYet}</h4>
              <p className="text-sm text-muted-foreground">
                {t.questions.shareYourThoughts} about this question
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {messages.map((msg) => {
              const isCurrentUser = msg.userId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isCurrentUser
                        ? `bg-gradient-to-br ${getCategoryColor(question.category)} text-white`
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`text-xs font-medium ${isCurrentUser ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {msg.userName}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <p className={`text-xs ${isCurrentUser ? 'text-white/60' : 'text-muted-foreground'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="px-6 pb-6 pt-2 border-t border-border bg-muted">
        <div className="flex gap-3">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={partner ? `Message ${partner.name}...` : 'Share your thoughts...'}
            className="flex-1 min-h-[80px] resize-none bg-card"
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            className={`self-end bg-gradient-to-r ${getCategoryColor(question.category)} text-white hover:opacity-90`}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </Card>
  );
}