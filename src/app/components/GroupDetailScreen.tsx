import { formatUiDate } from '../utils/uiDateTime';
import { communityDemoMessages } from '../locales/communityDemo';
import { useUiCopy, UI_LOCALES } from '../utils/uiTranslation';
import { communityMessages } from '../locales/community';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BackButton } from './BackButton';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Video,
  MessageCircle,
  Heart,
  Share2,
  Bell,
  BellOff,
  Settings,
  CheckCircle,
  Clock,
  BookOpen,
  ExternalLink,
  Lock,
  Globe,
  Sparkles,
  Star,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

const previewMessages = { ...communityMessages, ...communityDemoMessages };
const RESOURCE_TYPE_LABELS: Record<string, string> = {
  book: 'Book',
  pdf: 'PDF',
  video: 'Video',
  document: 'Document',
};

interface GroupDetailScreenProps {
  groupId: string;
  onBack: () => void;
}

// Sample data - would come from backend
const GROUP_DATA: any = {
  '1': {
    id: '1',
    name: 'Pre-Marriage Couples Support',
    description: 'A supportive community for couples preparing for marriage',
    longDescription: 'Join us as we navigate the exciting journey toward marriage! We discuss biblical foundations, communication skills, financial planning, and building a Christ-centered relationship. Perfect for engaged couples or those seriously dating.\n\nWhat to Expect:\n• Weekly video meetings with discussions\n• Prayer support throughout the week\n• Resource sharing and recommendations\n• Private couples mentoring available\n• Monthly social events',
    type: 'couple',
    category: 'Pre-Marriage',
    members: 24,
    maxMembers: 30,
    meetingSchedule: 'Sundays, 6:00 PM EST',
    location: 'online',
    coverImage: '',
    leaders: [
      { name: 'Pastor Mike & Sarah', avatar: '', role: 'Lead Facilitators', bio: 'Married 15 years, passionate about helping couples start strong' },
      { name: 'David & Rachel', avatar: '', role: 'Co-Leaders', bio: 'Newlyweds sharing their recent journey' }
    ],
    tags: ['Pre-Marriage', 'Couples', 'Communication', 'Faith'],
    nextMeeting: '2025-11-16T18:00:00',
    upcomingMeetings: [
      { date: '2025-11-16T18:00:00', topic: 'Communication in Conflict', speaker: 'Pastor Mike' },
      { date: '2025-11-23T18:00:00', topic: 'Financial Planning Together', speaker: 'David & Rachel' },
      { date: '2025-11-30T18:00:00', topic: 'Building Spiritual Intimacy', speaker: 'Pastor Sarah' }
    ],
    recentActivity: [
      { user: 'Sarah M.', action: 'shared a prayer request', time: '2 hours ago' },
      { user: 'John & Emily', action: 'joined the group', time: '5 hours ago' },
      { user: 'Pastor Mike', action: 'posted a new resource', time: '1 day ago' },
      { user: 'Lisa T.', action: 'commented on discussion', time: '2 days ago' }
    ],
    resources: [
      { title: 'The Meaning of Marriage by Tim Keller', type: 'book', url: '#' },
      { title: 'Pre-Marriage Workbook', type: 'pdf', url: '#' },
      { title: 'Communication Skills Video Series', type: 'video', url: '#' },
      { title: 'Financial Planning Template', type: 'document', url: '#' }
    ],
    isJoined: true,
    isPrivate: false,
    notifications: true,
    createdAt: '2024-01-15'
  }
};

export function GroupDetailScreen({ groupId, onBack }: GroupDetailScreenProps) {
  const tr = useUiCopy(previewMessages);
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('about');
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState(true);

  const group = GROUP_DATA[groupId] || GROUP_DATA['1'];

  const handleJoinGroup = () => {
    toast.success(tr("Join request sent! You'll be notified when approved."));
  };

  const handleLeaveGroup = () => {
    if (confirm(tr("Are you sure you want to leave this group?"))) {
      toast.success(tr("You have left the group"));
      onBack();
    }
  };

  const handleJoinLiveRoom = () => {
    toast.info(tr("Live room feature coming soon!"));
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      toast.success(tr("Message sent to group!"));
      setMessage('');
    }
  };

  const formatMeetingDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatUiDate(date, UI_LOCALES[language], {
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return tr('Past meeting');
    if (diffDays === 0) return tr('Today');
    if (diffDays === 1) return tr('Tomorrow');
    if (diffDays <= 7) return tr("In {count} days", { count: diffDays });
    return tr("{count} days", { count: diffDays });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-primary-50/30 pb-6 [overflow-wrap:anywhere]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <BackButton label={t.common.back} onClick={onBack} />
            <div className="min-w-0 flex-1 break-words">
              <h1 className="tbo-card-title min-w-0 break-words">{tr(group.name)}</h1>
              <p className="tbo-supporting text-muted-foreground">{group.members}  {tr("members")}</p>
            </div>
            <Button variant="ghost" size="icon" aria-label={tr("Share")}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cover/Hero Section */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400"></div>
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center border-4 border-white shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-14 space-y-4">
        {/* Group Title & Action */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 break-words">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="tbo-page-title min-w-0 break-words">{tr(group.name)}</h2>
              {group.isPrivate && (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <p className="tbo-body text-muted-foreground mb-3">{tr(group.description)}</p>
            
            {/* Quick Stats */}
            <div className="tbo-supporting flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{group.members}  {tr("members")}</span>
              </div>
              <div className="flex items-center gap-1">
                {group.location === 'online' ? (
                  <><Video className="w-4 h-4" /><span>{tr("Online")}</span></>
                ) : (
                  <><MapPin className="w-4 h-4" /><span>{tr("Hybrid")}</span></>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{tr(group.meetingSchedule)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {group.isJoined ? (
            <>
              <Button 
                className="flex-1 basis-40 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 h-auto min-h-9 flex-wrap min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] py-2"
                onClick={handleJoinLiveRoom}
              >
                <Video className="w-4 h-4 mr-2" />
                 <span className="min-w-0 [overflow-wrap:anywhere]">{tr("Join Live Room")}</span> </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={tr(notifications ? "Mute notifications" : "Enable notifications")}
                onClick={() => {
                  setNotifications(!notifications);
                  toast.success(notifications ? tr("Notifications muted") : tr("Notifications enabled"));
                }}
              >
                {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="icon" aria-label={tr("Settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button 
              className="flex-1 basis-40 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 h-auto min-h-9 flex-wrap min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] py-2"
              onClick={handleJoinGroup}
            >
              <Heart className="w-4 h-4 mr-2" />
              {group.isPrivate ? t.community.joinGroup : t.community.joinGroup}
            </Button>
          )}
        </div>

        {/* Next Meeting Card */}
        {group.nextMeeting && (
          <Card className="border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 break-words">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <h3 className="tbo-card-title min-w-0 break-words">{tr("Next Meeting")}</h3>
                    <Badge className="bg-primary-600 min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere]">{getTimeUntil(group.nextMeeting)}</Badge>
                  </div>
                  <p className="tbo-supporting text-foreground mb-2">
                    {formatMeetingDate(group.nextMeeting)}
                  </p>
                  {group.upcomingMeetings && group.upcomingMeetings[0] && (
                    <p className="tbo-supporting text-muted-foreground">
                       {tr("Topic:")} {tr(group.upcomingMeetings[0].topic)}
                    </p>
                  )}
                </div>
                <Button size="sm" className="h-auto min-h-9 flex-wrap min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] break-words py-2 bg-primary-600 hover:bg-primary-700">
                  <Calendar className="w-4 h-4 mr-2" />
                   <span className="min-w-0 [overflow-wrap:anywhere]">{tr("RSVP")}</span> </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto min-h-11 w-full grid-cols-4 items-stretch">
            <TabsTrigger value="about" className="h-auto min-h-11 min-w-0 whitespace-normal">{t.profile.about}</TabsTrigger>
            <TabsTrigger value="meetings" className="h-auto min-h-11 min-w-0 whitespace-normal">{tr("Meetings")}</TabsTrigger>
            <TabsTrigger value="members" className="h-auto min-h-11 min-w-0 whitespace-normal">{t.community.members}</TabsTrigger>
            <TabsTrigger value="chat" className="h-auto min-h-11 min-w-0 whitespace-normal">{tr("Chat")}</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6 mt-4">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>{tr("About This Group")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="tbo-body text-foreground whitespace-pre-line">
                  {tr(group.longDescription)}
                </p>
                
                <Separator />
                
                {/* Tags */}
                <div>
                  <h4 className="tbo-label mb-3 min-w-0 break-words">{tr("Topics")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere]">
                        {tr(tag)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Star className="w-5 h-5 text-warning-500" />
                   {tr("Group Leaders")} </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.leaders.map((leader: any, idx: number) => (
                  <div key={idx} className="flex flex-wrap items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={leader.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-400 text-white">
                        {leader.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 break-words">
                      <h4 className="tbo-label min-w-0 break-words">{leader.name}</h4>
                      <p className="tbo-supporting text-primary-600 mb-1">{tr(leader.role)}</p>
                      <p className="tbo-supporting text-muted-foreground">{tr(leader.bio)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Resources */}
            {group.resources && group.resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                     {tr("Resources")} </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.resources.map((resource: any, idx: number) => (
                    <div 
                      key={idx}
                      className="flex flex-wrap min-w-0 items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex flex-wrap min-w-0 flex-1 basis-full sm:basis-auto items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-sky-100 to-sky-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-sky-600" />
                        </div>
                        <div className="min-w-0 flex-1 basis-32">
                          <h5 className="tbo-label min-w-0 break-words">{tr(resource.title)}</h5>
                          <p className="tbo-caption text-muted-foreground">{tr(RESOURCE_TYPE_LABELS[resource.type] ?? resource.type)}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                   {tr("Recent Activity")} </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.recentActivity.map((activity: any, idx: number) => (
                  <div key={idx} className="tbo-supporting flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary-200 to-primary-200 text-primary-700 text-xs">
                        {activity.user.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 break-words">
                      <span className="tbo-label">{activity.user}</span>
                      <span className="text-muted-foreground"> {tr(activity.action)}</span>
                      <span className="tbo-caption text-muted-foreground ml-2">{tr(activity.time)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Meetings Tab */}
          <TabsContent value="meetings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{tr("Upcoming Meetings")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.upcomingMeetings?.map((meeting: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border bg-gradient-to-r from-primary-50 to-primary-100">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1 basis-32">
                        <h4 className="tbo-card-title min-w-0 break-words">{tr(meeting.topic)}</h4>
                        <p className="tbo-supporting text-muted-foreground mt-1">
                          {formatMeetingDate(meeting.date)}
                        </p>
                      </div>
                      <Badge className="bg-primary-600 min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere]">{getTimeUntil(meeting.date)}</Badge>
                    </div>
                    <p className="tbo-supporting text-muted-foreground">{tr("Speaker:")} {meeting.speaker}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 basis-32 h-auto min-h-9 flex-wrap min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] py-2">
                        <Calendar className="w-4 h-4 mr-2" />
                         <span className="min-w-0 [overflow-wrap:anywhere]">{tr("Add to Calendar")}</span> </Button>
                      <Button size="sm" className="flex-1 basis-32 bg-primary-600 hover:bg-primary-700 h-auto min-h-9 flex-wrap min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] py-2">
                         <span className="min-w-0 [overflow-wrap:anywhere]">{tr("RSVP")}</span> </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{tr("Members (")}{group.members})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Sample members */}
                  {['John & Sarah M.', 'David & Emily T.', 'Michael & Lisa R.', 'Chris & Anna P.'].map((member, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-primary-200 to-primary-200 text-primary-700">
                          {member.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 basis-32 break-words">
                        <h4 className="tbo-label min-w-0 break-words">{member}</h4>
                        <p className="tbo-supporting text-muted-foreground">{tr("Member since 2024")}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4 mt-4">
            {group.isJoined ? (
              <Card>
                <CardHeader>
                  <CardTitle>{tr("Group Chat")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sample messages */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {[
                      { user: 'Sarah M.', message: 'Looking forward to this week\'s meeting!', time: '2h ago' },
                      { user: 'John D.', message: 'Has anyone read the chapter we\'re discussing?', time: '5h ago' },
                      { user: 'Pastor Mike', message: 'Don\'t forget to RSVP for Sunday\'s session', time: '1d ago' }
                    ].map((msg, idx) => (
                      <div key={idx} className="flex flex-wrap items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-primary-200 to-primary-200 text-primary-700 text-xs">
                            {msg.user.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 basis-32 break-words">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                            <span className="tbo-label">{msg.user}</span>
                            <span className="tbo-caption text-muted-foreground">{tr(msg.time)}</span>
                          </div>
                          <p className="tbo-body break-words text-foreground">{tr(msg.message)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Input
                      placeholder={t.community.writePost}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="h-auto min-h-9 flex-wrap min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] break-words py-2 bg-primary-600 hover:bg-primary-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="tbo-card-title text-foreground mb-2 min-w-0 break-words">{tr("Join to Chat")}</h3>
                <p className="tbo-body text-muted-foreground mb-4">
                   {tr("Join this group to participate in group discussions")} </p>
                <Button className="bg-gradient-to-r from-primary-600 to-primary-700" onClick={handleJoinGroup}>
                   {tr("Join Group")} </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Danger Zone - Only for joined members */}
        {group.isJoined && (
          <Card className="border-error-500/30">
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full text-error-500 hover:text-error-700 hover:bg-error-50 border-error-500/30 h-auto min-h-9 flex-wrap min-w-0 max-w-full whitespace-normal [overflow-wrap:anywhere] py-2"
                onClick={handleLeaveGroup}
              >
                {t.community.leaveGroup}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
