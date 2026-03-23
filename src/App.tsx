import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import OrganizerEventsPage from "./pages/OrganizerEventsPage";
import EventCreatePage from "./pages/EventCreatePage";
import EventDashboardPage from "./pages/EventDashboardPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import ExploreEventsPage from "./pages/ExploreEventsPage";
import CRMPage from "./pages/CRMPage";
import DonationsPage from "./pages/DonationsPage";
import TithePage from "./pages/TithePage";
import SupportPage from "./pages/SupportPage";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/use-auth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleGuard = ({ children }: { children: React.ReactNode }) => {
  const role = localStorage.getItem("userRole");
  if (!role) {
    return <Navigate to="/role-select" replace />;
  }
  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/role-select" element={<ProtectedRoute><RoleSelectPage /></ProtectedRoute>} />

            {/* Organizer routes */}
            <Route element={<ProtectedRoute><RoleGuard><DashboardLayout /></RoleGuard></ProtectedRoute>}>
              <Route path="/organizador/dashboard" element={<OrganizerEventsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/events" element={<OrganizerEventsPage />} />
              <Route path="/events/new" element={<EventCreatePage />} />
              <Route path="/events/dashboard/:id" element={<EventDashboardPage />} />
              <Route path="/crm" element={<CRMPage />} />
              <Route path="/donations" element={<DonationsPage />} />
              <Route path="/tithe" element={<TithePage />} />

              {/* Participant routes */}
              <Route path="/participante/meus-ingressos" element={<MyTicketsPage />} />
              <Route path="/participante/explorar" element={<ExploreEventsPage />} />

              <Route path="/support" element={<SupportPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
