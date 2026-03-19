import type {
  SleepSession,
  SleepStagesSummary,
} from '@/lib/api/types';
import { formatMinutes } from './format';

/**
 * Sleep stage type keys
 */
export type SleepStageKey = 'deep' | 'rem' | 'light' | 'awake';

/**
 * Color classes for sleep stages (Tailwind)
 */
export const SLEEP_STAGE_COLORS: Record<SleepStageKey, string> = {
  deep: 'bg-indigo-500',
  rem: 'bg-purple-500',
  light: 'bg-sky-400',
  awake: 'bg-zinc-500',
};

/**
 * Display labels for sleep stages
 */
export const SLEEP_STAGE_LABELS: Record<SleepStageKey, string> = {
  deep: 'Deep',
  rem: 'REM',
  light: 'Light',
  awake: 'Awake',
};

/**
 * Chart colors for sleep metrics (hex)
 */
export const SLEEP_METRIC_CHART_COLORS = {
  efficiency: '#10b981',
  duration: '#6366f1',
} as const;

/**
 * Sleep stage data for visualization
 */
export interface SleepStageData {
  key: SleepStageKey;
  minutes: number;
  pct: number;
  color: string;
  label: string;
}

/**
 * Transform sleep stages into display data
 */
export function getSleepStageData(
  stages: SleepStagesSummary | null | undefined
): SleepStageData[] {
  if (!stages) return [];

  const total =
    (stages.deep_minutes || 0) +
    (stages.rem_minutes || 0) +
    (stages.light_minutes || 0) +
    (stages.awake_minutes || 0);

  if (total === 0) return [];

  return [
    {
      key: 'deep',
      minutes: stages.deep_minutes || 0,
      pct: ((stages.deep_minutes || 0) / total) * 100,
      color: SLEEP_STAGE_COLORS.deep,
      label: SLEEP_STAGE_LABELS.deep,
    },
    {
      key: 'rem',
      minutes: stages.rem_minutes || 0,
      pct: ((stages.rem_minutes || 0) / total) * 100,
      color: SLEEP_STAGE_COLORS.rem,
      label: SLEEP_STAGE_LABELS.rem,
    },
    {
      key: 'light',
      minutes: stages.light_minutes || 0,
      pct: ((stages.light_minutes || 0) / total) * 100,
      color: SLEEP_STAGE_COLORS.light,
      label: SLEEP_STAGE_LABELS.light,
    },
    {
      key: 'awake',
      minutes: stages.awake_minutes || 0,
      pct: ((stages.awake_minutes || 0) / total) * 100,
      color: SLEEP_STAGE_COLORS.awake,
      label: SLEEP_STAGE_LABELS.awake,
    },
  ];
}

/**
 * Field definition for sleep session detail display
 */
interface SleepFieldDefinition {
  key: string;
  label: string;
  getValue: (session: SleepSession) => string | null;
}

/**
 * Configuration for sleep session detail fields
 */
const SLEEP_FIELD_DEFINITIONS: SleepFieldDefinition[] = [
  {
    key: 'deepSleep',
    label: 'Deep Sleep',
    getValue: (s) =>
      s.stages && s.stages.deep_minutes !== null
        ? formatMinutes(s.stages.deep_minutes)
        : null,
  },
  {
    key: 'remSleep',
    label: 'REM Sleep',
    getValue: (s) =>
      s.stages && s.stages.rem_minutes !== null
        ? formatMinutes(s.stages.rem_minutes)
        : null,
  },
  {
    key: 'lightSleep',
    label: 'Light Sleep',
    getValue: (s) =>
      s.stages && s.stages.light_minutes !== null
        ? formatMinutes(s.stages.light_minutes)
        : null,
  },
  {
    key: 'awake',
    label: 'Time Awake',
    getValue: (s) =>
      s.stages && s.stages.awake_minutes !== null
        ? formatMinutes(s.stages.awake_minutes)
        : null,
  },
  {
    key: 'source',
    label: 'Source',
    getValue: (s) => s.source?.provider || null,
  },
];

/**
 * Get detail fields for a sleep session that have values
 */
export function getSleepSessionDetailFields(
  session: SleepSession
): { label: string; value: string }[] {
  return SLEEP_FIELD_DEFINITIONS.map((field) => ({
    label: field.label,
    value: field.getValue(session),
  })).filter(
    (field): field is { label: string; value: string } => field.value !== null
  );
}
