import express from 'express';
import cors from 'cors';
import path from 'path';
import { getGraph, getPaths, getCycles, getNode } from './services/graphService';
import { analyzeText } from './services/aiService';
import { initDB } from './db/sqlite';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize DB
initDB().catch(console.error);

// API Routes
app.get('/api/graph', (req, res) => {
  res.json(getGraph());
});

app.get('/api/node/:id', (req, res) => {
  const node = getNode(req.params.id);
  res.json(node || { error: 'Not found' });
});

app.get('/api/paths', (req, res) => {
  const { from, to, depth } = req.query;
  const result = getPaths(String(from), String(to), Number(depth) || 5);
  res.json(result);
});

app.get('/api/cycles', (req, res) => {
  const { node } = req.query;
  const result = getCycles(String(node));
  res.json(result);
});

app.post('/api/ai/analyze', async (req, res) => {
  try {
    const result = await analyzeText(req.body.text);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// Serve Client
const clientPath = path.join(__dirname, '../../dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientPath));
  app.get('*', (req, res) => res.sendFile(path.join(clientPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
