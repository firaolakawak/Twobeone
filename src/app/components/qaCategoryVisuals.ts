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
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-primary-100',
    iconColor: 'text-primary-700',
    text: 'text-foreground',
    progress: 'bg-primary-600',
  },
  'daily-life': {
    icon: Sun,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-amber-100',
    iconColor: 'text-amber-700',
    text: 'text-foreground',
    progress: 'bg-amber-600',
  },
  intimacy: {
    icon: Heart,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-rose-100',
    iconColor: 'text-rose-700',
    text: 'text-foreground',
    progress: 'bg-rose-600',
  },
  'love-balance': {
    icon: Scale,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-violet-100',
    iconColor: 'text-violet-700',
    text: 'text-foreground',
    progress: 'bg-violet-600',
  },
  'dream-wedding': {
    icon: Church,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-fuchsia-100',
    iconColor: 'text-fuchsia-700',
    text: 'text-foreground',
    progress: 'bg-fuchsia-600',
  },
  travel: {
    icon: Plane,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-sky-100',
    iconColor: 'text-sky-700',
    text: 'text-foreground',
    progress: 'bg-sky-600',
  },
  boundaries: {
    icon: ShieldCheck,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-teal-100',
    iconColor: 'text-teal-700',
    text: 'text-foreground',
    progress: 'bg-teal-600',
  },
  trust: {
    icon: Handshake,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-blue-100',
    iconColor: 'text-blue-700',
    text: 'text-foreground',
    progress: 'bg-blue-600',
  },
  'kids-future': {
    icon: Baby,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-orange-100',
    iconColor: 'text-orange-700',
    text: 'text-foreground',
    progress: 'bg-orange-600',
  },
  finance: {
    icon: CircleDollarSign,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    text: 'text-foreground',
    progress: 'bg-emerald-600',
  },
  family: {
    icon: Users,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-purple-100',
    iconColor: 'text-purple-700',
    text: 'text-foreground',
    progress: 'bg-purple-600',
  },
  bible: {
    icon: BookOpen,
    card: 'tbo-glass',
    border: 'border-[var(--glass-border)]',
    iconSurface: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
    text: 'text-foreground',
    progress: 'bg-indigo-600',
  },
};

export const getQACategoryVisual = (categoryId: string) =>
  QA_CATEGORY_VISUALS[categoryId] ?? QA_CATEGORY_VISUALS.all;
