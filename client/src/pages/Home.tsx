import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic, Brain, Zap, BookOpen, Database, BarChart3,
  FlaskConical, ArrowRight, Sparkles, Globe, Heart,
  ChevronRight
} from "lucide-react";

const EMOTION_COLORS = {
  happy: "oklch(0.85 0.18 85)",
  sad: "oklch(0.55 0.18 240)",
  angry: "oklch(0.55 0.25 20)",
  neutral: "oklch(0.55 0.05 260)",
  fearful: "oklch(0.55 0.2 300)",
  surprised: "oklch(0.75 0.2 55)",
  disgusted: "oklch(0.5 0.2 145)",
};

const FEATURES = [
  {
    icon: Mic,
    title: "Speech Recognition",
    desc: "OpenAI Whisper-powered transcription supporting both Arabic and English with high accuracy.",
    color: "oklch(0.65 0.22 270)",
  },
  {
    icon: Brain,
    title: "Emotion Detection",
    desc: "LLM-based classification of 7 emotional states from speech content and linguistic cues.",
    color: "oklch(0.75 0.18 200)",
  },
  {
    icon: Zap,
    title: "Adaptive Backgrounds",
    desc: "Dynamic visual environments that shift color and animation to reflect detected emotion.",
    color: "oklch(0.85 0.18 85)",
  },
  {
    icon: BookOpen,
    title: "ASL Rendering",
    desc: "Character-by-character hand sign display using our custom AI-generated A–Z dataset.",
    color: "oklch(0.65 0.25 340)",
  },
  {
    icon: Database,
    title: "Dataset Builder",
    desc: "Record and label Arabic emotional speech samples to build a first-of-its-kind dataset.",
    color: "oklch(0.5 0.2 145)",
  },
  {
    icon: FlaskConical,
    title: "ISEF Research",
    desc: "Full scientific methodology, architecture documentation, and experimental results.",
    color: "oklch(0.75 0.2 55)",
  },
];

const PIPELINE_STEPS = [
  { step: "01", label: "Speech Input", sub: "Microphone or file upload" },
  { step: "02", label: "Whisper ASR", sub: "Arabic & English transcription" },
  { step: "03", label: "Emotion AI", sub: "7-class LLM classification" },
  { step: "04", label: "Color Mapping", sub: "Emotion → visual theme" },
  { step: "05", label: "ASL Rendering", sub: "Character-by-character signs" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Ambient background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl emotion-pulse"
            style={{ background: "oklch(0.65 0.22 270 / 0.12)" }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl emotion-pulse"
            style={{ background: "oklch(0.75 0.18 200 / 0.1)", animationDelay: "1.5s" }}
          />
          <div
            className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full blur-3xl emotion-pulse"
            style={{ background: "oklch(0.65 0.25 340 / 0.08)", animationDelay: "3s" }}
          />
        </div>

        <div className="container relative z-10 text-center">
          <div className="animate-fade-in-up">
            <Badge
              variant="outline"
              className="mb-6 border-primary/30 text-primary bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-wider uppercase"
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              ISEF 2025 Research Project
            </Badge>
          </div>

          <h1
            className="animate-fade-in-up text-5xl md:text-7xl font-display font-bold tracking-tight mb-6"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="gradient-text">EVA-SL</span>
            <br />
            <span className="text-foreground/90 text-4xl md:text-5xl font-light">
              Emotion-Aware Speech to
            </span>
            <br />
            <span className="text-foreground/90 text-4xl md:text-5xl font-light">
              Sign Language
            </span>
          </h1>

          <p
            className="animate-fade-in-up text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ animationDelay: "0.2s" }}
          >
            The first AI system to bridge the emotional gap in sign language communication —
            translating speech into ASL while dynamically adapting visual environments
            to reflect the speaker's emotional state.
          </p>

          <div
            className="animate-fade-in-up flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animationDelay: "0.3s" }}
          >
            <Link href="/translate">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 text-base font-semibold glow-purple"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Translating
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/research">
              <Button
                size="lg"
                variant="outline"
                className="border-border/60 hover:border-primary/50 hover:bg-primary/5 px-8 h-12 text-base"
              >
                <FlaskConical className="w-5 h-5 mr-2" />
                Read Research Paper
              </Button>
            </Link>
          </div>

          {/* Emotion color swatches */}
          <div
            className="animate-fade-in-up mt-16 flex flex-wrap justify-center gap-3"
            style={{ animationDelay: "0.4s" }}
          >
            {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
              <div
                key={emotion}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/40 bg-card/50"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-xs text-muted-foreground capitalize">{emotion}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline ──────────────────────────────────────────────────────── */}
      <section className="py-20 border-y border-border/30 bg-card/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
              System Pipeline
            </h2>
            <p className="text-muted-foreground text-sm">
              Five automated stages from voice to visual sign language
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-0">
            {PIPELINE_STEPS.map((item, i) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center text-center px-6 py-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-3">
                    <span className="text-xs font-mono font-bold text-primary">{item.step}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-border hidden md:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Research-Grade Capabilities
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every component of EVA-SL is designed to meet ISEF scientific standards,
              combining novelty, methodology, and measurable results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-border/40 bg-card/40 hover:border-border/80 hover:bg-card/70 transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feature.color}20`, border: `1px solid ${feature.color}40` }}
                >
                  <feature.icon
                    className="w-5 h-5"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Research Gap ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-card/20 border-y border-border/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 border-destructive/30 text-destructive bg-destructive/10">
              Research Gap
            </Badge>
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">
              The Problem We Solve
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
              Traditional speech-to-sign language systems translate <strong className="text-foreground">words only</strong>.
              They do not convey emotions — tone, pitch, or feeling — making communication
              incomplete for deaf or hard-of-hearing individuals. EVA-SL introduces
              <strong className="text-primary"> emotion-adaptive visual communication</strong>,
              adding an empathetic layer that no prior system has addressed.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {[
                { label: "Traditional Systems", value: "Words only, no emotion", bad: true },
                { label: "EVA-SL Innovation", value: "Words + Emotion + Visual Context", bad: false },
                { label: "Impact", value: "Richer, more empathetic communication", bad: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`p-4 rounded-xl border ${
                    item.bad
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.bad ? "text-destructive" : "text-primary"}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Supporting Arabic & English</span>
              <Heart className="w-5 h-5 text-destructive" />
              <span className="text-sm text-muted-foreground">Built for accessibility</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Ready to Experience EVA-SL?
            </h2>
            <p className="text-muted-foreground mb-8">
              Upload a voice recording or speak directly — the system will transcribe,
              detect emotion, and render ASL automatically.
            </p>
            <Link href="/translate">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-13 text-base font-semibold glow-purple"
              >
                <Mic className="w-5 h-5 mr-2" />
                Launch Translator
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-display font-semibold gradient-text">EVA-SL</span>
            <span className="text-xs text-muted-foreground">
              — Emotion-Aware Speech to Sign Language Translation
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            ISEF Research Project · Dar Al-Fikr School · Jeddah, Saudi Arabia
          </p>
        </div>
      </footer>
    </div>
  );
}
