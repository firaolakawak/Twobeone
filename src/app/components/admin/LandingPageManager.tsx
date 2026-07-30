import { useState, useEffect } from 'react';
import { 
  Save, RefreshCw, Plus, Trash2, Edit, RotateCcw, Eye, Mail,
  Heart, BookOpen, MessageSquare, Users as UsersIcon, Sparkles, TrendingUp,
  Shield, Zap, Globe, Star, ChevronDown, ChevronUp, Smartphone
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ScreenshotUploader } from './ScreenshotUploader';

interface LandingPageManagerProps {
  accessToken?: string;
}

interface LandingContent {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    scripture: {
      text: string;
      reference: string;
    };
    socialProof: {
      couplesCount: string;
      rating: number;
    };
  };
  screenshot: {
    greeting: string;
    coupleNames: string;
    streakDays: string;
    devotional: {
      badge: string;
      title: string;
      verse: string;
    };
    stats: {
      devotionals: string;
      prayers: string;
      questions: string;
    };
    prayerRequest: {
      title: string;
      text: string;
    };
  };
  features: Array<{
    title: string;
    description: string;
    icon: string;
    color: string;
  }>;
  whySection: {
    badge: string;
    title: string;
    description: string;
    reasons: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  stats: Array<{
    label: string;
    value: string;
    gradient: string;
  }>;
  testimonials: Array<{
    name: string;
    location: string;
    image: string;
    quote: string;
    rating: number;
    married: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  cta: {
    title: string;
    description: string;
    newsletterLabel: string;
    buttonText: string;
    footer: string;
  };
}

const iconOptions = [
  'BookOpen', 'MessageSquare', 'Heart', 'Users', 'Sparkles', 'TrendingUp',
  'Shield', 'Zap', 'Globe', 'Star'
];

const colorGradientOptions = [
  'from-warning-500 to-warning-500',
  'from-sky-500 to-sky-600',
  'from-primary-500 to-primary-600',
  'from-primary-500 to-sky-500',
  'from-success-500 to-success-700',
  'from-primary-500 to-primary-500',
  'from-primary-50 to-primary-100',
  'from-primary-50 to-sky-50',
  'from-warning-50 to-warning-50',
  'from-success-50 to-success-50'
];

export function LandingPageManager({ accessToken }: LandingPageManagerProps) {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['hero']));

  useEffect(() => {
    loadContent();
    loadStats();
    loadSubscribers();
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/landing/content`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { content: loadedContent } = await response.json();
        setContent(loadedContent);
      }
    } catch (error) {
      console.error('Failed to load landing page content:', error);
      toast.error('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/landing/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { subscribersCount: count } = await response.json();
        setSubscribersCount(count);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSubscribers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/newsletter/subscribers`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const { subscribers: subs } = await response.json();
        setSubscribers(subs || []);
      }
    } catch (error) {
      console.error('Failed to load subscribers:', error);
    }
  };

  const handleSave = async () => {
    if (!content) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/landing/content`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(content)
        }
      );

      if (response.ok) {
        toast.success('Landing page content saved successfully!');
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Failed to save landing page content:', error);
      toast.error('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default content? This cannot be undone.')) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee/landing/content/reset`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken || publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        toast.success('Content reset to default successfully!');
        loadContent();
      } else {
        throw new Error('Failed to reset content');
      }
    } catch (error) {
      console.error('Failed to reset content:', error);
      toast.error('Failed to reset content');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading || !content) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Landing Page Content</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage all content displayed on the landing page</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={loadContent}
            disabled={isLoading}
            className="w-full sm:w-auto"
            size="sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload
              </>
            )}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary-600 hover:bg-primary-700 w-full sm:w-auto"
            size="sm"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm text-muted-foreground font-bold">Newsletter Subscribers</p>
              <p className="text-2xl font-semibold">{subscribersCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-sky-600" />
            <div>
              <p className="text-sm text-muted-foreground font-bold">Sections</p>
              <p className="text-2xl font-semibold">7</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-warning-500" />
            <div>
              <p className="text-sm text-muted-foreground font-bold">Testimonials</p>
              <p className="text-2xl font-semibold">{content.testimonials.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content Editor</TabsTrigger>
          <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
          <TabsTrigger value="subscribers">Newsletter Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Hero Section */}
          <Card className="p-6">
            <button
              onClick={() => toggleSection('hero')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary-600" />
                <h3 className="text-xl font-semibold">Hero Section</h3>
              </div>
              {expandedSections.has('hero') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedSections.has('hero') && (
              <div className="space-y-4">
                <div>
                  <Label>Badge Text</Label>
                  <Input
                    value={content.hero.badge}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { ...content.hero, badge: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Main Title</Label>
                  <Input
                    value={content.hero.title}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { ...content.hero, title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={content.hero.subtitle}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { ...content.hero, subtitle: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={content.hero.description}
                    onChange={(e) => setContent({
                      ...content,
                      hero: { ...content.hero, description: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Scripture Text</Label>
                    <Textarea
                      value={content.hero.scripture.text}
                      onChange={(e) => setContent({
                        ...content,
                        hero: {
                          ...content.hero,
                          scripture: { ...content.hero.scripture, text: e.target.value }
                        }
                      })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Scripture Reference</Label>
                    <Input
                      value={content.hero.scripture.reference}
                      onChange={(e) => setContent({
                        ...content,
                        hero: {
                          ...content.hero,
                          scripture: { ...content.hero.scripture, reference: e.target.value }
                        }
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Couples Count</Label>
                    <Input
                      value={content.hero.socialProof.couplesCount}
                      onChange={(e) => setContent({
                        ...content,
                        hero: {
                          ...content.hero,
                          socialProof: { ...content.hero.socialProof, couplesCount: e.target.value }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Rating (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={content.hero.socialProof.rating}
                      onChange={(e) => setContent({
                        ...content,
                        hero: {
                          ...content.hero,
                          socialProof: { ...content.hero.socialProof, rating: parseInt(e.target.value) }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Features Section */}
          <Card className="p-6">
            <button
              onClick={() => toggleSection('features')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h3 className="text-xl font-semibold">Features ({content.features.length})</h3>
              </div>
              {expandedSections.has('features') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedSections.has('features') && (
              <div className="space-y-4">
                {content.features.map((feature, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>{`Feature ${index + 1}`}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFeatures = content.features.filter((_, i) => i !== index);
                          setContent({ ...content, features: newFeatures });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-error-500" />
                      </Button>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={feature.title}
                        onChange={(e) => {
                          const newFeatures = [...content.features];
                          newFeatures[index].title = e.target.value;
                          setContent({ ...content, features: newFeatures });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={feature.description}
                        onChange={(e) => {
                          const newFeatures = [...content.features];
                          newFeatures[index].description = e.target.value;
                          setContent({ ...content, features: newFeatures });
                        }}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Icon</Label>
                        <Select
                          value={feature.icon}
                          onValueChange={(value) => {
                            const newFeatures = [...content.features];
                            newFeatures[index].icon = value;
                            setContent({ ...content, features: newFeatures });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map(icon => (
                              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Color Gradient</Label>
                        <Select
                          value={feature.color}
                          onValueChange={(value) => {
                            const newFeatures = [...content.features];
                            newFeatures[index].color = value;
                            setContent({ ...content, features: newFeatures });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorGradientOptions.map(color => (
                              <SelectItem key={color} value={color}>
                                <div className={`h-4 w-20 rounded bg-gradient-to-r ${color}`} />
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newFeature = {
                      title: 'New Feature',
                      description: 'Feature description',
                      icon: 'Heart',
                      color: 'from-primary-500 to-sky-500'
                    };
                    setContent({ ...content, features: [...content.features, newFeature] });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            )}
          </Card>

          {/* Stats Section */}
          <Card className="p-6">
            <button
              onClick={() => toggleSection('stats')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success-700" />
                <h3 className="text-xl font-semibold">Statistics ({content.stats.length})</h3>
              </div>
              {expandedSections.has('stats') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedSections.has('stats') && (
              <div className="grid grid-cols-2 gap-4">
                {content.stats.map((stat, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>{`Stat ${index + 1}`}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newStats = content.stats.filter((_, i) => i !== index);
                          setContent({ ...content, stats: newStats });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-error-500" />
                      </Button>
                    </div>
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={stat.label}
                        onChange={(e) => {
                          const newStats = [...content.stats];
                          newStats[index].label = e.target.value;
                          setContent({ ...content, stats: newStats });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Value</Label>
                      <Input
                        value={stat.value}
                        onChange={(e) => {
                          const newStats = [...content.stats];
                          newStats[index].value = e.target.value;
                          setContent({ ...content, stats: newStats });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Testimonials Section */}
          <Card className="p-6">
            <button
              onClick={() => toggleSection('testimonials')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-warning-500" />
                <h3 className="text-xl font-semibold">Testimonials ({content.testimonials.length})</h3>
              </div>
              {expandedSections.has('testimonials') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedSections.has('testimonials') && (
              <div className="space-y-4">
                {content.testimonials.map((testimonial, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>{`Testimonial ${index + 1}`}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newTestimonials = content.testimonials.filter((_, i) => i !== index);
                          setContent({ ...content, testimonials: newTestimonials });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-error-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={testimonial.name}
                          onChange={(e) => {
                            const newTestimonials = [...content.testimonials];
                            newTestimonials[index].name = e.target.value;
                            setContent({ ...content, testimonials: newTestimonials });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Location</Label>
                        <Input
                          value={testimonial.location}
                          onChange={(e) => {
                            const newTestimonials = [...content.testimonials];
                            newTestimonials[index].location = e.target.value;
                            setContent({ ...content, testimonials: newTestimonials });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Quote</Label>
                      <Textarea
                        value={testimonial.quote}
                        onChange={(e) => {
                          const newTestimonials = [...content.testimonials];
                          newTestimonials[index].quote = e.target.value;
                          setContent({ ...content, testimonials: newTestimonials });
                        }}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Image/Emoji</Label>
                        <Input
                          value={testimonial.image}
                          onChange={(e) => {
                            const newTestimonials = [...content.testimonials];
                            newTestimonials[index].image = e.target.value;
                            setContent({ ...content, testimonials: newTestimonials });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Rating (1-5)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={testimonial.rating}
                          onChange={(e) => {
                            const newTestimonials = [...content.testimonials];
                            newTestimonials[index].rating = parseInt(e.target.value);
                            setContent({ ...content, testimonials: newTestimonials });
                          }}
                        />
                      </div>
                      <div>
                        <Label>Married</Label>
                        <Input
                          value={testimonial.married}
                          onChange={(e) => {
                            const newTestimonials = [...content.testimonials];
                            newTestimonials[index].married = e.target.value;
                            setContent({ ...content, testimonials: newTestimonials });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newTestimonial = {
                      name: 'New Couple',
                      location: 'City, State',
                      image: '💑',
                      quote: 'Your testimonial here...',
                      rating: 5,
                      married: '1 year'
                    };
                    setContent({ ...content, testimonials: [...content.testimonials, newTestimonial] });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Testimonial
                </Button>
              </div>
            )}
          </Card>

          {/* FAQs Section */}
          <Card className="p-6">
            <button
              onClick={() => toggleSection('faqs')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <h3 className="text-xl font-semibold">FAQs ({content.faqs.length})</h3>
              </div>
              {expandedSections.has('faqs') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedSections.has('faqs') && (
              <div className="space-y-4">
                {content.faqs.map((faq, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge>{`FAQ ${index + 1}`}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFaqs = content.faqs.filter((_, i) => i !== index);
                          setContent({ ...content, faqs: newFaqs });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-error-500" />
                      </Button>
                    </div>
                    <div>
                      <Label>Question</Label>
                      <Input
                        value={faq.question}
                        onChange={(e) => {
                          const newFaqs = [...content.faqs];
                          newFaqs[index].question = e.target.value;
                          setContent({ ...content, faqs: newFaqs });
                        }}
                      />
                    </div>
                    <div>
                      <Label>Answer</Label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => {
                          const newFaqs = [...content.faqs];
                          newFaqs[index].answer = e.target.value;
                          setContent({ ...content, faqs: newFaqs });
                        }}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newFaq = {
                      question: 'New question?',
                      answer: 'Answer here...'
                    };
                    setContent({ ...content, faqs: [...content.faqs, newFaq] });
                  }}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ
                </Button>
              </div>
            )}
          </Card>

          {/* CTA Section */}
          <Card className="p-6">
            <button
              onClick={() => toggleSection('cta')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary-600" />
                <h3 className="text-xl font-semibold">Call to Action</h3>
              </div>
              {expandedSections.has('cta') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedSections.has('cta') && (
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={content.cta.title}
                    onChange={(e) => setContent({
                      ...content,
                      cta: { ...content.cta, title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={content.cta.description}
                    onChange={(e) => setContent({
                      ...content,
                      cta: { ...content.cta, description: e.target.value }
                    })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Newsletter Label</Label>
                  <Input
                    value={content.cta.newsletterLabel}
                    onChange={(e) => setContent({
                      ...content,
                      cta: { ...content.cta, newsletterLabel: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={content.cta.buttonText}
                    onChange={(e) => setContent({
                      ...content,
                      cta: { ...content.cta, buttonText: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Footer Text</Label>
                  <Input
                    value={content.cta.footer}
                    onChange={(e) => setContent({
                      ...content,
                      cta: { ...content.cta, footer: e.target.value }
                    })}
                  />
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="screenshots" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Screenshots</h3>
            </div>

            <ScreenshotUploader
              accessToken={accessToken || publicAnonKey}
            />
            <ScreenshotUploader accessToken={accessToken} />
          </Card>
          <ScreenshotUploader accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Newsletter Subscribers</h3>
              <Badge className="text-lg px-3 py-1">{subscribersCount} Total</Badge>
            </div>

            {subscribers.length > 0 ? (
              <div className="space-y-2">
                {subscribers.map((sub, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-primary-600" />
                      <div>
                        <p className="font-medium">{sub.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Subscribed: {new Date(sub.subscribedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No subscribers yet</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}