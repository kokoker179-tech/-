
console.log(`Server starting... NODE_ENV: ${process.env.NODE_ENV}`);
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
    marathons: [],
    marathonGroups: [],
    marathonPoints: [],
    servants: [],
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
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

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
      if (!newData || typeof newData !== 'object') {
        return res.status(400).json({ error: 'Invalid data format' });
      }
      newData.updatedAt = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(newData, null, 2));
      res.json({ success: true, updatedAt: newData.updatedAt });
    } catch (error) {
      console.error('Database write error:', error);
      res.status(500).json({ error: 'Failed to write to database' });
    }
  });

  // Vite middleware for development
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('Serving static files from dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('Using Vite middleware for development');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.get('*all', (req, res) => {
      res.status(404).send('Production build not found. Run npm run build first.');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
