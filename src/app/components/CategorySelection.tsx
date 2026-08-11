import { Sun, Heart, Scale, Church, Plane, Shield, Handshake, Baby, DollarSign, Users, BookOpen, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface CategorySelectionProps {
  onSelectCategory: (categoryId: string) => void;
  onBack?: () => void;
}

export function CategorySelection({ onSelectCategory, onBack }: CategorySelectionProps) {
  const { t } = useLanguage();
  const categories = [
    { 
      id: 'daily-life', 
      label: t.questions.categories.dailyLifeHabits,
      icon: Sun,
      color: 'from-warning-500 to-warning-500',
      bgColor: 'bg-gradient-to-br from-warning-50 to-warning-50',
      borderColor: 'border-warning-500/30',
      textColor: 'text-warning-700',
      description: t.questions.categoryDescriptions.dailyLifeHabits,
    },
    { 
      id: 'intimacy', 
      label: t.questions.categories.intimacyLifestyle,
      icon: Heart,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      description: t.questions.categoryDescriptions.intimacyLifestyle,
    },
    { 
      id: 'love-balance', 
      label: t.questions.categories.loveBalance,
      icon: Scale,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-100',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      description: t.questions.categoryDescriptions.loveBalance,
    },
    { 
      id: 'dream-wedding', 
      label: t.questions.categories.dreamWeddingHome,
      icon: Church,
      color: 'from-sky-500 to-primary-500',
      bgColor: 'bg-gradient-to-br from-sky-50 to-primary-50',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-700',
      description: t.questions.categoryDescriptions.dreamWeddingHome,
    },
    { 
      id: 'travel', 
      label: t.questions.categories.travelAdventure,
      icon: Plane,
      color: 'from-sky-500 to-sky-500',
      bgColor: 'bg-gradient-to-br from-sky-50 to-sky-50',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-700',
      description: t.questions.categoryDescriptions.travelAdventure,
    },
    { 
      id: 'boundaries', 
      label: t.questions.categories.relationshipBoundaries,
      icon: Shield,
      color: 'from-success-500 to-sky-500',
      bgColor: 'bg-gradient-to-br from-success-50 to-sky-50',
      borderColor: 'border-success-500/30',
      textColor: 'text-success-700',
      description: t.questions.categoryDescriptions.relationshipBoundaries,
    },
    { 
      id: 'trust', 
      label: t.questions.categories.trustTruth,
      icon: Handshake,
      color: 'from-sky-500 to-sky-500',
      bgColor: 'bg-gradient-to-br from-sky-50 to-sky-100',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-700',
      description: t.questions.categoryDescriptions.trustTruth,
    },
    { 
      id: 'kids-future', 
      label: t.questions.categories.kidsFuture,
      icon: Baby,
      color: 'from-primary-500 to-primary-500',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      description: t.questions.categoryDescriptions.kidsFuture,
    },
    { 
      id: 'finance', 
      label: t.questions.categories.financeGoals,
      icon: DollarSign,
      color: 'from-success-500 to-success-700',
      bgColor: 'bg-gradient-to-br from-success-50 to-success-50',
      borderColor: 'border-success-500/30',
      textColor: 'text-success-700',
      description: t.questions.categoryDescriptions.financeGoals,
    },
    { 
      id: 'family', 
      label: t.questions.categories.familyRelations,
      icon: Users,
      color: 'from-warning-500 to-warning-500',
      bgColor: 'bg-gradient-to-br from-warning-50 to-warning-50',
      borderColor: 'border-warning-500/30',
      textColor: 'text-warning-700',
      description: t.questions.categoryDescriptions.familyRelations,
    },
    { 
      id: 'bible', 
      label: t.questions.categories.bibleConvictions,
      icon: BookOpen,
      color: 'from-primary-500 to-primary-500',
      bgColor: 'bg-gradient-to-br from-primary-50 to-primary-50',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      description: t.questions.categoryDescriptions.bibleConvictions,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-primary-50 pb-20">
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* Back Icon Button */}
        {onBack && (
          null
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            {t.questions.selectCategory}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t.questions.knowEachOther}. Meaningful questions and deepen your Relationship
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
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Back Button */}
        {onBack && (
          null
        )}
      </div>
    </div>
  );
}