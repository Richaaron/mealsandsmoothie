const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'recipes.db'));
const recipesPath = path.join(__dirname, 'data', 'recipes.json');

// Create Table
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    title TEXT,
    category TEXT,
    origin TEXT,
    continent TEXT,
    description TEXT,
    prepTime TEXT,
    cookTime TEXT,
    difficulty TEXT,
    ingredients TEXT, -- Stored as JSON string
    method TEXT,      -- Stored as JSON string
    image TEXT
  )
`);

// Load JSON Data
console.log("Loading recipes from JSON...");
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

// Prepare Insert Statement
const insert = db.prepare(`
  INSERT OR REPLACE INTO recipes (
    id, title, category, origin, continent, description, prepTime, cookTime, difficulty, ingredients, method, image
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Insert in Transaction for speed
const insertMany = db.transaction((data) => {
  for (const r of data) {
    insert.run(
      r.id,
      r.title,
      r.category,
      r.origin,
      r.continent,
      r.description,
      r.prepTime,
      r.cookTime,
      r.difficulty,
      JSON.stringify(r.ingredients),
      JSON.stringify(r.method),
      r.image
    );
  }
});

console.log(`Migrating ${recipes.length} recipes to SQLite...`);
insertMany(recipes);
console.log("Migration complete!");

// Create indexes for faster searching
db.exec("CREATE INDEX IF NOT EXISTS idx_category ON recipes(category)");
db.exec("CREATE INDEX IF NOT EXISTS idx_origin ON recipes(origin)");
db.exec("CREATE INDEX IF NOT EXISTS idx_continent ON recipes(continent)");

db.close();
