import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Emotion type
export type EmotionLabel =
  | "happy"
  | "sad"
  | "angry"
  | "neutral"
  | "fearful"
  | "surprised"
  | "disgusted";

// Translation records — each speech-to-ASL session
export const translations = mysqlTable("translations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  originalText: text("originalText").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en"), // 'en' or 'ar'
  emotion: mysqlEnum("emotion", [
    "happy",
    "sad",
    "angry",
    "neutral",
    "fearful",
    "surprised",
    "disgusted",
  ]).notNull().default("neutral"),
  emotionConfidence: float("emotionConfidence").default(0),
  audioUrl: text("audioUrl"),
  durationSeconds: float("durationSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = typeof translations.$inferInsert;

// Arabic emotional speech dataset samples
export const arabicSpeechSamples = mysqlTable("arabic_speech_samples", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  audioUrl: text("audioUrl").notNull(),
  transcription: text("transcription"),
  emotion: mysqlEnum("emotion", [
    "happy",
    "sad",
    "angry",
    "neutral",
    "fearful",
    "surprised",
    "disgusted",
  ]).notNull(),
  speakerAge: int("speakerAge"),
  speakerGender: mysqlEnum("speakerGender", ["male", "female", "other"]),
  dialect: varchar("dialect", { length: 64 }).default("Gulf"),
  durationSeconds: float("durationSeconds"),
  isValidated: boolean("isValidated").default(false),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArabicSpeechSample = typeof arabicSpeechSamples.$inferSelect;
export type InsertArabicSpeechSample =
  typeof arabicSpeechSamples.$inferInsert;

// ASL sign metadata (for the gallery)
export const aslSigns = mysqlTable("asl_signs", {
  id: int("id").autoincrement().primaryKey(),
  letter: varchar("letter", { length: 1 }).notNull().unique(),
  imageUrl: text("imageUrl").notNull(),
  description: text("description"),
  handShape: text("handShape"),
  isAiGenerated: boolean("isAiGenerated").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AslSign = typeof aslSigns.$inferSelect;
export type InsertAslSign = typeof aslSigns.$inferInsert;
