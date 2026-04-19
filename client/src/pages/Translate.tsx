import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Mic, MicOff, Upload, Square, Loader2, Volume2,
  Globe, Sparkles, RefreshCw, ChevronDown
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
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [activeAslIndex, setActiveAslIndex] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const uploadMutation = trpc.translation.uploadAudio.useMutation();
  const processMutation = trpc.translation.process.useMutation();

  const isLoading = uploadMutation.isPending || processMutation.isPending;

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 16MB.");
        return;
      }
      setAudioBlob(file);
      toast.success(`File loaded: ${file.name}`);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) {
      toast.error("Please record or upload audio first.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const { url } = await uploadMutation.mutateAsync({
          audioBase64: base64,
          mimeType: audioBlob.type || "audio/webm",
          filename: "recording.webm",
        });

        const res = await processMutation.mutateAsync({
          audioUrl: url,
          language,
          durationSeconds: undefined,
        });

        setResult(res as TranslationResult);
        setActiveAslIndex(null);
      };
    } catch (err) {
      toast.error("Processing failed. Please try again.");
      console.error(err);
    }
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
            Speak or upload audio — the system handles everything automatically
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

          {/* Recording Controls */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Mic className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Audio Input</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Microphone */}
              <div className="flex-1">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  className={`w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                    isRecording
                      ? "border-destructive bg-destructive/10 text-destructive recording-pulse"
                      : "border-border/40 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                  }`}
                >
                  {isRecording ? (
                    <>
                      <div className="flex gap-1 items-end h-6">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-1.5 bg-destructive rounded-full wave-bar" />
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Square className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Stop Recording</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6" />
                      <span className="text-xs font-medium">Click to Record</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center">
                <span className="text-xs text-muted-foreground font-medium">OR</span>
              </div>

              {/* File Upload */}
              <div className="flex-1">
                <label className="w-full h-24 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-muted-foreground hover:text-primary">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-medium">
                    {audioBlob && !isRecording ? "File Ready ✓" : "Upload Audio File"}
                  </span>
                  <span className="text-xs text-muted-foreground/60">MP3, WAV, WebM, M4A (max 16MB)</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>

            {audioBlob && !isRecording && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Volume2 className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Audio ready for processing</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => setAudioBlob(null)}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Process Button */}
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-purple"
            onClick={processAudio}
            disabled={!audioBlob || isLoading || isRecording}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {uploadMutation.isPending ? "Uploading audio..." : "Analyzing speech & emotion..."}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Translate & Detect Emotion
              </>
            )}
          </Button>

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
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-3xl">{emotionCfg.emoji}</span>
                      <div>
                        <h3 className="text-xl font-display font-bold" style={{ color: emotionCfg.color }}>
                          {emotionCfg.label}
                        </h3>
                        <p className="text-xs text-muted-foreground">{emotionCfg.description}</p>
                      </div>
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

              {/* Transcription */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Volume2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Transcription</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {result.detectedLanguage?.toUpperCase() ?? language.toUpperCase()}
                  </Badge>
                </div>
                <p
                  className="text-foreground leading-relaxed"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  {result.transcription || <span className="text-muted-foreground italic">No speech detected</span>}
                </p>
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
