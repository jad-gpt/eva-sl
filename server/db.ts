import { eq, desc, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  translations,
  InsertTranslation,
  arabicSpeechSamples,
  InsertArabicSpeechSample,
  aslSigns,
  InsertAslSign,
  EmotionLabel,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Translations ─────────────────────────────────────────────────────────────

export async function saveTranslation(data: InsertTranslation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(translations).values(data);
  return result;
}

export async function getTranslationsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(translations)
    .where(eq(translations.userId, userId))
    .orderBy(desc(translations.createdAt))
    .limit(limit);
}

export async function getAllTranslationsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(translations);
  return result[0]?.count ?? 0;
}

export async function getEmotionDistribution() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      emotion: translations.emotion,
      count: count(),
    })
    .from(translations)
    .groupBy(translations.emotion);
  return result;
}

export async function getRecentTranslations(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(translations)
    .orderBy(desc(translations.createdAt))
    .limit(limit);
}

// ─── Arabic Speech Samples ────────────────────────────────────────────────────

export async function saveArabicSample(data: InsertArabicSpeechSample) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(arabicSpeechSamples).values(data);
}

export async function getArabicSamples(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(arabicSpeechSamples)
    .orderBy(desc(arabicSpeechSamples.createdAt))
    .limit(limit);
}

export async function getArabicSamplesCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(arabicSpeechSamples);
  return result[0]?.count ?? 0;
}

export async function getArabicSamplesByEmotion() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      emotion: arabicSpeechSamples.emotion,
      count: count(),
    })
    .from(arabicSpeechSamples)
    .groupBy(arabicSpeechSamples.emotion);
}

// ─── ASL Signs ────────────────────────────────────────────────────────────────

export async function upsertAslSign(data: InsertAslSign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .insert(aslSigns)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        imageUrl: data.imageUrl,
        description: data.description,
        handShape: data.handShape,
      },
    });
}

export async function getAllAslSigns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aslSigns).orderBy(aslSigns.letter);
}

// ─── Research Stats ───────────────────────────────────────────────────────────

export async function getResearchStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalTranslations: 0,
      totalArabicSamples: 0,
      emotionDistribution: [],
      arabicEmotionDistribution: [],
      recentTranslations: [],
    };
  }

  const [totalTranslations, totalArabicSamples, emotionDistribution, arabicEmotionDistribution, recentTranslations] =
    await Promise.all([
      getAllTranslationsCount(),
      getArabicSamplesCount(),
      getEmotionDistribution(),
      getArabicSamplesByEmotion(),
      getRecentTranslations(5),
    ]);

  return {
    totalTranslations,
    totalArabicSamples,
    emotionDistribution,
    arabicEmotionDistribution,
    recentTranslations,
  };
}
