import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Sparkles, Info } from "lucide-react";

export default function ASLGallery() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: signs = [], isLoading } = trpc.asl.getAllSigns.useQuery();

  const filtered = signs.filter((s) =>
    s.letter.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSign = signs.find((s) => s.letter === selected);

  return (
    <div className="min-h-screen py-10">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Custom Dataset
            </Badge>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            ASL Character Dataset
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            The complete A–Z American Sign Language fingerspelling dataset used by EVA-SL.
            Letters A–M are AI-generated using DALL-E 3; N–Z use structured reference illustrations.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
          {[
            { label: "Total Signs", value: "26" },
            { label: "AI-Generated", value: "13" },
            { label: "Coverage", value: "A–Z" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-display font-bold gradient-text">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="max-w-sm mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by letter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card/50 border-border/40 focus:border-primary/50"
          />
        </div>

        {/* Selected Sign Detail */}
        {selectedSign && (
          <div className="max-w-md mx-auto mb-8 glass rounded-2xl p-6 border border-primary/30 animate-fade-in-up">
            <div className="flex items-center gap-5">
              <img
                src={selectedSign.imageUrl}
                alt={`ASL ${selectedSign.letter}`}
                className="w-28 h-28 object-cover rounded-xl border border-border/40"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl font-display font-bold gradient-text">
                    {selectedSign.letter}
                  </span>
                  {selectedSign.isAiGenerated && (
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      <Sparkles className="w-2.5 h-2.5 mr-1" />
                      AI-Generated
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedSign.description}
                </p>
                <button
                  className="mt-3 text-xs text-muted-foreground/60 hover:text-muted-foreground"
                  onClick={() => setSelected(null)}
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-4xl mx-auto">
            {Array.from({ length: 26 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-card/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 max-w-4xl mx-auto">
            {filtered.map((sign) => (
              <button
                key={sign.letter}
                onClick={() => setSelected(selected === sign.letter ? null : sign.letter)}
                className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all asl-flip-in ${
                  selected === sign.letter
                    ? "border-primary bg-primary/15 scale-105 glow-purple"
                    : "border-border/30 bg-card/30 hover:border-primary/40 hover:bg-card/60 hover:scale-105"
                }`}
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                  <img
                    src={sign.imageUrl}
                    alt={`ASL ${sign.letter}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {sign.isAiGenerated && (
                    <div className="absolute top-1 right-1">
                      <Sparkles className="w-2.5 h-2.5 text-primary drop-shadow" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                  {sign.letter}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>AI-Generated (DALL-E 3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            <span>Structured Reference Illustration</span>
          </div>
        </div>
      </div>
    </div>
  );
}
