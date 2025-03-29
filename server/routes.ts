import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPlatformConnectionSchema, insertFollowingSchema, insertSyncHistorySchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import axios from "axios";

// Mock OAuth2 implementations since we can't connect to actual social platforms in this demo
const mockSocialMediaData = {
  twitter: {
    following: [
      { username: 'elonmusk', displayName: 'Elon Musk', profilePictureUrl: 'https://via.placeholder.com/150' },
      { username: 'BillGates', displayName: 'Bill Gates', profilePictureUrl: 'https://via.placeholder.com/150' }
    ]
  },
  instagram: {
    following: [
      { username: 'zuck', displayName: 'Mark Zuckerberg', profilePictureUrl: 'https://via.placeholder.com/150' },
      { username: 'natgeo', displayName: 'National Geographic', profilePictureUrl: 'https://via.placeholder.com/150' }
    ]
  },
  facebook: {
    following: [
      { username: 'meta', displayName: 'Meta', profilePictureUrl: 'https://via.placeholder.com/150' },
      { username: 'cnn', displayName: 'CNN', profilePictureUrl: 'https://via.placeholder.com/150' }
    ]
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const SessionStore = MemoryStore(session);

  // Configure session
  app.use(session({
    secret: process.env.SESSION_SECRET || 'social-sync-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
    store: new SessionStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    })
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        
        // In a real app, we would hash the password before storing it
        // Here we're comparing directly for simplicity
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // In a real app, we would hash the password
      // const hashedPassword = await bcrypt.hash(userData.password, 10);
      // userData.password = hashedPassword;
      
      const newUser = await storage.createUser(userData);
      
      // Setup default platform connections for new user
      const platforms = await storage.getAllPlatforms();
      for (const platform of platforms) {
        await storage.createPlatformConnection({
          userId: newUser.id,
          platformId: platform.id,
          connected: false,
          status: 'not_connected'
        });
      }
      
      // Log the user in
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error logging in after registration' });
        }
        return res.status(201).json({ 
          id: newUser.id, 
          username: newUser.username, 
          email: newUser.email 
        });
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    const user = req.user as any;
    res.json({ 
      id: user.id, 
      username: user.username, 
      email: user.email 
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({
        authenticated: true,
        user: { id: user.id, username: user.username, email: user.email }
      });
    }
    res.json({ authenticated: false });
  });
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };

  // Platform routes
  app.get('/api/platforms', async (req, res) => {
    const platforms = await storage.getAllPlatforms();
    res.json(platforms);
  });

  // Platform connections routes
  app.get('/api/connections', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const connections = await storage.getUserPlatformConnections(user.id);
    
    // Get platform details for each connection
    const connectionsWithDetails = await Promise.all(
      connections.map(async (connection) => {
        const platform = await storage.getPlatform(connection.platformId);
        return {
          ...connection,
          platform
        };
      })
    );
    
    res.json(connectionsWithDetails);
  });

  app.post('/api/connections/:platformId/connect', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const platformId = parseInt(req.params.platformId);
    
    const platform = await storage.getPlatform(platformId);
    if (!platform) {
      return res.status(404).json({ message: 'Platform not found' });
    }
    
    let connection = await storage.getPlatformConnectionByUserAndPlatform(user.id, platformId);
    
    if (!connection) {
      connection = await storage.createPlatformConnection({
        userId: user.id,
        platformId,
        connected: true,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        tokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        platformUsername: `${user.username}_on_${platform.code}`,
        status: 'connected',
        lastSynced: null
      });
    } else {
      connection = await storage.updatePlatformConnection(connection.id, {
        connected: true,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        tokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        platformUsername: `${user.username}_on_${platform.code}`,
        status: 'connected'
      });
    }
    
    res.json({ 
      ...connection,
      platform
    });
  });

  app.post('/api/connections/:platformId/disconnect', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const platformId = parseInt(req.params.platformId);
    
    const connection = await storage.getPlatformConnectionByUserAndPlatform(user.id, platformId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }
    
    const updatedConnection = await storage.updatePlatformConnection(connection.id, {
      connected: false,
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      status: 'disconnected'
    });
    
    const platform = await storage.getPlatform(platformId);
    
    res.json({
      ...updatedConnection,
      platform
    });
  });

  // Following routes
  app.get('/api/following', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const following = await storage.getUserFollowing(user.id);
    
    // Get platform details for each following
    const followingWithDetails = await Promise.all(
      following.map(async (follow) => {
        const platform = await storage.getPlatform(follow.platformId);
        return {
          ...follow,
          platform
        };
      })
    );
    
    res.json(followingWithDetails);
  });

  // Sync routes
  app.post('/api/sync', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Create sync history entries for connected platforms
    const connections = await storage.getUserPlatformConnections(user.id);
    const connectedPlatforms = connections.filter(conn => conn.connected);
    
    if (connectedPlatforms.length === 0) {
      return res.status(400).json({ message: 'No connected platforms to sync' });
    }
    
    const syncHistories = [];
    
    for (const connection of connectedPlatforms) {
      const platform = await storage.getPlatform(connection.platformId);
      
      // Create sync history entry
      const syncHistory = await storage.createSyncHistory({
        userId: user.id,
        platformId: connection.platformId,
        status: 'in_progress',
        totalItems: 0,
        itemsProcessed: 0,
        error: null,
        endTime: null
      });
      
      syncHistories.push({
        ...syncHistory,
        platform
      });
    }
    
    // Return the initial sync histories
    res.json(syncHistories);
    
    // Process sync in the background
    processSyncInBackground(user.id, connectedPlatforms);
  });

  app.get('/api/sync/status', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const syncHistories = await storage.getUserSyncHistory(user.id);
    
    // Get platform details for each sync history
    const historiesWithDetails = await Promise.all(
      syncHistories.map(async (history) => {
        const platform = await storage.getPlatform(history.platformId);
        return {
          ...history,
          platform
        };
      })
    );
    
    res.json(historiesWithDetails);
  });

  // Export route
  app.get('/api/export', isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const following = await storage.getUserFollowing(user.id);
    
    // Get platform details
    const platforms = await storage.getAllPlatforms();
    const platformMap = new Map(platforms.map(p => [p.id, p]));
    
    // Format data for CSV export
    const csvData = following.map(f => {
      const platform = platformMap.get(f.platformId);
      return {
        username: f.username,
        displayName: f.displayName || '',
        platform: platform ? platform.name : 'Unknown',
        platformCode: platform ? platform.code : 'unknown'
      };
    });
    
    res.json({ data: csvData });
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to simulate background sync process
async function processSyncInBackground(userId: number, connections: any[]) {
  for (const connection of connections) {
    try {
      // Get platform code to determine which mock data to use
      const platform = await storage.getPlatform(connection.platformId);
      const platformCode = platform?.code || 'unknown';
      
      // Get sync history to update
      const syncHistories = await storage.getUserSyncHistory(userId);
      const syncHistory = syncHistories.find(h => 
        h.userId === userId && 
        h.platformId === connection.platformId && 
        h.status === 'in_progress'
      );
      
      if (!syncHistory) continue;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get mock data based on platform
      const mockData = mockSocialMediaData[platformCode]?.following || [];
      
      // Update sync history with total items
      await storage.updateSyncHistory(syncHistory.id, {
        totalItems: mockData.length,
        itemsProcessed: 0
      });
      
      // Clear existing following data for this platform
      await storage.deleteUserFollowingByPlatform(userId, connection.platformId);
      
      // Process each mock following
      for (let i = 0; i < mockData.length; i++) {
        const followingData = mockData[i];
        
        // Add following to storage
        await storage.createFollowing({
          userId,
          platformId: connection.platformId,
          username: followingData.username,
          displayName: followingData.displayName,
          profilePictureUrl: followingData.profilePictureUrl,
          platformData: followingData,
          platformUserId: `${followingData.username}_id`
        });
        
        // Update sync progress
        await storage.updateSyncHistory(syncHistory.id, {
          itemsProcessed: i + 1
        });
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Update connection's last synced time
      await storage.updatePlatformConnection(connection.id, {
        lastSynced: new Date(),
        status: 'connected'
      });
      
      // Mark sync as complete
      await storage.updateSyncHistory(syncHistory.id, {
        status: 'completed',
        endTime: new Date()
      });
    } catch (error) {
      // Update sync history with error
      const syncHistories = await storage.getUserSyncHistory(userId);
      const syncHistory = syncHistories.find(h => 
        h.userId === userId && 
        h.platformId === connection.platformId && 
        h.status === 'in_progress'
      );
      
      if (syncHistory) {
        await storage.updateSyncHistory(syncHistory.id, {
          status: 'failed',
          error: error.message,
          endTime: new Date()
        });
      }
      
      // Update connection status
      await storage.updatePlatformConnection(connection.id, {
        status: 'error'
      });
    }
  }
}
