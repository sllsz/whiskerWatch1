import express from 'express';
import cors from 'cors';
import db from './database.js';
import { computeAnalytics } from './analytics.js';
import { validateIntParam, validateCatBody, validateLogBody } from './validation.js';

const app = express();
app.use(cors());
app.use(express.json());

// ── Request logging ──

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ── Cat CRUD ──

app.get('/api/cats', (req, res) => {
  const cats = db.prepare('SELECT * FROM cats ORDER BY name').all();
  res.json(cats);
});

app.post('/api/cats', (req, res) => {
  const result = validateCatBody(req.body);
  if (!result.valid) return res.status(400).json({ error: result.error });

  const { name, breed, birth_date, weight } = result.data;
  const insert = db.prepare(
    'INSERT INTO cats (name, breed, birth_date, weight) VALUES (?, ?, ?, ?)'
  ).run(name, breed, birth_date, weight);
  const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(insert.lastInsertRowid);
  res.status(201).json(cat);
});

app.put('/api/cats/:id', (req, res) => {
  const paramCheck = validateIntParam(req.params.id, 'id');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  const existing = db.prepare('SELECT id FROM cats WHERE id = ?').get(paramCheck.value);
  if (!existing) return res.status(404).json({ error: 'Cat not found' });

  const result = validateCatBody(req.body);
  if (!result.valid) return res.status(400).json({ error: result.error });

  const { name, breed, birth_date, weight } = result.data;
  db.prepare(
    'UPDATE cats SET name = ?, breed = ?, birth_date = ?, weight = ? WHERE id = ?'
  ).run(name, breed, birth_date, weight, paramCheck.value);
  const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(paramCheck.value);
  res.json(cat);
});

app.delete('/api/cats/:id', (req, res) => {
  const paramCheck = validateIntParam(req.params.id, 'id');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  const existing = db.prepare('SELECT id FROM cats WHERE id = ?').get(paramCheck.value);
  if (!existing) return res.status(404).json({ error: 'Cat not found' });

  db.prepare('DELETE FROM cats WHERE id = ?').run(paramCheck.value);
  res.status(204).end();
});

// ── Daily Logs ──

app.get('/api/cats/:catId/logs', (req, res) => {
  const paramCheck = validateIntParam(req.params.catId, 'catId');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  const { start, end, limit } = req.query;
  let query = 'SELECT * FROM daily_logs WHERE cat_id = ?';
  const params = [paramCheck.value];

  if (start) { query += ' AND date >= ?'; params.push(start); }
  if (end) { query += ' AND date <= ?'; params.push(end); }
  query += ' ORDER BY date DESC';
  if (limit) { query += ' LIMIT ?'; params.push(Number(limit)); }

  const logs = db.prepare(query).all(...params);

  // Attach custom symptoms to each log
  const getCustom = db.prepare(`
    SELECT cs.id, cs.name FROM log_custom_symptoms lcs
    JOIN custom_symptoms cs ON cs.id = lcs.symptom_id
    WHERE lcs.log_id = ?
  `);
  for (const log of logs) {
    log.customSymptoms = getCustom.all(log.id);
  }

  res.json(logs);
});

app.post('/api/cats/:catId/logs', (req, res) => {
  const paramCheck = validateIntParam(req.params.catId, 'catId');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  const result = validateLogBody(req.body);
  if (!result.valid) return res.status(400).json({ error: result.error });

  const { date, appetite, activity, litter_box, mood, water_intake, vomiting, sneezing, lethargy, diarrhea, notes } = result.data;
  const time = req.body.time || new Date().toTimeString().slice(0, 5);

  const insert = db.prepare(`
    INSERT INTO daily_logs (cat_id, date, time, appetite, activity, litter_box, mood, water_intake, vomiting, sneezing, lethargy, diarrhea, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(paramCheck.value, date, time, appetite, activity, litter_box, mood, water_intake, vomiting, sneezing, lethargy, diarrhea, notes);
  const log = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(insert.lastInsertRowid);
  res.status(201).json(log);
});

app.put('/api/cats/:catId/logs/:logId', (req, res) => {
  const paramCheck = validateIntParam(req.params.catId, 'catId');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });
  const logIdCheck = validateIntParam(req.params.logId, 'logId');
  if (!logIdCheck.valid) return res.status(400).json({ error: logIdCheck.error });

  const existing = db.prepare('SELECT * FROM daily_logs WHERE id = ? AND cat_id = ?').get(logIdCheck.value, paramCheck.value);
  if (!existing) return res.status(404).json({ error: 'Log not found' });

  const result = validateLogBody({ ...req.body, date: existing.date });
  if (!result.valid) return res.status(400).json({ error: result.error });

  const { appetite, activity, litter_box, mood, water_intake, vomiting, sneezing, lethargy, diarrhea, notes } = result.data;
  db.prepare(`
    UPDATE daily_logs SET appetite=?, activity=?, litter_box=?, mood=?, water_intake=?, vomiting=?, sneezing=?, lethargy=?, diarrhea=?, notes=?
    WHERE id=?
  `).run(appetite, activity, litter_box, mood, water_intake, vomiting, sneezing, lethargy, diarrhea, notes, logIdCheck.value);
  const log = db.prepare('SELECT * FROM daily_logs WHERE id = ?').get(logIdCheck.value);
  res.json(log);
});

app.delete('/api/cats/:catId/logs/:logId', (req, res) => {
  const paramCheck = validateIntParam(req.params.catId, 'catId');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });
  const logIdCheck = validateIntParam(req.params.logId, 'logId');
  if (!logIdCheck.valid) return res.status(400).json({ error: logIdCheck.error });

  db.prepare('DELETE FROM daily_logs WHERE id = ? AND cat_id = ?').run(logIdCheck.value, paramCheck.value);
  res.status(204).end();
});

// ── Avatar ──

app.put('/api/cats/:id/avatar', (req, res) => {
  const paramCheck = validateIntParam(req.params.id, 'id');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  const existing = db.prepare('SELECT id FROM cats WHERE id = ?').get(paramCheck.value);
  if (!existing) return res.status(404).json({ error: 'Cat not found' });

  const { color, ear, eye, pattern } = req.body;
  db.prepare(
    'UPDATE cats SET avatar_color = ?, avatar_ear = ?, avatar_eye = ?, avatar_pattern = ? WHERE id = ?'
  ).run(color || '', ear || '', eye || '', pattern || '', paramCheck.value);
  const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(paramCheck.value);
  res.json(cat);
});

// ── Custom Symptoms ──

app.get('/api/custom-symptoms', (req, res) => {
  const symptoms = db.prepare('SELECT * FROM custom_symptoms ORDER BY name').all();
  res.json(symptoms);
});

app.post('/api/custom-symptoms', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Symptom name is required' });
  }
  const trimmed = name.trim().slice(0, 50);

  const count = db.prepare('SELECT COUNT(*) as c FROM custom_symptoms').get().c;
  if (count >= 10) {
    return res.status(400).json({ error: 'Maximum of 10 custom symptoms allowed' });
  }

  try {
    const result = db.prepare('INSERT INTO custom_symptoms (name) VALUES (?)').run(trimmed);
    const symptom = db.prepare('SELECT * FROM custom_symptoms WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(symptom);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A symptom with this name already exists' });
    }
    throw err;
  }
});

app.delete('/api/custom-symptoms/:id', (req, res) => {
  const paramCheck = validateIntParam(req.params.id, 'id');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  db.prepare('DELETE FROM custom_symptoms WHERE id = ?').run(paramCheck.value);
  res.status(204).end();
});

// ── Custom Symptom Logging ──
// Attach custom symptoms to a log entry after it's created

app.get('/api/cats/:catId/logs/:date/custom-symptoms', (req, res) => {
  const paramCheck = validateIntParam(req.params.catId, 'catId');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  const log = db.prepare('SELECT id FROM daily_logs WHERE cat_id = ? AND date = ?').get(paramCheck.value, req.params.date);
  if (!log) return res.json([]);

  const symptoms = db.prepare(`
    SELECT cs.id, cs.name FROM log_custom_symptoms lcs
    JOIN custom_symptoms cs ON cs.id = lcs.symptom_id
    WHERE lcs.log_id = ?
  `).all(log.id);
  res.json(symptoms);
});

app.put('/api/cats/:catId/logs/:date/custom-symptoms', (req, res) => {
  const paramCheck = validateIntParam(req.params.catId, 'catId');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  const log = db.prepare('SELECT id FROM daily_logs WHERE cat_id = ? AND date = ?').get(paramCheck.value, req.params.date);
  if (!log) return res.status(404).json({ error: 'Log not found for this date' });

  const { symptomIds } = req.body;
  if (!Array.isArray(symptomIds)) {
    return res.status(400).json({ error: 'symptomIds must be an array' });
  }

  const updateCustomSymptoms = db.transaction(() => {
    db.prepare('DELETE FROM log_custom_symptoms WHERE log_id = ?').run(log.id);
    const insert = db.prepare('INSERT INTO log_custom_symptoms (log_id, symptom_id) VALUES (?, ?)');
    for (const sid of symptomIds) {
      insert.run(log.id, sid);
    }
  });
  updateCustomSymptoms();

  const symptoms = db.prepare(`
    SELECT cs.id, cs.name FROM log_custom_symptoms lcs
    JOIN custom_symptoms cs ON cs.id = lcs.symptom_id
    WHERE lcs.log_id = ?
  `).all(log.id);
  res.json(symptoms);
});

// ── Analytics ──

/** Empty analytics response shape, returned when a cat has no logs. */
const EMPTY_ANALYTICS = {
  trends: [], warnings: [], baseline: null, baselineStdDev: null,
  recentAvg: null, healthScore: null, stats: null,
};

app.get('/api/cats/:catId/analytics', (req, res) => {
  const paramCheck = validateIntParam(req.params.catId, 'catId');
  if (!paramCheck.valid) return res.status(400).json({ error: paramCheck.error });

  const logs = db.prepare(
    'SELECT * FROM daily_logs WHERE cat_id = ? ORDER BY date ASC'
  ).all(paramCheck.value);

  if (logs.length === 0) {
    return res.json(EMPTY_ANALYTICS);
  }

  res.json(computeAnalytics(logs));
});

// ── Global error handler ──
// Catches unhandled errors in route handlers and returns a structured
// JSON error instead of leaking stack traces to the client.

app.use((err, req, res, _next) => {
  console.error(`${new Date().toISOString()} ERROR ${req.method} ${req.originalUrl}`, err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`${new Date().toISOString()} WhiskerWatch API running on http://localhost:${PORT}`);
});
