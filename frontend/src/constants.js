/**
 * Shared constants for the WhiskerWatch frontend.
 * Keeps metric/symptom lists, chart colors, and display labels
 * in one place to prevent drift across components.
 */

/** Behavioral metrics tracked on a 1–5 scale in each daily log. */
export const METRICS = ['appetite', 'activity', 'litter_box', 'mood', 'water_intake'];

/** Boolean symptom flags recorded in each daily log. */
export const SYMPTOMS = ['vomiting', 'sneezing', 'lethargy', 'diarrhea'];

/**
 * Chart colors per metric. Chosen to be visually distinct from each other:
 * warm orange, cool teal, blue-purple, pink, green.
 */
export const METRIC_COLORS = {
  appetite: '#E8915A',
  activity: '#4EA8A6',
  litter_box: '#7A8FD4',
  mood: '#D46A9F',
  water_intake: '#5BAD7A',
};

/** Human-readable labels for each score level (1–5) per metric. */
export const METRIC_LABELS = {
  appetite: ['Not eating', 'Very low', 'Below normal', 'Normal', 'Excellent'],
  activity: ['Inactive', 'Very low', 'Below normal', 'Normal', 'Very active'],
  litter_box: ['Very abnormal', 'Abnormal', 'Slightly off', 'Normal', 'Perfect'],
  mood: ['Distressed', 'Withdrawn', 'Quiet', 'Content', 'Playful'],
  water_intake: ['Not drinking', 'Very low', 'Below normal', 'Normal', 'Above normal'],
};
