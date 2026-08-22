import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Send, Loader2, Quote, BookOpen } from 'lucide-react';
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
  title: string;
  verse: string;
  verseReference: string;
  category: string;
  prompts: string[];
}

interface QuestionChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
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

export function QuestionChatDialog({
  isOpen,
  onClose,
  question,
  promptIndex,
  accessToken,
  projectId,
  currentUserId,
  currentUserName,
  partner
}: QuestionChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get the specific question ID for this prompt
  const questionChatId = `${question.id}:prompt:${promptIndex}`;

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      // Set up polling for real-time updates every 3 seconds
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, questionChatId]);

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
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/question-chat/${encodeURIComponent(questionChatId)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        console.error('Failed to load question chat messages');
        return;
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

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
            question_id: questionChatId,
            message: newMessage.trim()
          })
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      const { message: sentMessage } = await response.json();

      // Add message to local state immediately
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');

      // Send notification to partner
      if (partner) {
        try {
          await sendNotification({
            recipientId: partner.id,
            title: '💬 New Message in Q&A Chat',
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
      'Daily Life & Habits': 'from-blue-500 to-cyan-500',
      'Intimacy & Lifestyle': 'from-pink-500 to-rose-500',
      'Love & Balance': 'from-purple-500 to-pink-500',
      'Dream Wedding / Dream Home': 'from-amber-500 to-orange-500',
      'Travel & Adventure': 'from-green-500 to-emerald-500',
      'Relationship Boundaries': 'from-red-500 to-pink-500',
      'Trust & Truth': 'from-indigo-500 to-purple-500',
      'Kids & Future': 'from-cyan-500 to-blue-500',
      'Finance & Goals': 'from-emerald-500 to-teal-500',
      'Family Relations': 'from-orange-500 to-amber-500',
      'Bible Convictions': 'from-violet-500 to-purple-500'
    };
    return colors[category] || 'from-gray-500 to-slate-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className={`bg-gradient-to-r ${getCategoryColor(question.category)} text-white border-0`}>
                {question.category}
              </Badge>
              <span className="text-sm text-gray-500">Q{promptIndex + 1}</span>
            </div>
            <DialogTitle className="text-xl leading-relaxed">
              {question.prompts[promptIndex]}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chat with your partner about this question
            </DialogDescription>
            
            {/* Bible Verse Card */}
            <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Quote className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-700 italic">
                    "{question.verse}"
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    {question.verseReference}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getCategoryColor(question.category)} flex items-center justify-center`}>
                <Quote className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Start the Conversation</h4>
                <p className="text-sm text-gray-500">
                  Share your thoughts and discuss this question together
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
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
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className={`text-xs mb-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {msg.userName}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <p className={`text-xs mt-2 ${
                        isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="px-6 py-4 border-t bg-white">
          <div className="flex gap-3 items-end">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={partner ? "Share your thoughts..." : "Connect with your partner to chat"}
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={!partner || isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending || !partner}
              className={`px-6 h-[60px] bg-gradient-to-r ${getCategoryColor(question.category)} text-white hover:opacity-90`}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          {!partner && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Add your partner to start chatting about questions together
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}