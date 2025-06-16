import { 
  users, type User, type InsertUser,
  platforms, type Platform, type InsertPlatform,
  platformConnections, type PlatformConnection, type InsertPlatformConnection,
  following, type Following, type InsertFollowing,
  syncHistory, type SyncHistory, type InsertSyncHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Platform methods
  getAllPlatforms(): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  getPlatformByCode(code: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  
  // Platform Connection methods
  getUserPlatformConnections(userId: number): Promise<PlatformConnection[]>;
  getPlatformConnection(id: number): Promise<PlatformConnection | undefined>;
  getPlatformConnectionByUserAndPlatform(userId: number, platformId: number): Promise<PlatformConnection | undefined>;
  createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection>;
  updatePlatformConnection(id: number, connection: Partial<InsertPlatformConnection>): Promise<PlatformConnection | undefined>;
  
  // Following methods
  getUserFollowing(userId: number): Promise<Following[]>;
  getUserFollowingByPlatform(userId: number, platformId: number): Promise<Following[]>;
  getFollowing(id: number): Promise<Following | undefined>;
  createFollowing(following: InsertFollowing): Promise<Following>;
  deleteUserFollowingByPlatform(userId: number, platformId: number): Promise<void>;
  
  // Sync History methods
  createSyncHistory(syncHistory: InsertSyncHistory): Promise<SyncHistory>;
  updateSyncHistory(id: number, syncHistory: Partial<InsertSyncHistory>): Promise<SyncHistory | undefined>;
  getUserSyncHistory(userId: number): Promise<SyncHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private platforms: Map<number, Platform>;
  private platformConnections: Map<number, PlatformConnection>;
  private following: Map<number, Following>;
  private syncHistory: Map<number, SyncHistory>;
  
  private userIdCounter: number = 1;
  private platformIdCounter: number = 1;
  private connectionIdCounter: number = 1;
  private followingIdCounter: number = 1;
  private syncHistoryIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.platforms = new Map();
    this.platformConnections = new Map();
    this.following = new Map();
    this.syncHistory = new Map();
    
    // Initialize with default platforms
    this.initDefaultPlatforms();
  }

  private initDefaultPlatforms() {
    const defaultPlatforms: InsertPlatform[] = [
      { name: "Twitter/X", code: "twitter", icon: "alternate_email", color: "#1DA1F2" },
      { name: "Instagram", code: "instagram", icon: "photo_camera", color: "#E1306C" },
      { name: "Facebook", code: "facebook", icon: "thumb_up", color: "#1877F2" },
      { name: "LinkedIn", code: "linkedin", icon: "business_center", color: "#0A66C2" },
      { name: "TikTok", code: "tiktok", icon: "music_note", color: "#000000" },
      { name: "YouTube", code: "youtube", icon: "play_arrow", color: "#FF0000" }
    ];

    for (const platform of defaultPlatforms) {
      this.createPlatform(platform);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username.toLowerCase() === username.toLowerCase());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const newUser: User = { ...user, id, createdAt: timestamp };
    this.users.set(id, newUser);
    return newUser;
  }

  // Platform methods
  async getAllPlatforms(): Promise<Platform[]> {
    return Array.from(this.platforms.values());
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    return this.platforms.get(id);
  }

  async getPlatformByCode(code: string): Promise<Platform | undefined> {
    return Array.from(this.platforms.values()).find(platform => platform.code === code);
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const id = this.platformIdCounter++;
    const newPlatform: Platform = { ...platform, id };
    this.platforms.set(id, newPlatform);
    return newPlatform;
  }

  // Platform Connection methods
  async getUserPlatformConnections(userId: number): Promise<PlatformConnection[]> {
    return Array.from(this.platformConnections.values())
      .filter(conn => conn.userId === userId);
  }

  async getPlatformConnection(id: number): Promise<PlatformConnection | undefined> {
    return this.platformConnections.get(id);
  }

  async getPlatformConnectionByUserAndPlatform(userId: number, platformId: number): Promise<PlatformConnection | undefined> {
    return Array.from(this.platformConnections.values())
      .find(conn => conn.userId === userId && conn.platformId === platformId);
  }

  async createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection> {
    const id = this.connectionIdCounter++;
    const newConnection: PlatformConnection = { ...connection, id };
    this.platformConnections.set(id, newConnection);
    return newConnection;
  }

  async updatePlatformConnection(id: number, connection: Partial<InsertPlatformConnection>): Promise<PlatformConnection | undefined> {
    const existingConnection = this.platformConnections.get(id);
    if (!existingConnection) return undefined;

    const updatedConnection = { ...existingConnection, ...connection };
    this.platformConnections.set(id, updatedConnection);
    return updatedConnection;
  }

  // Following methods
  async getUserFollowing(userId: number): Promise<Following[]> {
    return Array.from(this.following.values())
      .filter(following => following.userId === userId);
  }

  async getUserFollowingByPlatform(userId: number, platformId: number): Promise<Following[]> {
    return Array.from(this.following.values())
      .filter(following => following.userId === userId && following.platformId === platformId);
  }

  async getFollowing(id: number): Promise<Following | undefined> {
    return this.following.get(id);
  }

  async createFollowing(followingData: InsertFollowing): Promise<Following> {
    const id = this.followingIdCounter++;
    const timestamp = new Date();
    const newFollowing: Following = { 
      ...followingData, 
      id, 
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.following.set(id, newFollowing);
    return newFollowing;
  }

  async deleteUserFollowingByPlatform(userId: number, platformId: number): Promise<void> {
    for (const [id, following] of this.following.entries()) {
      if (following.userId === userId && following.platformId === platformId) {
        this.following.delete(id);
      }
    }
  }

  // Sync History methods
  async createSyncHistory(syncHistoryData: InsertSyncHistory): Promise<SyncHistory> {
    const id = this.syncHistoryIdCounter++;
    const startTime = new Date();
    const newSyncHistory: SyncHistory = { ...syncHistoryData, id, startTime };
    this.syncHistory.set(id, newSyncHistory);
    return newSyncHistory;
  }

  async updateSyncHistory(id: number, syncHistoryData: Partial<InsertSyncHistory>): Promise<SyncHistory | undefined> {
    const existingSyncHistory = this.syncHistory.get(id);
    if (!existingSyncHistory) return undefined;

    const updatedSyncHistory = { ...existingSyncHistory, ...syncHistoryData };
    this.syncHistory.set(id, updatedSyncHistory);
    return updatedSyncHistory;
  }

  async getUserSyncHistory(userId: number): Promise<SyncHistory[]> {
    return Array.from(this.syncHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }
}

export class DatabaseStorage implements IStorage {
  private async initializeDefaultPlatforms() {
    // Check if platforms already exist (avoid infinite recursion)
    const existingPlatforms = await db.select().from(platforms);
    if (existingPlatforms.length > 0) {
      return; // Platforms already initialized
    }

    // Create default platforms
    const defaultPlatforms = [
      { name: "Twitter", code: "twitter", icon: "twitter", color: "#1DA1F2", enabled: true },
      { name: "Instagram", code: "instagram", icon: "instagram", color: "#E4405F", enabled: true },
      { name: "Facebook", code: "facebook", icon: "facebook", color: "#1877F2", enabled: true },
      { name: "LinkedIn", code: "linkedin", icon: "linkedin", color: "#0A66C2", enabled: true },
      { name: "YouTube", code: "youtube", icon: "youtube", color: "#FF0000", enabled: true },
      { name: "TikTok", code: "tiktok", icon: "music_note", color: "#000000", enabled: true }
    ];

    for (const platform of defaultPlatforms) {
      await this.createPlatform(platform);
    }
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async getAllPlatforms(): Promise<Platform[]> {
    await this.initializeDefaultPlatforms();
    return await db.select().from(platforms);
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform || undefined;
  }

  async getPlatformByCode(code: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.code, code));
    return platform || undefined;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [newPlatform] = await db
      .insert(platforms)
      .values(platform)
      .returning();
    return newPlatform;
  }

  async getUserPlatformConnections(userId: number): Promise<PlatformConnection[]> {
    return await db.select().from(platformConnections).where(eq(platformConnections.userId, userId));
  }

  async getPlatformConnection(id: number): Promise<PlatformConnection | undefined> {
    const [connection] = await db.select().from(platformConnections).where(eq(platformConnections.id, id));
    return connection || undefined;
  }

  async getPlatformConnectionByUserAndPlatform(userId: number, platformId: number): Promise<PlatformConnection | undefined> {
    const [connection] = await db.select().from(platformConnections)
      .where(and(eq(platformConnections.userId, userId), eq(platformConnections.platformId, platformId)));
    return connection || undefined;
  }

  async createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection> {
    const [newConnection] = await db
      .insert(platformConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async updatePlatformConnection(id: number, connection: Partial<InsertPlatformConnection>): Promise<PlatformConnection | undefined> {
    const [updatedConnection] = await db
      .update(platformConnections)
      .set(connection)
      .where(eq(platformConnections.id, id))
      .returning();
    return updatedConnection || undefined;
  }

  async getUserFollowing(userId: number): Promise<Following[]> {
    return await db.select().from(following).where(eq(following.userId, userId));
  }

  async getUserFollowingByPlatform(userId: number, platformId: number): Promise<Following[]> {
    return await db.select().from(following)
      .where(and(eq(following.userId, userId), eq(following.platformId, platformId)));
  }

  async getFollowing(id: number): Promise<Following | undefined> {
    const [followingUser] = await db.select().from(following).where(eq(following.id, id));
    return followingUser || undefined;
  }

  async createFollowing(followingData: InsertFollowing): Promise<Following> {
    const [newFollowing] = await db
      .insert(following)
      .values(followingData)
      .returning();
    return newFollowing;
  }

  async deleteUserFollowingByPlatform(userId: number, platformId: number): Promise<void> {
    await db.delete(following)
      .where(and(eq(following.userId, userId), eq(following.platformId, platformId)));
  }

  async createSyncHistory(syncHistoryData: InsertSyncHistory): Promise<SyncHistory> {
    const [newSyncHistory] = await db
      .insert(syncHistory)
      .values(syncHistoryData)
      .returning();
    return newSyncHistory;
  }

  async updateSyncHistory(id: number, syncHistoryData: Partial<InsertSyncHistory>): Promise<SyncHistory | undefined> {
    const [updatedSyncHistory] = await db
      .update(syncHistory)
      .set(syncHistoryData)
      .where(eq(syncHistory.id, id))
      .returning();
    return updatedSyncHistory || undefined;
  }

  async getUserSyncHistory(userId: number): Promise<SyncHistory[]> {
    return await db.select().from(syncHistory)
      .where(eq(syncHistory.userId, userId))
      .orderBy(syncHistory.startTime);
  }
}

export const storage = new DatabaseStorage();
