import { useState, useEffect } from 'react';
import { Send, Heart, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';

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
      toast.error('Failed to load prayer conversation');
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
      toast.error('Failed to send message');
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
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl overflow-hidden flex flex-col border border-purple-100 dark:border-purple-800">
      {/* Chat Header - Fixed height with 16dp padding */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 fill-white" />
          <div>
            <h4 className="font-semibold">What Do Think!</h4>
            <p className="text-xs opacity-90">Share your Idea and reflections</p>
          </div>
        </div>
      </div>

      {/* Messages Area - Fixed height with internal scroll */}
      <div className="h-80 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-3">
                <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 fill-purple-600 dark:fill-purple-400" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Start praying together</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Share your thoughts, prayers, and reflections about this devotional
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  {/* Date Divider - 8dp spacing */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-purple-200 dark:bg-purple-700" />
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium px-2">{date}</span>
                    <div className="flex-1 h-px bg-purple-200 dark:bg-purple-700" />
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
                                  ? 'bg-purple-600 text-white rounded-br-sm' 
                                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm shadow-sm'
                              }`}
                            >
                              {!isCurrentUser && (
                                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                                  {message.userName}
                                </p>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {message.message}
                              </p>
                            </div>
                            
                            {/* Timestamp - 4dp margin */}
                            <p className={`text-xs text-gray-500 dark:text-gray-400 mt-1 px-2 ${
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
      <div className="border-t border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-900 p-3 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your prayer or reflection..."
            className="flex-1 resize-none rounded-xl border border-purple-200 dark:border-purple-700 dark:bg-gray-800 dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isSending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="bg-purple-600 hover:bg-purple-700 text-white w-11 h-11 flex-shrink-0 rounded-xl"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Your prayers are saved and shared with {partnerName}
        </p>
      </div>
    </div>
  );
}