import { useState, useEffect, useMemo } from 'react';
import { useCats } from '../context/CatContext';
import { apiFetch } from '../api';
import { METRICS, SYMPTOMS } from '../constants';
import { DownloadIcon, FilterIcon, XIcon } from './Icons';

const ITEMS_PER_PAGE = 10;

export default function History() {
  const { selectedCat, selectedCatId } = useCats();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    start: '',
    end: '',
    metrics: [], // empty = show all
    scoreRange: 'all', // all, low (1-2), normal (3), good (4-5)
    symptomsOnly: false,
  });

  const fetchLogs = async () => {
    if (!selectedCatId) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.start) params.set('start', filters.start);
    if (filters.end) params.set('end', filters.end);

    const result = await apiFetch(`/cats/${selectedCatId}/logs?${params}`);
    if (result.ok) {
      setLogs(result.data);
      setPage(1);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [selectedCatId, filters.start, filters.end]);

  const handleDelete = async (date) => {
    if (!window.confirm('Delete this log entry?')) return;
    await apiFetch(`/cats/${selectedCatId}/logs/${date}`, { method: 'DELETE' });
    fetchLogs();
  };

  const exportCSV = () => {
    if (filteredLogs.length === 0) return;
    const allMetrics = METRICS;
    const symptoms = SYMPTOMS;
    const headers = ['date', ...allMetrics, ...symptoms, 'notes'];
    const rows = filteredLogs.map(log =>
      headers.map(h => {
        const val = log[h];
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return val ?? '';
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCat.name}_logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allMetrics = METRICS;
  const symptoms = SYMPTOMS;

  // Apply client-side filters
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (filters.symptomsOnly) {
      result = result.filter(log => symptoms.some(s => log[s]));
    }

    if (filters.scoreRange !== 'all') {
      result = result.filter(log => {
        const avg = allMetrics.reduce((s, m) => s + log[m], 0) / allMetrics.length;
        if (filters.scoreRange === 'low') return avg < 2.5;
        if (filters.scoreRange === 'normal') return avg >= 2.5 && avg < 3.5;
        if (filters.scoreRange === 'good') return avg >= 3.5;
        return true;
      });
    }

    return result;
  }, [logs, filters.symptomsOnly, filters.scoreRange]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeFilterCount = [
    filters.start, filters.end,
    filters.scoreRange !== 'all',
    filters.symptomsOnly,
    filters.metrics.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({ start: '', end: '', metrics: [], scoreRange: 'all', symptomsOnly: false });
  };

  const toggleMetricFilter = (m) => {
    setFilters(prev => ({
      ...prev,
      metrics: prev.metrics.includes(m)
        ? prev.metrics.filter(x => x !== m)
        : [...prev.metrics, m],
    }));
  };

  const displayMetrics = filters.metrics.length > 0 ? filters.metrics : allMetrics;

  if (!selectedCat) {
    return <div className="empty-state">Please add a cat first from the "My Cats" page.</div>;
  }

  const getScoreClass = (val) => {
    if (val <= 2) return 'score-low';
    if (val >= 4) return 'score-high';
    return 'score-mid';
  };

  return (
    <div className="history">
      <div className="history-header">
        <h2>{selectedCat.name}'s Log History</h2>
        <div className="history-actions">
          <button
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon size={16} />
            Filters
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          {filteredLogs.length > 0 && (
            <button className="btn-export" onClick={exportCSV}>
              <DownloadIcon size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-panel-header">
            <h3>Filters</h3>
            {activeFilterCount > 0 && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <XIcon size={14} /> Clear all
              </button>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <div className="filter-row">
              <input type="date" value={filters.start} placeholder="From"
                onChange={e => setFilters({ ...filters, start: e.target.value })} />
              <span className="filter-separator">to</span>
              <input type="date" value={filters.end} placeholder="To"
                onChange={e => setFilters({ ...filters, end: e.target.value })} />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Show Metrics</label>
            <div className="filter-chips">
              {allMetrics.map(m => (
                <button key={m}
                  className={`filter-chip ${filters.metrics.length === 0 || filters.metrics.includes(m) ? 'active' : ''}`}
                  onClick={() => toggleMetricFilter(m)}>
                  {m.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Overall Score</label>
            <div className="filter-chips">
              {[
                { value: 'all', label: 'All' },
                { value: 'low', label: 'Low (1-2)' },
                { value: 'normal', label: 'Normal (3)' },
                { value: 'good', label: 'Good (4-5)' },
              ].map(opt => (
                <button key={opt.value}
                  className={`filter-chip ${filters.scoreRange === opt.value ? 'active' : ''}`}
                  onClick={() => setFilters({ ...filters, scoreRange: opt.value })}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-checkbox">
              <input type="checkbox" checked={filters.symptomsOnly}
                onChange={e => setFilters({ ...filters, symptomsOnly: e.target.checked })} />
              <span>Only show days with symptoms</span>
            </label>
          </div>
        </div>
      )}

      {/* Active filter tags */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="active-filters">
          {filters.start && <span className="active-tag">From: {filters.start} <button onClick={() => setFilters({...filters, start: ''})}><XIcon size={12} /></button></span>}
          {filters.end && <span className="active-tag">To: {filters.end} <button onClick={() => setFilters({...filters, end: ''})}><XIcon size={12} /></button></span>}
          {filters.scoreRange !== 'all' && <span className="active-tag">Score: {filters.scoreRange} <button onClick={() => setFilters({...filters, scoreRange: 'all'})}><XIcon size={12} /></button></span>}
          {filters.symptomsOnly && <span className="active-tag">Symptoms only <button onClick={() => setFilters({...filters, symptomsOnly: false})}><XIcon size={12} /></button></span>}
        </div>
      )}

      {loading && <div className="loading">Loading logs...</div>}

      {error && <div className="status-message error">{error}</div>}

      {!loading && filteredLogs.length === 0 && (
        <div className="empty-state">
          {logs.length === 0
            ? 'No logs found. Start logging from the "Log" page!'
            : 'No logs match your filters. Try adjusting your criteria.'}
        </div>
      )}

      <div className="log-list">
        {paginatedLogs.map(log => (
          <div key={log.id} className="log-card">
            <div className="log-date">
              <strong>{new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              <button className="btn-small btn-danger" onClick={() => handleDelete(log.date)}>Delete</button>
            </div>

            <div className="log-metrics">
              {displayMetrics.map(m => (
                <div key={m} className="log-metric">
                  <span className="metric-label">{m.replace(/_/g, ' ')}</span>
                  <span className={`metric-score ${getScoreClass(log[m])}`}>
                    {log[m]}/5
                  </span>
                </div>
              ))}
            </div>

            <div className="log-symptoms">
              {symptoms.filter(s => log[s]).map(s => (
                <span key={s} className="symptom-badge">{s}</span>
              ))}
              {symptoms.every(s => !log[s]) && <span className="no-symptoms">No symptoms</span>}
            </div>

            {log.notes && <div className="log-notes">{log.notes}</div>}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 1}
            onClick={() => setPage(p => p - 1)}>
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p}
                className={`page-num ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}>
                {p}
              </button>
            ))}
          </div>
          <button className="page-btn" disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      )}

      {filteredLogs.length > 0 && (
        <div className="history-summary">
          Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
