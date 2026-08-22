import { useState } from 'react';
import { Sparkles, Loader2, BookOpen, MessageCircle, Lightbulb, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface Question {
  id: string;
  category: string;
  title: string;
  verse: string;
  verseReference: string;
  prompts: string[];
  userAnswer?: string;
  partnerAnswer?: string;
}

interface AIAssistantProps {
  questions: Question[];
  onClose: () => void;
}

export function AIAssistant({ questions, onClose }: AIAssistantProps) {
  const [activeFeature, setActiveFeature] = useState<'generate' | 'summarize' | 'verse' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const answeredQuestions = questions.filter(q => q.userAnswer && q.partnerAnswer);

  const handleGenerateQuestions = async () => {
    setActiveFeature('generate');
    setIsLoading(true);
    setResult(null);

    try {
      // Simulated AI response - in production, this would call an AI API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedQuestions = `1. **Worship & Spiritual Intimacy**
   Verse: "Shout for joy to the Lord, all the earth. Worship the Lord with gladness" - Psalm 100:1-2
   
   • How can we incorporate worship into our daily routine together?
   • What worship styles resonate most with each of us?
   • How can we create a sacred space for prayer and worship in our home?

2. **Gratitude & Thanksgiving**
   Verse: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus" - 1 Thessalonians 5:18
   
   • What are three things you're grateful for in our relationship right now?
   • How can we practice daily gratitude together?
   • What blessings do you want to thank God for as a couple?

3. **Mission & Purpose**
   Verse: "Therefore go and make disciples of all nations" - Matthew 28:19
   
   • What mission or calling do you feel God has placed on our lives?
   • How can we serve others together as a couple?
   • What causes or ministries are you passionate about?`;

      setResult(generatedQuestions);
      toast.success('AI generated 3 new faith-based questions!');
    } catch (error) {
      toast.error('Failed to generate questions. Please try again.');
      console.error('AI generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeDiscussions = async () => {
    setActiveFeature('summarize');
    setIsLoading(true);
    setResult(null);

    try {
      if (answeredQuestions.length === 0) {
        toast.info('No discussions to summarize yet. Start answering questions together!');
        setIsLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const summary = `📊 **Your Relationship Discussion Summary**

**Areas of Strength:**
✅ Communication & Transparency - You both value open, honest dialogue and actively work to understand each other's perspectives.
✅ Shared Faith Foundation - Your commitment to keeping Christ at the center of your relationship is evident in every discussion.
✅ Future Alignment - You're both excited about building a God-honoring life together, with aligned visions for family, ministry, and growth.

**Areas for Growth:**
🌱 Work-Life Balance - Continue developing strategies to protect couple time when work demands increase.
🌱 Conflict Resolution - Practice the communication techniques you've learned when disagreements arise.
🌱 Extended Family Boundaries - Keep having conversations about healthy boundaries with in-laws.

**Key Themes:**
💜 Quality Time: Both of you consistently emphasize the importance of intentional, distraction-free time together.
💜 Spiritual Leadership: You're navigating what mutual spiritual leadership looks like in your unique relationship.
💜 Financial Stewardship: Strong agreement on tithing, saving, and avoiding consumer debt.

**Recommended Next Steps:**
1. Discuss questions in the "Trust & Truth" category to deepen vulnerability
2. Create a written vision statement for your marriage
3. Schedule a quarterly "state of the union" check-in`;

      setResult(summary);
      toast.success('Discussion summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary. Please try again.');
      console.error('AI summarization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendVerse = async () => {
    setActiveFeature('verse');
    setIsLoading(true);
    setResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const verseRecommendation = `📖 **Recommended Verse for Your Current Journey**

**Philippians 2:2-4**

"Then make my joy complete by being like-minded, having the same love, being one in spirit and of one mind. Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves, not looking to your own interests but each of you to the interests of the others."

**Why This Verse:**
Based on your recent discussions about balancing independence and togetherness, this passage beautifully captures the heart of Christian marriage - maintaining unity while lovingly serving one another.

**Reflection Questions:**
• How can we practice "humility" in our daily interactions?
• What does it mean to "value others above ourselves" without losing our identity?
• Where do we see selfish ambition creeping into our relationship, and how can we address it?

**Prayer Prompt:**
"Lord, help us to be one in spirit and purpose. Give us humble hearts that seek to serve rather than be served. Teach us to consider each other's needs above our own, just as Christ did for us. Amen."

**Application:**
This week, each of you identify one specific way you can "look to the interests" of your partner and intentionally practice it daily.`;

      setResult(verseRecommendation);
      toast.success('Verse recommendation generated!');
    } catch (error) {
      toast.error('Failed to recommend verse. Please try again.');
      console.error('AI verse recommendation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = `Based on your request: "${customPrompt}"

I'd be happy to help with that! While I'm still learning about your unique relationship journey, here are some faith-centered insights:

🙏 **Biblical Perspective:**
Every relationship challenge is an opportunity to grow in Christlikeness. Remember that "we know that in all things God works for the good of those who love him" (Romans 8:28).

💡 **Practical Suggestion:**
1. Start with prayer together about this specific topic
2. Share your individual perspectives without judgment
3. Look for scripture that speaks to this area
4. Commit to supporting each other as you work through it

🔄 **Next Steps:**
Consider exploring the relevant question categories in the Discussion Hub to dive deeper into this topic together.

Would you like me to generate specific discussion questions about this?`;

      setResult(response);
      toast.success('AI response generated!');
    } catch (error) {
      toast.error('Failed to process request. Please try again.');
      console.error('AI custom prompt error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Assistant</h3>
            <p className="text-sm text-gray-600">Faith-centered relationship insights</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3">
        <Button
          onClick={handleGenerateQuestions}
          disabled={isLoading}
          variant="outline"
          className="justify-start h-auto py-4 bg-white hover:bg-purple-50"
        >
          <Lightbulb className="w-5 h-5 mr-3 text-amber-500" />
          <div className="text-left">
            <p className="font-medium">Generate 3 New Questions</p>
            <p className="text-xs text-gray-600">AI-powered faith-based topics</p>
          </div>
        </Button>

        <Button
          onClick={handleSummarizeDiscussions}
          disabled={isLoading || answeredQuestions.length === 0}
          variant="outline"
          className="justify-start h-auto py-4 bg-white hover:bg-purple-50"
        >
          <MessageCircle className="w-5 h-5 mr-3 text-blue-500" />
          <div className="text-left">
            <p className="font-medium">Summarize Our Discussions</p>
            <p className="text-xs text-gray-600">
              {answeredQuestions.length > 0 
                ? `${answeredQuestions.length} discussions to analyze`
                : 'No discussions yet'}
            </p>
          </div>
        </Button>

        <Button
          onClick={handleRecommendVerse}
          disabled={isLoading}
          variant="outline"
          className="justify-start h-auto py-4 bg-white hover:bg-purple-50"
        >
          <BookOpen className="w-5 h-5 mr-3 text-purple-500" />
          <div className="text-left">
            <p className="font-medium">Recommend a Verse</p>
            <p className="text-xs text-gray-600">For your current journey</p>
          </div>
        </Button>
      </div>

      {/* Custom Prompt */}
      <div className="space-y-3">
        <label className="font-medium text-sm">Ask AI Assistant</label>
        <Textarea
          placeholder="E.g., 'Help us think through career decisions' or 'Suggest questions about financial planning'..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="bg-white"
        />
        <Button
          onClick={handleCustomPrompt}
          disabled={isLoading || !customPrompt.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Ask AI
            </>
          )}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      )}

      {/* Result */}
      {result && !isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600">AI Response</Badge>
          </div>
          <ScrollArea className="h-96">
            <div className="bg-white rounded-lg p-4 prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                {result}
              </pre>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-600 text-center">
        💡 AI suggestions are meant to inspire conversation and should be prayerfully considered together
      </p>
    </Card>
  );
}
