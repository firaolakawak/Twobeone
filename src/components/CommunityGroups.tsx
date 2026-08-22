import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
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
  Bell
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
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

      if (response.ok) {
        toast.success('Group created successfully!');
        setIsCreateDialogOpen(false);
        loadGroups();
        loadMyGroups();
      } else {
        toast.error('Failed to create group');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group');
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
        toast.success('Joined group successfully!');
        loadGroups();
        loadMyGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      toast.error('Failed to join group');
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
        toast.success('Left group successfully');
        setSelectedGroup(null);
        loadGroups();
        loadMyGroups();
      } else {
        toast.error('Failed to leave group');
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      toast.error('Failed to leave group');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl">Community Groups</h1>
        </div>
        <p className="text-gray-600">Connect, share, and grow together in faith</p>
      </div>

      {/* Live Sessions Banner */}
      {liveSessions.length > 0 && (
        <Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="w-6 h-6 text-red-600 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">🔴 Live Now!</h3>
                <p className="text-sm text-red-700">
                  {liveSessions.length} {liveSessions.length === 1 ? 'group is' : 'groups are'} streaming live
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => setActiveTab('live')}
              >
                Watch Live
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Group Button */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New Group
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Community Group</DialogTitle>
            <DialogDescription>
              Start a new community group to connect with other couples
            </DialogDescription>
          </DialogHeader>
          <CreateGroupForm onSubmit={createGroup} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Groups Grid */}
          <div className="grid gap-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{group.memberCount} members</span>
                        {group.isPublic && <Badge variant="secondary" className="text-xs">Public</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {isMember(group.id) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedGroup(group)}
                        >
                          Open
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => joinGroup(group.id)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredGroups.length === 0 && (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Groups Found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try a different search term' : 'Be the first to create a community group!'}
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* My Groups Tab */}
        <TabsContent value="my-groups" className="space-y-4">
          <div className="grid gap-4">
            {myGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedGroup(group)}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{group.memberCount} members</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {myGroups.length === 0 && (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
                <p className="text-gray-600 mb-4">Join or create a group to get started!</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Discover Groups
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Live Tab */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid gap-4">
            {liveSessions.map((session) => (
              <LiveSessionCard key={session.id} session={session} />
            ))}

            {liveSessions.length === 0 && (
              <Card className="p-12 text-center">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Live Sessions</h3>
                <p className="text-gray-600">Check back later for live streams from your groups!</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Create Group Form Component
function CreateGroupForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Group Name</Label>
        <Input
          id="name"
          placeholder="e.g., Young Couples Fellowship"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What is this group about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Group'}
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
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          ←
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <p className="text-sm text-gray-600">{group.memberCount} members</p>
        </div>
        {isMember && (
          <Button variant="outline" size="sm" onClick={onLeave}>
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        )}
      </div>

      {/* Description */}
      <Card>
        <CardContent className="p-4">
          <p className="text-gray-700">{group.description}</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="events">
            <Calendar className="w-4 h-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="live">
            <Video className="w-4 h-4 mr-2" />
            Go Live
          </TabsTrigger>
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
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
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
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm">{msg.userName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
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
        toast.success('Event created successfully!');
        setIsCreateDialogOpen(false);
        loadEvents();
      } else {
        toast.error('Failed to create event');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event');
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
        toast.success('RSVP saved!');
        loadRSVPs(eventId);
      } else {
        toast.error('Failed to RSVP');
      }
    } catch (error) {
      console.error('Failed to RSVP:', error);
      toast.error('Failed to RSVP');
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
    toast.success('Event added to calendar!');
  };

  return (
    <div className="space-y-4">
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group Event</DialogTitle>
            <DialogDescription>
              Add an event to your group to bring the community together!
            </DialogDescription>
          </DialogHeader>
          <CreateEventForm onSubmit={createEvent} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {events.map((event) => {
          const eventRsvps = rsvps[event.id] || [];
          const goingCount = eventRsvps.filter(r => r.status === 'going').length;
          
          return (
            <Card key={event.id}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    {new Date(event.date).toLocaleString()}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="w-4 h-4" />
                    {goingCount} going
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => rsvpToEvent(event.id, 'going')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Going
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rsvpToEvent(event.id, 'maybe')}
                    className="flex-1"
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Maybe
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rsvpToEvent(event.id, 'not-going')}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Can't Go
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addToCalendar(event)}
                  className="w-full"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {events.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
            <p className="text-gray-600">Create an event to bring the community together!</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function CreateEventForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error('Please fill in required fields');
      return;
    }
    onSubmit({ title, description, date, location });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          placeholder="e.g., Bible Study Night"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What's this event about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date">Date & Time</Label>
        <Input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g., Community Center"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Event'}
      </Button>
    </form>
  );
}

// Go Live Component
function GoLive({ groupId }: { groupId: string }) {
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
        toast.error('Failed to start video preview. Please try again.');
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
        toast.error('Camera is not supported in this browser. Please use Chrome, Firefox, or Safari.');
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
          '📹 Camera permission required! Please click on the camera icon in your browser\'s address bar and allow access.',
          { duration: 8000 }
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application. Please close other apps using the camera.');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('Camera does not support the requested settings. Trying with basic settings...');
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
          toast.error('Failed to access camera with any settings.');
          return false;
        }
      } else if (error.name === 'SecurityError') {
        toast.error('Camera access blocked due to security settings. Please use HTTPS or localhost.');
      } else {
        toast.error(`Camera error: ${error.message || 'Unknown error'}. Please check your camera permissions in browser settings.`);
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
            toast.info('Setting up video streaming...');
            const broadcaster = await createBroadcaster(newSession.id, videoStream, token);
            setWebrtcBroadcaster(broadcaster);
            console.log('✅ WebRTC broadcaster initialized!');
            toast.success('🔴 You are now live with video streaming!');
          } catch (webrtcError) {
            console.error('WebRTC setup failed:', webrtcError);
            const errorMsg = webrtcError instanceof Error ? webrtcError.message : 'Unknown error';
            console.error('WebRTC error details:', errorMsg);
            toast.warning(`Live session started but video streaming setup failed: ${errorMsg}`);
          }
        } else {
          console.warn('⚠️ No video stream available for WebRTC broadcaster');
          toast.warning('Live session started but camera not available');
        }
      } else {
        toast.error('Failed to start live session');
        stopCamera(); // Stop camera if live session failed
      }
    } catch (error) {
      console.error('Failed to start live:', error);
      toast.error('Failed to start live session');
      stopCamera(); // Stop camera if error occurred
    } finally {
      setIsLoading(false);
    }
  };

  const endLive = async () => {
    if (!liveSession) {
      toast.error('No active live session found');
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
        toast.success('Live session ended');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to end live session:', response.status, errorData);
        toast.error(`Failed to end live session: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to end live:', error);
      toast.error('Failed to end live session. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLive && liveSession) {
    console.log('Rendering live view. Video stream exists:', !!videoStream, 'videoRef exists:', !!videoRef.current);
    
    return (
      <Card className="border-2 border-red-500">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-red-600 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">You're Live!</h3>
              <p className="text-sm text-gray-600">{liveSession.title}</p>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-red-600" />
                <span className="font-semibold">{liveSession.viewerCount} viewers</span>
              </div>
              <span className="text-sm text-gray-600">
                Started {new Date(liveSession.startedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Live Video Stream */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            {videoStream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  {liveSession.viewerCount}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white space-y-3">
                  <Video className="w-16 h-16 mx-auto opacity-50" />
                  <p className="text-sm opacity-75">Starting camera...</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      console.log('Manual camera start button clicked');
                      const success = await startCamera();
                      console.log('Manual camera start result:', success);
                    }}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Retry Camera
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="destructive"
            onClick={endLive}
            disabled={isLoading}
            className="w-full"
          >
            End Live Session
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Go Live with Your Community</h3>
            <p className="text-sm text-gray-600">
              Start a live session to connect with group members in real-time.
              They'll receive a notification when you go live!
            </p>
          </div>
        </div>

        {/* Camera Permission Help Dialog */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-orange-600" />
                Camera Permission Was Denied
              </DialogTitle>
              <DialogDescription>
                Follow these steps to enable camera access
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-orange-900 mb-3">📹 How to Allow Camera Access:</h4>
                  <ol className="space-y-2 text-sm text-orange-800 list-decimal list-inside">
                    <li>Look for a <strong>camera icon (🎥)</strong> or <strong>lock icon</strong> in your browser's address bar (top-left of screen)</li>
                    <li>Click on it to open the site permissions menu</li>
                    <li>Find "Camera" and "Microphone" permissions</li>
                    <li>Change them from "Block" to <strong>"Allow"</strong></li>
                    <li>Reload this page (press F5 or Cmd+R)</li>
                    <li>Try "Go Live Now" again</li>
                  </ol>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <p className="text-xs text-blue-800 mb-2">
                    <strong>Alternative Method - Browser Settings:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li><strong>Chrome/Edge:</strong> Settings → Privacy & Security → Site Settings → Camera</li>
                    <li><strong>Firefox:</strong> Settings → Privacy & Security → Permissions → Camera</li>
                    <li><strong>Safari:</strong> Preferences → Websites → Camera</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPermissionDialog(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowPermissionDialog(false);
                    window.location.reload();
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Reload Page
                </Button>
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title || 'Live Session', description);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="live-title">Session Title (Optional)</Label>
        <Input
          id="live-title"
          placeholder="e.g., Evening Prayer & Worship"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="live-description">Description (Optional)</Label>
        <Textarea
          id="live-description"
          placeholder="What will you talk about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
        disabled={isLoading}
      >
        <Radio className="w-4 h-4 mr-2" />
        {isLoading ? 'Starting...' : 'Go Live Now'}
      </Button>
    </form>
  );
}

// Live Session Card
function LiveSessionCard({ session }: { session: LiveSession }) {
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
        toast.success('Joined live session!');
      }
    } catch (error) {
      console.error('Failed to join live:', error);
    }
  };

  if (showViewer) {
    return <LiveStreamViewer session={session} onClose={() => setShowViewer(false)} />;
  }

  return (
    <Card className="border-2 border-red-500 bg-gradient-to-r from-red-50 to-pink-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 bg-red-600 rounded-full animate-ping" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{session.title}</h3>
            <p className="text-sm text-gray-600">{session.userName} • {session.groupName}</p>
            {session.description && (
              <p className="text-sm text-gray-600 mt-1">{session.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {session.viewerCount} watching
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Started {new Date(session.startedAt).toLocaleTimeString()}
          </div>
        </div>

        <Button
          onClick={joinLive}
          className="w-full bg-red-600 hover:bg-red-700"
          disabled={hasJoined}
        >
          <Video className="w-4 h-4 mr-2" />
          {hasJoined ? 'Watching...' : 'Watch Live'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Live Stream Viewer Component
function LiveStreamViewer({ session, onClose }: { session: LiveSession; onClose: () => void }) {
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
            toast.info('Live session has ended');
            onClose();
          }
        } else if (response.status === 404) {
          // Session not found
          console.log('📴 Live session not found');
          toast.info('Live session has ended');
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
      toast.info('Connecting to live stream...', { duration: 3000 });
      
      const viewer = await createViewer(session.id, viewerId, token, (stream) => {
        console.log('📹 Received remote stream!', {
          active: stream.active,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length
        });
        setRemoteStream(stream);
        setHasVideo(stream.getVideoTracks().length > 0);
        setIsLoading(false);
        toast.success('Connected to live stream!');
      });
      
      setWebrtcViewer(viewer);
      console.log('✅ WebRTC viewer initialized!');
      
      // If no stream received after 30 seconds, show helpful message
      setTimeout(() => {
        if (!remoteStream) {
          console.log('⚠️ No video stream received after 30 seconds');
          toast.warning('Waiting for broadcaster to start camera...', { duration: 5000 });
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
        toast.error('This live session has ended.');
        onClose();
      } else {
        toast.error('Could not connect to live stream. Please try again.', { duration: 4000 });
      }
      
      setIsLoading(false);
    }
  };

  const getAuthToken = async () => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    return authSession?.access_token || publicAnonKey;
  };

  return (
    <Card className="border-2 border-red-500">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-red-600 rounded-full animate-ping" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">🔴 LIVE: {session.title}</h3>
              <p className="text-sm text-gray-600">{session.userName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Live Video Stream - WebRTC */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
              <div className="relative mb-4">
                <Video className="w-16 h-16 opacity-50 animate-pulse" />
              </div>
              <p className="text-sm opacity-75">Connecting to {session.userName}'s stream...</p>
              <p className="text-xs opacity-50 mt-2">Waiting for broadcaster to start WebRTC...</p>
              <div className="mt-4 flex items-center gap-2 text-xs opacity-40">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                This may take up to 15 seconds
              </div>
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
              
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm shadow-lg">
                <Eye className="w-4 h-4" />
                {viewerCount}
              </div>
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
                Started {new Date(session.startedAt).toLocaleTimeString()}
              </div>
              <div className="absolute top-4 right-4 bg-green-600/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                WebRTC Connected
              </div>
            </>
          ) : (
            <>
              {/* Fallback if no video stream */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-4 border-white/20">
                      <Video className="w-16 h-16 opacity-80" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="text-center space-y-3 bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                    <p className="text-2xl font-semibold">{session.userName} is Live</p>
                    <p className="text-sm opacity-90 max-w-md">
                      {session.description || 'Streaming live to the community'}
                    </p>
                    <div className="flex items-center justify-center gap-3 text-sm pt-2">
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                        <Eye className="w-4 h-4" />
                        <span className="font-semibold">{viewerCount} watching</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span>Live now</span>
                      </div>
                    </div>
                    <p className="text-xs opacity-75 mt-3">⚠️ Video stream not available</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm shadow-lg">
                <Eye className="w-4 h-4" />
                {viewerCount}
              </div>
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
                Started {new Date(session.startedAt).toLocaleTimeString()}
              </div>
            </>
          )}
        </div>

        <div className={`border p-3 rounded-lg ${hasVideo ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-start gap-2">
            <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasVideo ? 'text-green-600' : 'text-blue-600'}`} />
            <div className="flex-1">
              {hasVideo ? (
                <>
                  <p className="text-sm text-green-900 font-semibold">✅ WebRTC Video Connected!</p>
                  <p className="text-xs text-green-700 mt-1">
                    You're viewing {session.userName}'s live camera feed via peer-to-peer WebRTC connection.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-blue-900 font-semibold">📹 WebRTC Status</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Attempting to establish WebRTC connection... If video doesn't appear, the broadcaster may need to enable their camera or there may be network restrictions.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Leave Stream
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
            onClick={() => toast.info('Live chat coming soon!')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}