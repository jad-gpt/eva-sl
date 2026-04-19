import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, LogIn, Clock, Globe, Trash2 } from "lucide-react";

const EMOTION_EMOJIS: Record<string, string> = {
  happy: "😊", sad: "😢", angry: "😠",
  neutral: "😐", fearful: "😨", surprised: "😲", disgusted: "🤢",
};

const EMOTION_COLORS: Record<string, string> = {
  happy: "oklch(0.85 0.18 85)",
  sad: "oklch(0.55 0.18 240)",
  angry: "oklch(0.55 0.25 20)",
  neutral: "oklch(0.65 0.05 260)",
  fearful: "oklch(0.55 0.2 300)",
  surprised: "oklch(0.75 0.2 55)",
  disgusted: "oklch(0.5 0.2 145)",
};

export default function History() {
  const { isAuthenticated } = useAuth();
  const { data: history = [], isLoading } = trpc.translation.history.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <HistoryIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground mb-3">
            Sign In to View History
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your translation history is saved per account. Sign in to access your personal records.
          </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="container">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HistoryIcon className="w-5 h-5 text-primary" />
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Personal Records
            </Badge>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            Translation History
          </h1>
          <p className="text-muted-foreground text-sm">
            Your personal EVA-SL translation records
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-card/40 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl">
              <HistoryIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No translations yet</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Start translating to build your history
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item: { id: number; emotion: string; originalText: string | null; language: string; emotionConfidence: number | null; createdAt: Date }) => {
                const color = EMOTION_COLORS[item.emotion] ?? "oklch(0.65 0.05 260)";
                return (
                  <div
                    key={item.id}
                    className="glass rounded-2xl p-5 border border-border/30 hover:border-border/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                        >
                          {EMOTION_EMOJIS[item.emotion] ?? "😐"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium text-foreground truncate"
                            dir={item.language === "ar" ? "rtl" : "ltr"}
                          >
                            {item.originalText || (
                              <span className="text-muted-foreground italic">No transcription</span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0.5"
                              style={{ borderColor: `${color}40`, color }}
                            >
                              {item.emotion}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Globe className="w-3 h-3" />
                              {item.language === "ar" ? "Arabic" : "English"}
                            </span>
                            {item.emotionConfidence && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round((item.emotionConfidence ?? 0) * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
