/**
 * Custom hook and utilities for the analytics dashboard.
 *
 * Separates data-fetching, chart data windowing/aggregation, and
 * health-score display logic from the Dashboard component's rendering.
 */

import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../api';
import { METRICS } from '../constants';

/**
 * Fetches analytics for a given cat and manages loading/error state.
 * Resets pagination offsets when the cat changes.
 *
 * @param {number|null} catId
 * @returns {{ analytics, loading, error }}
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
        if (result.ok) {
          setAnalytics(result.data);
        } else {
          setError(result.error);
        }
      })
      .finally(() => setLoading(false));
  }, [catId]);

  return { analytics, loading, error };
}

// ── Chart data windowing ──

const DAILY_WINDOW = 14;
const WEEKLY_WINDOW = 8;

/**
 * Slices a data array into a paginated window.
 * offset=0 means the most recent window; higher offset goes further back.
 *
 * @param {object[]} data
 * @param {number} windowSize
 * @param {number} offset
 * @returns {{ data: object[], canPrev: boolean, canNext: boolean }}
 */
function windowSlice(data, windowSize, offset) {
  const start = Math.max(0, data.length - windowSize - offset * windowSize);
  const end = Math.min(data.length, start + windowSize);
  return {
    data: data.slice(start, end),
    canPrev: start > 0,
    canNext: offset > 0,
  };
}

/**
 * Aggregates daily trend points into weekly buckets by averaging metrics.
 * @param {object[]} trends
 * @returns {object[]}
 */
function aggregateWeekly(trends) {
  const weeks = [];
  for (let i = 0; i < trends.length; i += 7) {
    const chunk = trends.slice(i, i + 7);
    const point = { date: `Wk ${chunk[0].date.slice(5)}` };
    for (const m of METRICS) {
      point[m] = chunk.reduce((s, d) => s + d[m], 0) / chunk.length;
      point[`${m}_avg`] = chunk.reduce((s, d) => s + d[`${m}_avg`], 0) / chunk.length;
    }
    point.symptoms = chunk.reduce((s, d) => s + d.symptoms, 0);
    weeks.push(point);
  }
  return weeks;
}

/**
 * Aggregates daily trend points into monthly buckets by averaging metrics.
 * @param {object[]} trends
 * @returns {object[]}
 */
function aggregateMonthly(trends) {
  const months = {};
  for (const t of trends) {
    const key = t.date.slice(0, 7);
    (months[key] ??= []).push(t);
  }
  return Object.entries(months).map(([key, chunk]) => {
    const point = { date: key };
    for (const m of METRICS) {
      point[m] = chunk.reduce((s, d) => s + d[m], 0) / chunk.length;
      point[`${m}_avg`] = chunk.reduce((s, d) => s + d[`${m}_avg`], 0) / chunk.length;
    }
    point.symptoms = chunk.reduce((s, d) => s + d.symptoms, 0);
    return point;
  });
}

/**
 * Computes the visible window of trend chart data based on view mode and offset.
 *
 * @param {object|null} analytics - Full analytics payload
 * @param {'daily'|'weekly'|'monthly'} view
 * @param {number} offset - Page offset (0 = most recent)
 * @returns {{ data: object[], canPrev: boolean, canNext: boolean }}
 */
export function useTrendData(analytics, view, offset) {
  return useMemo(() => {
    if (!analytics?.trends) return { data: [], canPrev: false, canNext: false };
    const { trends } = analytics;

    if (view === 'daily') {
      return windowSlice(trends, DAILY_WINDOW, offset);
    } else if (view === 'weekly') {
      return windowSlice(aggregateWeekly(trends), WEEKLY_WINDOW, offset);
    } else {
      // Monthly — no pagination, show all months
      return { data: aggregateMonthly(trends), canPrev: false, canNext: false };
    }
  }, [analytics, view, offset]);
}

/**
 * Computes the visible window of bar chart data with pagination.
 *
 * @param {object|null} analytics
 * @param {number} offset
 * @returns {{ data: object[], canPrev: boolean, canNext: boolean }}
 */
export function useBarData(analytics, offset) {
  return useMemo(() => {
    if (!analytics?.trends) return { data: [], canPrev: false, canNext: false };
    return windowSlice(analytics.trends, DAILY_WINDOW, offset);
  }, [analytics, offset]);
}

// ── Health score display helpers ──

/**
 * Maps a 0–100 health score to a display label and CSS class.
 * @param {number} score
 * @returns {{ label: string, class: string }}
 */
export function getHealthLabel(score) {
  if (score >= 85) return { label: 'Excellent', class: 'health-excellent' };
  if (score >= 70) return { label: 'Good', class: 'health-good' };
  if (score >= 50) return { label: 'Fair', class: 'health-fair' };
  if (score >= 30) return { label: 'Concerning', class: 'health-concerning' };
  return { label: 'Needs Attention', class: 'health-poor' };
}

/**
 * Maps a 0–100 health score to a color for the ring visualization.
 * @param {number} score
 * @returns {string} Hex color
 */
export function getHealthColor(score) {
  if (score >= 85) return '#7BB08E';
  if (score >= 70) return '#A8C896';
  if (score >= 50) return '#E8C96A';
  if (score >= 30) return '#E8915A';
  return '#E07A7A';
}
