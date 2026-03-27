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

  const appItems = [
    { label: "Home", icon: Home, route: "/organizador/home" },
    { label: "Guardião Eventos", icon: Calendar, route: "/organizador/meus-eventos" },
    { label: "CRM", icon: Users2, route: "/crm/pessoas" },
    { label: "Atendimento", icon: Headset, route: "/support" },
  ].filter((item) => item.label.toLowerCase() !== "dizimo" && item.label.toLowerCase() !== "dízimo");

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

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
          <div className="flex items-center gap-2">
            {/* Aplicações Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <LayoutGrid className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 shadow-sm">
                <div className="text-sm font-semibold mb-3">Aplicações</div>
                <div className="grid grid-cols-2 gap-3">
                  {appItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.route)}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center shadow-sm hover:shadow-md transition cursor-pointer"
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Moon className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alterar tema</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{userInitials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-sm">
                <DropdownMenuLabel className="font-normal text-[11px] text-muted-foreground">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <LayoutGrid className="w-4 h-4" />
                  Ver aplicações
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Minha conta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/participante/meus-ingressos")} className="gap-2 cursor-pointer">
                  <Ticket className="w-4 h-4" />
                  Meus ingressos
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Convites pendentes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Organizadores
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <HelpCircle className="w-4 h-4" />
                  Ajuda
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
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
