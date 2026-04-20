/**
 * Analytics engine for WhiskerWatch.
 *
 * Pure functions that compute baselines, trends, health scores, and warnings
 * from an array of daily log rows. No database or HTTP awareness — the route
 * handler fetches logs and passes them in.
 */

import { METRICS, SYMPTOMS, formatMetric, countSymptoms } from './constants.js';

// ── Thresholds ──
// These are domain-specific tuning values chosen through manual testing
// with realistic cat behavior data. Adjust if users report too many or
// too few warnings.

/** A >15% drop from baseline triggers a decline warning. */
const BASELINE_DECLINE_PCT = -15;
/** A >30% drop escalates to high severity. */
const BASELINE_DECLINE_HIGH_PCT = -30;
/** 3+ consecutive declining days triggers a trend warning. */
const CONSECUTIVE_DECLINE_DAYS = 3;
/** 5+ consecutive declining days escalates to high severity. */
const CONSECUTIVE_DECLINE_HIGH_DAYS = 5;
/** A week-over-week drop of >0.8 points (on 1–5 scale) triggers a warning. */
const WEEK_DECLINE_THRESHOLD = -0.8;
/** A week-over-week drop of >1.5 points escalates to high severity. */
const WEEK_DECLINE_HIGH_THRESHOLD = -1.5;
/** 3+ symptoms in the past week triggers a symptom warning. */
const SYMPTOM_FREQ_THRESHOLD = 3;
/** 5+ symptoms in the past week escalates to high severity. */
const SYMPTOM_FREQ_HIGH_THRESHOLD = 5;
/** Minimum prior-week log count before week-over-week comparison is meaningful. */
const MIN_PRIOR_WEEK_LOGS = 5;

// ── Rolling window size ──
// 7 days smooths out day-to-day noise while still responding to real changes
// within a week. This matches the "past week" framing shown in the UI.
const ROLLING_WINDOW = 7;

/**
 * Computes the full analytics payload for a single cat.
 *
 * NOTE: This fetches ALL logs for the cat into memory. For cats with several
 * years of daily data (1000+ rows) this could become slow. If that becomes a
 * concern, the trend computation could be limited to the most recent N days,
 * while baseline/stats could use aggregate SQL queries instead.
 *
 * @param {object[]} logs - Daily log rows sorted by date ASC. Must not be empty.
 * @returns {{ trends, warnings, baseline, baselineStdDev, recentAvg, healthScore, stats }}
 */
export function computeAnalytics(logs) {
  const baseline = computeBaseline(logs);
  const baselineStdDev = computeBaselineStdDev(logs, baseline);
  const trends = computeTrends(logs);
  const recentAvg = computeRecentAverage(logs);
  const healthScore = computeHealthScore(logs, recentAvg);
  const stats = computeStats(logs);
  const warnings = generateWarnings(logs, baseline, recentAvg);

  return { trends, warnings, baseline, baselineStdDev, recentAvg, healthScore, stats };
}

/**
 * Adaptive baseline: all-time average for each metric.
 * Adjusts automatically as the cat accumulates more logs, so each cat's
 * "normal" is personalized rather than a fixed population average.
 *
 * @param {object[]} logs
 * @returns {Record<string, number>}
 */
function computeBaseline(logs) {
  const baseline = {};
  for (const m of METRICS) {
    baseline[m] = logs.reduce((sum, l) => sum + l[m], 0) / logs.length;
  }
  return baseline;
}

/**
 * Population standard deviation per metric. Used in the UI to show each
 * cat's "usual range" (baseline ± 1 SD).
 *
 * @param {object[]} logs
 * @param {Record<string, number>} baseline
 * @returns {Record<string, number>}
 */
function computeBaselineStdDev(logs, baseline) {
  const stdDev = {};
  for (const m of METRICS) {
    const variance = logs.reduce((sum, l) => sum + Math.pow(l[m] - baseline[m], 2), 0) / logs.length;
    stdDev[m] = Math.sqrt(variance);
  }
  return stdDev;
}

/**
 * Builds the trend-line dataset for charts. Each point includes:
 * - Raw daily scores for each metric
 * - A 7-day rolling average (`{metric}_avg`) that smooths noise
 * - A symptom count for that day
 *
 * @param {object[]} logs
 * @returns {object[]}
 */
function computeTrends(logs) {
  return logs.map((log, i) => {
    const windowStart = Math.max(0, i - (ROLLING_WINDOW - 1));
    const window = logs.slice(windowStart, i + 1);

    const point = { date: log.date };
    for (const m of METRICS) {
      point[m] = log[m];
      point[`${m}_avg`] = window.reduce((s, l) => s + l[m], 0) / window.length;
    }
    point.symptoms = countSymptoms(log);
    return point;
  });
}

/**
 * Average of each metric over the most recent 7 days.
 * Used as the "current state" for comparison against baseline.
 *
 * @param {object[]} logs
 * @returns {Record<string, number>}
 */
function computeRecentAverage(logs) {
  const recent = logs.slice(-ROLLING_WINDOW);
  const avg = {};
  for (const m of METRICS) {
    avg[m] = recent.reduce((s, l) => s + l[m], 0) / recent.length;
  }
  return avg;
}

/**
 * Composite health score (0–100) combining three components:
 *
 * 1. Recent metric averages (up to 80 pts)
 *    Each of the 5 metrics contributes proportionally: (score/5) × 16.
 *    A cat scoring 5/5 on everything gets the full 80.
 *
 * 2. Recent symptom penalty (up to −15 pts)
 *    Each symptom occurrence in the past week costs 4 points, capped at 15.
 *
 * 3. Trend bonus/penalty (±15 pts)
 *    Compares this week's average to the prior week's. Improving trends
 *    add points; declining trends subtract. Requires ≥5 prior-week logs
 *    to avoid noisy comparisons with sparse data.
 *
 * @param {object[]} logs
 * @param {Record<string, number>} recentAvg
 * @returns {number} Integer 0–100
 */
function computeHealthScore(logs, recentAvg) {
  let score = 0;

  // Component 1: recent averages → up to 80 points
  for (const m of METRICS) {
    score += (recentAvg[m] / 5) * 16;
  }

  // Component 2: recent symptom penalty → up to −15 points
  const recent = logs.slice(-ROLLING_WINDOW);
  const recentSymptomCount = recent.reduce((s, l) => s + countSymptoms(l), 0);
  score -= Math.min(15, recentSymptomCount * 4);

  // Component 3: week-over-week trend → ±15 points
  const prior = logs.slice(-ROLLING_WINDOW * 2, -ROLLING_WINDOW);
  if (prior.length >= MIN_PRIOR_WEEK_LOGS) {
    let trendScore = 0;
    for (const m of METRICS) {
      const priorAvg = prior.reduce((s, l) => s + l[m], 0) / prior.length;
      trendScore += (recentAvg[m] - priorAvg) * 1.5;
    }
    score += Math.max(-15, Math.min(15, trendScore));
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Summary statistics for the dashboard header.
 *
 * @param {object[]} logs
 * @returns {{ totalLogs: number, totalSymptoms: number, daysCovered: number, streakDays: number }}
 */
function computeStats(logs) {
  const totalLogs = logs.length;
  const totalSymptoms = logs.reduce((s, l) => s + countSymptoms(l), 0);

  const firstDate = new Date(logs[0].date);
  const lastDate = new Date(logs[logs.length - 1].date);
  const daysCovered = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;

  // Streak: count consecutive days ending at today
  const today = new Date();
  let streakDays = 0;
  for (let i = logs.length - 1; i >= 0; i--) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - streakDays);
    if (logs[i].date === expected.toISOString().split('T')[0]) {
      streakDays++;
    } else {
      break;
    }
  }

  return { totalLogs, totalSymptoms, daysCovered, streakDays };
}

/**
 * Rule-based warning engine. Evaluates multiple heuristics against
 * the cat's log history and produces an array of warnings with
 * type, metric, severity ("high"|"medium"), and a human-readable message.
 *
 * Warning types:
 * - `decline`      — Recent average dropped >15% below all-time baseline
 * - `trend`        — 3+ consecutive days of declining scores
 * - `week_decline` — This week's average dropped >0.8 pts from last week
 * - `symptoms`     — 3+ symptom occurrences in the past week
 * - `low_score`    — Most recent log scored ≤2 on a metric
 *
 * @param {object[]} logs
 * @param {Record<string, number>} baseline
 * @param {Record<string, number>} recentAvg
 * @returns {Array<{ type: string, metric: string, severity: string, message: string }>}
 */
function generateWarnings(logs, baseline, recentAvg) {
  const warnings = [];
  const recent = logs.slice(-ROLLING_WINDOW);
  const prior = logs.slice(-ROLLING_WINDOW * 2, -ROLLING_WINDOW);

  for (const m of METRICS) {
    // Baseline decline: recent week average vs. all-time average
    const diff = recentAvg[m] - baseline[m];
    const pctChange = baseline[m] > 0 ? (diff / baseline[m]) * 100 : 0;

    if (pctChange < BASELINE_DECLINE_PCT) {
      warnings.push({
        type: 'decline',
        metric: m,
        severity: pctChange < BASELINE_DECLINE_HIGH_PCT ? 'high' : 'medium',
        message: `${formatMetric(m)} has dropped ${Math.abs(pctChange).toFixed(0)}% below baseline over the past week.`,
      });
    }

    // Consecutive decline: count days where score < previous day's score
    if (recent.length >= CONSECUTIVE_DECLINE_DAYS) {
      let consecutiveDecline = 0;
      for (let i = recent.length - 1; i > 0; i--) {
        if (recent[i][m] < recent[i - 1][m]) consecutiveDecline++;
        else break;
      }
      if (consecutiveDecline >= CONSECUTIVE_DECLINE_DAYS) {
        warnings.push({
          type: 'trend',
          metric: m,
          severity: consecutiveDecline >= CONSECUTIVE_DECLINE_HIGH_DAYS ? 'high' : 'medium',
          message: `${formatMetric(m)} has been declining for ${consecutiveDecline} consecutive days.`,
        });
      }
    }

    // Week-over-week: compare this week's avg to last week's avg
    if (prior.length >= MIN_PRIOR_WEEK_LOGS) {
      const priorAvg = prior.reduce((s, l) => s + l[m], 0) / prior.length;
      const weekDiff = recentAvg[m] - priorAvg;
      if (weekDiff < WEEK_DECLINE_THRESHOLD) {
        warnings.push({
          type: 'week_decline',
          metric: m,
          severity: weekDiff < WEEK_DECLINE_HIGH_THRESHOLD ? 'high' : 'medium',
          message: `${formatMetric(m)} dropped significantly compared to the previous week.`,
        });
      }
    }
  }

  // Symptom frequency in the past week
  const recentSymptoms = recent.reduce((s, l) => s + countSymptoms(l), 0);
  if (recentSymptoms >= SYMPTOM_FREQ_THRESHOLD) {
    warnings.push({
      type: 'symptoms',
      metric: 'symptoms',
      severity: recentSymptoms >= SYMPTOM_FREQ_HIGH_THRESHOLD ? 'high' : 'medium',
      message: `${recentSymptoms} symptoms recorded in the past week. Consider a vet visit.`,
    });
  }

  // Most recent log: flag any metric scored ≤2
  const lastLog = logs[logs.length - 1];
  for (const m of METRICS) {
    if (lastLog[m] <= 2) {
      warnings.push({
        type: 'low_score',
        metric: m,
        severity: lastLog[m] === 1 ? 'high' : 'medium',
        message: `${formatMetric(m)} scored very low (${lastLog[m]}/5) in the most recent log.`,
      });
    }
  }

  return warnings;
}
