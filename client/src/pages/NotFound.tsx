import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-6xl font-display font-bold gradient-text mb-4">404</h1>
        <h2 className="text-xl font-display font-semibold text-foreground mb-3">Page Not Found</h2>
        <p className="text-muted-foreground text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to EVA-SL
          </Button>
        </Link>
      </div>
    </div>
  );
}
