import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import {
  saveTranslation,
  getTranslationsByUser,
  getResearchStats,
  getAllAslSigns,
  upsertAslSign,
  saveArabicSample,
  getArabicSamples,
  getArabicSamplesCount,
  getArabicSamplesByEmotion,
  getAllTranslationsCount,
  getEmotionDistribution,
} from "./db";
import type { EmotionLabel } from "../drizzle/schema";

// ─── ASL Sign URLs ────────────────────────────────────────────────────────────
const ASL_SIGN_URLS: Record<string, string> = {
  A: "/manus-storage/asl_a_cd18191d.png",
  B: "/manus-storage/asl_b_4ee22420.png",
  C: "/manus-storage/asl_c_e778a7a9.png",
  D: "/manus-storage/asl_d_30c8f312.png",
  E: "/manus-storage/asl_e_51003395.png",
  F: "/manus-storage/asl_f_aaa35b0e.png",
  G: "/manus-storage/asl_g_f5521dd7.png",
  H: "/manus-storage/asl_h_af0a7dbe.png",
  I: "/manus-storage/asl_i_ef218a6c.png",
  J: "/manus-storage/asl_j_2db02023.png",
  K: "/manus-storage/asl_k_6e19859e.png",
  L: "/manus-storage/asl_l_c8144988.png",
  M: "/manus-storage/asl_m_77a0da82.png",
  N: "/manus-storage/asl_n_991f7500.png",
  O: "/manus-storage/asl_o_537f70d8.png",
  P: "/manus-storage/asl_p_4914ed9f.png",
  Q: "/manus-storage/asl_q_3632decf.png",
  R: "/manus-storage/asl_r_ce5c37f4.png",
  S: "/manus-storage/asl_s_8ef5574b.png",
  T: "/manus-storage/asl_t_583a75f6.png",
  U: "/manus-storage/asl_u_a53c0902.png",
  V: "/manus-storage/asl_v_32a17ebb.png",
  W: "/manus-storage/asl_w_4c4841d6.png",
  X: "/manus-storage/asl_x_604a11de.png",
  Y: "/manus-storage/asl_y_6f0e56b3.png",
  Z: "/manus-storage/asl_z_b3701e60.png",
};

const ASL_DESCRIPTIONS: Record<string, string> = {
  A: "Fist with thumb resting on side",
  B: "Four fingers extended upward, thumb tucked",
  C: "Curved hand forming letter C",
  D: "Index finger up, other fingers curved to touch thumb",
  E: "All fingers bent, thumb tucked under",
  F: "Index finger and thumb touching, others extended",
  G: "Index finger and thumb pointing sideways",
  H: "Index and middle fingers extended sideways",
  I: "Pinky finger extended upward",
  J: "Pinky extended, trace J in air",
  K: "Index and middle fingers up, thumb between them",
  L: "Index finger up, thumb extended sideways",
  M: "Three fingers folded over thumb",
  N: "Index and middle fingers folded over thumb",
  O: "All fingers curved to touch thumb, forming O",
  P: "Index finger pointing down, middle extended",
  Q: "Index finger pointing down, thumb extended",
  R: "Index and middle fingers crossed",
  S: "Fist with thumb over fingers",
  T: "Thumb between index and middle fingers",
  U: "Index and middle fingers together, extended up",
  V: "Index and middle fingers spread in V shape",
  W: "Three fingers spread (index, middle, ring)",
  X: "Index finger hooked/bent",
  Y: "Thumb and pinky extended outward",
  Z: "Index finger traces Z in the air",
};

// ─── Emotion Detection ────────────────────────────────────────────────────────
async function detectEmotion(text: string, language: string): Promise<{ emotion: EmotionLabel; confidence: number; reasoning: string }> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert emotion analysis AI for the EVA-SL research system. 
Analyze the emotional content of speech transcriptions and classify them into exactly one of these seven emotions: happy, sad, angry, neutral, fearful, surprised, disgusted.
Return a JSON object with: emotion (string), confidence (0.0-1.0), reasoning (brief explanation).
Be precise and consider linguistic cues, word choice, and context.`,
      },
      {
        role: "user",
        content: `Analyze the emotion in this ${language === "ar" ? "Arabic" : "English"} speech transcription. Text: "${text}". Return JSON only.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "emotion_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            emotion: {
              type: "string",
              enum: ["happy", "sad", "angry", "neutral", "fearful", "surprised", "disgusted"],
            },
            confidence: { type: "number" },
            reasoning: { type: "string" },
          },
          required: ["emotion", "confidence", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices?.[0]?.message?.content;
  const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
  if (!content) return { emotion: "neutral", confidence: 0.5, reasoning: "No response" };

  try {
    const parsed = JSON.parse(content);
    return {
      emotion: parsed.emotion as EmotionLabel,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      reasoning: parsed.reasoning,
    };
  } catch {
    return { emotion: "neutral", confidence: 0.5, reasoning: "Parse error" };
  }
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Translation Pipeline ─────────────────────────────────────────────────
  translation: router({
    // Transcribe audio and detect emotion
    process: publicProcedure
      .input(
        z.object({
          audioUrl: z.string(),
          language: z.enum(["en", "ar"]).default("en"),
          durationSeconds: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 1. Transcribe with Whisper
        const transcriptionResult = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
          prompt: input.language === "ar" ? "تفريغ الكلام العربي" : "Transcribe speech",
        });

        if ('error' in transcriptionResult) {
          throw new Error(transcriptionResult.error);
        }

        const transcription = transcriptionResult;
        const text = transcription.text?.trim() || "";

        // 2. Detect emotion via LLM
        const emotionResult = await detectEmotion(text, input.language);

        // 3. Save to DB
        const userId = ctx.user?.id ?? null;
        if (text) {
          await saveTranslation({
            userId: userId ?? undefined,
            originalText: text,
            language: input.language,
            emotion: emotionResult.emotion,
            emotionConfidence: emotionResult.confidence,
            audioUrl: input.audioUrl,
            durationSeconds: input.durationSeconds,
          });
        }

        // 4. Build ASL character array
        const cleanText = text.toUpperCase().replace(/[^A-Z\s]/g, "");
        const aslChars = cleanText.split("").map((char) => ({
          char,
          imageUrl: char === " " ? null : ASL_SIGN_URLS[char] ?? null,
        }));

        return {
          transcription: text,
          detectedLanguage: transcription.language,
          emotion: emotionResult.emotion,
          emotionConfidence: emotionResult.confidence,
          emotionReasoning: emotionResult.reasoning,
          aslChars,
        };
      }),

    // Process text directly (no audio — emotion detection + ASL rendering)
    processText: publicProcedure
      .input(
        z.object({
          text: z.string().min(1).max(2000),
          language: z.enum(["en", "ar"]).default("en"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const text = input.text.trim();

        // 1. Detect emotion via LLM
        const emotionResult = await detectEmotion(text, input.language);

        // 2. Save to DB
        const userId = ctx.user?.id ?? null;
        await saveTranslation({
          userId: userId ?? undefined,
          originalText: text,
          language: input.language,
          emotion: emotionResult.emotion,
          emotionConfidence: emotionResult.confidence,
        });

        // 3. Build ASL character array
        const cleanText = text.toUpperCase().replace(/[^A-Z\s]/g, "");
        const aslChars = cleanText.split("").map((char) => ({
          char,
          imageUrl: char === " " ? null : ASL_SIGN_URLS[char] ?? null,
        }));

        return {
          transcription: text,
          detectedLanguage: input.language,
          emotion: emotionResult.emotion,
          emotionConfidence: emotionResult.confidence,
          emotionReasoning: emotionResult.reasoning,
          aslChars,
        };
      }),

    // Get user's translation history
    history: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ ctx, input }) => {
        return getTranslationsByUser(ctx.user.id, input.limit);
      }),

    // Upload audio file and get URL
    uploadAudio: publicProcedure
      .input(
        z.object({
          audioBase64: z.string(),
          mimeType: z.string().default("audio/webm"),
          filename: z.string().default("recording.webm"),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.audioBase64, "base64");
        const key = `audio/${Date.now()}_${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── ASL Dataset ──────────────────────────────────────────────────────────
  asl: router({
    // Get all 26 ASL signs
    getAllSigns: publicProcedure.query(async () => {
      // Return from static data (always available)
      return Object.entries(ASL_SIGN_URLS).map(([letter, imageUrl]) => ({
        letter,
        imageUrl,
        description: ASL_DESCRIPTIONS[letter] ?? "",
        isAiGenerated: ["A","B","C","D","E","F","G","H","I","J","K","L","M"].includes(letter),
      }));
    }),

    // Get sign for a specific letter
    getSign: publicProcedure
      .input(z.object({ letter: z.string().length(1) }))
      .query(({ input }) => {
        const letter = input.letter.toUpperCase();
        return {
          letter,
          imageUrl: ASL_SIGN_URLS[letter] ?? null,
          description: ASL_DESCRIPTIONS[letter] ?? "",
          isAiGenerated: ["A","B","C","D","E","F","G","H","I","J","K","L","M"].includes(letter),
        };
      }),
  }),

  // ─── Arabic Speech Dataset Builder ───────────────────────────────────────
  dataset: router({
    // Save a new Arabic speech sample
    saveSample: publicProcedure
      .input(
        z.object({
          audioBase64: z.string(),
          mimeType: z.string().default("audio/webm"),
          emotion: z.enum(["happy", "sad", "angry", "neutral", "fearful", "surprised", "disgusted"]),
          transcription: z.string().optional(),
          speakerAge: z.number().optional(),
          speakerGender: z.enum(["male", "female", "other"]).optional(),
          dialect: z.string().default("Gulf"),
          durationSeconds: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Upload audio
        const buffer = Buffer.from(input.audioBase64, "base64");
        const key = `arabic-dataset/${Date.now()}_${input.emotion}.webm`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        // Auto-transcribe if not provided
        let transcription = input.transcription;
        if (!transcription) {
          try {
            const result = await transcribeAudio({ audioUrl: url, language: "ar" });
            transcription = 'error' in result ? '' : result.text;
          } catch {
            transcription = "";
          }
        }

        await saveArabicSample({
          userId: ctx.user?.id ?? undefined,
          audioUrl: url,
          transcription,
          emotion: input.emotion,
          speakerAge: input.speakerAge,
          speakerGender: input.speakerGender,
          dialect: input.dialect,
          durationSeconds: input.durationSeconds,
          notes: input.notes,
        });

        return { success: true, transcription };
      }),

    // Get all samples
    getSamples: publicProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return getArabicSamples(input.limit);
      }),

    // Get dataset stats
    getStats: publicProcedure.query(async () => {
      const [total, byEmotion] = await Promise.all([
        getArabicSamplesCount(),
        getArabicSamplesByEmotion(),
      ]);
      return { total, byEmotion };
    }),
  }),

  // ─── Research Dashboard ───────────────────────────────────────────────────
  research: router({
    getStats: publicProcedure.query(async () => {
      return getResearchStats();
    }),

    getEmotionDistribution: publicProcedure.query(async () => {
      return getEmotionDistribution();
    }),
  }),
});

export type AppRouter = typeof appRouter;
