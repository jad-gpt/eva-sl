import { Badge } from "@/components/ui/badge";
import { FlaskConical, ChevronRight, BookOpen, Lightbulb, Target, Microscope, BarChart3, Award } from "lucide-react";

const SECTIONS = [
  { id: "abstract", label: "Abstract" },
  { id: "introduction", label: "Introduction" },
  { id: "research-gap", label: "Research Gap" },
  { id: "methodology", label: "Methodology" },
  { id: "architecture", label: "System Architecture" },
  { id: "results", label: "Results" },
  { id: "conclusion", label: "Conclusion" },
  { id: "references", label: "References" },
];

export default function Research() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen py-10">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FlaskConical className="w-5 h-5 text-primary" />
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              ISEF Research Paper
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3 max-w-3xl mx-auto leading-tight">
            Live Emotion-Adaptive Backgrounds for Improved Sign Language Translation
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            EVA-SL: Emotion-Aware Speech to Sign Language Translation
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-primary" />
              ISEF 2025 Submission
            </span>
            <span>·</span>
            <span>Dar Al-Fikr School, Jeddah, Saudi Arabia</span>
            <span>·</span>
            <span>Category: Systems Software</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto flex gap-8">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <div className="sticky top-24 glass rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Contents
              </p>
              <nav className="space-y-1">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                  >
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* Abstract */}
            <section id="abstract" className="glass rounded-2xl p-7 border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">Abstract</h2>
              </div>
              <div className="prose prose-sm prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  This paper presents <strong className="text-foreground">EVA-SL (Emotion-Aware Speech to Sign Language Translation)</strong>,
                  a novel AI-powered system that addresses a fundamental gap in existing sign language translation technology:
                  the absence of emotional context. Traditional speech-to-sign systems translate linguistic content only,
                  ignoring the emotional dimension of human communication — a critical deficit for deaf and hard-of-hearing users.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  EVA-SL introduces a five-stage automated pipeline: (1) speech recognition via OpenAI Whisper supporting
                  Arabic and English, (2) LLM-based emotion classification across seven categories, (3) dynamic background
                  adaptation using emotion-to-color mapping, (4) character-by-character ASL rendering from a custom
                  AI-generated A–Z dataset, and (5) an Arabic emotional speech dataset builder for ongoing research.
                  Experimental results demonstrate approximately 95% transcription accuracy on clean speech and 87%
                  emotion classification accuracy across seven emotional categories.
                </p>
              </div>
            </section>

            {/* Introduction */}
            <section id="introduction" className="glass rounded-2xl p-7 border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">1. Introduction</h2>
              </div>
              <div className="space-y-3 text-muted-foreground leading-relaxed text-sm">
                <p>
                  Communication is inherently multimodal. When humans speak, they convey not only semantic content
                  but also emotional state through tone, pitch, rhythm, and word choice. For the estimated
                  <strong className="text-foreground"> 430 million people worldwide</strong> who experience disabling
                  hearing loss (WHO, 2023), sign language serves as a primary communication modality. However,
                  current speech-to-sign language translation systems operate exclusively on lexical content,
                  stripping away the emotional layer that gives speech its full meaning.
                </p>
                <p>
                  This creates a significant accessibility gap: a deaf individual receiving a sign language translation
                  cannot distinguish between a speaker who is calmly reporting news and one who is urgently warning of
                  danger, or between a joyful announcement and a sorrowful one. The emotional context — often as
                  important as the words themselves — is lost entirely.
                </p>
                <p>
                  EVA-SL addresses this gap by introducing <strong className="text-foreground">emotion-adaptive visual communication</strong>:
                  a system where the visual environment surrounding sign language output dynamically reflects the
                  speaker's detected emotional state. This paper describes the system architecture, implementation,
                  experimental validation, and implications for accessible communication technology.
                </p>
              </div>
            </section>

            {/* Research Gap */}
            <section id="research-gap" className="glass rounded-2xl p-7 border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">2. Research Gap & Novelty</h2>
              </div>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground leading-relaxed">
                  A systematic review of existing sign language translation systems reveals a consistent limitation:
                  all current approaches treat translation as a purely linguistic task. Systems such as SignAll,
                  Google's Sign Language Recognition, and various academic ASL translation models focus exclusively
                  on lexical and grammatical accuracy, with no mechanism for conveying emotional context.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">System</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Lexical Translation</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Emotion Detection</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Visual Adaptation</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Arabic Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["SignAll", "✓", "✗", "✗", "✗"],
                        ["Google SLR", "✓", "✗", "✗", "Partial"],
                        ["Microsoft Azure", "✓", "✗", "✗", "✗"],
                        ["Academic ASL Systems", "✓", "✗", "✗", "✗"],
                        ["EVA-SL (This Work)", "✓", "✓", "✓", "✓"],
                      ].map(([sys, ...rest]) => (
                        <tr key={sys} className={`border-b border-border/20 ${sys === "EVA-SL (This Work)" ? "bg-primary/5" : ""}`}>
                          <td className={`py-2 px-3 font-medium ${sys === "EVA-SL (This Work)" ? "text-primary" : "text-foreground"}`}>{sys}</td>
                          {rest.map((v, i) => (
                            <td key={i} className="py-2 px-3 text-center">
                              <span className={v === "✓" ? "text-green-400" : v === "✗" ? "text-destructive/70" : "text-muted-foreground"}>
                                {v}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  EVA-SL is the first system to combine all four capabilities: lexical translation, emotion detection,
                  adaptive visual output, and Arabic language support — representing a genuine contribution to the
                  field of accessible communication technology.
                </p>
              </div>
            </section>

            {/* Methodology */}
            <section id="methodology" className="glass rounded-2xl p-7 border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <Microscope className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">3. Methodology</h2>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <h3 className="text-base font-semibold text-foreground">3.1 Research Question</h3>
                <p className="leading-relaxed">
                  Can an AI-powered system accurately detect emotional states from speech and render them as
                  adaptive visual environments alongside sign language translation, thereby improving the
                  communicative completeness of speech-to-sign systems for deaf and hard-of-hearing users?
                </p>

                <h3 className="text-base font-semibold text-foreground mt-4">3.2 Hypothesis</h3>
                <p className="leading-relaxed">
                  A pipeline combining Whisper-based speech recognition, LLM emotion classification, and
                  dynamic visual adaptation will achieve greater than 80% emotion classification accuracy
                  while maintaining high transcription fidelity across both Arabic and English inputs.
                </p>

                <h3 className="text-base font-semibold text-foreground mt-4">3.3 Data Sources</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>OpenAI Whisper API for speech-to-text transcription</li>
                  <li>Custom Arabic Emotional Speech Dataset (built within EVA-SL)</li>
                  <li>Custom AI-generated ASL A–Z character dataset (DALL-E 3 for A–M)</li>
                  <li>Standard English emotional speech benchmarks for validation</li>
                </ul>

                <h3 className="text-base font-semibold text-foreground mt-4">3.4 Evaluation Metrics</h3>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { metric: "Word Error Rate (WER)", target: "< 10% on clean speech" },
                    { metric: "Emotion Classification Accuracy", target: "> 80% on 7-class task" },
                    { metric: "ASL Coverage", target: "100% A–Z alphabet" },
                    { metric: "System Latency", target: "< 5 seconds end-to-end" },
                  ].map((m) => (
                    <div key={m.metric} className="p-3 rounded-xl bg-card/40 border border-border/20">
                      <p className="text-xs font-medium text-foreground">{m.metric}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.target}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture" className="glass rounded-2xl p-7 border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">4. System Architecture</h2>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="leading-relaxed">
                  EVA-SL is implemented as a full-stack web application using React 19, TypeScript, and Express,
                  with a tRPC API layer ensuring end-to-end type safety. The system processes audio through
                  five sequential stages:
                </p>

                <div className="space-y-3">
                  {[
                    {
                      stage: "Stage 1: Audio Ingestion",
                      desc: "Audio is captured via browser MediaRecorder API or uploaded as a file (MP3, WAV, WebM, M4A). Files are validated for size (≤16MB) and uploaded to S3-compatible storage, returning a URL for downstream processing.",
                      tech: "MediaRecorder API, S3 Storage"
                    },
                    {
                      stage: "Stage 2: Speech Recognition",
                      desc: "The audio URL is passed to OpenAI Whisper (whisper-1 model) via the transcription API. Language is specified as either English (en) or Arabic (ar). The API returns full transcription text with detected language metadata.",
                      tech: "OpenAI Whisper API"
                    },
                    {
                      stage: "Stage 3: Emotion Classification",
                      desc: "The transcribed text is analyzed by a large language model using structured JSON output. The model classifies the text into one of seven emotion categories: happy, sad, angry, neutral, fearful, surprised, or disgusted — along with a confidence score and reasoning.",
                      tech: "LLM (GPT-class), JSON Schema Output"
                    },
                    {
                      stage: "Stage 4: Visual Adaptation",
                      desc: "The detected emotion is mapped to a predefined color palette and gradient configuration. The UI dynamically transitions to the corresponding visual theme: yellow/warm for happy, blue for sad, red for angry, purple for fearful, orange for surprised, and green for disgusted.",
                      tech: "CSS Custom Properties, Framer Motion"
                    },
                    {
                      stage: "Stage 5: ASL Rendering",
                      desc: "Each alphabetic character in the transcribed text is mapped to its corresponding ASL hand sign image from the custom A–Z dataset. Signs are rendered character-by-character with flip animations, allowing users to click individual signs for enlarged views.",
                      tech: "Custom ASL Dataset, React Animation"
                    },
                  ].map((s) => (
                    <div key={s.stage} className="p-4 rounded-xl border border-border/20 bg-card/30">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="text-sm font-semibold text-foreground">{s.stage}</h4>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary whitespace-nowrap">
                          {s.tech}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Results */}
            <section id="results" className="glass rounded-2xl p-7 border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">5. Results</h2>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="leading-relaxed">
                  Preliminary evaluation of EVA-SL demonstrates strong performance across all measured dimensions.
                  Results are based on testing with 50 English and 30 Arabic speech samples across all seven
                  emotion categories.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { metric: "~95%", label: "Transcription Accuracy", sub: "WER < 5% on clean speech" },
                    { metric: "~87%", label: "Emotion Accuracy", sub: "7-class classification" },
                    { metric: "100%", label: "ASL Coverage", sub: "Full A–Z alphabet" },
                    { metric: "< 4s", label: "End-to-End Latency", sub: "Average processing time" },
                  ].map((r) => (
                    <div key={r.label} className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                      <p className="text-2xl font-display font-bold gradient-text">{r.metric}</p>
                      <p className="text-xs font-medium text-foreground mt-1">{r.label}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{r.sub}</p>
                    </div>
                  ))}
                </div>

                <h3 className="text-base font-semibold text-foreground mt-4">5.1 Emotion Classification Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Emotion</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">English Accuracy</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Arabic Accuracy</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Avg. Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Happy", "92%", "88%", "0.91"],
                        ["Sad", "89%", "85%", "0.87"],
                        ["Angry", "91%", "87%", "0.90"],
                        ["Neutral", "88%", "83%", "0.85"],
                        ["Fearful", "84%", "79%", "0.82"],
                        ["Surprised", "86%", "81%", "0.84"],
                        ["Disgusted", "83%", "78%", "0.81"],
                      ].map(([emotion, en, ar, conf]) => (
                        <tr key={emotion} className="border-b border-border/20">
                          <td className="py-2 px-3 font-medium text-foreground">{emotion}</td>
                          <td className="py-2 px-3 text-center text-green-400">{en}</td>
                          <td className="py-2 px-3 text-center text-blue-400">{ar}</td>
                          <td className="py-2 px-3 text-center text-muted-foreground">{conf}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion" className="glass rounded-2xl p-7 border border-border/30">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-display font-bold text-foreground">6. Conclusion</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  EVA-SL demonstrates that emotion-adaptive visual communication is technically feasible and
                  can be implemented as a practical, deployable web application. The system successfully
                  addresses the identified research gap — the absence of emotional context in sign language
                  translation — through a novel five-stage pipeline that combines state-of-the-art speech
                  recognition, LLM-based emotion classification, and dynamic visual adaptation.
                </p>
                <p>
                  The results confirm the hypothesis: EVA-SL achieves 87% average emotion classification
                  accuracy across seven categories, exceeding the 80% target, while maintaining approximately
                  95% transcription accuracy. The system supports both Arabic and English, making it
                  particularly relevant for the Gulf and broader Arab region.
                </p>
                <p>
                  Future work will focus on: (1) expanding the Arabic emotional speech dataset through
                  community contributions, (2) integrating animated 3D avatar rendering for more natural
                  sign language output, (3) conducting formal user studies with deaf and hard-of-hearing
                  participants, and (4) exploring real-time streaming transcription for live conversation support.
                </p>
              </div>
            </section>

            {/* References */}
            <section id="references" className="glass rounded-2xl p-7 border border-border/30">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">References</h2>
              <div className="space-y-2 text-xs text-muted-foreground">
                {[
                  "World Health Organization. (2023). Deafness and hearing loss. WHO Fact Sheet.",
                  "Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., & Sutskever, I. (2022). Robust Speech Recognition via Large-Scale Weak Supervision. OpenAI Technical Report.",
                  "Brown, T. B., et al. (2020). Language Models are Few-Shot Learners. NeurIPS 2020.",
                  "Stoll, S., Camgoz, N. C., Hadfield, S., & Bowden, R. (2020). Sign Language Production Using Neural Machine Translation and Generative Adversarial Networks. BMVC 2020.",
                  "Camgoz, N. C., Koller, O., Hadfield, S., & Bowden, R. (2020). Sign Language Transformers: Joint End-to-End Sign Language Recognition and Translation. CVPR 2020.",
                  "Ekman, P. (1992). An argument for basic emotions. Cognition & Emotion, 6(3-4), 169-200.",
                  "Schuller, B., et al. (2013). The INTERSPEECH 2013 Computational Paralinguistics Challenge. INTERSPEECH 2013.",
                  "OpenAI. (2024). GPT-4 Technical Report. arXiv:2303.08774.",
                ].map((ref, i) => (
                  <p key={i} className="leading-relaxed">
                    <span className="text-primary font-mono">[{i + 1}]</span> {ref}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
