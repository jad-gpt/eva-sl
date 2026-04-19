import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Translate from "./pages/Translate";
import ASLGallery from "./pages/ASLGallery";
import DatasetBuilder from "./pages/DatasetBuilder";
import Dashboard from "./pages/Dashboard";
import Research from "./pages/Research";
import History from "./pages/History";
import Navbar from "./components/Navbar";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/translate" component={Translate} />
        <Route path="/asl-gallery" component={ASLGallery} />
        <Route path="/dataset" component={DatasetBuilder} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/research" component={Research} />
        <Route path="/history" component={History} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
