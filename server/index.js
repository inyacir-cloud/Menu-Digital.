const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');
const SEED_PATH = path.join(__dirname, 'seed.json');

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/ping', (req, res) => res.json({ ok: true }));

app.get('/api/state', (req, res) => {
  const db = readDB();
  res.json(db.config || {});
});

app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories || []);
});

app.post('/api/categories', (req, res) => {
  const db = readDB();
  const categories = db.categories || [];
  const { name } = req.body;
  const id = Date.now().toString();
  const newCat = { id, name };
  categories.push(newCat);
  db.categories = categories;
  writeDB(db);
  res.json(newCat);
});

app.put('/api/categories/:id', (req, res) => {
  const db = readDB();
  const categories = db.categories || [];
  const { id } = req.params;
  const { name } = req.body;
  const updated = categories.map(c => c.id === id ? { ...c, name } : c);
  db.categories = updated;
  writeDB(db);
  res.json({ ok: true });
});

app.delete('/api/categories/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.categories = (db.categories || []).filter(c => c.id !== id);
  db.products = (db.products || []).filter(p => p.categoryId !== id);
  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/complements', (req, res) => {
  const db = readDB();
  res.json(db.complements || []);
});

app.post('/api/complements', (req, res) => {
  const db = readDB();
  const complements = db.complements || [];
  const { name, price } = req.body;
  const id = 'c' + Date.now().toString();
  const newComp = { id, name, price: Number(price) || 0 };
  complements.push(newComp);
  db.complements = complements;
  writeDB(db);
  res.json(newComp);
});

app.put('/api/complements/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { name, price } = req.body;
  db.complements = (db.complements || []).map(c => c.id === id ? { ...c, name, price: Number(price) || 0 } : c);
  writeDB(db);
  res.json({ ok: true });
});

app.delete('/api/complements/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.complements = (db.complements || []).filter(c => c.id !== id);
  db.products = (db.products || []).map(p => ({ ...p, complementIds: (p.complementIds || []).filter(cid => cid !== id) }));
  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products || []);
});

app.post('/api/products', (req, res) => {
  const db = readDB();
  const products = db.products || [];
  const data = req.body;
  const id = Date.now().toString();
  const newProd = { ...data, id };
  products.push(newProd);
  db.products = products;
  writeDB(db);
  res.json(newProd);
});

app.put('/api/products/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const data = req.body;
  db.products = (db.products || []).map(p => p.id === id ? { ...p, ...data } : p);
  writeDB(db);
  res.json({ ok: true });
});

app.delete('/api/products/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.products = (db.products || []).filter(p => p.id !== id);
  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json(db.config || {});
});

app.put('/api/config', (req, res) => {
  const db = readDB();
  db.config = { ...(db.config || {}), ...(req.body || {}) };
  writeDB(db);
  res.json(db.config);
});

app.post('/api/reset', (req, res) => {
  try {
    const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'));
    writeDB(seed);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API server listening on http://localhost:${port}`));
