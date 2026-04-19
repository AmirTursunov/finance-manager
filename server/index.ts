import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initBot, launchBot } from './bot';
import apiRouter from './api';
import { initPrisma } from './db';
import { initSocket } from './socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io separately to avoid circular dependencies
const io = initSocket(httpServer);

app.use(cors());
app.use(express.json());

// Main API Router
app.use('/api', apiRouter);

// Serve Static Frontend for Production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Handle React Routing - Return all requests to React app
app.get(/.*/, (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  }
});

const startServer = async () => {
  await initPrisma();
  
  // Bot Init
  const bot = initBot(io);
  await launchBot(bot);

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server & API is running on http://localhost:${PORT}`);
    console.log(`🤖 Telegram Bot started`);
  });
};

startServer();
