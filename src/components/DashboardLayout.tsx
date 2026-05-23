import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  LayoutGrid, MessageCircle,
  Calendar, Users2, Headset, Home, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatarMenu } from "@/components/UserAvatarMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = () => {
  const { role, setRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      setDrawerOpen(false);
    }
  }, [location.pathname]);

  const handleSwitchProfile = () => {
    setRole(null);
    navigate("/role-select");
  };

  if (role === "organizer") {
    if (location.pathname.startsWith("/participante")) {
      return <Navigate to="/crm" replace />;
    }
  }

  const showSidebar = true;

  const appItems = [
    { label: "Home", icon: Home, route: "/organizador/home" },
    { label: "Guardião Eventos", icon: Calendar, route: "/organizador/meus-eventos" },
    { label: "CRM", icon: Users2, route: "/crm/pessoas" },
    { label: "Atendimento", icon: Headset, route: "/support" },
  ].filter((item) => item.label.toLowerCase() !== "dizimo" && item.label.toLowerCase() !== "dízimo");

  const content = (
    <div className="min-h-screen flex w-full">
      {showSidebar && !isMobile && <AppSidebar />}
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-2">
            {showSidebar && !isMobile && <SidebarTrigger />}
            {showSidebar && isMobile && (
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="left-0 right-auto top-0 bottom-0 h-full w-72 rounded-none p-0">
                  <AppSidebar />
                </DrawerContent>
              </Drawer>
            )}
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              {role === "organizer" ? "Painel do Organizador" : role === "admin" ? "Administrador" : "Área do Participante"}
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

            <ThemeToggle />

            {/* User dropdown */}
            <UserAvatarMenu />
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
