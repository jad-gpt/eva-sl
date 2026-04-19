import { useEffect, useRef, useState, useCallback } from "react";
import { CharacterPlayer, loadDataset, getLetterSign, type SignEntry, type Emotion } from "@/lib/characterPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RotateCcw, Zap } from "lucide-react";

const DATASET_URL = "/manus-storage/asl_letter_cf621511.json";
const ARSL_URL = "/manus-storage/arsl_letter_53967a8b.json";
const EMOTION_URL = "/manus-storage/emotion_posture_9b141e93.json";

const EMOTIONS: Emotion[] = ["happy", "sad", "angry", "neutral", "fearful", "surprised", "disgusted"];

const EMOTION_COLORS: Record<Emotion, string> = {
  happy: "#f59e0b",
  sad: "#3b82f6",
  angry: "#ef4444",
  neutral: "#64748b",
  fearful: "#7c3aed",
  surprised: "#06b6d4",
  disgusted: "#10b981",
};

const DEMO_PHRASES = [
  "HELLO",
  "LOVE",
  "EVA SL",
  "ISEF",
  "JEDDAH",
];

export default function CharacterViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<CharacterPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signs, setSigns] = useState<SignEntry[]>([]);
  const [arslSigns, setArslSigns] = useState<SignEntry[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>("neutral");
  const [inputText, setInputText] = useState("HELLO");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLetters, setActiveLetters] = useState<string[]>([]);
  const [currentLetterIdx, setCurrentLetterIdx] = useState(-1);
  const [datasetStats, setDatasetStats] = useState({ asl: 0, arsl: 0 });

  // Load datasets
  useEffect(() => {
    Promise.all([
      loadDataset(DATASET_URL),
      loadDataset(ARSL_URL),
    ]).then(([aslData, arslData]) => {
      setSigns(aslData);
      setArslSigns(arslData);
      setDatasetStats({ asl: aslData.length, arsl: arslData.length });
    }).catch(console.error);
  }, []);

  // Initialize character
  useEffect(() => {
    if (!containerRef.current) return;

    const player = new CharacterPlayer({
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      emotion: "neutral",
      onReady: () => setIsLoading(false),
    });
    playerRef.current = player;

    const handleResize = () => {
      if (containerRef.current) {
        player.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      player.dispose();
    };
  }, []);

  const handleEmotionChange = useCallback((emotion: Emotion) => {
    setCurrentEmotion(emotion);
    playerRef.current?.setEmotion(emotion);
  }, []);

  const handlePlay = useCallback(() => {
    if (!playerRef.current || signs.length === 0 || isPlaying) return;

    const chars = inputText.toUpperCase().replace(/[^A-Z0-9 ]/g, "").split("").filter(c => c !== " ");
    setActiveLetters(chars);
    setCurrentLetterIdx(0);
    setIsPlaying(true);

    const signDuration = 1200; // ms per sign
    chars.forEach((ch, i) => {
      setTimeout(() => {
        setCurrentLetterIdx(i);
        const sign = getLetterSign(signs, ch);
        if (sign) playerRef.current?.playSign(sign);
      }, i * signDuration);
    });

    setTimeout(() => {
      setIsPlaying(false);
      setCurrentLetterIdx(-1);
    }, chars.length * signDuration + 500);
  }, [inputText, signs, isPlaying]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveLetters([]);
    setCurrentLetterIdx(-1);
    playerRef.current?.setEmotion(currentEmotion);
  }, [currentEmotion]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase text-white">
              EVA-SL <span className="text-indigo-400">Character</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Hugo — Emotion-Adaptive Sign Language Character
            </p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="border-indigo-500/50 text-indigo-300 text-xs">
              ASL: {datasetStats.asl} entries
            </Badge>
            <Badge variant="outline" className="border-violet-500/50 text-violet-300 text-xs">
              ArSL: {datasetStats.arsl} entries
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Character Viewport */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0f172a]"
              style={{ height: "520px" }}>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1e] z-10">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 animate-spin border-t-indigo-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm tracking-widest uppercase">Initializing Hugo</p>
                  <p className="text-slate-600 text-xs mt-1">Loading character engine...</p>
                </div>
              )}
              <div ref={containerRef} className="w-full h-full" />

              {/* Emotion indicator overlay */}
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                  <div
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: EMOTION_COLORS[currentEmotion] }}
                  />
                  <span className="text-xs font-mono uppercase tracking-widest text-white/80">
                    {currentEmotion}
                  </span>
                </div>
              </div>

              {/* Active letter display */}
              {activeLetters.length > 0 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="flex gap-1.5 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
                    {activeLetters.map((ch, i) => (
                      <span
                        key={i}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold font-mono transition-all duration-300"
                        style={{
                          backgroundColor: i === currentLetterIdx
                            ? EMOTION_COLORS[currentEmotion]
                            : i < currentLetterIdx ? "rgba(255,255,255,0.1)" : "transparent",
                          color: i === currentLetterIdx ? "#000" : i < currentLetterIdx ? "#fff" : "#64748b",
                          transform: i === currentLetterIdx ? "scale(1.2)" : "scale(1)",
                        }}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-4 flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value.toUpperCase())}
                placeholder="Type text to sign..."
                className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                maxLength={30}
              />
              <Button
                onClick={handlePlay}
                disabled={isPlaying || isLoading || signs.length === 0}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl"
              >
                {isPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span className="ml-2">{isPlaying ? "Signing..." : "Sign It"}</span>
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-white/10 text-slate-300 hover:bg-white/5 rounded-xl px-4"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Demo phrases */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {DEMO_PHRASES.map(phrase => (
                <button
                  key={phrase}
                  onClick={() => setInputText(phrase)}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">

            {/* Emotion Selector */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Emotion Posture
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {EMOTIONS.map(emotion => (
                  <button
                    key={emotion}
                    onClick={() => handleEmotionChange(emotion)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium capitalize"
                    style={{
                      borderColor: currentEmotion === emotion ? EMOTION_COLORS[emotion] : "rgba(255,255,255,0.08)",
                      backgroundColor: currentEmotion === emotion ? `${EMOTION_COLORS[emotion]}20` : "transparent",
                      color: currentEmotion === emotion ? EMOTION_COLORS[emotion] : "#94a3b8",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: EMOTION_COLORS[emotion] }}
                    />
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            {/* Dataset Stats */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Dataset
              </h3>
              <div className="space-y-3">
                {[
                  { label: "ASL Letters (A–Z)", value: "26 base + 130 augmented", color: "#6366f1" },
                  { label: "ASL Numbers (0–9)", value: "10 base + 50 augmented", color: "#8b5cf6" },
                  { label: "ASL Phrases", value: "97 high-frequency signs", color: "#06b6d4" },
                  { label: "ArSL Letters", value: "28 base + 140 augmented", color: "#f59e0b" },
                  { label: "Emotion Postures", value: "7 body configurations", color: "#10b981" },
                  { label: "Total Entries", value: "488 keypoint records", color: "#ef4444" },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{stat.label}</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Format Info */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
                Format
              </h3>
              <div className="space-y-2 text-xs font-mono">
                {[
                  ["Standard", "MediaPipe Holistic v0.8"],
                  ["Hand LMs", "21 per hand (x, y, z, conf)"],
                  ["Pose LMs", "33 body landmarks"],
                  ["Augmentation", "5× per base entry"],
                  ["Languages", "English ASL + Arabic ArSL"],
                  ["Version", "EVA-SL Dataset v1.0"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
