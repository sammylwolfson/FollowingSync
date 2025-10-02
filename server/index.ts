import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
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

(async () => {
  // Log environment info for debugging
  log(`Starting server - NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${process.env.VERCEL}, PORT: ${process.env.PORT}`);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isDevelopment = app.get("env") === "development" || (!process.env.NODE_ENV || process.env.NODE_ENV === "development");
  const isVercel = !!process.env.VERCEL;
  
  log(`Environment check - isDevelopment: ${isDevelopment}, isVercel: ${isVercel}`);
  
  if (isDevelopment && !isVercel) {
    log("Setting up Vite development server");
    await setupVite(app, server);
  } else {
    log("Setting up static file serving for production");
    serveStatic(app);
  }

  // Use Vercel's dynamic port or fallback to 5000 for local development
  // In production (Vercel), use the PORT environment variable
  // In development, use port 5000 (not firewalled)
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const host = process.env.VERCEL ? "0.0.0.0" : "0.0.0.0";
  
  server.listen({
    port,
    host,
    reusePort: !process.env.VERCEL, // Disable reusePort on Vercel
  }, () => {
    log(`serving on port ${port}`);
  });
})();
