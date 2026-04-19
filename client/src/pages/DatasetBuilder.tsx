import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Mic, Square, Database, Upload, CheckCircle2,
  Loader2, User, Globe, MessageSquare, BarChart3
} from "lucide-react";

type Emotion = "happy" | "sad" | "angry" | "neutral" | "fearful" | "surprised" | "disgusted";

const EMOTIONS: { value: Emotion; label: string; emoji: string; color: string }[] = [
  { value: "happy", label: "Happy", emoji: "😊", color: "oklch(0.85 0.18 85)" },
  { value: "sad", label: "Sad", emoji: "😢", color: "oklch(0.55 0.18 240)" },
  { value: "angry", label: "Angry", emoji: "😠", color: "oklch(0.55 0.25 20)" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "oklch(0.65 0.05 260)" },
  { value: "fearful", label: "Fearful", emoji: "😨", color: "oklch(0.55 0.2 300)" },
  { value: "surprised", label: "Surprised", emoji: "😲", color: "oklch(0.75 0.2 55)" },
  { value: "disgusted", label: "Disgusted", emoji: "🤢", color: "oklch(0.5 0.2 145)" },
];

const DIALECTS = ["Gulf", "Egyptian", "Levantine", "Moroccan", "Iraqi", "Yemeni", "Other"];

export default function DatasetBuilder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>("neutral");
  const [speakerAge, setSpeakerAge] = useState("");
  const [speakerGender, setSpeakerGender] = useState<"male" | "female" | "other">("male");
  const [dialect, setDialect] = useState("Gulf");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: stats, refetch: refetchStats } = trpc.dataset.getStats.useQuery();
  const { data: samples = [], refetch: refetchSamples } = trpc.dataset.getSamples.useQuery({ limit: 20 });
  const saveMutation = trpc.dataset.saveSample.useMutation();

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
      toast.error("Microphone access denied.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const handleSubmit = async () => {
    if (!audioBlob) {
      toast.error("Please record audio first.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        await saveMutation.mutateAsync({
          audioBase64: base64,
          mimeType: "audio/webm",
          emotion: selectedEmotion,
          speakerAge: speakerAge ? parseInt(speakerAge) : undefined,
          speakerGender,
          dialect,
          notes: notes || undefined,
        });
        toast.success("Sample saved to dataset!");
        setSubmitted(true);
        setAudioBlob(null);
        setNotes("");
        setTimeout(() => setSubmitted(false), 3000);
        refetchStats();
        refetchSamples();
      } catch {
        toast.error("Failed to save sample.");
      }
    };
  };

  return (
    <div className="min-h-screen py-10">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Research Dataset
            </Badge>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            Arabic Emotional Speech Dataset Builder
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
            Contribute to the first Arabic emotional speech dataset for sign language research.
            Record samples in any Arabic dialect and label them by emotion.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold gradient-text">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Samples</p>
            </div>
            {stats.byEmotion.slice(0, 3).map((e) => (
              <div key={e.emotion} className="glass rounded-xl p-4 text-center">
                <p className="text-2xl font-display font-bold text-foreground">{e.count}</p>
                <p className="text-xs text-muted-foreground capitalize">{e.emotion}</p>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-5">
          {/* Step 1: Record */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <span className="text-sm font-semibold text-foreground">Record Arabic Speech</span>
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={saveMutation.isPending}
              className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                isRecording
                  ? "border-destructive bg-destructive/10 text-destructive recording-pulse"
                  : audioBlob
                  ? "border-primary/50 bg-primary/5 text-primary"
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
              ) : audioBlob ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  <span className="text-xs font-semibold">Recording Ready — Click to Re-record</span>
                </>
              ) : (
                <>
                  <Mic className="w-7 h-7" />
                  <span className="text-sm font-medium">Click to Record Arabic Speech</span>
                  <span className="text-xs text-muted-foreground/60">Speak naturally in any Arabic dialect</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2: Emotion Label */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <span className="text-sm font-semibold text-foreground">Label the Emotion</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {EMOTIONS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setSelectedEmotion(e.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                    selectedEmotion === e.value
                      ? "border-2 scale-105"
                      : "border-border/30 hover:border-border/60"
                  }`}
                  style={
                    selectedEmotion === e.value
                      ? { borderColor: e.color, background: `${e.color}15` }
                      : {}
                  }
                >
                  <span className="text-xl">{e.emoji}</span>
                  <span className="text-xs font-medium text-muted-foreground">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Metadata */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <span className="text-sm font-semibold text-foreground">Speaker Metadata (Optional)</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Age
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 25"
                  value={speakerAge}
                  onChange={(e) => setSpeakerAge(e.target.value)}
                  className="bg-card/50 border-border/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Gender
                </label>
                <div className="flex gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setSpeakerGender(g)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all capitalize ${
                        speakerGender === g
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border/40 text-muted-foreground hover:border-border"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Dialect
                </label>
                <select
                  value={dialect}
                  onChange={(e) => setDialect(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border/40 bg-card/50 text-sm text-foreground px-3"
                >
                  {DIALECTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Notes
                </label>
                <Input
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-card/50 border-border/40"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            size="lg"
            className="w-full h-13 text-base font-semibold bg-primary hover:bg-primary/90 glow-purple"
            onClick={handleSubmit}
            disabled={!audioBlob || saveMutation.isPending || isRecording}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving & auto-transcribing...
              </>
            ) : submitted ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Save to Dataset
              </>
            )}
          </Button>

          {/* Recent Samples */}
          {samples.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Recent Contributions</span>
              </div>
              <div className="space-y-2">
                {samples.slice(0, 8).map((sample) => {
                  const emotionInfo = EMOTIONS.find(e => e.value === sample.emotion);
                  return (
                    <div
                      key={sample.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-card/40 border border-border/20"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{emotionInfo?.emoji}</span>
                        <span className="text-xs font-medium text-foreground capitalize">{sample.emotion}</span>
                        <span className="text-xs text-muted-foreground">· {sample.dialect}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(sample.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
