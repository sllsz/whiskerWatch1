import db from './database.js';

db.exec('DELETE FROM log_custom_symptoms');
db.exec('DELETE FROM daily_logs');
db.exec('DELETE FROM cats');

// ── Cats ──

const cats = [
  { name: 'Mochi', breed: 'Scottish Fold', birth_date: '2022-04-15', weight: 9.2 },
  { name: 'Luna', breed: 'Siamese', birth_date: '2020-08-22', weight: 7.8 },
  { name: 'Biscuit', breed: 'Orange Tabby', birth_date: '2023-06-10', weight: 11.5 },
  { name: 'Pebble', breed: 'Domestic Shorthair', birth_date: '2016-02-03', weight: 6.1 },
];

const insertCat = db.prepare(
  'INSERT INTO cats (name, breed, birth_date, weight) VALUES (?, ?, ?, ?)'
);
const catIds = cats.map(c => insertCat.run(c.name, c.breed, c.birth_date, c.weight).lastInsertRowid);

// ── Helpers ──

function clamp(val) { return Math.max(1, Math.min(5, Math.round(val))); }
function rand(min, max) { return min + Math.random() * (max - min); }
function localDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Seasonal modifier: cats tend to eat more in winter, be more active in spring/summer
function seasonalMod(month) {
  // Returns { appetite, activity } offsets (-0.5 to +0.5)
  if (month >= 11 || month <= 1) return { appetite: 0.3, activity: -0.3 }; // winter
  if (month >= 2 && month <= 4) return { appetite: 0, activity: 0.2 };     // spring
  if (month >= 5 && month <= 7) return { appetite: -0.2, activity: 0.4 };  // summer
  return { appetite: 0.1, activity: 0 };                                    // fall
}

const insertLog = db.prepare(`
  INSERT INTO daily_logs (cat_id, date, time, appetite, activity, litter_box, mood, water_intake,
    vomiting, sneezing, lethargy, diarrhea, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// ── Generate logs ──
// Fixed date range: 2025-03-01 to 2026-04-10 (~406 days)

const START_DATE = new Date(2025, 2, 1); // March 1, 2025
const END_DATE = new Date();             // Today
const TOTAL_DAYS = Math.ceil((END_DATE - START_DATE) / (1000 * 60 * 60 * 24));

const insertAll = db.transaction(() => {
  for (let catIdx = 0; catIdx < cats.length; catIdx++) {
    const catId = catIds[catIdx];
    const catName = cats[catIdx].name;

    for (let dayIdx = 0; dayIdx < TOTAL_DAYS; dayIdx++) {
      const date = new Date(START_DATE);
      date.setDate(START_DATE.getDate() + dayIdx);
      const dateStr = localDateStr(date);
      const month = date.getMonth();
      const daysAgo = TOTAL_DAYS - 1 - dayIdx; // for compatibility with existing logic
      const season = seasonalMod(month);

      // Most days 2-3 logs, occasionally 1 (for variety)
      let logsToday;
      if (catName === 'Luna' && Math.random() < 0.12) {
        logsToday = 1; // Luna's owner sometimes only logs once
      } else if (catName === 'Pebble' && daysAgo > 200 && Math.random() < 0.15) {
        logsToday = 1; // Pebble's owner was less diligent early on
      } else {
        logsToday = Math.random() < 0.6 ? 2 : 3;
      }
      const times = logsToday === 1 ? ['09:00']
        : logsToday === 2 ? ['08:00', '20:00']
        : ['07:30', '13:00', '21:00'];

      for (let logIdx = 0; logIdx < logsToday; logIdx++) {
        let appetite, activity, litter_box, mood, water_intake;
        let vomiting = 0, sneezing = 0, lethargy = 0, diarrhea = 0;
        let notes = '';

        if (catName === 'Mochi') {
          // ── Mochi: Healthy veteran with one brief illness 3 months ago ──
          const illnessCenter = 90; // ~3 months ago
          const distFromIllness = Math.abs(daysAgo - illnessCenter);

          if (distFromIllness <= 4) {
            // Upper respiratory illness: 1 week
            const severity = 1 - (distFromIllness / 5);
            appetite = clamp(rand(2, 3.5) - severity);
            activity = clamp(rand(2, 3) - severity);
            litter_box = clamp(rand(3, 4));
            mood = clamp(rand(2, 3.5) - severity * 0.5);
            water_intake = clamp(rand(2.5, 4));
            sneezing = Math.random() < 0.7 ? 1 : 0;
            lethargy = Math.random() < 0.5 ? 1 : 0;
            if (distFromIllness <= 2) notes = 'Sneezing frequently, less interested in food';
          } else {
            // Healthy baseline with seasonal variation
            appetite = clamp(rand(3.8, 5) + season.appetite);
            activity = clamp(rand(3.5, 5) + season.activity);
            litter_box = clamp(rand(4, 5));
            mood = clamp(rand(3.8, 5));
            water_intake = clamp(rand(3.5, 5));
          }

          // Skip some days occasionally to vary the streak (1% chance)
          if (daysAgo > 30 && daysAgo < 300 && Math.random() < 0.01) continue;

        } else if (catName === 'Luna') {
          // ── Luna: Sensitive, stress-reactive, spring allergies ──
          // Stress episodes: ~every 2-3 months lasting ~5 days
          const stressPhases = [300, 220, 140, 50];
          const inStress = stressPhases.some(p => Math.abs(daysAgo - p) <= 3);

          // Spring allergies (March-May)
          const isSpring = month >= 2 && month <= 4;

          if (inStress) {
            appetite = clamp(rand(2, 3.5));
            activity = clamp(rand(2, 3));
            litter_box = clamp(rand(3, 4.5));
            mood = clamp(rand(1.5, 3));
            water_intake = clamp(rand(3, 4));
            if (Math.random() < 0.3) notes = 'Hiding under the bed, not eating much';
          } else {
            appetite = clamp(rand(3.5, 5) + season.appetite);
            activity = clamp(rand(3, 4.5) + season.activity);
            litter_box = clamp(rand(4, 5));
            mood = clamp(rand(3.5, 5));
            water_intake = clamp(rand(3.5, 5));
          }

          // Spring sneezing
          if (isSpring && Math.random() < 0.15) {
            sneezing = 1;
            if (Math.random() < 0.3) notes = 'Sneezy today — might be pollen';
          }

          // Skip days to simulate missed logging (~8% of days)
          if (Math.random() < 0.08) continue;

        } else if (catName === 'Biscuit') {
          // ── Biscuit: Food-motivated, digestive issues every 2-3 weeks ──
          appetite = clamp(rand(4, 5) + season.appetite);
          activity = clamp(rand(4, 5) + season.activity);
          mood = clamp(rand(4, 5));
          water_intake = clamp(rand(3.5, 5));
          litter_box = clamp(rand(3.5, 5));

          // Digestive episode roughly every 15-20 days
          if (daysAgo % 17 <= 1 || (Math.random() < 0.05)) {
            litter_box = clamp(rand(1, 3));
            appetite = clamp(rand(2.5, 4));
            diarrhea = Math.random() < 0.6 ? 1 : 0;
            vomiting = Math.random() < 0.4 ? 1 : 0;
            notes = diarrhea && vomiting ? 'Upset stomach — threw up and loose stool'
              : vomiting ? 'Vomited after eating too fast'
              : diarrhea ? 'Loose stool — might have gotten into something'
              : 'Stomach seems a bit off';
          }

          // Fun notes occasionally
          if (!notes && Math.random() < 0.03) {
            const funNotes = ['Extra zoomies today!', 'Knocked over the plant again',
              'Stole a piece of chicken off the counter', 'Very chatty this morning',
              'Found him sleeping in the sink'];
            notes = funNotes[Math.floor(Math.random() * funNotes.length)];
          }

          // Biscuit was adopted in Aug 2025 — no logs before that (~250 days ago)
          if (daysAgo > 250) continue;

        } else if (catName === 'Pebble') {
          // ── Pebble: Senior cat with gradual kidney disease decline ──
          // First ~9 months: mostly normal for a senior cat
          // Last ~3 months: progressive decline
          const declineStart = 90; // decline begins ~3 months ago
          const inDecline = daysAgo < declineStart;
          const declineProgress = inDecline ? 1 - (daysAgo / declineStart) : 0; // 0 to 1

          if (!inDecline) {
            // Baseline for senior cat: slightly lower than young cat
            appetite = clamp(rand(3, 4.5) + season.appetite);
            activity = clamp(rand(2.5, 4) + season.activity);
            litter_box = clamp(rand(3.5, 5));
            mood = clamp(rand(3, 4.5));
            water_intake = clamp(rand(3, 4.5));

            // Occasional age-related symptoms
            if (Math.random() < 0.03) { vomiting = 1; notes = 'Threw up hairball'; }
            if (Math.random() < 0.02) { lethargy = 1; notes = 'Extra sleepy today'; }
          } else {
            // Progressive CKD decline:
            // - Appetite decreases
            // - Water intake INCREASES (key CKD sign — cats drink more to compensate)
            // - Activity decreases
            // - Mood decreases
            // - Vomiting and lethargy become more frequent
            const d = declineProgress;
            appetite = clamp(rand(3 - d * 2, 4.5 - d * 2));
            activity = clamp(rand(2.5 - d * 1.5, 4 - d * 1.5));
            litter_box = clamp(rand(3 - d * 1.5, 4.5 - d));
            mood = clamp(rand(3 - d * 1.5, 4.5 - d * 1.5));
            // Water intake goes UP in CKD
            water_intake = clamp(rand(3.5 + d * 1, 5));

            // Increasing symptom frequency
            if (Math.random() < 0.05 + d * 0.2) {
              vomiting = 1;
              notes = d > 0.6 ? 'Vomited again, not keeping food down well'
                : 'Threw up this morning';
            }
            if (Math.random() < 0.03 + d * 0.25) {
              lethargy = 1;
              notes = notes ? notes + '. Very lethargic.'
                : d > 0.7 ? 'Barely moving today, just lying in one spot'
                : 'More tired than usual';
            }

            // Recent concerning notes
            if (d > 0.5 && !notes && Math.random() < 0.1) {
              notes = 'Drinking a lot of water but not eating';
            }
            if (d > 0.8 && !notes && Math.random() < 0.15) {
              notes = 'Weight seems lower, fur looking rough';
            }
          }

          // Pebble's owner logs most days but misses some (~5%)
          if (Math.random() < 0.05) continue;
        }

        insertLog.run(
          catId, dateStr, times[logIdx],
          appetite, activity, litter_box, mood, water_intake,
          vomiting, sneezing, lethargy, diarrhea, notes
        );
      }
    }
  }
});

insertAll();

const logCount = db.prepare('SELECT COUNT(*) as c FROM daily_logs').get().c;
const catCount = db.prepare('SELECT COUNT(*) as c FROM cats').get().c;
const perCat = db.prepare('SELECT cat_id, COUNT(*) as c FROM daily_logs GROUP BY cat_id').all();
console.log(`Seeded ${catCount} cats and ${logCount} total logs.`);
perCat.forEach(r => {
  const cat = cats[r.cat_id - catIds[0] + Number(catIds[0]) - 1] || {};
  console.log(`  Cat ${r.cat_id}: ${r.c} logs`);
});
