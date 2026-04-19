import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2, Globe, Sparkles, RefreshCw, ChevronDown, Type
} from "lucide-react";

type Emotion = "happy" | "sad" | "angry" | "neutral" | "fearful" | "surprised" | "disgusted";
type Language = "en" | "ar";

const EMOTION_CONFIG: Record<Emotion, {
  color: string; bg: string; gradient: string; label: string; emoji: string; description: string;
}> = {
  happy: {
    color: "oklch(0.85 0.18 85)", bg: "oklch(0.85 0.18 85 / 0.08)",
    gradient: "linear-gradient(135deg, oklch(0.85 0.18 85 / 0.15), oklch(0.8 0.2 70 / 0.08))",
    label: "Happy", emoji: "😊", description: "Joyful, positive energy detected"
  },
  sad: {
    color: "oklch(0.55 0.18 240)", bg: "oklch(0.55 0.18 240 / 0.08)",
    gradient: "linear-gradient(135deg, oklch(0.55 0.18 240 / 0.15), oklch(0.5 0.15 250 / 0.08))",
    label: "Sad", emoji: "😢", description: "Melancholic, sorrowful tone detected"
  },
  angry: {
    color: "oklch(0.55 0.25 20)", bg: "oklch(0.55 0.25 20 / 0.08)",
    gradient: "linear-gradient(135deg, oklch(0.55 0.25 20 / 0.15), oklch(0.5 0.22 30 / 0.08))",
    label: "Angry", emoji: "😠", description: "Intense, aggressive tone detected"
  },
  neutral: {
    color: "oklch(0.65 0.05 260)", bg: "oklch(0.65 0.05 260 / 0.06)",
    gradient: "linear-gradient(135deg, oklch(0.65 0.05 260 / 0.1), oklch(0.6 0.04 270 / 0.06))",
    label: "Neutral", emoji: "😐", description: "Calm, balanced tone detected"
  },
  fearful: {
    color: "oklch(0.55 0.2 300)", bg: "oklch(0.55 0.2 300 / 0.08)",
    gradient: "linear-gradient(135deg, oklch(0.55 0.2 300 / 0.15), oklch(0.5 0.18 310 / 0.08))",
    label: "Fearful", emoji: "😨", description: "Anxious, fearful tone detected"
  },
  surprised: {
    color: "oklch(0.75 0.2 55)", bg: "oklch(0.75 0.2 55 / 0.08)",
    gradient: "linear-gradient(135deg, oklch(0.75 0.2 55 / 0.15), oklch(0.7 0.18 65 / 0.08))",
    label: "Surprised", emoji: "😲", description: "Astonished, unexpected tone detected"
  },
  disgusted: {
    color: "oklch(0.5 0.2 145)", bg: "oklch(0.5 0.2 145 / 0.08)",
    gradient: "linear-gradient(135deg, oklch(0.5 0.2 145 / 0.15), oklch(0.45 0.18 155 / 0.08))",
    label: "Disgusted", emoji: "🤢", description: "Repulsed, aversive tone detected"
  },
};

interface AslChar { char: string; imageUrl: string | null; }

interface TranslationResult {
  transcription: string;
  detectedLanguage: string;
  emotion: Emotion;
  emotionConfidence: number;
  emotionReasoning: string;
  aslChars: AslChar[];
}

export default function Translate() {
  const [language, setLanguage] = useState<Language>("en");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [activeAslIndex, setActiveAslIndex] = useState<number | null>(null);

  const processTextMutation = trpc.translation.processText.useMutation();
  const isLoading = processTextMutation.isPending;

  const handleTranslate = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      toast.error("Please enter some text first.");
      return;
    }
    try {
      const res = await processTextMutation.mutateAsync({
        text: trimmed,
        language,
      });
      setResult(res as TranslationResult);
      setActiveAslIndex(null);
    } catch (err) {
      toast.error("Processing failed. Please try again.");
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const handleReset = () => {
    setInputText("");
    setResult(null);
    setActiveAslIndex(null);
  };

  const emotion = result?.emotion ?? "neutral";
  const emotionCfg = EMOTION_CONFIG[emotion];

  return (
    <div
      className="min-h-screen transition-all duration-1000"
      style={{ background: result ? emotionCfg.gradient : undefined }}
    >
      <div className="container py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            EVA-SL Translator
          </h1>
          <p className="text-muted-foreground text-sm">
            Type your text — the system detects emotion and renders ASL signs automatically
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Language Selector */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Input Language</span>
            </div>
            <div className="flex gap-3">
              {(["en", "ar"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    language === lang
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {lang === "en" ? "🇺🇸 English" : "🇸🇦 Arabic (العربية)"}
                </button>
              ))}
            </div>
          </div>

          {/* Text Input */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Type className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Enter Text</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {inputText.length} / 2000
              </span>
            </div>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                language === "ar"
                  ? "اكتب نصك هنا... (اضغط Enter للترجمة)"
                  : "Type your text here... (Press Enter to translate)"
              }
              dir={language === "ar" ? "rtl" : "ltr"}
              rows={5}
              maxLength={2000}
              disabled={isLoading}
              className="resize-none text-base bg-background/50 border-border/40 focus:border-primary/60 placeholder:text-muted-foreground/50"
            />
            <p className="text-xs text-muted-foreground/60 mt-2">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-xs font-mono">Enter</kbd> to translate · <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-xs font-mono">Shift+Enter</kbd> for new line
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-purple"
              onClick={handleTranslate}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing emotion &amp; rendering ASL...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Translate &amp; Detect Emotion
                </>
              )}
            </Button>
            {(inputText || result) && (
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-5"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Emotion Result */}
              <div
                className="rounded-2xl p-6 border transition-all duration-500"
                style={{
                  background: emotionCfg.bg,
                  borderColor: `${emotionCfg.color}40`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{emotionCfg.emoji}</span>
                    <div>
                      <h3 className="text-xl font-display font-bold" style={{ color: emotionCfg.color }}>
                        {emotionCfg.label}
                      </h3>
                      <p className="text-xs text-muted-foreground">{emotionCfg.description}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: `${emotionCfg.color}50`, color: emotionCfg.color }}
                  >
                    {Math.round(result.emotionConfidence * 100)}% confidence
                  </Badge>
                </div>

                {/* Confidence bar */}
                <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${result.emotionConfidence * 100}%`,
                      background: emotionCfg.color,
                    }}
                  />
                </div>

                {result.emotionReasoning && (
                  <p className="mt-3 text-xs text-muted-foreground italic">
                    "{result.emotionReasoning}"
                  </p>
                )}
              </div>

              {/* ASL Rendering */}
              {result.aslChars.length > 0 && (
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-sm font-medium text-foreground">ASL Sign Language</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {result.aslChars.filter(c => c.char !== " ").length} characters
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {result.aslChars.map((aslChar, idx) => (
                      aslChar.char === " " ? (
                        <div key={idx} className="w-4" />
                      ) : (
                        <button
                          key={idx}
                          onClick={() => setActiveAslIndex(activeAslIndex === idx ? null : idx)}
                          className={`group relative flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all asl-flip-in ${
                            activeAslIndex === idx
                              ? "border-primary bg-primary/15 scale-110"
                              : "border-border/30 hover:border-primary/40 hover:bg-card/60"
                          }`}
                          style={{ animationDelay: `${idx * 0.04}s` }}
                        >
                          {aslChar.imageUrl ? (
                            <img
                              src={aslChar.imageUrl}
                              alt={`ASL ${aslChar.char}`}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">?</span>
                            </div>
                          )}
                          <span className="text-xs font-mono font-bold text-muted-foreground group-hover:text-foreground">
                            {aslChar.char}
                          </span>
                        </button>
                      )
                    ))}
                  </div>

                  {/* Expanded view */}
                  {activeAslIndex !== null && result.aslChars[activeAslIndex]?.imageUrl && (
                    <div className="mt-5 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-5 animate-fade-in-up">
                      <img
                        src={result.aslChars[activeAslIndex].imageUrl!}
                        alt={`ASL ${result.aslChars[activeAslIndex].char}`}
                        className="w-24 h-24 object-cover rounded-xl border border-border/40"
                      />
                      <div>
                        <p className="text-2xl font-display font-bold text-primary mb-1">
                          {result.aslChars[activeAslIndex].char}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ASL hand sign for letter "{result.aslChars[activeAslIndex].char}"
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Click another letter to compare
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground/60 mt-4 flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" />
                    Click any sign to view it enlarged
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
