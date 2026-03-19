import type { ActivitySummary } from '@/lib/api/types';
import { formatDistance, formatMinutes, formatNumber } from './format';

/**
 * Metric keys for activity summary cards
 */
export type ActivityMetricKey =
  | 'steps'
  | 'calories'
  | 'activeTime'
  | 'heartRate'
  | 'distance'
  | 'floors'
  | 'sedentary';

/**
 * Chart colors for each activity metric
 */
export const ACTIVITY_METRIC_CHART_COLORS: Record<ActivityMetricKey, string> = {
  steps: '#10b981',
  calories: '#f97316',
  activeTime: '#0ea5e9',
  heartRate: '#f43f5e',
  distance: '#a855f7',
  floors: '#f59e0b',
  sedentary: '#71717a',
};

/**
 * Field definition for activity detail display
 */
interface ActivityFieldDefinition {
  key: string;
  label: string;
  getValue: (summary: ActivitySummary) => string | null;
}

/**
 * Configuration for activity detail fields
 */
const ACTIVITY_FIELD_DEFINITIONS: ActivityFieldDefinition[] = [
  {
    key: 'distance',
    label: 'Distance',
    getValue: (s) =>
      s.distance_meters !== null ? formatDistance(s.distance_meters) : null,
  },
  {
    key: 'floors',
    label: 'Floors Climbed',
    getValue: (s) =>
      s.floors_climbed !== null ? formatNumber(s.floors_climbed) : null,
  },
  {
    key: 'elevation',
    label: 'Elevation',
    getValue: (s) =>
      s.elevation_meters !== null
        ? `${Math.round(s.elevation_meters)} m`
        : null,
  },
  {
    key: 'totalCalories',
    label: 'Total Calories',
    getValue: (s) =>
      s.total_calories_kcal !== null
        ? formatNumber(s.total_calories_kcal)
        : null,
  },
  {
    key: 'sedentary',
    label: 'Sedentary Time',
    getValue: (s) =>
      s.sedentary_minutes !== null ? formatMinutes(s.sedentary_minutes) : null,
  },
  {
    key: 'maxHr',
    label: 'Max Heart Rate',
    getValue: (s) =>
      s.heart_rate !== null && s.heart_rate.max_bpm !== null
        ? `${s.heart_rate.max_bpm} bpm`
        : null,
  },
  {
    key: 'minHr',
    label: 'Min Heart Rate',
    getValue: (s) =>
      s.heart_rate !== null && s.heart_rate.min_bpm !== null
        ? `${s.heart_rate.min_bpm} bpm`
        : null,
  },
  {
    key: 'lightActivity',
    label: 'Light Activity',
    getValue: (s) =>
      s.intensity_minutes !== null && s.intensity_minutes.light !== null
        ? formatMinutes(s.intensity_minutes.light)
        : null,
  },
  {
    key: 'moderateActivity',
    label: 'Moderate Activity',
    getValue: (s) =>
      s.intensity_minutes !== null && s.intensity_minutes.moderate !== null
        ? formatMinutes(s.intensity_minutes.moderate)
        : null,
  },
  {
    key: 'vigorousActivity',
    label: 'Vigorous Activity',
    getValue: (s) =>
      s.intensity_minutes !== null && s.intensity_minutes.vigorous !== null
        ? formatMinutes(s.intensity_minutes.vigorous)
        : null,
  },
  {
    key: 'source',
    label: 'Source',
    getValue: (s) => s.source?.provider || null,
  },
];

/**
 * Get detail fields for an activity summary that have values
 */
export function getActivityDetailFields(
  summary: ActivitySummary
): { label: string; value: string }[] {
  return ACTIVITY_FIELD_DEFINITIONS.map((field) => ({
    label: field.label,
    value: field.getValue(summary),
  })).filter(
    (field): field is { label: string; value: string } => field.value !== null
  );
}
