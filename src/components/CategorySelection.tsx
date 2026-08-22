import { MessageCircle, Sun, Heart, Scale, Church, Plane, Shield, Handshake, Baby, DollarSign, Users, BookOpen, Home } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface CategorySelectionProps {
  onSelectCategory: (categoryId: string) => void;
  onBack?: () => void;
}

export function CategorySelection({ onSelectCategory, onBack }: CategorySelectionProps) {
  const categories = [
    { 
      id: 'daily-life', 
      label: 'Daily Life & Habits', 
      icon: Sun,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      description: 'Explore daily routines and habits'
    },
    { 
      id: 'intimacy', 
      label: 'Intimacy & Lifestyle', 
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50',
      borderColor: 'border-rose-200',
      textColor: 'text-rose-700',
      description: 'Deepen connection and understanding'
    },
    { 
      id: 'love-balance', 
      label: 'Love & Balance', 
      icon: Scale,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      description: 'Finding harmony in relationships'
    },
    { 
      id: 'dream-wedding', 
      label: 'Dream Wedding / Dream Home', 
      icon: Church,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      description: 'Plan your future together'
    },
    { 
      id: 'travel', 
      label: 'Travel & Adventure', 
      icon: Plane,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-gradient-to-br from-cyan-50 to-blue-50',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-700',
      description: 'Explore the world together'
    },
    { 
      id: 'boundaries', 
      label: 'Relationship Boundaries', 
      icon: Shield,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      description: 'Establish healthy boundaries'
    },
    { 
      id: 'trust', 
      label: 'Trust & Truth', 
      icon: Handshake,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      description: 'Build trust and transparency'
    },
    { 
      id: 'kids-future', 
      label: 'Kids & Future', 
      icon: Baby,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
      borderColor: 'border-pink-200',
      textColor: 'text-pink-700',
      description: 'Discuss family planning'
    },
    { 
      id: 'finance', 
      label: 'Finance & Goals', 
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      description: 'Plan your financial future'
    },
    { 
      id: 'family', 
      label: 'Family Relations', 
      icon: Users,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      description: 'Navigate family dynamics'
    },
    { 
      id: 'bible', 
      label: 'Bible Convictions', 
      icon: BookOpen,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50',
      borderColor: 'border-violet-200',
      textColor: 'text-violet-700',
      description: 'Discuss faith and beliefs'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="relative text-center space-y-3 pt-8 pb-4">
          {/* Home Icon Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-8 left-0 p-3 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 border border-purple-200 hover:border-purple-400 group"
              aria-label="Go to home"
            >
              <Home className="w-6 h-6 text-purple-600 group-hover:text-purple-700" />
            </button>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Choose a Category
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Select a topic to explore meaningful questions and deepen your relationship
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card
                key={category.id}
                className={`${category.bgColor} ${category.borderColor} cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2`}
                onClick={() => onSelectCategory(category.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className={`font-semibold text-lg ${category.textColor}`}>
                        {category.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* All Categories Option */}
        <Card
          className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2"
          onClick={() => onSelectCategory('all')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-purple-700">
                    All Questions
                  </h3>
                  <p className="text-sm text-gray-600">
                    Browse all available questions across every category
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                →
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
            size="lg"
          >
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
}