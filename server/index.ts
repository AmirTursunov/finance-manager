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
const clientDistPath = path.resolve(process.cwd(), 'client/dist');
app.use(express.static(clientDistPath));

// Handle React Routing - Return all requests to React app
app.get(/.*/, (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  }
});

const startServer = async () => {
  try {
    await initPrisma();
    
    // Bot Init
    const bot = initBot(io);
  
    // Webhook Middleware (Only for Production/Render)
    if (process.env.RENDER_EXTERNAL_URL) {
      app.use(bot.webhookCallback('/api/telegraf-webhook'));
    }

    await launchBot(bot);

    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server & API is running on port ${PORT}`);
      console.log(`🤖 Telegram Bot started`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      // Only stop bot if it was launched in polling mode
      if (!process.env.RENDER_EXTERNAL_URL) {
        try {
          bot.stop(signal);
        } catch (e) {
          // Ignore "Bot is not running" errors
        }
      }

      httpServer.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
