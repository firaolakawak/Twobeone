import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCheck, Heart, Loader2, Lock, MessageCircleHeart, Send, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';

interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: string;
}

interface PartnerChatProps {
  accessToken: string;
  currentUserId: string;
  partnerName?: string;
  partnerOnline?: boolean;
  onBack: () => void;
}

const copy = {
  en: { title: 'Partner Chat', private: 'Private channel for just the two of you', online: 'Online', offline: 'Offline', empty: 'Start your conversation', emptyHint: 'Share a thought, encouragement, or something from your day.', placeholder: 'Message your partner…', send: 'Send message', connect: 'Connect with your partner to start chatting', connectHint: 'Once your accounts are linked, your private channel will appear here.', loadError: 'Could not load your chat', sendError: 'Could not send your message', today: 'Today', yesterday: 'Yesterday', back: 'Back home' },
  am: { title: 'የአጋር ውይይት', private: 'ለሁለታችሁ ብቻ የግል ቻናል', online: 'መስመር ላይ', offline: 'ከመስመር ውጭ', empty: 'ውይይታችሁን ጀምሩ', emptyHint: 'ሀሳብ፣ ማበረታቻ ወይም ከዕለታችሁ የሆነ ነገር አጋሩ።', placeholder: 'ለአጋርዎ መልዕክት ይጻፉ…', send: 'መልዕክት ላክ', connect: 'ለመወያየት ከአጋርዎ ጋር ይገናኙ', connectHint: 'መለያዎቻችሁ ሲገናኙ የግል ቻናላችሁ እዚህ ይታያል።', loadError: 'ውይይቱን መጫን አልተቻለም', sendError: 'መልዕክቱን መላክ አልተቻለም', today: 'ዛሬ', yesterday: 'ትናንት', back: 'ወደ መነሻ ተመለስ' },
  om: { title: 'Haasaʼa Hiriyyaa', private: 'Chaanaalii dhuunfaa isin lamaaniif qofa', online: 'Toora irra', offline: 'Toora ala', empty: 'Haasaʼa keessan jalqabaa', emptyHint: 'Yaada, jajjabina, ykn waan guyyaa keessanii qoodaa.', placeholder: 'Hiriyyaa keetiif ergaa barreessi…', send: 'Ergaa ergi', connect: 'Haasaʼuuf hiriyyaa kee waliin wal qunnami', connectHint: 'Yeroo herregoonni keessan wal qabatan chaanaaliin dhuunfaa keessan asitti mulʼata.', loadError: 'Haasaʼa feʼuun hin dandaʼamne', sendError: 'Ergaa erguun hin dandaʼamne', today: 'Harʼa', yesterday: 'Kaleessa', back: 'Gara manaatti deebiʼi' },
} as const;

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function PartnerChat({ accessToken, currentUserId, partnerName = 'Partner', partnerOnline = false, onBack }: PartnerChatProps) {
  const { language } = useLanguage();
  const text = copy[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasPartner, setHasPartner] = useState(Boolean(partnerName && partnerName !== 'Partner'));
  const endRef = useRef<HTMLDivElement>(null);
  const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/chat`;

  const markRead = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    await fetch(`${apiUrl}/read`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => undefined);
  }, [accessToken, apiUrl]);

  const loadMessages = useCallback(async (silent = false) => {
    try {
      const response = await fetch(`${apiUrl}/messages`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) throw new Error('Chat request failed');
      const data = await response.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setHasPartner(Boolean(data.hasPartner));
      if (data.unreadCount > 0) await markRead();
    } catch (error) {
      if (!silent) toast.error(text.loadError);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [accessToken, apiUrl, markRead, text.loadError]);

  useEffect(() => {
    void loadMessages();
    const interval = window.setInterval(() => void loadMessages(true), 4_000);
    const refresh = () => void loadMessages(true);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [loadMessages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: loading ? 'auto' : 'smooth' }); }, [messages.length, loading]);

  const grouped = useMemo(() => messages.reduce<Record<string, ChatMessage[]>>((result, message) => {
    const key = dayKey(message.createdAt);
    (result[key] ||= []).push(message);
    return result;
  }, {}), [messages]);

  const formatDay = (value: string) => {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (dayKey(value) === dayKey(today.toISOString())) return text.today;
    if (dayKey(value) === dayKey(yesterday.toISOString())) return text.yesterday;
    return new Intl.DateTimeFormat(language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'en-US', { month: 'short', day: 'numeric', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' }).format(date);
  };

  const sendMessage = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Send failed');
      setMessages(current => current.some(entry => entry.id === data.message.id) ? current : [...current, data.message]);
      setDraft('');
    } catch {
      toast.error(text.sendError);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-rose-100 bg-white shadow-[0_24px_70px_-48px_rgba(190,24,93,.6)]" aria-label={text.title}>
      <header className="relative overflow-hidden border-b border-rose-100 bg-gradient-to-br from-rose-600 via-pink-600 to-violet-600 px-5 py-5 text-white">
        <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <button type="button" onClick={onBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25" aria-label={text.back}><ArrowLeft className="h-5 w-5" /></button>
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-rose-700 shadow-md">{partnerName.charAt(0).toUpperCase()}<span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${partnerOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} /></div>
          <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-black">{partnerName}</h1><p className="text-xs font-semibold text-rose-50">{partnerOnline ? text.online : text.offline}</p></div>
          <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider sm:flex"><Lock className="h-3 w-3" />{text.private}</span>
        </div>
      </header>

      {!hasPartner ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center"><span className="grid h-20 w-20 place-items-center rounded-full bg-rose-50 text-rose-500"><UserPlus className="h-10 w-10" /></span><h2 className="mt-5 text-xl font-black text-slate-900">{text.connect}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{text.connectHint}</p></div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-rose-50/35 to-white px-4 py-5 sm:px-6">
            {loading ? <div className="grid h-full place-items-center"><Loader2 className="h-7 w-7 animate-spin text-rose-500" /></div> : messages.length === 0 ? (
              <div className="flex h-full min-h-80 flex-col items-center justify-center text-center"><span className="grid h-20 w-20 place-items-center rounded-full bg-rose-100 text-rose-600"><MessageCircleHeart className="h-10 w-10" /></span><h2 className="mt-5 text-xl font-black text-slate-900">{text.empty}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{text.emptyHint}</p></div>
            ) : Object.entries(grouped).map(([key, dayMessages]) => (
              <div key={key} className="mb-6"><div className="mb-4 flex items-center gap-3"><span className="h-px flex-1 bg-rose-100" /><span className="text-[10px] font-black uppercase tracking-wider text-rose-500">{formatDay(dayMessages[0].createdAt)}</span><span className="h-px flex-1 bg-rose-100" /></div><div className="space-y-3">{dayMessages.map(message => {
                const own = message.senderId === currentUserId;
                return <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] sm:max-w-[70%]`}><div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${own ? 'rounded-br-md bg-rose-600 text-white' : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-100'}`}><p className="whitespace-pre-wrap break-words">{message.message}</p></div><p className={`mt-1 flex items-center gap-1 px-1 text-[10px] font-semibold text-slate-400 ${own ? 'justify-end' : 'justify-start'}`}>{new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt))}{own && <CheckCheck className="h-3 w-3 text-rose-400" />}</p></div></div>;
              })}</div></div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={event => { event.preventDefault(); void sendMessage(); }} className="border-t border-rose-100 bg-white p-3 sm:p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-50"><textarea value={draft} onChange={event => setDraft(event.target.value.slice(0, 2000))} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} maxLength={2000} placeholder={text.placeholder} aria-label={text.placeholder} className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" /><Button type="submit" size="icon" disabled={!draft.trim() || sending} className="h-11 w-11 shrink-0 rounded-xl bg-rose-600 text-white hover:bg-rose-700" aria-label={text.send}>{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</Button></div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400"><Heart className="h-3 w-3 fill-rose-300 text-rose-300" />{text.private}</p>
          </form>
        </>
      )}
    </section>
  );
}
