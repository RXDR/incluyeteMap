import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import SurveyDataManager from "./pages/SurveyDataManager";
import GeoportalInterface from "./components/GeoportalInterface";
import BarranquillaRealMap from "./components/BarranquillaRealMap";
import BarranquillaChoroplethMap from "./components/BarranquillaChoroplethMap";
import BarranquillaChoroplethMapNoMap from "./components/BarranquillaChoroplethMapNoMap";
import DataManagement from "./components/DataManagement";
import TestMap from "./pages/TestMap";
import MapPage from "./pages/MapPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando página...</div>}>
            <Routes>
                                      <Route path="/" element={<Index />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/survey-manager" element={<SurveyDataManager />} />
                        <Route path="/geoportal" element={<GeoportalInterface />} />
                        <Route path="/barranquilla" element={<BarranquillaRealMap />} />
                        <Route path="/barranquilla-choropleth" element={<BarranquillaChoroplethMap />} />
                        <Route path="/barranquilla-sin-mapa" element={<BarranquillaChoroplethMapNoMap />} />
                        <Route path="/data-management" element={<DataManagement />} />
                         <Route path="/test" element={<MapPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;