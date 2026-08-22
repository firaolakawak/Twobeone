import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  ChevronLeft, 
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
import { toast } from 'sonner@2.0.3';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

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
  const [activeTab, setActiveTab] = useState('about');
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState(true);

  const group = GROUP_DATA[groupId] || GROUP_DATA['1'];

  const handleJoinGroup = () => {
    toast.success('Join request sent! You\'ll be notified when approved.');
  };

  const handleLeaveGroup = () => {
    if (confirm('Are you sure you want to leave this group?')) {
      toast.success('You have left the group');
      onBack();
    }
  };

  const handleJoinLiveRoom = () => {
    toast.info('Live room feature coming soon!');
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      toast.success('Message sent to group!');
      setMessage('');
    }
  };

  const formatMeetingDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
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
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return `${diffDays} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-pink-50/30 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold line-clamp-1">{group.name}</h1>
              <p className="text-sm text-gray-500">{group.members} members</p>
            </div>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cover/Hero Section */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400"></div>
        <div className="absolute -bottom-10 left-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-4 border-white shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-14 space-y-4">
        {/* Group Title & Action */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold">{group.name}</h2>
              {group.isPrivate && (
                <Lock className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <p className="text-gray-600 mb-3">{group.description}</p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{group.members} members</span>
              </div>
              <div className="flex items-center gap-1">
                {group.location === 'online' ? (
                  <><Video className="w-4 h-4" /><span>Online</span></>
                ) : (
                  <><MapPin className="w-4 h-4" /><span>Hybrid</span></>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{group.meetingSchedule}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {group.isJoined ? (
            <>
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleJoinLiveRoom}
              >
                <Video className="w-4 h-4 mr-2" />
                Join Live Room
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setNotifications(!notifications);
                  toast.success(notifications ? 'Notifications muted' : 'Notifications enabled');
                }}
              >
                {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button 
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleJoinGroup}
            >
              <Heart className="w-4 h-4 mr-2" />
              {group.isPrivate ? 'Request to Join' : 'Join Group'}
            </Button>
          )}
        </div>

        {/* Next Meeting Card */}
        {group.nextMeeting && (
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Next Meeting</h3>
                    <Badge className="bg-purple-600">{getTimeUntil(group.nextMeeting)}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {formatMeetingDate(group.nextMeeting)}
                  </p>
                  {group.upcomingMeetings && group.upcomingMeetings[0] && (
                    <p className="text-sm text-gray-600">
                      Topic: {group.upcomingMeetings[0].topic}
                    </p>
                  )}
                </div>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  RSVP
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6 mt-4">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {group.longDescription}
                </p>
                
                <Separator />
                
                {/* Tags */}
                <div>
                  <h4 className="font-medium mb-3">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Group Leaders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.leaders.map((leader: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={leader.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {leader.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{leader.name}</h4>
                      <p className="text-sm text-purple-600 mb-1">{leader.role}</p>
                      <p className="text-sm text-gray-600">{leader.bio}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Resources */}
            {group.resources && group.resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.resources.map((resource: any, idx: number) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-sm">{resource.title}</h5>
                          <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.recentActivity.map((activity: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-purple-200 to-pink-200 text-purple-700 text-xs">
                        {activity.user.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-gray-600"> {activity.action}</span>
                      <span className="text-gray-400 text-xs ml-2">{activity.time}</span>
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
                <CardTitle>Upcoming Meetings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.upcomingMeetings?.map((meeting: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{meeting.topic}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatMeetingDate(meeting.date)}
                        </p>
                      </div>
                      <Badge className="bg-purple-600">{getTimeUntil(meeting.date)}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Speaker: {meeting.speaker}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        Add to Calendar
                      </Button>
                      <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                        RSVP
                      </Button>
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
                <CardTitle>Members ({group.members})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Sample members */}
                  {['John & Sarah M.', 'David & Emily T.', 'Michael & Lisa R.', 'Chris & Anna P.'].map((member, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-purple-200 to-pink-200 text-purple-700">
                          {member.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{member}</h4>
                        <p className="text-sm text-gray-500">Member since 2024</p>
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
                  <CardTitle>Group Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sample messages */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {[
                      { user: 'Sarah M.', message: 'Looking forward to this week\'s meeting!', time: '2h ago' },
                      { user: 'John D.', message: 'Has anyone read the chapter we\'re discussing?', time: '5h ago' },
                      { user: 'Pastor Mike', message: 'Don\'t forget to RSVP for Sunday\'s session', time: '1d ago' }
                    ].map((msg, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-purple-200 to-pink-200 text-purple-700 text-xs">
                            {msg.user.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.user}</span>
                            <span className="text-xs text-gray-400">{msg.time}</span>
                          </div>
                          <p className="text-sm text-gray-700">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="bg-purple-600 hover:bg-purple-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Join to Chat</h3>
                <p className="text-gray-500 mb-4">
                  Join this group to participate in group discussions
                </p>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600" onClick={handleJoinGroup}>
                  Join Group
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Danger Zone - Only for joined members */}
        {group.isJoined && (
          <Card className="border-red-200">
            <CardContent className="p-4">
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={handleLeaveGroup}
              >
                Leave Group
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
