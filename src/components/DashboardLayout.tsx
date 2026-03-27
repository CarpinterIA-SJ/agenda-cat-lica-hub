import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  User, LogOut, LayoutGrid, Moon, Sun, MessageCircle,
  Calendar, Users2, Headset, Home, Ticket, Mail, Users, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
      return <Navigate to="/crm" replace />;
    }
  }

  const showSidebar = role !== "organizer" || location.pathname.startsWith("/organizador/evento/");

  const content = (
    <div className="min-h-screen flex w-full">
      {showSidebar && <AppSidebar />}
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-2">
            {showSidebar && <SidebarTrigger />}
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {role === "organizer" ? "Painel do Organizador" : "Área do Participante"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Aplicações">
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Troca de tema">
              <Moon className="w-5 h-5" />
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
      <a
        href="https://wa.me/5500000000000"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>
    </div>
  );

  if (showSidebar) {
    return <SidebarProvider>{content}</SidebarProvider>;
  }

  return content;
};

export default DashboardLayout;
