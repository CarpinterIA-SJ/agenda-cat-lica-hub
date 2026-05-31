import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Settings,
  ChevronLeft,
  LogOut,
  ShieldCheck,
  Building2,
  Wallet,
  ClipboardList,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const adminNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Gestão de Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Gestão de Organizadores", url: "/admin/organizadores", icon: Building2 },
  { title: "Gestão de Eventos", url: "/admin/eventos", icon: Calendar },
  { title: "Moderação de Eventos", url: "/admin/moderacao", icon: ShieldCheck },
  { title: "Gestão de Repasses", url: "/admin/repasses", icon: Wallet },
  { title: "Financeiro Global", url: "/admin/financeiro", icon: DollarSign },
  { title: "Logs de Auditoria", url: "/admin/logs", icon: ClipboardList },
  { title: "Configurações do Sistema", url: "/admin/configuracoes", icon: Settings },
];

export function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { setRole } = useAuth();
  const navigate = useNavigate();

  const handleExit = () => {
    setRole(null);
    navigate("/role-select");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex items-center justify-between flex-1">
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-slate-900 text-sm">Guardião Eventos</span>
                <span className="text-[11px] text-emerald-700 font-medium">Painel Administrativo</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Recolher menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className="py-2.5">
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors"
                      activeClassName="bg-emerald-50 text-emerald-800 font-medium"
                    >
                      <item.icon className="w-5 h-5 shrink-0 text-emerald-700" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleExit}
              className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Sair do Admin</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && <div className="text-xs text-slate-400 pl-2">© 2026 Guardião Eventos</div>}
      </SidebarFooter>
    </Sidebar>
  );
}
