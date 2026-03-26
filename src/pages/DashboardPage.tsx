import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";

const DashboardPage = () => {
  const { role } = useAuth();

  if (role === "organizer") {
    return <Navigate to="/crm" replace />;
  }

  if (role === "participant") {
    return <Navigate to="/participante/meus-ingressos" replace />;
  }

  return <Navigate to="/role-select" replace />;
};

export default DashboardPage;
