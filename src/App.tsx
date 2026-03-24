import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import EventsPage from "./pages/EventsPage";
import EventCreatePage from "./pages/EventCreatePage";
import EventDashboardPage from "./pages/EventDashboardPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import ExploreEventsPage from "./pages/ExploreEventsPage";
import CRMPage from "./pages/CRMPage";
import SupportPage from "./pages/SupportPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventManageLayout from "./components/EventManageLayout";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/use-auth";

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children ? <>{children}</> : <Outlet />;
};

const RoleRoute = ({ children, requiredRole }: { children?: React.ReactNode; requiredRole?: 'organizer' | 'participant' }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!role) return <Navigate to="/role-select" replace />;
  if (requiredRole && role !== requiredRole) {
    const fallback = role === 'organizer' ? "/organizador/dashboard" : "/participante/meus-ingressos";
    return <Navigate to={fallback} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
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
            
            {/* Shared Layout for Authenticated Users with Role */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              {/* Organizer Routes */}
              <Route element={<RoleRoute requiredRole="organizer" />}>
                <Route path="/organizador/dashboard" element={<EventsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/new" element={<EventCreatePage />} />
                <Route path="/events/dashboard/:id" element={<EventDashboardPage />} />
                <Route path="/crm" element={<CRMPage />} />
              </Route>

              {/* Participant Routes */}
              <Route element={<RoleRoute requiredRole="participant" />}>
                <Route path="/participante/meus-ingressos" element={<MyTicketsPage />} />
                <Route path="/participante/explorar" element={<ExploreEventsPage />} />
              </Route>

              {/* Common Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>

            {/* Event Management Dashboard (Specific Layout) */}
            <Route path="/event/:id/dashboard" element={<ProtectedRoute><RoleRoute requiredRole="organizer"><EventManageLayout /></RoleRoute></ProtectedRoute>} />

            <Route path="/event/detail/:id" element={<EventDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
