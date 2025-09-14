import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, useState } from "react";
import LoginIncluyete from "./components/LoginIncluyete";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MapPage from "./pages/MapPage";
import DataVisualization from "./pages/DataVisualization";

const queryClient = new QueryClient();

const App = () => {
  const [logged, setLogged] = useState(() => localStorage.getItem('incluyete_logged') === 'true');

  function PrivateRoute({ children }) {
    return logged ? children : <Navigate to="/login" replace />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
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
                  <Route path="/login" element={<LoginIncluyete onLogin={() => setLogged(true)} />} />
                  <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
                  <Route path="/mapa" element={<PrivateRoute><MapPage /></PrivateRoute>} />
                  <Route
                    path="/visualization"
                    element={
                      <PrivateRoute>
                        <Suspense fallback={<div>Cargando...</div>}>
                          <DataVisualization data={[]} />
                        </Suspense>
                      </PrivateRoute>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
