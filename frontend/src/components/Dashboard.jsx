import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar,
} from 'recharts';
import { useCats } from '../context/CatContext';
import { METRICS, METRIC_COLORS, SYMPTOMS, SYMPTOM_COLORS, capitalize } from '../constants';
import {
  useAnalyticsData, useTrendData, useRawLogs, getHealthLabel, getHealthColor,
} from '../hooks/useAnalytics';
import {
  ChartIcon, BellIcon, RulerIcon, NoteIcon, CalendarIcon, FireIcon,
  StethoscopeIcon, SparkleIcon, BowlIcon, RunningIcon, LitterBoxIcon,
  HeartIcon, DropletIcon, ChevronLeftIcon, ChevronRightIcon,
} from './Icons';

const formatTooltipValue = (value) => typeof value === 'number' ? value.toFixed(2) : value;

const METRIC_ICONS = {
  appetite: BowlIcon,
  activity: RunningIcon,
  litter_box: LitterBoxIcon,
  mood: HeartIcon,
  water_intake: DropletIcon,
};

const METRIC_DISPLAY = {
  appetite: 'Appetite',
  activity: 'Activity',
  litter_box: 'Litter Box',
  mood: 'Mood',
  water_intake: 'Water',
};

const VIEW_OPTIONS = ['daily', 'weekly', 'monthly', 'yearly'];

function ViewControls({ view, setView, offset, setOffset, canPrev, canNext, periodLabel }) {
  return (
    <div className="chart-controls-row">
      <div className="view-toggle">
        {VIEW_OPTIONS.map(v => (
          <button key={v} className={`view-btn ${view === v ? 'active' : ''}`}
            onClick={() => { setView(v); setOffset(0); }}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      <div className="period-nav">
        <button className="arrow-btn" disabled={!canPrev} aria-label="Earlier"
          onClick={() => setOffset(o => o + 1)}>
          <ChevronLeftIcon size={16} />
        </button>
        {periodLabel && <span className="period-label">{periodLabel}</span>}
        <button className="arrow-btn" disabled={!canNext} aria-label="Later"
          onClick={() => setOffset(o => o - 1)}>
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { selectedCat, selectedCatId } = useCats();
  const { analytics, loading, error } = useAnalyticsData(selectedCatId);
  const rawLogs = useRawLogs(selectedCatId);
  const [activeMetrics, setActiveMetrics] = useState(['appetite', 'activity', 'mood']);
  const [chartView, setChartView] = useState('weekly');
  const [chartOffset, setChartOffset] = useState(0);
  const [symptomView, setSymptomView] = useState('monthly');
  const [symptomOffset, setSymptomOffset] = useState(0);

  const chartData = useTrendData(analytics, chartView, chartOffset, rawLogs);
  const symptomChartData = useTrendData(analytics, symptomView, symptomOffset, rawLogs);

  // All useMemo hooks MUST be above early returns (React rules of hooks)
  const radarData = useMemo(() => {
    if (!analytics) return [];
    const { baseline: bl, recentAvg: ra } = analytics;
    const visibleData = chartData.data.filter(d => d[METRICS[0]] !== null);
    const radarMetrics = activeMetrics.length >= 3 ? activeMetrics
      : [...activeMetrics, ...METRICS.filter(m => !activeMetrics.includes(m))].slice(0, 3);

    return radarMetrics.map(m => {
      const currentVal = visibleData.length > 0
        ? visibleData.reduce((s, d) => s + (d[m] ?? 0), 0) / visibleData.length
        : (ra?.[m] ?? 3);
      return {
        metric: METRIC_DISPLAY[m],
        current: Number(currentVal.toFixed(2)),
        baseline: Number((bl?.[m] ?? 3).toFixed(2)),
        isActive: activeMetrics.includes(m),
      };
    });
  }, [analytics, chartData.data, activeMetrics]);

  const dailyData = useMemo(() => {
    if (chartView !== 'daily' || chartData.data.length === 0) return chartData.data;
    return chartData.data.map(d => {
      const point = { ...d };
      const valueGroups = {};
      for (const m of activeMetrics) {
        if (d[m] == null) continue;
        const key = Math.round(d[m]);
        if (!valueGroups[key]) valueGroups[key] = [];
        valueGroups[key].push(m);
      }
      for (const group of Object.values(valueGroups)) {
        if (group.length > 1) {
          group.forEach((m, i) => {
            point[`${m}_display`] = d[m] + (i - (group.length - 1) / 2) * 0.12;
          });
        }
      }
      for (const m of activeMetrics) {
        if (!point[`${m}_display`]) point[`${m}_display`] = d[m];
      }
      return point;
    });
  }, [chartView, chartData.data, activeMetrics]);

  // ── Early returns (AFTER all hooks) ──
  if (!selectedCat) return <div className="empty-state">Please add a cat first from the "My Cats" page.</div>;
  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="status-message error">{error}</div>;

  if (!analytics || analytics.trends.length === 0) {
    return (
      <div className="empty-state">
        <CatFaceEmpty />
        <h2>Welcome! Start tracking {selectedCat.name}'s health</h2>
        <p>Add your first daily log to see insights here.</p>
      </div>
    );
  }

  const { trends, warnings, baseline, baselineStdDev, recentAvg, healthScore, stats } = analytics;
  const health = getHealthLabel(healthScore);
  const healthColor = getHealthColor(healthScore);

  const toggleMetric = (m) => {
    setActiveMetrics(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const highWarnings = warnings.filter(w => w.severity === 'high');
  const medWarnings = warnings.filter(w => w.severity === 'medium');

  return (
    <div className="dashboard">
      <h2>{selectedCat.name}'s Health Overview</h2>

      {/* ── Summary Row ── */}
      <div className="dashboard-top-row">
        <div className={`health-score-card ${health.class}`}>
          <div className="health-ring">
            <svg viewBox="0 0 120 120" className="health-ring-svg" role="img"
              aria-label={`Wellness score: ${healthScore}`}>
              <circle cx="60" cy="60" r="52" stroke="#F0DDD0" strokeWidth="8" fill="none" />
              <circle cx="60" cy="60" r="52" stroke={healthColor} strokeWidth="8" fill="none"
                strokeDasharray={`${healthScore * 3.267} 326.7`}
                strokeLinecap="round" transform="rotate(-90 60 60)" />
            </svg>
            <div className="health-ring-inner">
              <div className="health-score-number">{healthScore}</div>
            </div>
          </div>
          <div className="health-score-label">Wellness Score</div>
          <div className="health-score-status" style={{ color: healthColor }}>{health.label}</div>
          <div className="health-score-breakdown">
            Based on this week's behavior, symptoms, and changes from last week
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <NoteIcon size={20} color="var(--primary)" />
            <div className="stat-value">{stats.totalLogs}</div>
            <div className="stat-label">Logs</div>
          </div>
          <div className="stat-card">
            <CalendarIcon size={20} color="var(--primary)" />
            <div className="stat-value">{stats.daysLogged ?? stats.daysCovered}</div>
            <div className="stat-label">Days</div>
          </div>
          <div className="stat-card">
            <FireIcon size={20} color="var(--primary)" />
            <div className="stat-value">{stats.streakDays}</div>
            <div className="stat-label">Streak</div>
          </div>
          <div className="stat-card">
            <StethoscopeIcon size={20} color="var(--primary)" />
            <div className="stat-value">{stats.totalSymptoms}</div>
            <div className="stat-label">Symptoms</div>
            {stats.symptomBreakdown && Object.keys(stats.symptomBreakdown).length > 0 && (
              <div className="stat-detail">
                {Object.entries(stats.symptomBreakdown).map(([s, count]) => (
                  <span key={s} className="stat-symptom-tag">{s} ({count})</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {warnings.length > 0 ? (
        <div className="warnings-panel" role="alert">
          <h3><BellIcon size={18} /> Health Alerts</h3>
          {highWarnings.map((w, i) => (
            <div key={`h${i}`} className="warning high">
              <span className="warning-icon" aria-hidden="true">!</span>
              {w.message}
            </div>
          ))}
          {medWarnings.map((w, i) => (
            <div key={`m${i}`} className="warning medium">
              <span className="warning-icon" aria-hidden="true">~</span>
              {w.message}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-warnings-panel" role="status">
          <SparkleIcon size={18} /> Everything looks good — {selectedCat.name} is doing well!
        </div>
      )}

      {/* ── Baseline Comparison ── */}
      <div className="comparison-section">
        <h3><RulerIcon size={18} /> How {selectedCat.name} Compares to Their Normal</h3>
        <p className="section-subtitle">
          Built from {stats.daysLogged ?? stats.daysCovered} days of data. Updates as you log more.
        </p>
        <div className="comparison-grid">
          {METRICS.map(m => {
            const Icon = METRIC_ICONS[m];
            const diff = recentAvg[m] - baseline[m];
            const absDiff = Math.abs(diff);
            const status = absDiff <= 0.3 ? 'stable' : diff < 0 ? 'declining' : 'improving';
            return (
              <div key={m} className={`comparison-card ${status}`}>
                <div className="comp-icon"><Icon size={22} color={METRIC_COLORS[m]} /></div>
                <div className="comp-metric-name">{METRIC_DISPLAY[m]}</div>
                <div className="comp-current">{recentAvg[m].toFixed(1)}</div>
                <div className={`comp-badge ${status}`}>
                  {status === 'stable' ? 'Normal' : status === 'improving' ? `+${absDiff.toFixed(1)} above` : `${absDiff.toFixed(1)} below`}
                </div>
                <div className="comp-range">usual {Math.max(1, baseline[m] - baselineStdDev[m]).toFixed(1)} – {Math.min(5, baseline[m] + baselineStdDev[m]).toFixed(1)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Behavior Chart ── */}
      <div className="chart-section">
        <h3><ChartIcon size={18} /> Behavior Over Time</h3>
        <ViewControls view={chartView} setView={setChartView}
          offset={chartOffset} setOffset={setChartOffset}
          canPrev={chartData.canPrev} canNext={chartData.canNext}
          periodLabel={chartData.periodLabel} />

        <div className="metric-toggles">
          {METRICS.map(m => {
            const Icon = METRIC_ICONS[m];
            return (
              <button key={m}
                className={`metric-toggle ${activeMetrics.includes(m) ? 'active' : ''}`}
                style={activeMetrics.includes(m) ? { backgroundColor: METRIC_COLORS[m], borderColor: METRIC_COLORS[m] } : {}}
                onClick={() => toggleMetric(m)} aria-pressed={activeMetrics.includes(m)}>
                <Icon size={14} color={activeMetrics.includes(m) ? 'white' : METRIC_COLORS[m]} /> {METRIC_DISPLAY[m]}
              </button>
            );
          })}
        </div>

        <div className="charts-row">
          <div className="chart-inner">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartView === 'daily' ? dailyData : chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7A6252' }} />
                <YAxis domain={[0.5, 5.5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#7A6252' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0DDD0', fontFamily: 'Nunito' }}
                  formatter={formatTooltipValue} />
                <Legend />
                {activeMetrics.map(m => (
                  <Line key={m} type={chartView === 'daily' ? 'linear' : 'monotone'}
                    dataKey={chartView === 'daily' ? `${m}_display` : `${m}_avg`}
                    name={METRIC_DISPLAY[m]}
                    stroke={METRIC_COLORS[m]} strokeWidth={chartView === 'daily' ? 0 : 2.5}
                    dot={{ r: chartView === 'daily' ? 6 : 3, strokeWidth: 2, stroke: METRIC_COLORS[m], fill: 'white' }}
                    connectNulls={false}
                    activeDot={{ r: 8, strokeWidth: 2 }}
                    isAnimationActive={true} animationDuration={500} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-inner chart-radar-wrap">
            <div className="radar-label">
              {chartData.periodLabel || 'Period'} Average
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke="#F0DDD0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#4A3728', fontWeight: 600 }} />
                <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9, fill: '#7A6252' }} axisLine={false} />
                <Radar name="Current" dataKey="current" stroke={METRIC_COLORS.appetite}
                  fill={METRIC_COLORS.appetite} fillOpacity={0.2} strokeWidth={2}
                  isAnimationActive={true} animationDuration={500} />
                <Radar name="Normal" dataKey="baseline" stroke="#8B5E50"
                  fill="#8B5E50" fillOpacity={0.06} strokeWidth={1.5} strokeDasharray="4 4" />
                <Legend />
                <Tooltip formatter={formatTooltipValue} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Symptom History ── */}
      <div className="chart-section">
        <h3><StethoscopeIcon size={18} /> Symptom History</h3>
        <ViewControls view={symptomView} setView={setSymptomView}
          offset={symptomOffset} setOffset={setSymptomOffset}
          canPrev={symptomChartData.canPrev} canNext={symptomChartData.canNext}
          periodLabel={symptomChartData.periodLabel} />

        {(() => {
          const periodHasSymptoms = symptomChartData.data.some(d => (d.symptoms || 0) > 0);
          if (!periodHasSymptoms) {
            return (
              <div className="no-symptoms-banner">
                <SparkleIcon size={20} color="var(--success)" />
                <span>No symptoms recorded in this period</span>
              </div>
            );
          }
          return (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={symptomChartData.data} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD0" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#7A6252' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7A6252' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0DDD0', fontFamily: 'Nunito' }} />
                <Legend />
                {SYMPTOMS.map((s, i) => (
                  <Bar key={s} dataKey={s} name={capitalize(s)}
                    stackId="symptoms" fill={SYMPTOM_COLORS[s]}
                    radius={i === SYMPTOMS.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        })()}
      </div>
    </div>
  );
}

function CatFaceEmpty() {
  return (
    <svg width="80" height="80" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}>
      <path d="M12 18L18 4L26 18" fill="#F4C79E" />
      <path d="M38 18L46 4L52 18" fill="#F4C79E" />
      <ellipse cx="32" cy="36" rx="20" ry="18" fill="#F4C79E" />
      <circle cx="24" cy="34" r="3" fill="white" />
      <circle cx="24" cy="34" r="1.8" fill="#333" />
      <circle cx="40" cy="34" r="3" fill="white" />
      <circle cx="40" cy="34" r="1.8" fill="#333" />
      <path d="M32 39L30 41H34L32 39Z" fill="#E8A090" />
      <path d="M30 41.5Q32 43.5 34 41.5" stroke="#E8A090" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
