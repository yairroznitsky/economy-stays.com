import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLandingTracker } from "@/hooks/useLandingTracker";
import { SITELINK_SLUGS } from "./lib/sitelinkPages.ts";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Privacy from "./pages/Privacy.tsx";
import NotFound from "./pages/NotFound.tsx";
import HotelLanding from "./pages/HotelLanding.tsx";
import SitelinkPage from "./pages/SitelinkPage.tsx";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useLandingTracker();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/es" element={<Index locale="es" />} />
      <Route path="/br" element={<Index locale="pt-BR" />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      {SITELINK_SLUGS.map((slug) => (
        <Route
          key={slug}
          path={`/${slug}`}
          element={<SitelinkPage slug={slug} />}
        />
      ))}
      <Route path="/hotels/:citySlug/:intentSlug" element={<HotelLanding />} />
      <Route path="/hotels/:citySlug" element={<HotelLanding />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
