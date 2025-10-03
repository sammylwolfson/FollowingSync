import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from '../server/routes.js';
import { serveStatic, log } from '../server/vite.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req: any, res: any, next: any) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Create HTTP server for routes registration
const server = createServer(app);

// Initialize the app once
let initialized = false;

async function initializeApp() {
  if (!initialized) {
    log("Initializing Vercel serverless function");
    
    await registerRoutes(app);
    
    // Add error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    // Setup static file serving for production
    serveStatic(app);
    
    initialized = true;
    log("Vercel serverless function initialized");
  }
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initializeApp();
    
    // Handle the request with Express
    app(req as any, res as any);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}