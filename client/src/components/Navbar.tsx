import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Brain, Mic, BookOpen, Database, BarChart3, FlaskConical, History, LogOut, LogIn } from "lucide-react";

const NAV_ITEMS = [
  { href: "/translate", label: "Translate", icon: Mic },
  { href: "/asl-gallery", label: "ASL Gallery", icon: BookOpen },
  { href: "/dataset", label: "Dataset Builder", icon: Database },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/research", label: "Research", icon: FlaskConical },
  { href: "/history", label: "History", icon: History },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <Brain className="w-4.5 h-4.5 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            <span className="gradient-text">EVA</span>
            <span className="text-foreground/70">-SL</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  location === href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{user?.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <button
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    location === href
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              </Link>
            ))}
            <div className="pt-2 border-t border-border/50 mt-2">
              {isAuthenticated ? (
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user?.name})
                </button>
              ) : (
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-primary hover:bg-primary/10"
                  onClick={() => { window.location.href = getLoginUrl(); setMobileOpen(false); }}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
