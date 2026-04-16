import { Moon, Heart, Activity, Scale, Zap, Timer, Footprints, Dumbbell } from 'lucide-react';
import { useCalculatedHealthScores } from '@/hooks/api/use-health-scores';
import { useWorkouts, useActivitySummaries, useBodySummary } from '@/hooks/api/use-health';
import { useDateRange } from '@/hooks/use-date-range';
import { ScoreRing } from '@/components/common/score-ring';
import { MetricCardDetailed } from '@/components/user/metric-card-detailed';
import type { ScoreDetail } from '@/lib/api/ai-client';
import { format } from 'date-fns';

interface HealthScoresDashboardProps {
  userId: string;
}

const SCORE_CONFIGS = [
  { key: 'sleep_score', label: 'Sleep', icon: Moon, color: '#8B5CF6' },
  { key: 'recovery_score', label: 'Recovery', icon: Heart, color: '#EF4444' },
  { key: 'activity_score', label: 'Activity', icon: Activity, color: '#22C55E' },
  { key: 'body_score', label: 'Body', icon: Scale, color: '#3B82F6' },
] as const;

function ScoreCard({
  score,
  label,
}: {
  score: ScoreDetail | null;
  label: string;
}) {
  const value = score?.value ?? null;
  const qualifier = score?.qualifier ?? null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3">
      <ScoreRing value={value ?? 0} size={90} label={label} />
      <div className="text-center">
        <p className="text-xs font-medium text-foreground-secondary capitalize">
          {qualifier || (value !== null ? 'Calculating...' : 'No data')}
        </p>
      </div>
    </div>
  );
}

function RecentWorkoutItem({
  workout,
}: {
  workout: { type: string; start_datetime: string; duration_seconds: number };
}) {
  const type = (workout.type || 'workout').replace(/_/g, ' ');
  const duration = Math.round(workout.duration_seconds / 60);
  const dateStr = workout.start_datetime
    ? format(new Date(workout.start_datetime), 'MMM d, h:mm a')
    : '';

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground capitalize">{type}</p>
          <p className="text-xs text-foreground-muted">{dateStr}</p>
        </div>
      </div>
      <span className="text-sm font-medium text-foreground-secondary font-mono tabular-nums">
        {duration} min
      </span>
    </div>
  );
}

export function HealthScoresDashboard({ userId }: HealthScoresDashboardProps) {
  const { data: scoresData, isLoading: scoresLoading } = useCalculatedHealthScores(userId, 30);
  const { startDate, endDate } = useDateRange(7);
  const { data: workoutsData } = useWorkouts(userId, {
    start_date: startDate,
    end_date: endDate,
    limit: 5,
  });
  const { data: activityData } = useActivitySummaries(userId, {
    start_date: startDate,
    end_date: endDate,
  });
  const { data: bodyData } = useBodySummary(userId);

  const recentWorkouts = workoutsData?.data?.slice(0, 5) ?? [];

  // Compute key metrics from real data
  const activityRecords = activityData?.data ?? [];
  const avgSteps = activityRecords.length > 0
    ? Math.round(activityRecords.reduce((sum: number, a: any) => sum + (a.steps ?? 0), 0) / activityRecords.length)
    : null;
  const avgActiveMin = activityRecords.length > 0
    ? Math.round(activityRecords.reduce((sum: number, a: any) => sum + (a.active_minutes ?? 0), 0) / activityRecords.length)
    : null;
  const avgHR = activityRecords.length > 0
    ? Math.round(activityRecords.reduce((sum: number, a: any) => sum + (a.heart_rate?.avg_bpm ?? 0), 0) / activityRecords.filter((a: any) => a.heart_rate?.avg_bpm).length) || null
    : null;

  const rhr = bodyData?.averaged?.resting_heart_rate_bpm ?? null;
  const hrv = bodyData?.averaged?.avg_hrv_sdnn_ms ?? null;

  const workoutCount = recentWorkouts.length;
  const trainingLoad = workoutCount > 0 ? workoutCount : null;

  if (scoresLoading) {
    return (
      <div className="space-y-6">
        {/* Score rings skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3">
              <div className="h-[90px] w-[90px] rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        {/* Metrics skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Rings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SCORE_CONFIGS.map((config) => (
          <ScoreCard
            key={config.key}
            score={scoresData?.[config.key] ?? null}
            label={config.label}
          />
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Key Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCardDetailed
            title="Resting HR"
            value={rhr != null ? `${Math.round(rhr)}` : '--'}
            unit="bpm"
            icon={Heart}
          />
          <MetricCardDetailed
            title="HRV"
            value={hrv != null ? `${Math.round(hrv)}` : '--'}
            unit="ms"
            icon={Zap}
          />
          <MetricCardDetailed
            title="Sleep Duration"
            value={scoresData?.sleep_score?.value != null ? `${Math.round(scoresData.sleep_score.value / 12.5)}` : '--'}
            unit="h avg"
            icon={Moon}
          />
          <MetricCardDetailed
            title="Active Minutes"
            value={avgActiveMin != null ? `${avgActiveMin}` : '--'}
            unit="/day"
            icon={Timer}
          />
          <MetricCardDetailed
            title="Steps"
            value={avgSteps != null ? avgSteps.toLocaleString() : '--'}
            unit="/day"
            icon={Footprints}
          />
          <MetricCardDetailed
            title="Training Load"
            value={trainingLoad != null ? `${trainingLoad}` : '--'}
            unit="sessions/wk"
            icon={Dumbbell}
          />
          <MetricCardDetailed
            title="Recovery Score"
            value={scoresData?.recovery_score?.value != null ? scoresData.recovery_score.value.toString() : '--'}
            unit="/100"
            icon={Heart}
          />
          <MetricCardDetailed
            title="Activity Score"
            value={scoresData?.activity_score?.value != null ? scoresData.activity_score.value.toString() : '--'}
            unit="/100"
            icon={Activity}
          />
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Workouts</h3>
          <p className="text-xs text-foreground-muted mt-0.5">Last 7 days</p>
        </div>
        <div className="px-6 py-2">
          {recentWorkouts.length > 0 ? (
            recentWorkouts.map((w: any, i: number) => (
              <RecentWorkoutItem key={w.id || i} workout={w} />
            ))
          ) : (
            <p className="text-sm text-foreground-muted py-4 text-center">
              No recent workouts
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
