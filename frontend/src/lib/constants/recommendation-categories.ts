import {
  AlertTriangle,
  MessageCircle,
  Trophy,
  TrendingDown,
  Radio,
} from 'lucide-react';
import type { RecommendationCategory } from '@/lib/api/ai-client';

export const categoryConfig: Record<
  RecommendationCategory,
  {
    icon: typeof AlertTriangle;
    borderClass: string;
    bgClass: string;
    badgeClass: string;
    label: string;
  }
> = {
  alert: {
    icon: AlertTriangle,
    borderClass: 'border-l-destructive',
    bgClass: 'bg-destructive/5',
    badgeClass: 'bg-destructive/10 text-destructive',
    label: 'Alert',
  },
  praise: {
    icon: Trophy,
    borderClass: 'border-l-success',
    bgClass: 'bg-success/5',
    badgeClass: 'bg-success/10 text-success',
    label: 'Praise',
  },
  nudge: {
    icon: TrendingDown,
    borderClass: 'border-l-warning',
    bgClass: 'bg-warning/5',
    badgeClass: 'bg-warning/10 text-warning',
    label: 'Nudge',
  },
  check_in: {
    icon: MessageCircle,
    borderClass: 'border-l-primary',
    bgClass: 'bg-primary/5',
    badgeClass: 'bg-primary/10 text-primary',
    label: 'Check-in',
  },
  sync: {
    icon: Radio,
    borderClass: 'border-l-foreground-muted',
    bgClass: 'bg-muted/30',
    badgeClass: 'bg-muted text-foreground-muted',
    label: 'Sync',
  },
};

export const categoryDot: Record<RecommendationCategory, string> = {
  alert: 'bg-destructive',
  nudge: 'bg-warning',
  check_in: 'bg-primary',
  praise: 'bg-success',
  sync: 'bg-foreground-muted',
};
