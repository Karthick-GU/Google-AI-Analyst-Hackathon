import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import ProjectIntake from "./pages/ProjectIntake";
import BMCEditor from "./pages/BMCEditor";
import HypothesesDashboard from "./pages/HypothesesDashboard";
import ExperimentSuggestion from "./pages/ExperimentSuggestion";
import TestCard from "./pages/TestCard";
import LearningCard from "./pages/LearningCard";
import ProjectMetrics from "./pages/ProjectMetrics";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import NotFound from "./pages/NotFound";
import { autoImportOnStartup } from "./utils/localStorageImport";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Auto-import localStorage data on startup if empty
    autoImportOnStartup();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/new" element={<ProjectIntake />} />
            <Route path="/project/:projectId/bmc" element={<BMCEditor />} />
            <Route
              path="/project/:projectId/hypotheses"
              element={<HypothesesDashboard />}
            />
            <Route
              path="/project/:projectId/experiments"
              element={<ExperimentSuggestion />}
            />
            <Route
              path="/project/:projectId/test-cards"
              element={<TestCard />}
            />
            <Route
              path="/project/:projectId/learning-card"
              element={<LearningCard />}
            />
            <Route
              path="/project/:projectId/metrics"
              element={<ProjectMetrics />}
            />
            <Route path="/portfolio" element={<PortfolioDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
