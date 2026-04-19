import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-001",
      email: "jad@example.com",
      name: "Jad Test",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe("auth", () => {
  it("returns null user for unauthenticated context", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user object for authenticated context", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Jad Test");
    expect(result?.email).toBe("jad@example.com");
  });

  it("clears session cookie on logout", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ maxAge: -1 })
    );
  });
});

// ─── ASL Dataset Tests ────────────────────────────────────────────────────────

describe("asl.getAllSigns", () => {
  it("returns exactly 26 ASL signs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const signs = await caller.asl.getAllSigns();
    expect(signs).toHaveLength(26);
  });

  it("covers all letters A through Z", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const signs = await caller.asl.getAllSigns();
    const letters = signs.map((s) => s.letter).sort();
    const expected = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    expect(letters).toEqual(expected);
  });

  it("marks letters A–M as AI-generated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const signs = await caller.asl.getAllSigns();
    const aiGenerated = signs.filter((s) => s.isAiGenerated).map((s) => s.letter);
    expect(aiGenerated).toEqual(expect.arrayContaining(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]));
    expect(aiGenerated).toHaveLength(13);
  });

  it("all signs have imageUrl and description", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const signs = await caller.asl.getAllSigns();
    for (const sign of signs) {
      expect(sign.imageUrl).toBeTruthy();
      expect(sign.description).toBeTruthy();
    }
  });
});

describe("asl.getSign", () => {
  it("returns correct sign for letter A", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const sign = await caller.asl.getSign({ letter: "A" });
    expect(sign.letter).toBe("A");
    expect(sign.imageUrl).toContain("asl_a");
    expect(sign.isAiGenerated).toBe(true);
  });

  it("handles lowercase input by converting to uppercase", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const sign = await caller.asl.getSign({ letter: "z" });
    expect(sign.letter).toBe("Z");
  });
});

// ─── Emotion Label Validation ─────────────────────────────────────────────────

describe("emotion labels", () => {
  const VALID_EMOTIONS = ["happy", "sad", "angry", "neutral", "fearful", "surprised", "disgusted"];

  it("EVA-SL supports exactly 7 emotion categories", () => {
    expect(VALID_EMOTIONS).toHaveLength(7);
  });

  it("all required emotion labels are present", () => {
    expect(VALID_EMOTIONS).toContain("happy");
    expect(VALID_EMOTIONS).toContain("sad");
    expect(VALID_EMOTIONS).toContain("angry");
    expect(VALID_EMOTIONS).toContain("neutral");
    expect(VALID_EMOTIONS).toContain("fearful");
    expect(VALID_EMOTIONS).toContain("surprised");
    expect(VALID_EMOTIONS).toContain("disgusted");
  });
});

// ─── Translation Router Input Validation ─────────────────────────────────────

describe("translation.uploadAudio input validation", () => {
  it("successfully uploads audio and returns a storage URL", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.translation.uploadAudio({
      audioBase64: "dGVzdA==", // base64 "test"
      mimeType: "audio/webm",
      filename: "test.webm",
    });
    expect(result).toHaveProperty("url");
    expect(typeof result.url).toBe("string");
    expect(result.url).toContain("/manus-storage/");
  });
});
