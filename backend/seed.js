import db from './database.js';

// Clear existing data
db.exec('DELETE FROM daily_logs');
db.exec('DELETE FROM cats');

// ── Create cats ──
const cats = [
  { name: 'Mochi', breed: 'Scottish Fold', birth_date: '2021-06-15', weight: 9.2 },
  { name: 'Luna', breed: 'Siamese', birth_date: '2020-03-22', weight: 7.8 },
  { name: 'Biscuit', breed: 'Orange Tabby', birth_date: '2023-01-10', weight: 11.5 },
];

const insertCat = db.prepare(
  'INSERT INTO cats (name, breed, birth_date, weight) VALUES (?, ?, ?, ?)'
);

const catIds = cats.map(c => insertCat.run(c.name, c.breed, c.birth_date, c.weight).lastInsertRowid);

// ── Generate logs ──
const insertLog = db.prepare(`
  INSERT INTO daily_logs (cat_id, date, appetite, activity, litter_box, mood, water_intake, vomiting, sneezing, lethargy, diarrhea, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function clamp(val) { return Math.max(1, Math.min(5, Math.round(val))); }
function rand(min, max) { return min + Math.random() * (max - min); }

// Generate 45 days of logs for each cat
const today = new Date();
const insertAll = db.transaction(() => {
  for (let catIdx = 0; catIdx < cats.length; catIdx++) {
    const catId = catIds[catIdx];
    const catName = cats[catIdx].name;

    for (let daysAgo = 44; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      // Use local date parts to avoid UTC offset producing duplicate dates
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      let appetite, activity, litter_box, mood, water_intake;
      let vomiting = 0, sneezing = 0, lethargy = 0, diarrhea = 0;
      let notes = '';

      if (catName === 'Mochi') {
        // Mochi: generally healthy but had a rough week 2 weeks ago, now recovering
        const phase = daysAgo;
        if (phase > 20) {
          // Healthy baseline
          appetite = clamp(rand(3.5, 5));
          activity = clamp(rand(3.5, 5));
          litter_box = clamp(rand(4, 5));
          mood = clamp(rand(3.5, 5));
          water_intake = clamp(rand(3, 5));
        } else if (phase > 12) {
          // Decline period - something's off
          appetite = clamp(rand(2, 3.5));
          activity = clamp(rand(1.5, 3));
          litter_box = clamp(rand(2, 4));
          mood = clamp(rand(2, 3.5));
          water_intake = clamp(rand(2, 3));
          if (Math.random() < 0.3) { vomiting = 1; notes = 'Vomited after breakfast'; }
          if (Math.random() < 0.25) { lethargy = 1; notes = notes ? notes + '. Sleeping more than usual' : 'Sleeping more than usual'; }
        } else {
          // Recovery - gradually improving
          const recovery = (12 - phase) / 12;
          appetite = clamp(rand(2.5 + recovery * 2, 3.5 + recovery * 1.5));
          activity = clamp(rand(2.5 + recovery * 2, 3.5 + recovery * 1.5));
          litter_box = clamp(rand(3 + recovery, 4.5 + recovery * 0.5));
          mood = clamp(rand(3 + recovery * 1.5, 4 + recovery));
          water_intake = clamp(rand(3, 4.5));
          if (phase > 8 && Math.random() < 0.15) vomiting = 1;
          if (phase < 5) notes = 'Looking much better!';
        }
      } else if (catName === 'Luna') {
        // Luna: stable and healthy, slight seasonal mood dip recently
        appetite = clamp(rand(3.5, 5));
        activity = clamp(rand(3, 4.5));
        water_intake = clamp(rand(3.5, 5));
        litter_box = clamp(rand(4, 5));

        if (daysAgo < 10) {
          // Recent mild mood dip
          mood = clamp(rand(2.5, 3.5));
          activity = clamp(rand(2.5, 3.5));
          if (Math.random() < 0.1) notes = 'Seems a bit withdrawn today';
        } else {
          mood = clamp(rand(3.5, 5));
        }
        if (Math.random() < 0.05) { sneezing = 1; notes = 'Sneezed a couple times'; }
      } else if (catName === 'Biscuit') {
        // Biscuit: young and energetic, consistently good with occasional tummy issues
        appetite = clamp(rand(4, 5));
        activity = clamp(rand(4, 5));
        mood = clamp(rand(4, 5));
        water_intake = clamp(rand(3.5, 5));
        litter_box = clamp(rand(3, 5));

        // Occasional digestive episodes
        if (Math.random() < 0.1) {
          litter_box = clamp(rand(1.5, 3));
          diarrhea = 1;
          notes = 'Loose stool — might have eaten something weird';
          appetite = clamp(rand(3, 4));
        }

        if (daysAgo % 7 === 0) notes = notes || 'Extra zoomies today!';
        if (Math.random() < 0.08) notes = notes || 'Knocked over the plant again';
      }

      insertLog.run(
        catId, dateStr,
        appetite, activity, litter_box, mood, water_intake,
        vomiting, sneezing, lethargy, diarrhea,
        notes
      );
    }
  }
});

insertAll();

const logCount = db.prepare('SELECT COUNT(*) as count FROM daily_logs').get().count;
const catCount = db.prepare('SELECT COUNT(*) as count FROM cats').get().count;
console.log(`Seeded ${catCount} cats and ${logCount} daily logs.`);
console.log('Cats:', cats.map(c => c.name).join(', '));
console.log('Each cat has 45 days of behavioral data.');
