/**
 * Shared constants for the WhiskerWatch backend.
 * Duplicating these across modules is a common source of drift —
 * all metric/symptom references should import from here.
 */

/** Behavioral metrics tracked on a 1–5 scale in each daily log. */
export const METRICS = ['appetite', 'activity', 'litter_box', 'mood', 'water_intake'];

/** Boolean symptom flags recorded in each daily log. */
export const SYMPTOMS = ['vomiting', 'sneezing', 'lethargy', 'diarrhea'];

/**
 * Converts a snake_case metric key to a display-friendly title.
 * e.g. "litter_box" → "Litter Box"
 * @param {string} metric
 * @returns {string}
 */
export function formatMetric(metric) {
  return metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Sums all symptom flags for a single log entry.
 * @param {object} log - A daily_logs row
 * @returns {number} Count of active symptoms (0–4)
 */
export function countSymptoms(log) {
  return SYMPTOMS.reduce((sum, s) => sum + (log[s] || 0), 0);
}
