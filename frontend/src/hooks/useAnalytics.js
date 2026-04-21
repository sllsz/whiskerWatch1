/**
 * Dashboard data hooks and display utilities.
 */

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../api';
import { METRICS } from '../constants';

/**
 * Fetches analytics for a given cat.
 */
export function useAnalyticsData(catId) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!catId) return;
    setLoading(true);
    setError(null);
    apiFetch(`/cats/${catId}/analytics`)
      .then(result => {
        if (result.ok) setAnalytics(result.data);
        else setError(result.error);
      })
      .finally(() => setLoading(false));
  }, [catId]);

  return { analytics, loading, error };
}

// ── Helpers ──

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function averagePoints(points, label) {
  if (points.length === 0) return null;
  const avg = { date: label };
  for (const m of METRICS) {
    avg[m] = Number((points.reduce((s, p) => s + p[m], 0) / points.length).toFixed(2));
    avg[`${m}_avg`] = Number((points.reduce((s, p) => s + (p[`${m}_avg`] ?? p[m]), 0) / points.length).toFixed(2));
  }
  avg.symptoms = points.reduce((s, p) => s + (p.symptoms || 0), 0);
  // Carry individual symptom counts for the stacked bar chart
  const SYMPTOM_KEYS = ['vomiting', 'sneezing', 'lethargy', 'diarrhea'];
  for (const s of SYMPTOM_KEYS) {
    avg[s] = points.reduce((sum, p) => sum + (p[s] || 0), 0);
  }
  return avg;
}

/**
 * Fetches raw individual log entries for a cat (needed for Daily view
 * which shows individual log times within a single day).
 */
export function useRawLogs(catId) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!catId) return;
    apiFetch(`/cats/${catId}/logs`).then(r => {
      if (r.ok) setLogs(r.data);
    });
  }, [catId]);

  return logs;
}

// ── Navigable periods ──

/**
 * Gets all unique dates from trends data.
 */
function getUniqueDates(trends) {
  return [...new Set(trends.map(t => t.date))].sort();
}

/**
 * Gets all unique weeks (by Monday start date) from trends.
 */
function getUniqueWeeks(trends) {
  const weeks = new Set();
  for (const t of trends) {
    const d = new Date(t.date + 'T00:00:00');
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    weeks.add(monday.toISOString().slice(0, 10));
  }
  return [...weeks].sort();
}

/**
 * Gets all unique year-month keys from trends.
 */
function getUniqueMonths(trends) {
  const months = new Set();
  for (const t of trends) months.add(t.date.slice(0, 7));
  return [...months].sort();
}

/**
 * Gets all unique years from trends.
 */
function getUniqueYears(trends) {
  const years = new Set();
  for (const t of trends) years.add(t.date.slice(0, 4));
  return [...years].sort();
}

/**
 * Computes chart data for each view mode.
 *
 * - Daily: X = log times within one day. Arrows switch days.
 * - Weekly: X = Mon–Sun. Arrows switch weeks.
 * - Monthly: X = Week 1–4. Arrows switch months.
 * - Yearly: X = Jan–Dec. Arrows switch years.
 *
 * Missing data points produce null values (gaps in the line).
 */
export function useTrendData(analytics, view, offset, rawLogs) {
  return useMemo(() => {
    if (!analytics?.trends?.length) return { data: [], canPrev: false, canNext: false, periodLabel: '' };
    const { trends } = analytics;

    if (view === 'daily') {
      return computeDaily(trends, rawLogs || [], offset);
    } else if (view === 'weekly') {
      return computeWeekly(trends, offset);
    } else if (view === 'monthly') {
      return computeMonthly(trends, offset);
    } else {
      return computeYearly(trends, offset);
    }
  }, [analytics, view, offset, rawLogs]);
}

/**
 * Daily: shows individual log entries for a single day.
 * X-axis = time of day. Arrows navigate between days.
 */
function computeDaily(trends, rawLogs, offset) {
  const dates = getUniqueDates(trends);
  if (dates.length === 0) return { data: [], canPrev: false, canNext: false, periodLabel: '' };

  const idx = Math.max(0, dates.length - 1 - offset);
  const selectedDate = dates[idx];

  // Get raw logs for this day (they have time info)
  const dayLogs = rawLogs
    .filter(l => l.date === selectedDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // If we have raw logs with times, show each entry
  const data = dayLogs.length > 0
    ? dayLogs.map(l => {
        const point = { date: l.time || 'Log' };
        for (const m of METRICS) {
          point[m] = l[m];
          point[`${m}_avg`] = l[m]; // No rolling avg for individual entries
        }
        point.symptoms = (l.vomiting || 0) + (l.sneezing || 0) + (l.lethargy || 0) + (l.diarrhea || 0);
        return point;
      })
    : // Fallback: just show the aggregated daily point
      trends.filter(t => t.date === selectedDate);

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const label = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return {
    data,
    canPrev: idx > 0,
    canNext: offset > 0,
    periodLabel: label,
  };
}

/**
 * Weekly: X = Mon, Tue, Wed, Thu, Fri, Sat, Sun.
 * Each point is the average of all logs on that day.
 * Arrows navigate between weeks.
 */
function computeWeekly(trends, offset) {
  const weeks = getUniqueWeeks(trends);
  if (weeks.length === 0) return { data: [], canPrev: false, canNext: false, periodLabel: '' };

  const idx = Math.max(0, weeks.length - 1 - offset);
  const weekStart = weeks[idx];
  const weekStartDate = new Date(weekStart + 'T00:00:00');

  // Build Mon–Sun slots
  const data = [];
  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + d);
    const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;

    const dayTrend = trends.find(t => t.date === dateStr);
    if (dayTrend) {
      data.push({ ...dayTrend, date: DAY_NAMES[(dayDate.getDay())] });
    } else {
      // Missing day — insert null point for gap
      const point = { date: DAY_NAMES[dayDate.getDay()] };
      for (const m of METRICS) {
        point[m] = null;
        point[`${m}_avg`] = null;
      }
      point.symptoms = 0;
      point.vomiting = 0;
      point.sneezing = 0;
      point.lethargy = 0;
      point.diarrhea = 0;
      data.push(point);
    }
  }

  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekStartDate.getDate() + 6);
  const label = `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return {
    data,
    canPrev: idx > 0,
    canNext: offset > 0,
    periodLabel: label,
  };
}

/**
 * Monthly: X = Week 1, Week 2, Week 3, Week 4 (up to 5).
 * Each point averages all days within that calendar week of the month.
 * Arrows navigate between months.
 */
function computeMonthly(trends, offset) {
  const months = getUniqueMonths(trends);
  if (months.length === 0) return { data: [], canPrev: false, canNext: false, periodLabel: '' };

  const idx = Math.max(0, months.length - 1 - offset);
  const selectedMonth = months[idx]; // e.g., "2026-04"
  const [year, month] = selectedMonth.split('-').map(Number);

  // Get all trend points in this month
  const monthTrends = trends.filter(t => t.date.startsWith(selectedMonth));

  // Group by week of month (1-based, week starts Monday)
  const weekBuckets = {};
  for (const t of monthTrends) {
    const dayOfMonth = parseInt(t.date.slice(8));
    const weekNum = Math.ceil(dayOfMonth / 7);
    if (!weekBuckets[weekNum]) weekBuckets[weekNum] = [];
    weekBuckets[weekNum].push(t);
  }

  // How many weeks does this month span?
  const daysInMonth = new Date(year, month, 0).getDate();
  const totalWeeks = Math.ceil(daysInMonth / 7);

  const data = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const bucket = weekBuckets[w];
    if (bucket && bucket.length > 0) {
      data.push(averagePoints(bucket, `Week ${w}`));
    } else {
      const point = { date: `Week ${w}` };
      for (const m of METRICS) { point[m] = null; point[`${m}_avg`] = null; }
      point.symptoms = 0; point.vomiting = 0; point.sneezing = 0; point.lethargy = 0; point.diarrhea = 0;
      data.push(point);
    }
  }

  const label = `${MONTH_NAMES[month - 1]} ${year}`;

  return {
    data: data.filter(Boolean),
    canPrev: idx > 0,
    canNext: offset > 0,
    periodLabel: label,
  };
}

/**
 * Yearly: X = Jan, Feb, ..., Dec.
 * Each point averages all days within that month.
 * Arrows navigate between years.
 */
function computeYearly(trends, offset) {
  const years = getUniqueYears(trends);
  if (years.length === 0) return { data: [], canPrev: false, canNext: false, periodLabel: '' };

  const idx = Math.max(0, years.length - 1 - offset);
  const selectedYear = years[idx];

  // Get trend points for this year
  const yearTrends = trends.filter(t => t.date.startsWith(selectedYear));

  // Group by month
  const monthBuckets = {};
  for (const t of yearTrends) {
    const m = parseInt(t.date.slice(5, 7));
    if (!monthBuckets[m]) monthBuckets[m] = [];
    monthBuckets[m].push(t);
  }

  const data = [];
  for (let m = 1; m <= 12; m++) {
    const bucket = monthBuckets[m];
    if (bucket && bucket.length > 0) {
      data.push(averagePoints(bucket, MONTH_NAMES[m - 1]));
    } else {
      const point = { date: MONTH_NAMES[m - 1] };
      for (const m2 of METRICS) { point[m2] = null; point[`${m2}_avg`] = null; }
      point.symptoms = 0; point.vomiting = 0; point.sneezing = 0; point.lethargy = 0; point.diarrhea = 0;
      data.push(point);
    }
  }

  return {
    data,
    canPrev: idx > 0,
    canNext: offset > 0,
    periodLabel: selectedYear,
  };
}

// ── Health score display ──

export function getHealthLabel(score) {
  if (score >= 85) return { label: 'Excellent', class: 'health-excellent' };
  if (score >= 70) return { label: 'Good', class: 'health-good' };
  if (score >= 50) return { label: 'Fair', class: 'health-fair' };
  if (score >= 30) return { label: 'Concerning', class: 'health-concerning' };
  return { label: 'Needs Attention', class: 'health-poor' };
}

export function getHealthColor(score) {
  if (score >= 85) return '#7BB08E';
  if (score >= 70) return '#A8C896';
  if (score >= 50) return '#E8C96A';
  if (score >= 30) return '#B5612A';
  return '#C0504D';
}
