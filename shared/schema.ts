import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for application authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Social Platforms
export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  enabled: boolean("enabled").default(true),
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
});

// User Platform Connections
export const platformConnections = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  connected: boolean("connected").default(false),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  platformUsername: text("platform_username"),
  lastSynced: timestamp("last_synced"),
  status: text("status").default("not_connected"),
});

export const insertPlatformConnectionSchema = createInsertSchema(platformConnections).omit({
  id: true,
});

// Following records - who users follow across platforms
export const following = pgTable("following", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  username: text("username").notNull(),
  displayName: text("display_name"),
  profilePictureUrl: text("profile_picture_url"),
  platformData: jsonb("platform_data"),
  platformUserId: text("platform_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFollowingSchema = createInsertSchema(following).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Sync History
export const syncHistory = pgTable("sync_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  platformId: integer("platform_id").notNull().references(() => platforms.id),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").default("in_progress"),
  totalItems: integer("total_items"),
  itemsProcessed: integer("items_processed"),
  error: text("error"),
});

export const insertSyncHistorySchema = createInsertSchema(syncHistory).omit({
  id: true,
  startTime: true,
});

// Type Definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;

export type PlatformConnection = typeof platformConnections.$inferSelect;
export type InsertPlatformConnection = z.infer<typeof insertPlatformConnectionSchema>;

export type Following = typeof following.$inferSelect;
export type InsertFollowing = z.infer<typeof insertFollowingSchema>;

export type SyncHistory = typeof syncHistory.$inferSelect;
export type InsertSyncHistory = z.infer<typeof insertSyncHistorySchema>;
