import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import CreateMatch from "./pages/CreateMatch";
import LiveScoring from "./pages/LiveScoring";
import Scorecard from "./pages/Scorecard";
import MatchHistory from "./pages/MatchHistory";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  return (
    <>
      <Toaster />
      <Sonner />
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/create" element={<CreateMatch />} />
          <Route path="/score/:id" element={<LiveScoring />} />
          <Route path="/scorecard/:id" element={<Scorecard />} />
          <Route path="/history" element={<MatchHistory />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
