import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, User, LogOut, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

const DashboardLayout = () => {
  const { user, signOut, role, setRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleSwitchProfile = () => {
    setRole(null);
    navigate("/role-select");
  };

  if (role === "organizer") {
    if (location.pathname.startsWith("/participante")) {
      return <Navigate to="/organizador/dashboard" replace />;
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                {role === "organizer" ? "Painel do Organizador" : "Área do Participante"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Bell className="w-5 h-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-primary/90">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal text-xs">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">{user?.user_metadata?.full_name || "Usuário"}</p>
                      <p className="text-[10px] leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 cursor-pointer font-medium text-primary/80">
                    <Settings className="w-4 h-4" />
                    Meu Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSwitchProfile} className="gap-2 cursor-pointer font-medium text-primary/80">
                    <Users className="w-4 h-4" />
                    Trocar de Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer font-medium text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
