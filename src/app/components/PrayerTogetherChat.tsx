import { useState, useEffect } from 'react';
import { Send, Heart, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

interface PrayerMessage {
  id: string;
  devotionId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

interface PrayerTogetherChatProps {
  devotionId: string;
  accessToken: string;
  projectId: string;
  currentUserId: string;
  currentUserName: string;
  partnerName?: string;
}

export function PrayerTogetherChat({
  devotionId,
  accessToken,
  projectId,
  currentUserId,
  currentUserName,
  partnerName = 'Your Partner'
}: PrayerTogetherChatProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<PrayerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  // Fetch prayer messages
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotions/${devotionId}/prayer-chat`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load prayer chat');
      }

      const data = await response.json();
      const newMessages = data.messages || [];
      
      // Check if there are new messages from partner (not from current user)
      if (lastMessageCount > 0 && newMessages.length > lastMessageCount) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage.userId !== currentUserId) {
          // Show toast notification for new partner message
          toast.success(`💜 New prayer from ${latestMessage.userName}`, {
            description: latestMessage.message.substring(0, 60) + (latestMessage.message.length > 60 ? '...' : ''),
            duration: 5000,
          });
        }
      }
      
      setMessages(newMessages);
      setLastMessageCount(newMessages.length);
    } catch (error) {
      console.error('Error loading prayer chat:', error);
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    
    return () => clearInterval(interval);
  }, [devotionId, accessToken]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/devotions/${devotionId}/prayer-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: newMessage.trim()
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add the new message to the list
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(t.messages.errorOccurred);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, PrayerMessage[]>);

  return (
    <div className="flex flex-col overflow-hidden rounded-[1.5rem] border border-rose-100 bg-gradient-to-br from-white to-rose-50/45 shadow-[0_14px_45px_-34px_rgba(190,24,93,0.45)]">
      {/* Chat Header - Fixed height with 16dp padding */}
      <div className="flex-shrink-0 bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-3.5 text-white">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 fill-white" aria-hidden="true" />
          <div>
            <h4 className="font-semibold">Your shared reflection</h4>
            <p className="text-xs text-rose-50">Share what this reading stirred in you</p>
          </div>
        </div>
      </div>

      {/* Messages Area - Fixed height with internal scroll */}
      <div className="h-80 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                <Heart className="h-8 w-8 fill-rose-500 text-rose-500" aria-hidden="true" />
              </div>
              <p className="mb-1 text-sm font-semibold text-slate-700">Begin the conversation</p>
              <p className="text-xs text-slate-500">
                Share your thoughts, prayers, and reflections about this devotional
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  {/* Date Divider - 8dp spacing */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-rose-100" />
                    <span className="px-2 text-xs font-medium text-rose-600">{date}</span>
                    <div className="h-px flex-1 bg-rose-100" />
                  </div>

                  {/* Messages for this date - 12dp spacing */}
                  <div className="space-y-3">
                    {dateMessages.map((message) => {
                      const isCurrentUser = message.userId === currentUserId;
                      
                      return (
                        <div 
                          key={message.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                            {/* Message Bubble - 16dp padding */}
                            <div 
                              className={`rounded-2xl px-4 py-3 ${
                                isCurrentUser 
                                  ? 'rounded-br-sm bg-rose-600 text-white'
                                  : 'rounded-bl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
                              }`}
                            >
                              {!isCurrentUser && (
                                <p className="mb-1 text-xs font-semibold text-rose-600">
                                  {message.userName}
                                </p>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.message}
                              </p>
                            </div>
                            
                            {/* Timestamp - 4dp margin */}
                            <p className={`mt-1 px-2 text-xs text-slate-400 ${
                              isCurrentUser ? 'text-right' : 'text-left'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom with 12dp padding */}
      <div className="flex-shrink-0 border-t border-rose-100 bg-white p-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your prayer or reflection..."
            aria-label="Shared devotional reflection"
            className="min-h-[44px] max-h-[120px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
            rows={1}
            disabled={isSending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="h-11 w-11 flex-shrink-0 rounded-xl bg-rose-600 text-white shadow-sm hover:bg-rose-700"
            aria-label="Send shared reflection"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-400">
          Shared privately with {partnerName}
        </p>
      </div>
    </div>
  );
}
