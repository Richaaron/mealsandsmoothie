const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const db = new Database(path.join(__dirname, 'recipes.db'));

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/recipes', (req, res) => {
  const { category, origin, continent, search, page = 1, limit = 24 } = req.query;
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM recipes WHERE 1=1";
  const params = [];

  if (category && category !== 'All') {
    query += " AND category = ?";
    params.push(category);
  }

  if (origin && origin !== 'All') {
    query += " AND origin = ?";
    params.push(origin);
  }

  if (continent && continent !== 'All') {
    query += " AND continent = ?";
    params.push(continent);
  }

  if (search) {
    query += " AND (title LIKE ? OR description LIKE ? OR ingredients LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Get total count for pagination
  const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as count");
  const total = db.prepare(countQuery).get(...params).count;

  // Get paginated recipes
  query += " LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  const recipes = db.prepare(query).all(...params).map(r => ({
    ...r,
    ingredients: JSON.parse(r.ingredients),
    method: JSON.parse(r.method)
  }));

  res.json({
    recipes,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  });
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(req.params.id);
  if (recipe) {
    res.json({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      method: JSON.parse(recipe.method)
    });
  } else {
    res.status(404).json({ message: 'Recipe not found' });
  }
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare("SELECT DISTINCT category FROM recipes").all().map(r => r.category);
  res.json(['All', ...categories]);
});

app.get('/api/origins', (req, res) => {
  const origins = db.prepare("SELECT DISTINCT origin FROM recipes ORDER BY origin ASC").all().map(r => r.origin);
  res.json(['All', ...origins]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
