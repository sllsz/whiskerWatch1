/**
 * Analytics engine for WhiskerWatch.
 *
 * Pure functions that compute baselines, trends, health scores, and warnings.
 * Handles multiple logs per day by first aggregating to daily averages.
 */

import { METRICS, SYMPTOMS, formatMetric, countSymptoms } from './constants.js';

// ── Thresholds ──

const BASELINE_DECLINE_PCT = -15;
const BASELINE_DECLINE_HIGH_PCT = -30;
const CONSECUTIVE_DECLINE_DAYS = 3;
const CONSECUTIVE_DECLINE_HIGH_DAYS = 5;
const WEEK_DECLINE_THRESHOLD = -0.8;
const WEEK_DECLINE_HIGH_THRESHOLD = -1.5;
const SYMPTOM_FREQ_THRESHOLD = 3;
const SYMPTOM_FREQ_HIGH_THRESHOLD = 5;
const MIN_PRIOR_WEEK_LOGS = 5;
const ROLLING_WINDOW = 7;

/**
 * Aggregates raw log rows (which may have multiple entries per day)
 * into one data point per day by averaging metrics and summing symptoms.
 *
 * @param {object[]} logs - Raw log rows sorted by date ASC
 * @returns {object[]} One entry per day with averaged metrics
 */
function aggregateToDays(logs) {
  const byDate = {};
  for (const log of logs) {
    if (!byDate[log.date]) byDate[log.date] = [];
    byDate[log.date].push(log);
  }

  return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayLogs]) => {
    const n = dayLogs.length;
    const day = { date, logCount: n };

    for (const m of METRICS) {
      day[m] = dayLogs.reduce((s, l) => s + l[m], 0) / n;
    }

    // Symptoms: if any log that day had it, it counts
    for (const s of SYMPTOMS) {
      day[s] = dayLogs.some(l => l[s]) ? 1 : 0;
    }

    day.symptoms = SYMPTOMS.reduce((sum, s) => sum + day[s], 0);
    return day;
  });
}

/**
 * Computes the full analytics payload for a single cat.
 *
 * @param {object[]} logs - Raw log rows sorted by date ASC. Must not be empty.
 * @returns {{ trends, warnings, baseline, baselineStdDev, recentAvg, healthScore, stats }}
 */
export function computeAnalytics(logs) {
  // First: aggregate multiple-logs-per-day into daily averages
  const days = aggregateToDays(logs);

  const baseline = computeBaseline(days);
  const baselineStdDev = computeBaselineStdDev(days, baseline);
  const trends = computeTrends(days);
  const recentAvg = computeRecentAverage(days);
  const healthScore = computeHealthScore(days, recentAvg);
  const stats = computeStats(logs, days);
  const warnings = generateWarnings(days, baseline, recentAvg);

  return { trends, warnings, baseline, baselineStdDev, recentAvg, healthScore, stats };
}

function computeBaseline(days) {
  const baseline = {};
  for (const m of METRICS) {
    baseline[m] = days.reduce((sum, d) => sum + d[m], 0) / days.length;
  }
  return baseline;
}

function computeBaselineStdDev(days, baseline) {
  const stdDev = {};
  for (const m of METRICS) {
    const variance = days.reduce((sum, d) => sum + Math.pow(d[m] - baseline[m], 2), 0) / days.length;
    stdDev[m] = Math.sqrt(variance);
  }
  return stdDev;
}

/**
 * Builds trend data with rolling averages.
 * Each point has raw daily averages + 7-day smoothed values + symptom flags.
 */
function computeTrends(days) {
  return days.map((day, i) => {
    const windowStart = Math.max(0, i - (ROLLING_WINDOW - 1));
    const window = days.slice(windowStart, i + 1);

    const point = { date: day.date };
    for (const m of METRICS) {
      point[m] = Number(day[m].toFixed(2));
      point[`${m}_avg`] = Number((window.reduce((s, d) => s + d[m], 0) / window.length).toFixed(2));
    }
    point.symptoms = day.symptoms;
    for (const s of SYMPTOMS) {
      point[s] = day[s];
    }
    return point;
  });
}

function computeRecentAverage(days) {
  const recent = days.slice(-ROLLING_WINDOW);
  const avg = {};
  for (const m of METRICS) {
    avg[m] = recent.reduce((s, d) => s + d[m], 0) / recent.length;
  }
  return avg;
}

/**
 * Health score 0–100:
 * 1. Recent metric averages (up to 80 pts)
 * 2. Recent symptom penalty (up to −15 pts)
 * 3. Week-over-week trend (±15 pts)
 */
function computeHealthScore(days, recentAvg) {
  let score = 0;

  for (const m of METRICS) {
    score += (recentAvg[m] / 5) * 16;
  }

  const recent = days.slice(-ROLLING_WINDOW);
  const recentSymptomCount = recent.reduce((s, d) => s + d.symptoms, 0);
  score -= Math.min(15, recentSymptomCount * 4);

  const prior = days.slice(-ROLLING_WINDOW * 2, -ROLLING_WINDOW);
  if (prior.length >= MIN_PRIOR_WEEK_LOGS) {
    let trendScore = 0;
    for (const m of METRICS) {
      const priorAvg = prior.reduce((s, d) => s + d[m], 0) / prior.length;
      trendScore += (recentAvg[m] - priorAvg) * 1.5;
    }
    score += Math.max(-15, Math.min(15, trendScore));
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Stats use both raw logs (for total count) and daily aggregates (for days/streak).
 */
function computeStats(rawLogs, days) {
  const totalLogs = rawLogs.length;
  const totalSymptoms = days.reduce((s, d) => s + d.symptoms, 0);

  const symptomBreakdown = {};
  for (const s of SYMPTOMS) {
    const count = days.reduce((sum, d) => sum + d[s], 0);
    if (count > 0) symptomBreakdown[s] = count;
  }

  const firstDate = new Date(days[0].date);
  const lastDate = new Date(days[days.length - 1].date);
  const daysCovered = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;

  const today = new Date();
  let streakDays = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - streakDays);
    const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
    if (days[i].date === expectedStr) {
      streakDays++;
    } else {
      break;
    }
  }

  return { totalLogs, totalSymptoms, symptomBreakdown, daysCovered, daysLogged: days.length, streakDays };
}

function generateWarnings(days, baseline, recentAvg) {
  const warnings = [];
  const recent = days.slice(-ROLLING_WINDOW);
  const prior = days.slice(-ROLLING_WINDOW * 2, -ROLLING_WINDOW);

  for (const m of METRICS) {
    const diff = recentAvg[m] - baseline[m];
    const pctChange = baseline[m] > 0 ? (diff / baseline[m]) * 100 : 0;

    if (pctChange < BASELINE_DECLINE_PCT) {
      warnings.push({
        type: 'decline', metric: m,
        severity: pctChange < BASELINE_DECLINE_HIGH_PCT ? 'high' : 'medium',
        message: `${formatMetric(m)} has dropped ${Math.abs(pctChange).toFixed(0)}% below ${'\u2019'}s normal over the past week.`,
      });
    }

    if (recent.length >= CONSECUTIVE_DECLINE_DAYS) {
      let consecutiveDecline = 0;
      for (let i = recent.length - 1; i > 0; i--) {
        if (recent[i][m] < recent[i - 1][m]) consecutiveDecline++;
        else break;
      }
      if (consecutiveDecline >= CONSECUTIVE_DECLINE_DAYS) {
        warnings.push({
          type: 'trend', metric: m,
          severity: consecutiveDecline >= CONSECUTIVE_DECLINE_HIGH_DAYS ? 'high' : 'medium',
          message: `${formatMetric(m)} has been declining for ${consecutiveDecline} consecutive days.`,
        });
      }
    }

    if (prior.length >= MIN_PRIOR_WEEK_LOGS) {
      const priorAvg = prior.reduce((s, d) => s + d[m], 0) / prior.length;
      const weekDiff = recentAvg[m] - priorAvg;
      if (weekDiff < WEEK_DECLINE_THRESHOLD) {
        warnings.push({
          type: 'week_decline', metric: m,
          severity: weekDiff < WEEK_DECLINE_HIGH_THRESHOLD ? 'high' : 'medium',
          message: `${formatMetric(m)} dropped noticeably compared to the previous week.`,
        });
      }
    }
  }

  const recentSymptoms = recent.reduce((s, d) => s + d.symptoms, 0);
  if (recentSymptoms >= SYMPTOM_FREQ_THRESHOLD) {
    warnings.push({
      type: 'symptoms', metric: 'symptoms',
      severity: recentSymptoms >= SYMPTOM_FREQ_HIGH_THRESHOLD ? 'high' : 'medium',
      message: `${recentSymptoms} symptoms recorded in the past week. Consider a vet visit.`,
    });
  }

  const lastDay = days[days.length - 1];
  for (const m of METRICS) {
    if (lastDay[m] <= 2) {
      warnings.push({
        type: 'low_score', metric: m,
        severity: lastDay[m] <= 1 ? 'high' : 'medium',
        message: `${formatMetric(m)} scored very low (${lastDay[m].toFixed(1)}/5) in the most recent log.`,
      });
    }
  }

  return warnings;
}
