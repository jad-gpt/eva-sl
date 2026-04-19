import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2, Globe, Sparkles, RefreshCw, Type, BookOpen, ChevronDown, ChevronUp
} from "lucide-react";
import HugoAvatar, { textToGloss, SIGNS, type HugoAvatarHandle } from "@/components/HugoAvatar";

type Emotion = "happy" | "sad" | "angry" | "neutral" | "fearful" | "surprised" | "disgusted";
type Language = "en" | "ar";

const EMOTION_CONFIG: Record<Emotion, {
  color: string; bg: string; gradient: string; label: string; emoji: string;
  sceneColor: string;
}> = {
  happy:    { color: "oklch(0.85 0.18 85)",  bg: "oklch(0.85 0.18 85 / 0.08)",  gradient: "linear-gradient(135deg, oklch(0.85 0.18 85 / 0.15), oklch(0.8 0.2 70 / 0.08))",   label: "Happy",    emoji: "😊", sceneColor: "0x3d2a00" },
  sad:      { color: "oklch(0.55 0.18 240)", bg: "oklch(0.55 0.18 240 / 0.08)", gradient: "linear-gradient(135deg, oklch(0.55 0.18 240 / 0.15), oklch(0.5 0.15 250 / 0.08))", label: "Sad",      emoji: "😢", sceneColor: "0x001a3d" },
  angry:    { color: "oklch(0.55 0.25 20)",  bg: "oklch(0.55 0.25 20 / 0.08)",  gradient: "linear-gradient(135deg, oklch(0.55 0.25 20 / 0.15), oklch(0.5 0.22 30 / 0.08))",   label: "Angry",    emoji: "😠", sceneColor: "0x3d0000" },
  neutral:  { color: "oklch(0.65 0.05 260)", bg: "oklch(0.65 0.05 260 / 0.06)", gradient: "linear-gradient(135deg, oklch(0.65 0.05 260 / 0.1), oklch(0.6 0.04 270 / 0.06))",  label: "Neutral",  emoji: "😐", sceneColor: "0x111827" },
  fearful:  { color: "oklch(0.55 0.2 300)",  bg: "oklch(0.55 0.2 300 / 0.08)",  gradient: "linear-gradient(135deg, oklch(0.55 0.2 300 / 0.15), oklch(0.5 0.18 310 / 0.08))",  label: "Fearful",  emoji: "😨", sceneColor: "0x1a003d" },
  surprised:{ color: "oklch(0.75 0.2 55)",   bg: "oklch(0.75 0.2 55 / 0.08)",   gradient: "linear-gradient(135deg, oklch(0.75 0.2 55 / 0.15), oklch(0.7 0.18 65 / 0.08))",   label: "Surprised",emoji: "😲", sceneColor: "0x2a2a00" },
  disgusted:{ color: "oklch(0.5 0.2 145)",   bg: "oklch(0.5 0.2 145 / 0.08)",   gradient: "linear-gradient(135deg, oklch(0.5 0.2 145 / 0.15), oklch(0.45 0.18 155 / 0.08))", label: "Disgusted",emoji: "🤢", sceneColor: "0x002a00" },
};

// All implemented signs for the reference panel
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const WORDS = [
  "HELLO","THANK","YOU","PLEASE","SORRY","HELP","YES","NO","LOVE","HAPPY",
  "SAD","ANGRY","GOOD","BAD","WANT","NEED","KNOW","UNDERSTAND","AGAIN","STOP",
  "GO","COME","WAIT","SEE","HEAR","FEEL","THINK","LEARN","WORK","PLAY",
  "EAT","DRINK","SLEEP","WAKE","HOME","SCHOOL","FRIEND","FAMILY","NAME","WHAT",
  "WHERE","WHEN","HOW","WHY","WHO","MORE","LESS",
  "I_AM_HAPPY","I_HATE_YOU","I_LOVE_YOU","GOOD_MORNING","GOOD_NIGHT",
];

const QUICK_PHRASES = [
  { label: "Hello!", text: "Hello" },
  { label: "Thank you", text: "Thank you" },
  { label: "I love you ❤️", text: "I love you" },
  { label: "I am happy 😊", text: "I am happy" },
  { label: "I hate you 😠", text: "I hate you" },
  { label: "Good morning", text: "Good morning" },
  { label: "Good night", text: "Good night" },
  { label: "Please help", text: "Please help" },
  { label: "Yes / No", text: "Yes No" },
  { label: "Sorry", text: "Sorry" },
];

interface TranslationResult {
  transcription: string;
  detectedLanguage: string;
  emotion: Emotion;
  emotionConfidence: number;
  emotionReasoning: string;
  aslChars: { char: string; imageUrl: string | null }[];
}

export default function Translate() {
  const [language, setLanguage] = useState<Language>("en");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [activeGloss, setActiveGloss] = useState<string[]>([]);
  const hugoRef = useRef<HugoAvatarHandle>(null);

  const processTextMutation = trpc.translation.processText.useMutation();
  const isLoading = processTextMutation.isPending;

  const triggerSigning = useCallback((text: string, _emotion: Emotion) => {
    const gloss = textToGloss(text);
    setActiveGloss(gloss);
    setIsSigning(true);
    hugoRef.current?.sign(gloss);
  }, []);

  const handleTranslate = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) { toast.error("Please enter some text first."); return; }
    try {
      const res = await processTextMutation.mutateAsync({ text: trimmed, language });
      const typed = res as TranslationResult;
      setResult(typed);
      triggerSigning(trimmed, typed.emotion);
    } catch {
      toast.error("Processing failed. Please try again.");
    }
  };

  const handleQuickPhrase = (text: string) => {
    setInputText(text);
    // Detect emotion locally for quick phrases
    const emotionMap: Record<string, Emotion> = {
      "hello": "happy", "thank you": "happy", "i love you": "happy",
      "i am happy": "happy", "good morning": "happy", "good night": "neutral",
      "i hate you": "angry", "please help": "fearful", "yes no": "neutral",
      "sorry": "sad",
    };
    const emotion = emotionMap[text.toLowerCase()] ?? "neutral";
    setResult({
      transcription: text, detectedLanguage: "en", emotion,
      emotionConfidence: 0.85, emotionReasoning: `Quick phrase: ${text}`,
      aslChars: [],
    });
    triggerSigning(text, emotion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTranslate(); }
  };

  const handleReset = () => {
    setInputText(""); setResult(null); setActiveGloss([]); setIsSigning(false);
  };

  const emotion = result?.emotion ?? "neutral";
  const emotionCfg = EMOTION_CONFIG[emotion];

  return (
    <div className="min-h-screen transition-all duration-1000" style={{ background: result ? emotionCfg.gradient : undefined }}>
      <div className="container py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">EVA-SL Translator</h1>
          <p className="text-muted-foreground text-sm">
            Hugo signs your words in real ASL — with emotion-adaptive background
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Left: Input Panel ── */}
          <div className="space-y-4">
            {/* Language */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Input Language</span>
              </div>
              <div className="flex gap-2">
                {(["en", "ar"] as Language[]).map((lang) => (
                  <button key={lang} onClick={() => setLanguage(lang)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      language === lang ? "border-primary bg-primary/15 text-primary" : "border-border/40 text-muted-foreground hover:border-border"
                    }`}>
                    {lang === "en" ? "🇺🇸 English" : "🇸🇦 Arabic"}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Enter Text</span>
                <span className="text-xs text-muted-foreground ml-auto">{inputText.length}/2000</span>
              </div>
              <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === "ar" ? "اكتب نصك هنا..." : "Type your text here... (Enter to translate)"}
                dir={language === "ar" ? "rtl" : "ltr"} rows={4} maxLength={2000} disabled={isLoading}
                className="resize-none text-base bg-background/50 border-border/40 focus:border-primary/60" />
              <p className="text-xs text-muted-foreground/60 mt-2">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-xs font-mono">Enter</kbd> to sign
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button size="lg" className="flex-1 h-12 font-semibold bg-primary hover:bg-primary/90"
                onClick={handleTranslate} disabled={!inputText.trim() || isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4 mr-2" />Translate & Sign</>}
              </Button>
              {(inputText || result) && (
                <Button size="lg" variant="outline" className="h-12 px-4" onClick={handleReset} disabled={isLoading}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Quick Phrases */}
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Quick Phrases</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PHRASES.map((qp) => (
                  <button key={qp.text} onClick={() => handleQuickPhrase(qp.text)}
                    className="px-3 py-1.5 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emotion Result */}
            {result && (
              <div className="rounded-2xl p-4 border transition-all duration-500"
                style={{ background: emotionCfg.bg, borderColor: `${emotionCfg.color}40` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{emotionCfg.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold" style={{ color: emotionCfg.color }}>{emotionCfg.label}</h3>
                    <p className="text-xs text-muted-foreground">{result.emotionReasoning}</p>
                  </div>
                  <Badge variant="outline" className="text-xs" style={{ borderColor: `${emotionCfg.color}50`, color: emotionCfg.color }}>
                    {Math.round(result.emotionConfidence * 100)}%
                  </Badge>
                </div>
                <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${result.emotionConfidence * 100}%`, background: emotionCfg.color }} />
                </div>
              </div>
            )}

            {/* Active Gloss */}
            {activeGloss.length > 0 && (
              <div className="glass rounded-2xl p-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">ASL Gloss Sequence</p>
                <div className="flex flex-wrap gap-1.5">
                  {activeGloss.map((g, i) => (
                    <span key={i} className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      SIGNS[g] ? "border-primary/40 bg-primary/10 text-primary" : "border-border/30 bg-muted/30 text-muted-foreground"
                    }`}>
                      {g.replace(/_/g, " ")}
                      {!SIGNS[g] && <span className="ml-1 text-muted-foreground/50">(spell)</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Hugo Avatar ── */}
          <div className="space-y-4">
            <div className="glass rounded-2xl overflow-hidden" style={{ height: "520px" }}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSigning ? "bg-green-400 animate-pulse" : "bg-muted-foreground/30"}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {isSigning ? "Signing..." : "Ready"}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs" style={{ borderColor: `${emotionCfg.color}50`, color: emotionCfg.color }}>
                  {emotionCfg.emoji} {emotionCfg.label}
                </Badge>
              </div>
              <div style={{ height: "calc(100% - 40px)" }}>
                <HugoAvatar
                  ref={hugoRef}
                  emotion={emotion}
                  onSignComplete={() => setIsSigning(false)}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Reference Panel Toggle */}
            <button
              onClick={() => setShowReference(!showReference)}
              className="w-full glass rounded-2xl p-3 flex items-center justify-between hover:bg-card/60 transition-all"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">ASL Sign Reference</span>
                <Badge variant="outline" className="text-xs">{ALPHABET.length + WORDS.length} signs</Badge>
              </div>
              {showReference ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showReference && (
              <div className="glass rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Alphabet (A–Z)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALPHABET.map(l => (
                      <button key={l} onClick={() => { setInputText(l); triggerSigning(l, "neutral"); setResult({ transcription: l, detectedLanguage: "en", emotion: "neutral", emotionConfidence: 0.5, emotionReasoning: "Letter sign", aslChars: [] }); }}
                        className="w-8 h-8 rounded-lg border border-border/40 text-xs font-mono font-bold text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Words & Phrases</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WORDS.map(w => (
                      <button key={w} onClick={() => {
                        const display = w.replace(/_/g, " ").toLowerCase();
                        setInputText(display);
                        triggerSigning(display, "neutral");
                        setResult({ transcription: display, detectedLanguage: "en", emotion: "neutral", emotionConfidence: 0.5, emotionReasoning: "Word sign", aslChars: [] });
                      }}
                        className="px-2.5 py-1 rounded-lg border border-border/40 text-xs font-mono text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all">
                        {w.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/60 italic">
                  Click any sign to preview it. Unknown words are fingerspelled letter by letter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
