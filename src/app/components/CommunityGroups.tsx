import '../styles/feature-glass.css';
import { formatUiTime, formatUiDateTime } from '../utils/uiDateTime';
import { BrandLoader, LoadingMark } from './BrandLoader';
import { useCurrentLanguage } from '../utils/languageStore';
import { useUiCopy, UI_LOCALES } from '../utils/uiTranslation';
import { communityMessages } from '../locales/community';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { BackButton } from './BackButton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import {
  Users,
  MessageCircle,
  Calendar,
  Video,
  Plus,
  Search,
  Send,
  UserPlus,
  LogOut,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Eye,
  Radio,
  Bell,
  ArrowRight,
  Globe2,
  LockKeyhole,
  Heart,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';
import { createBroadcaster, createViewer, type WebRTCBroadcaster, type WebRTCViewer } from '../utils/webrtc';

const supabase = createClient();

interface Group {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  memberCount: number;
}

interface Message {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

interface Event {
  id: string;
  groupId: string;
  title: string;
  description: string;
  date: string;
  location: string;
  createdBy: string;
  createdAt: string;
  rsvpCount: number;
}

interface RSVP {
  eventId: string;
  groupId: string;
  userId: string;
  userName: string;
  status: 'going' | 'maybe' | 'not-going';
  rsvpAt: string;
}

interface LiveSession {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  startedAt: string;
  isActive: boolean;
  viewerCount: number;
  groupName?: string;
}

export function CommunityGroups() {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('discover');
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);

  useEffect(() => {
    loadGroups();
    loadMyGroups();
    loadActiveLiveSessions();

    // Poll for live sessions every 10 seconds
    const interval = setInterval(() => {
      loadActiveLiveSessions();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || publicAnonKey;
  };

  const loadGroups = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { groups } = await response.json();
        setGroups(groups || []);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const loadMyGroups = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/my`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { groups } = await response.json();
        setMyGroups(groups || []);
      }
    } catch (error) {
      console.error('Failed to load my groups:', error);
    }
  };

  const loadActiveLiveSessions = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/active`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { liveSessions } = await response.json();
        setLiveSessions(liveSessions || []);
      }
    } catch (error) {
      console.error('Failed to load live sessions:', error);
    }
  };

  const createGroup = async (data: { name: string; description: string; imageUrl?: string }) => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...data, isPublic: true })
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        const createdGroup = result.group as Group | undefined;
        if (createdGroup) {
          setGroups((current) => current.some((group) => group.id === createdGroup.id)
            ? current
            : [createdGroup, ...current]);
          setMyGroups((current) => current.some((group) => group.id === createdGroup.id)
            ? current
            : [createdGroup, ...current]);
        }
        toast.success(tr("Group created successfully!"));
        setIsCreateDialogOpen(false);
        await Promise.all([loadGroups(), loadMyGroups()]);
      } else {
        toast.error(result.error || `Failed to create group (${response.status})`);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error(tr("Failed to create group"));
    } finally {
      setIsLoading(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/join`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        toast.success(tr("Joined group successfully!"));
        loadGroups();
        loadMyGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || tr("Failed to join group"));
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      toast.error(tr("Failed to join group"));
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/leave`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        toast.success(tr("Left group successfully"));
        setSelectedGroup(null);
        loadGroups();
        loadMyGroups();
      } else {
        toast.error(tr("Failed to leave group"));
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast.error(tr("Failed to leave group"));
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isMember = (groupId: string) => {
    return myGroups.some(g => g.id === groupId);
  };

  if (selectedGroup) {
    return (
      <GroupDetails
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        isMember={isMember(selectedGroup.id)}
        onLeave={() => leaveGroup(selectedGroup.id)}
      />
    );
  }

  return (
    <div className="tbo-feature-layout mx-auto w-full max-w-3xl space-y-7 pb-28">
      <header className="tbo-feature-header relative isolate overflow-hidden rounded-[2rem] tbo-glass-raised px-6 py-7 shadow-[0_18px_55px_-38px_rgba(190,24,93,0.45)] ring-1 ring-[var(--glass-rim)] sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[var(--glass-inset-surface)] blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="tbo-eyebrow mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--glass-inset-surface)] px-3 py-1.5 text-[var(--glass-accent)] shadow-sm ring-1 ring-[var(--glass-rim)]">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden="true" />
                 {tr("Growing in faith together")} </div>
              <h1 className="tbo-page-title text-foreground min-w-0 break-words">{t.community.title}</h1>
              <p className="tbo-body mt-2 max-w-lg text-muted-foreground">{tr("Find belonging, share encouragement, and build meaningful connections with other couples.")}</p>
            </div>
            <Button type="button" onClick={() => setIsCreateDialogOpen(true)} aria-label={tr("Create New Group")} className="h-11 rounded-full px-5 shadow-lg">
              <Plus className="h-4 w-4" aria-hidden="true" />
               {tr("Create Group")} </Button>
          </div>
          <div className="tbo-feature-stats mt-7 grid grid-cols-3 gap-3 border-t border-[var(--glass-border)] pt-5">
            <div><p className="text-xl font-bold text-foreground">{groups.length}</p><p className="tbo-caption mt-0.5 text-muted-foreground">{tr("Communities")}</p></div>
            <div className="border-l border-[var(--glass-border)] pl-3"><p className="text-xl font-bold text-foreground">{myGroups.length}</p><p className="tbo-caption mt-0.5 text-muted-foreground">{tr("Joined")}</p></div>
            <div className="border-l border-[var(--glass-border)] pl-3"><p className="text-xl font-bold text-foreground">{liveSessions.length}</p><p className="tbo-caption mt-0.5 text-muted-foreground">{tr("Live now")}</p></div>
          </div>
        </div>
      </header>

      {/* Live Sessions Banner */}
      {liveSessions.length > 0 && (
        <Card className="tbo-glass overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="h-6 w-6 animate-pulse text-red-500" aria-hidden="true" />
                <div className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="tbo-card-title text-red-800 min-w-0 break-words">{tr("Live conversations happening now")}</h3>
                <p className="text-sm text-red-700">
                  {tr("{count} groups are streaming live", { count: liveSessions.length })}
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                className="rounded-full bg-red-600 px-4 hover:bg-red-700"
                onClick={() => setActiveTab('live')}
              >
                 {tr("Watch Live")} </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="gap-0 overflow-hidden rounded-[1.75rem] border-[var(--glass-border)] p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-[var(--glass-border)] tbo-glass-raised px-6 py-6 pr-12 text-left">
            <DialogTitle className="text-foreground">{tr("Create Community Group")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
               {tr("Start a new community group to connect with other couples")} </DialogDescription>
          </DialogHeader>
          <CreateGroupForm onSubmit={createGroup} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList className="grid h-auto min-h-14 w-full grid-cols-3 rounded-[1.25rem] border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] p-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-24px_rgba(15,23,42,0.45)]" aria-label={tr("Community sections")}>
          <TabsTrigger value="discover" className="h-full gap-2 rounded-[0.9rem] text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[var(--glass-rim)] min-w-0 min-h-11 h-auto flex-wrap whitespace-normal [overflow-wrap:anywhere] [&>span]:min-w-0"><Search className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{tr("Discover")}</span><span className="sm:hidden">{tr("Explore")}</span></TabsTrigger>
          <TabsTrigger value="my-groups" className="h-full gap-2 rounded-[0.9rem] text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[var(--glass-rim)] min-w-0 min-h-11 h-auto flex-wrap whitespace-normal [overflow-wrap:anywhere] [&>span]:min-w-0"><Users className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{t.community.myGroups}</span><span className="sm:hidden">{tr("Joined")}</span></TabsTrigger>
          <TabsTrigger value="live" className="h-full gap-2 rounded-[0.9rem] text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-[var(--glass-rim)] min-w-0 min-h-11 h-auto flex-wrap whitespace-normal [overflow-wrap:anywhere] [&>span]:min-w-0"><Radio className="h-4 w-4" aria-hidden="true" />{tr("Live")}</TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          {/* Search */}
          <div className="relative" role="search">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder={tr("Search groups...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(event) => { if (event.key === 'Escape') setSearchQuery(''); }}
              className="h-12 rounded-2xl border-[var(--glass-border)] bg-[var(--glass-inset-surface)] pl-11 pr-11 shadow-[0_8px_25px_-22px_rgba(15,23,42,0.55)] placeholder:text-muted-foreground focus-visible:border-rose-300 focus-visible:ring-4 focus-visible:ring-[var(--glass-rim)]"
              aria-label={tr("Search community groups")}
            />
            {searchQuery && <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-[var(--glass-inset-surface)] hover:text-foreground" aria-label={tr("Clear community search")}><X className="h-4 w-4" aria-hidden="true" /></button>}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 px-1 [&>div]:min-w-0 [&>div]:flex-1">
            <div>
              <h2 className="tbo-section-title text-foreground min-w-0 break-words">{tr("Discover communities")}</h2>
              <p className="tbo-supporting mt-1 text-muted-foreground">{tr("Find a group where you can grow together.")}</p>
            </div>
            <span className="tbo-label shrink-0 text-muted-foreground">{filteredGroups.length} {filteredGroups.length === 1 ? tr("group") : tr("groups")}</span>
          </div>

          {/* Groups Grid */}
          <div className="grid min-w-0 gap-5">
            {filteredGroups.map((group) => (
              <CommunityGroupCard
                key={group.id}
                group={group}
                member={isMember(group.id)}
                onView={() => setSelectedGroup(group)}
                onJoin={() => joinGroup(group.id)}
              />
            ))}

            {filteredGroups.length === 0 && (
              <Card className="tbo-glass rounded-[2rem] border-[var(--glass-border)] bg-gradient-to-br from-white to-rose-50/60 min-w-0 p-5 sm:p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]"><Users className="h-7 w-7" /></div>
                <h3 className="tbo-card-title mb-2 text-foreground min-w-0 break-words">{tr("No Groups Found")}</h3>
                <p className="tbo-body mb-4 text-muted-foreground">
                  {searchQuery ? tr("Try a different search term") : tr("Be the first to create a community group!")}
                </p>
                {searchQuery && <Button type="button" variant="ghost" onClick={() => setSearchQuery('')} className="rounded-full text-[var(--glass-accent)] hover:bg-[var(--glass-inset-surface)]">{tr("Clear search")}</Button>}
              </Card>
            )}
          </div>
        </TabsContent>

        {/* My Groups Tab */}
        <TabsContent value="my-groups" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1 [&>div]:min-w-0 [&>div]:flex-1">
            <div>
              <h2 className="tbo-section-title text-foreground min-w-0 break-words">{tr("My communities")}</h2>
              <p className="tbo-supporting mt-1 text-muted-foreground">{tr("Continue connecting with your groups.")}</p>
            </div>
            <span className="tbo-label shrink-0 text-muted-foreground">{myGroups.length} {myGroups.length === 1 ? tr("group") : tr("groups")}</span>
          </div>
          <div className="grid min-w-0 gap-5">
            {myGroups.map((group) => (
              <CommunityGroupCard key={group.id} group={group} member onView={() => setSelectedGroup(group)} />
            ))}

            {myGroups.length === 0 && (
              <Card className="tbo-glass rounded-[2rem] border-[var(--glass-border)] bg-gradient-to-br from-white to-rose-50/60 min-w-0 p-5 sm:p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]"><Users className="h-7 w-7" /></div>
                <h3 className="tbo-card-title mb-2 text-foreground min-w-0 break-words">{tr("No Groups Yet")}</h3>
                <p className="tbo-body mb-4 text-muted-foreground">{tr("Join or create a group to get started!")}</p>
                <Button onClick={() => setActiveTab('discover')} className="rounded-full">
                   {tr("Discover Groups")} </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Live Tab */}
        <TabsContent value="live" className="space-y-6">
          <div className="px-1">
            <h2 className="tbo-section-title text-foreground min-w-0 break-words">{tr("Live now")}</h2>
            <p className="tbo-supporting mt-1 text-muted-foreground">{tr("Join real-time conversations from your communities.")}</p>
          </div>
          <div className="grid min-w-0 gap-5">
            {liveSessions.map((session) => (
              <LiveSessionCard key={session.id} session={session} />
            ))}

            {liveSessions.length === 0 && (
              <Card className="tbo-glass rounded-[2rem] border-[var(--glass-border)] bg-gradient-to-br from-white to-rose-50/60 min-w-0 p-5 sm:p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--glass-inset-surface)] text-[var(--glass-accent)]"><Video className="h-7 w-7" /></div>
                <h3 className="tbo-card-title mb-2 text-foreground min-w-0 break-words">{tr("No Live Sessions")}</h3>
                <p className="tbo-body text-muted-foreground">{tr("Check back later for live streams from your groups!")}</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CommunityGroupCardProps {
  group: Group;
  member: boolean;
  onView: () => void;
  onJoin?: () => void;
}

function CommunityGroupCard({ group, member, onView, onJoin }: CommunityGroupCardProps) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  return (
    <Card className="tbo-glass group overflow-hidden rounded-[1.5rem] border border-[var(--glass-border)] shadow-[0_12px_36px_-28px_rgba(15,23,42,0.45)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--glass-border)] hover:shadow-[0_18px_42px_-26px_rgba(190,24,93,0.3)] focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-[var(--glass-rim)]">
      <CardContent className="tbo-feature-card-content p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="tbo-feature-card-heading flex min-w-0 flex-1 gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl tbo-glass-inset text-[var(--glass-accent)] ring-1 ring-[var(--glass-rim)] transition-transform duration-200 group-hover:scale-[1.03] sm:h-18 sm:w-18">
              {group.imageUrl ? (
                <img src={group.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Users className="h-8 w-8" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="tbo-card-title text-foreground min-w-0 break-words">
                {group.name}
              </h3>
              <p className="tbo-supporting mt-1.5 line-clamp-2 text-muted-foreground">
                {group.description || tr("A welcoming space for couples to connect and grow together.")}
              </p>
              <div className="tbo-supporting mt-3 flex flex-wrap items-center gap-2.5 text-muted-foreground">
                <span className="tbo-supporting inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {group.memberCount} {group.memberCount === 1 ? tr("member") : tr("members")}
                </span>
                <span className="h-4 w-px bg-[var(--glass-inset-surface)]" aria-hidden="true" />
                <Badge variant="secondary" className="max-w-full whitespace-normal h-auto min-h-6 gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] px-2.5 text-muted-foreground shadow-none">
                  {group.isPublic ? <Globe2 className="h-3 w-3" aria-hidden="true" /> : <LockKeyhole className="h-3 w-3" aria-hidden="true" />}
                  {group.isPublic ? tr("Public") : tr("Private")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 sm:justify-end">
            {member ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onView}
                className="min-h-10 w-full justify-center rounded-full px-4 text-[var(--glass-accent)] transition-all duration-200 hover:bg-[var(--glass-inset-surface)] hover:text-[var(--glass-accent)] sm:w-auto h-auto whitespace-normal py-2"
                aria-label={`View ${group.name}`}
              >
                 {tr("View Group")} <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onJoin}
                className="min-h-10 w-full rounded-full px-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-auto h-auto whitespace-normal py-2"
                aria-label={`Join ${group.name}`}
              >
                <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                 {tr("Join Group")} </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Group Form Component
function CreateGroupForm({ onSubmit, isLoading }: { onSubmit: (data: any) => Promise<void>; isLoading: boolean }) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(tr("Please enter a group name"));
      return;
    }
    void onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      <div className="space-y-2">
        <Label htmlFor="name">{tr("Group Name")}</Label>
        <Input
          id="name"
          placeholder={tr("e.g., Young Couples Fellowship")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-11 rounded-xl border-[var(--glass-border)] focus-visible:ring-rose-400"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{tr("Description")}</Label>
        <Textarea
          id="description"
          placeholder={tr("What is this group about?")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="rounded-xl border-[var(--glass-border)] focus-visible:ring-rose-400"
        />
      </div>
      <Button type="submit" className="min-h-11 w-full rounded-full shadow-sm h-auto whitespace-normal py-2" disabled={isLoading}>
        {isLoading && <LoadingMark />}
        {isLoading ? tr("Saving...") : t.community.createGroup}
      </Button>
    </form>
  );
}

// Group Details Component
function GroupDetails({ group, onBack, isMember, onLeave }: {
  group: Group;
  onBack: () => void;
  isMember: boolean;
  onLeave: () => void;
}) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="tbo-feature-layout mx-auto w-full max-w-3xl space-y-7 pb-28">
      <header className="tbo-feature-header relative isolate overflow-hidden rounded-[2rem] tbo-glass-raised px-6 py-7 shadow-[0_18px_55px_-38px_rgba(190,24,93,0.45)] ring-1 ring-[var(--glass-rim)] sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[var(--glass-inset-surface)] blur-3xl" aria-hidden="true" />
        <div className="relative">
          <BackButton label={tr("Back to communities")} onClick={onBack} className="mb-5" />
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl tbo-glass-inset text-[var(--glass-accent)] ring-1 ring-[var(--glass-rim)]">
              {group.imageUrl ? <img src={group.imageUrl} alt="" className="h-full w-full object-cover" /> : <Users className="h-7 w-7" />}
            </div>
            <div className="min-w-0 flex-1 basis-48">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="tbo-page-title text-foreground min-w-0 break-words">{group.name}</h1>
                <Badge className="max-w-full whitespace-normal h-auto min-h-6 max-w-full whitespace-normal border-0 bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] shadow-sm hover:bg-[var(--glass-inset-surface)]">{group.memberCount}  {tr("members")}</Badge>
              </div>
              <p className="tbo-body mt-2 max-w-xl text-muted-foreground">{group.description || tr("A welcoming space for couples to connect and grow together.")}</p>
            </div>
          </div>
          {isMember && (
            <Button variant="outline" size="sm" onClick={onLeave} className="mt-5 rounded-full border-[var(--glass-border)] bg-[var(--glass-inset-surface)] text-[var(--glass-accent)] hover:bg-[var(--glass-inset-surface)] hover:text-[var(--glass-accent)]">
              <LogOut className="h-4 w-4" />  {tr("Leave group")} </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
        <TabsList className="grid h-auto min-h-14 w-full grid-cols-3 rounded-[1.25rem] border border-[var(--glass-border)] bg-[var(--glass-inset-surface)] p-1.5 shadow-inner">
          <TabsTrigger value="chat" className="h-full rounded-[0.9rem] text-muted-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-sm min-w-0 whitespace-normal">
            <MessageCircle className="mr-2 h-4 w-4" />
             {tr("Chat")} </TabsTrigger>
          <TabsTrigger value="events" className="h-full rounded-[0.9rem] text-muted-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-sm min-w-0 whitespace-normal">
            <Calendar className="mr-2 h-4 w-4" />
             {tr("Events")} </TabsTrigger>
          <TabsTrigger value="live" className="h-full rounded-[0.9rem] text-muted-foreground data-[state=active]:bg-[var(--glass-inset-surface)] data-[state=active]:text-[var(--glass-accent)] data-[state=active]:shadow-sm min-w-0 whitespace-normal">
            <Video className="mr-2 h-4 w-4" />
             {tr("Go Live")} </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <GroupChat groupId={group.id} />
        </TabsContent>

        <TabsContent value="events">
          <GroupEvents groupId={group.id} />
        </TabsContent>

        <TabsContent value="live">
          <GoLive groupId={group.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Group Chat Component
function GroupChat({ groupId }: { groupId: string }) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [groupId]);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || publicAnonKey;
  };

  const loadMessages = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { messages } = await response.json();
        setMessages(messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: newMessage })
        }
      );

      if (response.ok) {
        setNewMessage('');
        loadMessages();
      } else {
        toast.error(tr("Failed to send message"));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(tr("Failed to send message"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Messages */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="tbo-label">{msg.userName}</span>
                  <span className="tbo-caption text-muted-foreground">
                    {formatUiTime(new Date(msg.createdAt), locale)}
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="tbo-body break-words">{msg.message}</p>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="tbo-body">{tr("No messages yet. Start the conversation!")}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder={tr("Type your message...")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Group Events Component (continuing in next message due to length...)
function GroupEvents({ groupId }: { groupId: string }) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RSVP[]>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [groupId]);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || publicAnonKey;
  };

  const loadEvents = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/events`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { events } = await response.json();
        setEvents(events || []);

        // Load RSVPs for each event
        events.forEach((event: Event) => {
          loadRSVPs(event.id);
        });
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const loadRSVPs = async (eventId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/events/${eventId}/rsvps`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { rsvps: eventRsvps } = await response.json();
        setRsvps(prev => ({ ...prev, [eventId]: eventRsvps || [] }));
      }
    } catch (error) {
      console.error('Failed to load RSVPs:', error);
    }
  };

  const createEvent = async (data: { title: string; description: string; date: string; location: string }) => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (response.ok) {
        toast.success(tr("Event created successfully!"));
        setIsCreateDialogOpen(false);
        loadEvents();
      } else {
        toast.error(tr("Failed to create event"));
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error(tr("Failed to create event"));
    } finally {
      setIsLoading(false);
    }
  };

  const rsvpToEvent = async (eventId: string, status: 'going' | 'maybe' | 'not-going') => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/events/${eventId}/rsvp`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        }
      );

      if (response.ok) {
        toast.success(tr("RSVP saved!"));
        loadRSVPs(eventId);
      } else {
        toast.error(tr("Failed to RSVP"));
      }
    } catch (error) {
      console.error('Failed to RSVP:', error);
      toast.error(tr("Failed to RSVP"));
    }
  };

  const addToCalendar = (event: Event) => {
    // Create ICS file for calendar
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${new Date(event.date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(tr("Event added to calendar!"));
  };

  return (
    <div className="space-y-4">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full h-auto min-h-9 whitespace-normal py-2">
            <Plus className="w-4 h-4 mr-2" />
             {tr("Create Event")} </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("Create Group Event")}</DialogTitle>
            <DialogDescription>
               {tr("Add an event to your group to bring the community together!")} </DialogDescription>
          </DialogHeader>
          <CreateEventForm onSubmit={createEvent} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {events.map((event) => {
          const eventRsvps = (rsvps[event.id] || []).filter(Boolean);
          const goingCount = eventRsvps.filter(r => r.status === 'going').length;

          return (
            <Card key={event.id}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="tbo-card-title min-w-0 break-words">{event.title}</h3>
                  <p className="tbo-body text-muted-foreground">{event.description}</p>
                </div>

                <div className="tbo-supporting space-y-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4" />
                    {formatUiDateTime(new Date(event.date), locale)}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-foreground">
                    <Users className="w-4 h-4" />
                    {goingCount}  {tr("going")} </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => rsvpToEvent(event.id, tr("going"))}
                    className="flex-1 h-auto min-h-9 whitespace-normal py-2"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                     {tr("Going")} </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rsvpToEvent(event.id, 'maybe')}
                    className="flex-1 h-auto min-h-9 whitespace-normal py-2"
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                     {tr("Maybe")} </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rsvpToEvent(event.id, 'not-going')}
                    className="flex-1 h-auto min-h-9 whitespace-normal py-2"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                     {tr("Can't Go")} </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addToCalendar(event)}
                  className="w-full h-auto min-h-9 whitespace-normal py-2"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                   {tr("Add to Calendar")} </Button>
              </CardContent>
            </Card>
          );
        })}

        {events.length === 0 && (
          <Card className="tbo-glass p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="tbo-card-title mb-2 min-w-0 break-words">{tr("No Events Yet")}</h3>
            <p className="tbo-body text-muted-foreground">{tr("Create an event to bring the community together!")}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function CreateEventForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error(tr("Please fill in required fields"));
      return;
    }
    onSubmit({ title, description, date, location });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{tr("Event Title")}</Label>
        <Input
          id="title"
          placeholder={tr("e.g., Bible Study Night")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{tr("Description")}</Label>
        <Textarea
          id="description"
          placeholder={tr("What's this event about?")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">{tr("Date & Time")}</Label>
        <Input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">{tr("Location")}</Label>
        <Input
          id="location"
          placeholder={tr("e.g., Community Center")}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full h-auto min-h-9 whitespace-normal py-2" disabled={isLoading}>
        {isLoading && <LoadingMark />}
        {isLoading ? tr("Creating...") : tr("Create Event")}
      </Button>
    </form>
  );
}

// Go Live Component
function GoLive({ groupId }: { groupId: string }) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [isLive, setIsLive] = useState(false);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [webrtcBroadcaster, setWebrtcBroadcaster] = useState<WebRTCBroadcaster | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    checkLiveStatus();

    // Cleanup video stream and WebRTC when component unmounts
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (webrtcBroadcaster) {
        webrtcBroadcaster.cleanup();
      }
    };
  }, [groupId]);

  useEffect(() => {
    // Attach video stream to video element
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      // Explicitly play the video to ensure it starts
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        toast.error(tr("Failed to start video preview. Please try again."));
      });
    }
  }, [videoStream]);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || publicAnonKey;
  };

  const checkLiveStatus = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/live`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const { liveSession } = await response.json();
        setLiveSession(liveSession);
        setIsLive(!!liveSession);

        // If there's an active live session and we don't have a video stream yet, start the camera
        if (liveSession && !videoStream) {
          console.log('Found existing live session, starting camera...');
          await startCamera();
        }
      }
    } catch (error) {
      console.error('Failed to check live status:', error);
    }
  };

  const startCamera = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(tr("Camera is not supported in this browser. Please use Chrome, Firefox, or Safari."));
        return false;
      }

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('Camera access granted!', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        active: stream.active
      });

      // Ensure all tracks are enabled
      stream.getTracks().forEach(track => {
        track.enabled = true;
        console.log(`Track ${track.kind} enabled:`, track.enabled, 'ready state:', track.readyState);
      });

      setVideoStream(stream);
      console.log('Video stream set successfully');
      return true;
    } catch (error: any) {
      console.error('Failed to access camera:', error);

      // Provide specific error messages based on error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.log('Camera permission denied - showing help dialog');
        setShowPermissionDialog(true);
        toast.error(
          tr("📹 Camera permission required! Please click on the camera icon in your browser's address bar and allow access."),
          { duration: 8000 }
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error(tr("No camera found. Please connect a camera and try again."));
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error(tr("Camera is already in use by another application. Please close other apps using the camera."));
      } else if (error.name === 'OverconstrainedError') {
        toast.error(tr("Camera does not support the requested settings. Trying with basic settings..."));
        // Try again with basic settings
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          console.log('Basic camera stream obtained');
          setVideoStream(basicStream);
          return true;
        } catch (retryError) {
          console.error('Failed with basic settings:', retryError);
          toast.error(tr("Failed to access camera with any settings."));
          return false;
        }
      } else if (error.name === 'SecurityError') {
        toast.error(tr("Camera access blocked due to security settings. Please use HTTPS or localhost."));
      } else {
        toast.error(`Camera error: ${error.message || tr("Unknown error")}. Please check your camera permissions in browser settings.`);
      }

      return false;
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const startLive = async (title: string, description: string) => {
    setIsLoading(true);

    // First, start the camera
    const cameraStarted = await startCamera();
    if (!cameraStarted) {
      setIsLoading(false);
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/groups/${groupId}/live`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, description })
        }
      );

      if (response.ok) {
        const { liveSession: newSession } = await response.json();
        setLiveSession(newSession);
        setIsLive(true);

        // Initialize WebRTC broadcaster
        if (videoStream) {
          try {
            console.log('📡 Initializing WebRTC broadcaster...');
            toast.info(tr("Setting up video streaming..."));
            const broadcaster = await createBroadcaster(newSession.id, videoStream, token);
            setWebrtcBroadcaster(broadcaster);
            console.log('✅ WebRTC broadcaster initialized!');
            toast.success(tr("🔴 You are now live with video streaming!"));
          } catch (webrtcError) {
            console.error('WebRTC setup failed:', webrtcError);
            const errorMsg = webrtcError instanceof Error ? webrtcError.message : 'Unknown error';
            console.error('WebRTC error details:', errorMsg);
            toast.warning(`Live session started but video streaming setup failed: ${errorMsg}`);
          }
        } else {
          console.warn('⚠️ No video stream available for WebRTC broadcaster');
          toast.warning(tr("Live session started but camera not available"));
        }
      } else {
        toast.error(tr("Failed to start live session"));
        stopCamera(); // Stop camera if live session failed
      }
    } catch (error) {
      console.error('Failed to start live:', error);
      toast.error(tr("Failed to start live session"));
      stopCamera(); // Stop camera if error occurred
    } finally {
      setIsLoading(false);
    }
  };

  const endLive = async () => {
    if (!liveSession) {
      toast.error(tr("No active live session found"));
      return;
    }

    setIsLoading(true);
    try {
      const token = await getAuthToken();
      console.log('Ending live session:', liveSession.id);

      // Clean up WebRTC connection first
      if (webrtcBroadcaster) {
        console.log('Cleaning up WebRTC broadcaster...');
        webrtcBroadcaster.cleanup();
        setWebrtcBroadcaster(null);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${liveSession.id}/end`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setIsLive(false);
        setLiveSession(null);
        stopCamera(); // Stop camera when ending live
        toast.success(tr("Live session ended"));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to end live session:', response.status, errorData);
        toast.error(`Failed to end live session: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to end live:', error);
      toast.error(tr("Failed to end live session. Please check your connection."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLive && liveSession) {
    console.log('Rendering live view. Video stream exists:', !!videoStream, 'videoRef exists:', !!videoRef.current);

    return (
      <Card className="tbo-glass border-2 border-error-500">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-error-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-error-500 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="tbo-card-title min-w-0 break-words">{tr("You're Live!")}</h3>
              <p className="tbo-supporting text-muted-foreground">{liveSession.title}</p>
            </div>
          </div>

          <div className="bg-error-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-error-500" />
                <span className="font-semibold">{liveSession.viewerCount}  {tr("viewers")}</span>
              </div>
              <span className="tbo-supporting text-muted-foreground">
                 {tr("Started")} {formatUiTime(new Date(liveSession.startedAt), locale)}
              </span>
            </div>
          </div>

          {/* Live Video Stream */}
          <div className="relative bg-neutral-900 rounded-lg overflow-hidden aspect-video">
            {videoStream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="tbo-label absolute top-4 left-4 bg-error-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-card rounded-full animate-pulse" />
                   {tr("LIVE")} </div>
                <div className="tbo-supporting absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {liveSession.viewerCount}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white space-y-3">
                  <Video className="w-16 h-16 mx-auto opacity-50" />
                  <p className="tbo-supporting opacity-75">{tr("Starting camera...")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      console.log('Manual camera start button clicked');
                      const success = await startCamera();
                      console.log('Manual camera start result:', success);
                    }}
                    className="bg-card text-foreground hover:bg-[var(--glass-inset-surface)]"
                  >
                    <Video className="w-4 h-4 mr-2" />
                     {tr("Retry Camera")} </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="destructive"
            onClick={endLive}
            disabled={isLoading}
            className="w-full h-auto min-h-9 whitespace-normal py-2"
          >
             {tr("End Live Session")} </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-error-50 to-primary-100 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-error-500" />
          </div>
          <div>
            <h3 className="tbo-card-title mb-2 min-w-0 break-words">{tr("Go Live with Your Community")}</h3>
            <p className="tbo-supporting text-muted-foreground">
               {tr("Start a live session to connect with group members in real-time. They'll receive a notification when you go live!")} </p>
          </div>
        </div>

        {/* Camera Permission Help Dialog */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-warning-700" />
                 {tr("Camera Permission Was Denied")} </DialogTitle>
              <DialogDescription>
                 {tr("Follow these steps to enable camera access")} </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="tbo-glass bg-warning-50 border-warning-500/30">
                <CardContent className="p-4">
                  <h4 className="tbo-card-title text-warning-700 mb-3 min-w-0 break-words">{tr("📹 How to Allow Camera Access:")}</h4>
                  <ol className="tbo-supporting space-y-2 text-warning-700 list-decimal list-inside">
                    <li>{tr("Look for a")} <strong>{tr("camera icon (🎥)")}</strong>  {tr("or")} <strong>{tr("lock icon")}</strong>  {tr("in your browser's address bar (top-left of screen)")}</li>
                    <li>{tr("Click on it to open the site permissions menu")}</li>
                    <li>{tr("Find \"Camera\" and \"Microphone\" permissions")}</li>
                    <li>{tr("Change them from \"Block\" to")} <strong>{tr("\"Allow\"")}</strong></li>
                    <li>{tr("Reload this page (press F5 or Cmd+R)")}</li>
                    <li>{tr("Try \"Go Live Now\" again")}</li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="tbo-glass bg-sky-50 border-[var(--glass-border)]">
                <CardContent className="p-3">
                  <p className="tbo-supporting text-[var(--glass-accent)] mb-2">
                    <strong>{tr("Alternative Method - Browser Settings:")}</strong>
                  </p>
                  <ul className="tbo-supporting text-[var(--glass-accent)] space-y-1 list-disc list-inside">
                    <li><strong>Chrome/Edge:</strong>  {tr("Settings → Privacy & Security → Site Settings → Camera")}</li>
                    <li><strong>Firefox:</strong>  {tr("Settings → Privacy & Security → Permissions → Camera")}</li>
                    <li><strong>Safari:</strong>  {tr("Preferences → Websites → Camera")}</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPermissionDialog(false)}
                  className="flex-1 h-auto min-h-9 whitespace-normal py-2"
                >
                   {tr("Close")} </Button>
                <Button
                  onClick={() => {
                    setShowPermissionDialog(false);
                    window.location.reload();
                  }}
                  className="flex-1 bg-warning-500 hover:bg-warning-700 text-white h-auto min-h-9 whitespace-normal py-2"
                >
                   {tr("Reload Page")} </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <StartLiveForm onSubmit={startLive} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

function StartLiveForm({ onSubmit, isLoading }: { onSubmit: (title: string, description: string) => void; isLoading: boolean }) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title || 'Live Session', description);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="live-title">{tr("Session Title (Optional)")}</Label>
        <Input
          id="live-title"
          placeholder={tr("e.g., Evening Prayer & Worship")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="live-description">{tr("Description (Optional)")}</Label>
        <Textarea
          id="live-description"
          placeholder={tr("What will you talk about?")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <Button
        type="submit"
        className="w-full from-error-500 hover:from-error-700 h-auto min-h-9 whitespace-normal py-2"
        disabled={isLoading}
      >
        <Radio className="w-4 h-4 mr-2" />
        {isLoading && <LoadingMark />}
        {isLoading ? tr("Starting...") : tr("Go Live Now")}
      </Button>
    </form>
  );
}

// Live Session Card
function LiveSessionCard({ session }: { session: LiveSession }) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [hasJoined, setHasJoined] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const getAuthToken = async () => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    return authSession?.access_token || publicAnonKey;
  };

  const joinLive = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${session.id}/join`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setHasJoined(true);
        setShowViewer(true);
        toast.success(tr("Joined live session!"));
      }
    } catch (error) {
      console.error('Failed to join live:', error);
    }
  };

  if (showViewer) {
    return <LiveStreamViewer session={session} onClose={() => setShowViewer(false)} />;
  }

  return (
    <Card className="tbo-glass border-2 border-error-500 bg-gradient-to-r from-error-50 to-primary-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-error-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-error-500 rounded-full animate-ping" />
          </div>
          <div className="flex-1">
            <h3 className="tbo-card-title min-w-0 break-words">{session.title}</h3>
            <p className="tbo-supporting text-muted-foreground">{session.userName} • {session.groupName}</p>
            {session.description && (
              <p className="tbo-supporting text-muted-foreground mt-1">{session.description}</p>
            )}
          </div>
        </div>

        <div className="tbo-supporting flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {session.viewerCount}  {tr("watching")} </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
             {tr("Started")} {formatUiTime(new Date(session.startedAt), locale)}
          </div>
        </div>

        <Button
          onClick={joinLive}
          className="w-full bg-error-500 hover:bg-error-700 h-auto min-h-9 whitespace-normal py-2"
          disabled={hasJoined}
        >
          <Video className="w-4 h-4 mr-2" />
          {hasJoined ? tr("Watching...") : tr("Watch Live")}
        </Button>
      </CardContent>
    </Card>
  );
}

// Live Stream Viewer Component
function LiveStreamViewer({ session, onClose }: { session: LiveSession; onClose: () => void }) {
  const tr = useUiCopy(communityMessages);
  const locale = UI_LOCALES[useCurrentLanguage()];
  const [viewerCount, setViewerCount] = useState(session.viewerCount);
  const [isLoading, setIsLoading] = useState(true);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [webrtcViewer, setWebrtcViewer] = useState<WebRTCViewer | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeViewer();

    // Poll for updated viewer count every 5 seconds
    const interval = setInterval(async () => {
      try {
        const token = await getAuthToken();
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/live/${session.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const { liveSession } = await response.json();
          if (liveSession && liveSession.isActive) {
            setViewerCount(liveSession.viewerCount);
          } else {
            // Session ended or not active
            console.log('📴 Live session has ended');
            toast.info(tr("Live session has ended"));
            onClose();
          }
        } else if (response.status === 404) {
          // Session not found
          console.log('📴 Live session not found');
          toast.info(tr("Live session has ended"));
          onClose();
        }
      } catch (error) {
        console.error('Failed to update viewer count:', error);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (webrtcViewer) {
        webrtcViewer.cleanup();
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [session.id]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().catch(err => {
        console.error('Error playing remote video:', err);
      });
    }
  }, [remoteStream]);

  const initializeViewer = async () => {
    try {
      const token = await getAuthToken();
      const viewerId = `viewer-${Date.now()}`;

      console.log('📡 Initializing WebRTC viewer...');
      toast.info(tr("Connecting to live stream..."), { duration: 3000 });

      const viewer = await createViewer(session.id, viewerId, token, (stream) => {
        console.log('📹 Received remote stream!', {
          active: stream.active,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });
        setRemoteStream(stream);
        setHasVideo(stream.getVideoTracks().length > 0);
        setIsLoading(false);
        toast.success(tr("Connected to live stream!"));
      });

      setWebrtcViewer(viewer);
      console.log('✅ WebRTC viewer initialized!');

      // If no stream received after 30 seconds, show helpful message
      setTimeout(() => {
        if (!remoteStream) {
          console.log('⚠️ No video stream received after 30 seconds');
          toast.warning(tr("Waiting for broadcaster to start camera..."), { duration: 5000 });
          setIsLoading(false);
        }
      }, 30000);
    } catch (error) {
      console.error('Failed to initialize viewer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to live stream';

      // Show more user-friendly error message
      if (errorMessage.includes('setting up their camera')) {
        toast.error(errorMessage, { duration: 5000 });
      } else if (errorMessage.includes('Live session has ended')) {
        toast.error(tr("This live session has ended."));
        onClose();
      } else {
        toast.error(tr("Could not connect to live stream. Please try again."), { duration: 4000 });
      }

      setIsLoading(false);
    }
  };

  const getAuthToken = async () => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    return authSession?.access_token || publicAnonKey;
  };

  return (
    <Card className="tbo-glass border-2 border-error-500">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-error-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-error-500 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="tbo-card-title min-w-0 break-words">{tr("🔴 LIVE:")} {session.title}</h3>
              <p className="tbo-supporting text-muted-foreground">{session.userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Live Video Stream - WebRTC */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-white">
              <div className="relative mb-4">
                <LoadingMark size={64} />
              </div>
              <p className="tbo-supporting opacity-75">{tr("Connecting to {name}’s stream...", { name: session.userName })}</p>
              <p className="tbo-caption opacity-50 mt-2">{tr("Waiting for broadcaster to start WebRTC...")}</p>
              <div className="tbo-caption mt-4 flex items-center gap-2 opacity-40">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
                 {tr("This may take up to 15 seconds")} </div>
            </div>
          ) : hasVideo && remoteStream ? (
            <>
              {/* Real WebRTC Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              <div className="tbo-label absolute top-4 left-4 bg-error-500 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-card rounded-full animate-pulse" />
                 {tr("LIVE")} </div>
              <div className="tbo-supporting absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
                <Eye className="w-4 h-4" />
                {viewerCount}
              </div>
              <div className="tbo-caption absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded">
                 {tr("Started")} {formatUiTime(new Date(session.startedAt), locale)}
              </div>
              <div className="tbo-caption absolute top-4 right-4 bg-success-500/80 backdrop-blur-sm text-white px-2 py-1 rounded flex items-center gap-1">
                <div className="w-2 h-2 bg-card rounded-full animate-pulse" />
                 {tr("WebRTC Connected")} </div>
            </>
          ) : (
            <>
              {/* Fallback if no video stream */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-sky-800 to-primary-900">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-4 border-white/20">
                      <Video className="w-16 h-16 opacity-80" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-error-500 rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-3 h-3 bg-card rounded-full" />
                    </div>
                  </div>
                  <div className="text-center space-y-3 bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                    <p className="tbo-section-title">{tr("{name} is Live", { name: session.userName })}</p>
                    <p className="tbo-supporting opacity-90 max-w-md">
                      {session.description || tr("Streaming live to the community")}
                    </p>
                    <div className="tbo-supporting flex items-center justify-center gap-3 pt-2">
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                        <Eye className="w-4 h-4" />
                        <span className="font-semibold">{viewerCount}  {tr("watching")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span>{tr("Live now")}</span>
                      </div>
                    </div>
                    <p className="tbo-supporting opacity-75 mt-3">{tr("⚠️ Video stream not available")}</p>
                  </div>
                </div>
              </div>

              <div className="tbo-label absolute top-4 left-4 bg-error-500 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-card rounded-full animate-pulse" />
                 {tr("LIVE")} </div>
              <div className="tbo-supporting absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
                <Eye className="w-4 h-4" />
                {viewerCount}
              </div>
              <div className="tbo-caption absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded">
                 {tr("Started")} {formatUiTime(new Date(session.startedAt), locale)}
              </div>
            </>
          )}
        </div>

        <div className={`border p-3 rounded-lg ${hasVideo ? 'bg-success-50 border-success-500/30' : 'bg-sky-50 border-[var(--glass-border)]'}`}>
          <div className="flex items-start gap-2">
            <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasVideo ? 'text-success-700' : 'text-[var(--glass-accent)]'}`} />
            <div className="flex-1">
              {hasVideo ? (
                <>
                  <p className="tbo-label text-success-700">{tr("✅ WebRTC Video Connected!")}</p>
                  <p className="tbo-caption text-success-700 mt-1">
                    {tr("You are viewing {name}’s live camera feed.", { name: session.userName })}
                  </p>
                </>
              ) : (
                <>
                  <p className="tbo-label text-[var(--glass-accent)]">{tr("📹 WebRTC Status")}</p>
                  <p className="tbo-caption text-[var(--glass-accent)] mt-1">
                     {tr("Attempting to establish WebRTC connection... If video doesn't appear, the broadcaster may need to enable their camera or there may be network restrictions.")} </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-auto min-h-9 whitespace-normal py-2"
          >
             {tr("Leave Stream")} </Button>
          <Button
            className="flex-1 h-auto min-h-9 whitespace-normal py-2"
            onClick={() => toast.info(tr("Live chat coming soon!"))}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
             {tr("Chat")} </Button>
        </div>
      </CardContent>
    </Card>
  );
}
