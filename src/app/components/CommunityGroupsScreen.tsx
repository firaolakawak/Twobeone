import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  BookOpen, 
  MapPin, 
  Search,
  Filter,
  Clock,
  Heart,
  Video,
  Lock,
  Globe,
  UserPlus,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Flame,
  Star,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Group {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  type: 'couple' | 'bible-study' | 'prayer-room' | 'general';
  category: string;
  members: number;
  maxMembers?: number;
  meetingSchedule: string;
  location: 'online' | 'hybrid' | 'in-person';
  locationDetails?: string;
  isPrivate: boolean;
  coverImage?: string;
  leaders: Array<{ name: string; avatar?: string }>;
  tags: string[];
  nextMeeting?: string;
  isJoined?: boolean;
  isPending?: boolean;
  isLive?: boolean;
  activityLevel: 'high' | 'medium' | 'low';
  createdAt: string;
}

interface CommunityGroupsScreenProps {
  onGroupClick: (groupId: string) => void;
  onJoinGroup: (groupId: string) => Promise<void>;
  userGroups: string[];
  pendingRequests: string[];
}

const SAMPLE_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Pre-Marriage Couples Support',
    description: 'A supportive community for couples preparing for marriage',
    longDescription: 'Join us as we navigate the exciting journey toward marriage! We discuss biblical foundations, communication skills, financial planning, and building a Christ-centered relationship. Perfect for engaged couples or those seriously dating.',
    type: 'couple',
    category: 'Pre-Marriage',
    members: 24,
    maxMembers: 30,
    meetingSchedule: 'Sundays, 6:00 PM EST',
    location: 'online',
    isPrivate: false,
    leaders: [
      { name: 'Pastor Mike & Sarah', avatar: '' },
      { name: 'David & Rachel', avatar: '' }
    ],
    tags: ['Pre-Marriage', 'Couples', 'Communication', 'Faith'],
    nextMeeting: '2025-11-16T18:00:00',
    isJoined: true,
    activityLevel: 'high',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Young Married Couples',
    description: 'Connect with newly married couples navigating the first years together',
    longDescription: 'The first years of marriage are both beautiful and challenging. Join other young married couples as we share experiences, pray together, and grow in our faith. We cover topics like conflict resolution, intimacy, building traditions, and keeping Christ at the center.',
    type: 'couple',
    category: 'Newlyweds',
    members: 18,
    maxMembers: 25,
    meetingSchedule: 'Thursdays, 7:00 PM EST',
    location: 'hybrid',
    locationDetails: 'Grace Community Church',
    isPrivate: false,
    leaders: [
      { name: 'John & Mary', avatar: '' }
    ],
    tags: ['Marriage', 'Newlyweds', 'Support', 'Growth'],
    nextMeeting: '2025-11-14T19:00:00',
    activityLevel: 'high',
    createdAt: '2024-03-20'
  },
  {
    id: '3',
    name: 'Bible Study: Song of Solomon',
    description: 'Exploring biblical romance and marital love',
    longDescription: 'Dive deep into the Song of Solomon and discover God\'s beautiful design for romantic love, intimacy, and marriage. This 8-week study explores the poetic celebration of marital love and what it teaches us about God\'s love for His people.',
    type: 'bible-study',
    category: 'Bible Study',
    members: 32,
    maxMembers: 40,
    meetingSchedule: 'Tuesdays, 7:30 PM EST',
    location: 'online',
    isPrivate: false,
    leaders: [
      { name: 'Dr. James Thompson', avatar: '' }
    ],
    tags: ['Bible Study', 'Romance', 'Marriage', 'Intimacy'],
    nextMeeting: '2025-11-12T19:30:00',
    isJoined: true,
    activityLevel: 'medium',
    createdAt: '2024-09-01'
  },
  {
    id: '4',
    name: 'Morning Prayer Warriors',
    description: 'Start your day praying for marriages and relationships',
    longDescription: 'Join us every weekday morning for 30 minutes of focused prayer. We pray for our marriages, relationships, families, and each other. Experience the power of praying together and watch God move in your relationship.',
    type: 'prayer-room',
    category: 'Prayer',
    members: 15,
    meetingSchedule: 'Mon-Fri, 6:30 AM EST',
    location: 'online',
    isPrivate: false,
    isLive: true,
    leaders: [
      { name: 'Pastor Tom', avatar: '' }
    ],
    tags: ['Prayer', 'Morning', 'Daily', 'Community'],
    activityLevel: 'high',
    createdAt: '2023-11-01'
  },
  {
    id: '5',
    name: 'Marriage Enrichment',
    description: 'Monthly workshops for strengthening your marriage',
    longDescription: 'A monthly gathering focused on enriching and strengthening marriages through workshops, guest speakers, and couple activities. Topics include date night ideas, love languages, serving together, and maintaining romance.',
    type: 'couple',
    category: 'Enrichment',
    members: 42,
    meetingSchedule: 'First Saturday, 10:00 AM EST',
    location: 'hybrid',
    locationDetails: 'Hope Church',
    isPrivate: false,
    leaders: [
      { name: 'Steve & Linda', avatar: '' }
    ],
    tags: ['Marriage', 'Enrichment', 'Workshops', 'Fun'],
    nextMeeting: '2025-12-07T10:00:00',
    activityLevel: 'medium',
    createdAt: '2023-06-15'
  },
  {
    id: '6',
    name: 'Proverbs 31 Study for Couples',
    description: 'Biblical wisdom for modern relationships',
    longDescription: 'Study the book of Proverbs together as couples, focusing on wisdom, character, and godly living. Learn how ancient wisdom applies to modern relationships, parenting, finances, and daily life.',
    type: 'bible-study',
    category: 'Bible Study',
    members: 28,
    maxMembers: 35,
    meetingSchedule: 'Wednesdays, 8:00 PM EST',
    location: 'online',
    isPrivate: false,
    leaders: [
      { name: 'Mark & Jennifer', avatar: '' }
    ],
    tags: ['Bible Study', 'Wisdom', 'Proverbs', 'Growth'],
    nextMeeting: '2025-11-13T20:00:00',
    activityLevel: 'medium',
    createdAt: '2024-08-10'
  },
  {
    id: '7',
    name: 'Parents-to-Be Prayer Circle',
    description: 'Praying for expectant couples and new parents',
    longDescription: 'A private prayer group for couples expecting or newly parenting. Share prayer requests, encouragement, and support during this transformative season. We pray for healthy pregnancies, wisdom in parenting, and strong marriages.',
    type: 'prayer-room',
    category: 'Prayer',
    members: 12,
    maxMembers: 20,
    meetingSchedule: 'Sundays, 8:00 PM EST',
    location: 'online',
    isPrivate: true,
    leaders: [
      { name: 'Alex & Maria', avatar: '' }
    ],
    tags: ['Prayer', 'Parenting', 'Pregnancy', 'Support'],
    nextMeeting: '2025-11-17T20:00:00',
    activityLevel: 'medium',
    createdAt: '2024-05-20'
  },
  {
    id: '8',
    name: 'Date Night Ideas Exchange',
    description: 'Creative ways to keep romance alive',
    longDescription: 'A fun, casual group where couples share creative date night ideas, recipes, activities, and ways to keep the spark alive. Monthly virtual meetups with themes, plus an active chat for ongoing inspiration.',
    type: 'general',
    category: 'Social',
    members: 56,
    meetingSchedule: 'Monthly, Various Times',
    location: 'online',
    isPrivate: false,
    leaders: [
      { name: 'Chris & Amy', avatar: '' }
    ],
    tags: ['Romance', 'Fun', 'Date Night', 'Creative'],
    activityLevel: 'low',
    createdAt: '2024-02-14'
  },
  {
    id: '9',
    name: 'Financial Wisdom for Couples',
    description: 'Biblical stewardship and financial planning',
    longDescription: 'Learn to manage finances God\'s way! Topics include budgeting, debt freedom, giving, saving, and financial goal-setting. Based on biblical principles with practical application for couples.',
    type: 'bible-study',
    category: 'Finance',
    members: 35,
    maxMembers: 40,
    meetingSchedule: 'Bi-weekly, Saturdays 9:00 AM EST',
    location: 'online',
    isPrivate: false,
    leaders: [
      { name: 'Robert & Susan', avatar: '' }
    ],
    tags: ['Finance', 'Stewardship', 'Budgeting', 'Planning'],
    nextMeeting: '2025-11-16T09:00:00',
    activityLevel: 'medium',
    createdAt: '2024-04-01'
  },
  {
    id: '10',
    name: 'Intercessory Prayer for Marriages',
    description: 'Deep, focused prayer for struggling marriages',
    longDescription: 'A confidential prayer group dedicated to interceding for marriages facing challenges. Whether you\'re going through difficulties or want to pray for others, this is a safe space for honest prayer and spiritual warfare.',
    type: 'prayer-room',
    category: 'Prayer',
    members: 8,
    maxMembers: 15,
    meetingSchedule: 'Fridays, 9:00 PM EST',
    location: 'online',
    isPrivate: true,
    leaders: [
      { name: 'Pastor Dan & Lisa', avatar: '' }
    ],
    tags: ['Prayer', 'Intercession', 'Support', 'Confidential'],
    activityLevel: 'high',
    createdAt: '2023-09-15'
  }
];

export function CommunityGroupsScreen({ 
  onGroupClick, 
  onJoinGroup,
  userGroups = [],
  pendingRequests = []
}: CommunityGroupsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'couple' | 'bible-study' | 'prayer-room' | 'general'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Enhance sample groups with user status
  const groups = useMemo(() => {
    return SAMPLE_GROUPS.map(group => ({
      ...group,
      isJoined: userGroups.includes(group.id),
      isPending: pendingRequests.includes(group.id)
    }));
  }, [userGroups, pendingRequests]);

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const matchesSearch = searchQuery === '' || 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedType === 'all' || group.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [groups, searchQuery, selectedType]);

  const myGroups = filteredGroups.filter(g => g.isJoined);
  const discoverGroups = filteredGroups.filter(g => !g.isJoined && !g.isPending);
  const pendingGroups = filteredGroups.filter(g => g.isPending);

  const handleJoinRequest = async (groupId: string) => {
    try {
      await onJoinGroup(groupId);
      toast.success('Join request sent!');
    } catch (error) {
      toast.error('Failed to send join request');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'couple': return Heart;
      case 'bible-study': return BookOpen;
      case 'prayer-room': return MessageCircle;
      default: return Users;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'couple': return 'from-primary-500 to-primary-500';
      case 'bible-study': return 'from-sky-500 to-sky-500';
      case 'prayer-room': return 'from-primary-500 to-primary-500';
      default: return 'from-success-500 to-success-700';
    }
  };

  const getActivityBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-success-50 text-success-700 border-success-500/30"><Flame className="w-3 h-3 mr-1" />Very Active</Badge>;
      case 'medium':
        return <Badge className="bg-sky-100 text-sky-700 border-sky-200"><TrendingUp className="w-3 h-3 mr-1" />Active</Badge>;
      default:
        return <Badge className="bg-muted text-foreground border-border"><Clock className="w-3 h-3 mr-1" />Casual</Badge>;
    }
  };

  const formatNextMeeting = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const GroupCard = ({ group }: { group: Group }) => {
    const TypeIcon = getTypeIcon(group.type);
    const nextMeetingText = formatNextMeeting(group.nextMeeting);

    return (
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => onGroupClick(group.id)}
      >
        {/* Header with gradient */}
        <div className={`h-3 bg-gradient-to-r ${getTypeColor(group.type)}`}></div>
        
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getTypeColor(group.type)} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <TypeIcon className="w-7 h-7 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg leading-tight">{group.name}</h3>
                    {group.isLive && (
                      <Badge className="bg-error-500 text-white animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-card mr-1"></span>
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                </div>
                {group.isPrivate && (
                  <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{group.members}{group.maxMembers ? `/${group.maxMembers}` : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  {group.location === 'online' ? (
                    <><Video className="w-4 h-4" /><span>Online</span></>
                  ) : group.location === 'hybrid' ? (
                    <><Globe className="w-4 h-4" /><span>Hybrid</span></>
                  ) : (
                    <><MapPin className="w-4 h-4" /><span>In-Person</span></>
                  )}
                </div>
                {nextMeetingText && (
                  <div className="flex items-center gap-1 text-primary-600">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{nextMeetingText}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {group.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {getActivityBadge(group.activityLevel)}
              </div>

              {/* Leaders */}
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {group.leaders.map((leader, idx) => (
                    <Avatar key={idx} className="w-6 h-6 border-2 border-white">
                      <AvatarImage src={leader.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-400 text-white text-xs">
                        {leader.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span>Led by {group.leaders.map(l => l.name).join(', ')}</span>
              </div>

              {/* Action Button */}
              {group.isJoined ? (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGroupClick(group.id);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Group
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              ) : group.isPending ? (
                <Button variant="outline" className="w-full" disabled>
                  <Clock className="w-4 h-4 mr-2" />
                  Request Pending
                </Button>
              ) : (
                <Button 
                  className={`w-full bg-gradient-to-r ${getTypeColor(group.type)} hover:opacity-90`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinRequest(group.id);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {group.isPrivate ? 'Request to Join' : 'Join Group'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/30 to-primary-50/30">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Community</h1>
              <p className="text-sm text-muted-foreground">Connect with Christian couples</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search groups, Bible studies, prayer rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
              className={selectedType === 'all' ? 'bg-gradient-to-r from-primary-600 to-primary-700' : ''}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              All
            </Button>
            <Button
              variant={selectedType === 'couple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('couple')}
              className={selectedType === 'couple' ? 'bg-gradient-to-r from-primary-600 to-primary-600' : ''}
            >
              <Heart className="w-4 h-4 mr-2" />
              Couples
            </Button>
            <Button
              variant={selectedType === 'bible-study' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('bible-study')}
              className={selectedType === 'bible-study' ? 'bg-gradient-to-r from-sky-600 to-sky-600' : ''}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Bible Study
            </Button>
            <Button
              variant={selectedType === 'prayer-room' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('prayer-room')}
              className={selectedType === 'prayer-room' ? 'bg-gradient-to-r from-primary-600 to-primary-600' : ''}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Prayer
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-8">
        {/* Pending Requests */}
        {pendingGroups.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-warning-700" />
              <h2 className="text-lg font-semibold">Pending Requests</h2>
              <Badge className="bg-warning-50 text-warning-700">{pendingGroups.length}</Badge>
            </div>
            <div className="space-y-4">
              {pendingGroups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </div>
        )}

        {/* My Groups */}
        {myGroups.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-success-700" />
              <h2 className="text-lg font-semibold">My Groups</h2>
              <Badge className="bg-success-50 text-success-700">{myGroups.length}</Badge>
            </div>
            <div className="space-y-4">
              {myGroups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </div>
        )}

        {/* Discover Groups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold">Discover Groups</h2>
              <Badge className="bg-primary-100 text-primary-800">{discoverGroups.length}</Badge>
            </div>
          </div>

          {discoverGroups.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Groups Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {discoverGroups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
