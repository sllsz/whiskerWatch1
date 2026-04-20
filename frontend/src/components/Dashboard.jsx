import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Area, AreaChart,
} from 'recharts';
import { useCats } from '../context/CatContext';
import { METRICS, METRIC_COLORS } from '../constants';
import {
  useAnalyticsData, useTrendData, useBarData, getHealthLabel, getHealthColor,
} from '../hooks/useAnalytics';
import {
  ChartIcon, BellIcon, RulerIcon, NoteIcon, CalendarIcon, FireIcon, AlertIcon,
  StethoscopeIcon, SparkleIcon, BowlIcon, RunningIcon, LitterBoxIcon,
  HeartIcon, DropletIcon, ChevronLeftIcon, ChevronRightIcon,
} from './Icons';

/** Formats tooltip values to 2 decimal places */
const formatTooltipValue = (value) => typeof value === 'number' ? value.toFixed(2) : value;

const METRIC_ICONS = {
  appetite: BowlIcon,
  activity: RunningIcon,
  litter_box: LitterBoxIcon,
  mood: HeartIcon,
  water_intake: DropletIcon,
};

export default function Dashboard() {
  const { selectedCat, selectedCatId } = useCats();
  const { analytics, loading, error } = useAnalyticsData(selectedCatId);
  const [activeMetrics, setActiveMetrics] = useState(['appetite', 'activity', 'mood']);
  const [trendView, setTrendView] = useState('daily');
  const [trendOffset, setTrendOffset] = useState(0);
  const [barView, setBarView] = useState('daily');
  const [barOffset, setBarOffset] = useState(0);

  const trendData = useTrendData(analytics, trendView, trendOffset);
  const barData = useTrendData(analytics, barView, barOffset);

  if (!selectedCat) {
    return <div className="empty-state">Please add a cat first from the "My Cats" page.</div>;
  }

  if (loading) return <div className="loading">Loading analytics...</div>;

  if (error) {
    return <div className="status-message error">{error}</div>;
  }

  if (!analytics || analytics.trends.length === 0) {
    return (
      <div className="empty-state">
        <CatFaceEmpty />
        <h2>Welcome! Start tracking {selectedCat.name}'s health</h2>
        <p>Add your first daily log to see analytics and trends here.</p>
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
      <h2><ChartIcon size={22} /> {selectedCat.name}'s Dashboard</h2>

      {/* Top Row: Health Score + Quick Stats */}
      <div className="dashboard-top-row">
        <div className={`health-score-card ${health.class}`}>
          <div className="health-ring" style={{ '--score': healthScore, '--color': healthColor }}>
            <svg viewBox="0 0 120 120" className="health-ring-svg">
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
            Computed from the last 7 days of metrics, symptoms, and week-over-week trends
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <NoteIcon size={20} color="var(--primary)" />
            <div className="stat-value">{stats.totalLogs}</div>
            <div className="stat-label">Total Logs</div>
          </div>
          <div className="stat-card">
            <CalendarIcon size={20} color="var(--primary)" />
            <div className="stat-value">{stats.daysCovered}</div>
            <div className="stat-label">Days Tracked</div>
          </div>
          <div className="stat-card">
            <FireIcon size={20} color="var(--primary)" />
            <div className="stat-value">{stats.streakDays}</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card">
            <AlertIcon size={20} color="var(--primary)" />
            <div className="stat-value">{stats.totalSymptoms}</div>
            <div className="stat-label">Total Symptoms</div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="warnings-panel">
          <h3><BellIcon size={18} /> Alerts</h3>
          {highWarnings.map((w, i) => (
            <div key={`h${i}`} className="warning high">
              <span className="warning-icon">!</span>
              {w.message}
            </div>
          ))}
          {medWarnings.map((w, i) => (
            <div key={`m${i}`} className="warning medium">
              <span className="warning-icon">~</span>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {warnings.length === 0 && (
        <div className="no-warnings-panel">
          <SparkleIcon size={18} /> No alerts — {selectedCat.name} is doing well!
        </div>
      )}

      {/* Baseline vs Recent */}
      <div className="comparison-section">
        <h3><RulerIcon size={18} /> {selectedCat.name}'s Personal Baseline vs. Last 7 Days</h3>
        <p className="section-subtitle">
          The baseline adapts as you log more data — it represents {selectedCat.name}'s unique "normal" based on {stats.totalLogs} logs over {stats.daysCovered} days.
        </p>
        <div className="comparison-grid">
          {METRICS.map(m => {
            const Icon = METRIC_ICONS[m];
            const diff = recentAvg[m] - baseline[m];
            const isDown = diff < -0.3;
            const isUp = diff > 0.3;
            return (
              <div key={m} className={`comparison-card ${isDown ? 'declining' : isUp ? 'improving' : ''}`}>
                <div className="comp-icon"><Icon size={20} color={METRIC_COLORS[m]} /></div>
                <div className="comp-label">{m.replace(/_/g, ' ')}</div>
                <div className="comp-values">
                  <span className="comp-baseline" title="Baseline">{baseline[m].toFixed(1)}</span>
                  <span className="comp-arrow">{isDown ? '↓' : isUp ? '↑' : '→'}</span>
                  <span className="comp-recent" title="Recent">{recentAvg[m].toFixed(1)}</span>
                </div>
                <div className="comp-diff">{diff > 0 ? '+' : ''}{diff.toFixed(1)}</div>
                <div className="comp-range">usual: {Math.max(1, baseline[m] - baselineStdDev[m]).toFixed(1)}–{Math.min(5, baseline[m] + baselineStdDev[m]).toFixed(1)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric Toggle */}
      <div className="metric-toggles">
        {METRICS.map(m => {
          const Icon = METRIC_ICONS[m];
          return (
            <button
              key={m}
              className={`metric-toggle ${activeMetrics.includes(m) ? 'active' : ''}`}
              style={activeMetrics.includes(m) ? { backgroundColor: METRIC_COLORS[m], borderColor: METRIC_COLORS[m] } : {}}
              onClick={() => toggleMetric(m)}
            >
              <Icon size={14} color={activeMetrics.includes(m) ? 'white' : METRIC_COLORS[m]} /> {m.replace(/_/g, ' ')}
            </button>
          );
        })}
      </div>

      {/* Trend Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3><ChartIcon size={18} /> Behavior Trends (7-Day Rolling Average)</h3>
          <div className="chart-controls">
            <div className="view-toggle">
              {['daily', 'weekly', 'monthly'].map(v => (
                <button key={v} className={`view-btn ${trendView === v ? 'active' : ''}`}
                  onClick={() => { setTrendView(v); setTrendOffset(0); }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <div className="nav-arrows">
              <button className="arrow-btn" disabled={!trendData.canPrev}
                onClick={() => setTrendOffset(o => o + 1)}>
                <ChevronLeftIcon size={16} />
              </button>
              <button className="arrow-btn" disabled={!trendData.canNext}
                onClick={() => setTrendOffset(o => o - 1)}>
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="section-subtitle">Each point averages the past 7 days to smooth out day-to-day variation.</p>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B7262' }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#8B7262' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0DDD0', fontFamily: 'Nunito' }}
              formatter={formatTooltipValue} />
            <Legend />
            {activeMetrics.map(m => (
              <Line key={m} type="monotone"
                dataKey={`${m}_avg`}
                name={m.replace(/_/g, ' ') + ' (avg)'}
                stroke={METRIC_COLORS[m]} strokeWidth={2.5} dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Scores */}
      <div className="chart-section">
        <div className="chart-header">
          <h3><ChartIcon size={18} /> Scores</h3>
          <div className="chart-controls">
            <div className="view-toggle">
              {['daily', 'weekly', 'monthly'].map(v => (
                <button key={v} className={`view-btn ${barView === v ? 'active' : ''}`}
                  onClick={() => { setBarView(v); setBarOffset(0); }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <div className="nav-arrows">
              <button className="arrow-btn" disabled={!barData.canPrev}
                onClick={() => setBarOffset(o => o + 1)}>
                <ChevronLeftIcon size={16} />
              </button>
              <button className="arrow-btn" disabled={!barData.canNext}
                onClick={() => setBarOffset(o => o - 1)}>
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData.data} barSize={16} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B7262' }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#8B7262' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0DDD0', fontFamily: 'Nunito' }}
              formatter={formatTooltipValue} />
            <Legend />
            {activeMetrics.map(m => (
              <Bar key={m} dataKey={m} name={m.replace(/_/g, ' ')}
                fill={METRIC_COLORS[m]} opacity={0.85} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Symptom Frequency */}
      <div className="chart-section">
        <h3><StethoscopeIcon size={18} /> Symptom Frequency</h3>
        <p className="section-subtitle">Number of symptoms recorded per day over the last 30 days.</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trends.slice(-30)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0DDD0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8B7262' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8B7262' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F0DDD0', fontFamily: 'Nunito' }}
              formatter={formatTooltipValue} />
            <Area type="monotone" dataKey="symptoms" name="Symptoms"
              stroke="#E07A7A" fill="#FDE8E8" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
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
