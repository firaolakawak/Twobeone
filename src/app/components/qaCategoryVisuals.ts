import {
  Baby,
  BookOpen,
  Church,
  CircleDollarSign,
  Handshake,
  Heart,
  MessageCircleMore,
  Plane,
  Scale,
  ShieldCheck,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface QACategoryVisual {
  icon: LucideIcon;
  card: string;
  border: string;
  iconSurface: string;
  iconColor: string;
  text: string;
  progress: string;
}

export const QA_CATEGORY_VISUALS: Record<string, QACategoryVisual> = {
  all: {
    icon: MessageCircleMore,
    card: 'bg-primary-50/45',
    border: 'border-primary-200/70',
    iconSurface: 'bg-primary-100',
    iconColor: 'text-primary-700',
    text: 'text-primary-800',
    progress: 'bg-primary-600',
  },
  'daily-life': {
    icon: Sun,
    card: 'bg-amber-50/55',
    border: 'border-amber-200/70',
    iconSurface: 'bg-amber-100',
    iconColor: 'text-amber-700',
    text: 'text-amber-900',
    progress: 'bg-amber-600',
  },
  intimacy: {
    icon: Heart,
    card: 'bg-rose-50/55',
    border: 'border-rose-200/70',
    iconSurface: 'bg-rose-100',
    iconColor: 'text-rose-700',
    text: 'text-rose-900',
    progress: 'bg-rose-600',
  },
  'love-balance': {
    icon: Scale,
    card: 'bg-violet-50/55',
    border: 'border-violet-200/70',
    iconSurface: 'bg-violet-100',
    iconColor: 'text-violet-700',
    text: 'text-violet-900',
    progress: 'bg-violet-600',
  },
  'dream-wedding': {
    icon: Church,
    card: 'bg-fuchsia-50/45',
    border: 'border-fuchsia-200/60',
    iconSurface: 'bg-fuchsia-100',
    iconColor: 'text-fuchsia-700',
    text: 'text-fuchsia-900',
    progress: 'bg-fuchsia-600',
  },
  travel: {
    icon: Plane,
    card: 'bg-sky-50/55',
    border: 'border-sky-200/70',
    iconSurface: 'bg-sky-100',
    iconColor: 'text-sky-700',
    text: 'text-sky-900',
    progress: 'bg-sky-600',
  },
  boundaries: {
    icon: ShieldCheck,
    card: 'bg-teal-50/55',
    border: 'border-teal-200/70',
    iconSurface: 'bg-teal-100',
    iconColor: 'text-teal-700',
    text: 'text-teal-900',
    progress: 'bg-teal-600',
  },
  trust: {
    icon: Handshake,
    card: 'bg-blue-50/50',
    border: 'border-blue-200/70',
    iconSurface: 'bg-blue-100',
    iconColor: 'text-blue-700',
    text: 'text-blue-900',
    progress: 'bg-blue-600',
  },
  'kids-future': {
    icon: Baby,
    card: 'bg-orange-50/50',
    border: 'border-orange-200/70',
    iconSurface: 'bg-orange-100',
    iconColor: 'text-orange-700',
    text: 'text-orange-900',
    progress: 'bg-orange-600',
  },
  finance: {
    icon: CircleDollarSign,
    card: 'bg-emerald-50/50',
    border: 'border-emerald-200/70',
    iconSurface: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    text: 'text-emerald-900',
    progress: 'bg-emerald-600',
  },
  family: {
    icon: Users,
    card: 'bg-purple-50/45',
    border: 'border-purple-200/60',
    iconSurface: 'bg-purple-100',
    iconColor: 'text-purple-700',
    text: 'text-purple-900',
    progress: 'bg-purple-600',
  },
  bible: {
    icon: BookOpen,
    card: 'bg-indigo-50/50',
    border: 'border-indigo-200/70',
    iconSurface: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
    text: 'text-indigo-900',
    progress: 'bg-indigo-600',
  },
};

export const getQACategoryVisual = (categoryId: string) =>
  QA_CATEGORY_VISUALS[categoryId] ?? QA_CATEGORY_VISUALS.all;
