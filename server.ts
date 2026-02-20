
import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    youth: [],
    attendance: [],
    config: {
      churchName: 'كنيسة الملاك روفائيل',
      meetingName: 'اجتماع ثانوي بنين',
      adminPassword: 'kerolos0',
      grades: ['أولى ثانوي', 'تانية ثانوي', 'تالتة ثانوي']
    },
    updatedAt: new Date().toISOString()
  }, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/data', (req, res) => {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: 'Failed to read database' });
    }
  });

  app.post('/api/data', (req, res) => {
    try {
      const newData = req.body;
      newData.updatedAt = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2));
      res.json({ success: true, updatedAt: newData.updatedAt });
    } catch (error) {
      res.status(500).json({ error: 'Failed to write to database' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
