import {
  Home, Calendar, Users, HelpCircle, ChevronLeft, Church, LogOut,
  Ticket, UserCheck, DollarSign, Settings, CheckSquare,
  ChevronDown, ChevronUp, BarChart3, CreditCard, FileText,
  MessageCircle, Globe, ListOrdered, Clock
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
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

interface NavItem {
  title: string;
  url?: string;
  icon: any;
  roles: string[];
  children?: { title: string; url: string }[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/events/dashboard", icon: Home, roles: ["organizer"] },
  {
    title: "Gerenciar ingressos", icon: Ticket, roles: ["organizer"],
    children: [
      { title: "Ingressos", url: "/events/dashboard?tab=tickets" },
    ],
  },
  {
    title: "Participantes", icon: UserCheck, roles: ["organizer"],
    children: [
      { title: "Lista de participantes", url: "/events/dashboard?tab=general" },
      { title: "Fila de espera", url: "#" },
    ],
  },
  {
    title: "Financeiro", icon: DollarSign, roles: ["organizer"],
    children: [
      { title: "Cupons de desconto", url: "#" },
      { title: "Histórico de transações", url: "#" },
      { title: "Repasses", url: "#" },
    ],
  },
  { title: "Colaboradores", url: "/events/dashboard?tab=collaborators", icon: Users, roles: ["organizer"] },
  { title: "Integração", url: "/events/dashboard?tab=integrations", icon: Globe, roles: ["organizer"] },
  {
    title: "Configurações", icon: Settings, roles: ["organizer"],
    children: [
      { title: "Informações gerais", url: "/events/dashboard?tab=general" },
      { title: "Página do evento", url: "/events/dashboard?tab=page" },
      { title: "Pagamento", url: "/events/dashboard?tab=payment" },
      { title: "Formulário de cadastro", url: "/events/dashboard?tab=form" },
      { title: "Mensagens", url: "/events/dashboard?tab=messages" },
    ],
  },
  {
    title: "Check-ins", icon: CheckSquare, roles: ["organizer"],
    children: [],
  },
  { title: "Guardião Eventos", url: "/events", icon: Calendar, roles: ["organizer", "participant"] },
  { title: "CRM", url: "/crm", icon: BarChart3, roles: ["organizer"] },
  { title: "Suporte", url: "/support", icon: HelpCircle, roles: ["organizer", "participant"] },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const role = localStorage.getItem("userRole") || "participant";
  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Church className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex items-center justify-between flex-1">
              <span className="font-bold text-sidebar-foreground text-sm">Guardião Eventos</span>
              <button onClick={toggleSidebar} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isOpen = openGroups[item.title];

                if (hasChildren) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => toggleGroup(item.title)}
                        tooltip={item.title}
                        className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <item.icon className="w-5 h-5 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </span>
                        {!collapsed && (
                          isOpen ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />
                        )}
                      </SidebarMenuButton>
                      {!collapsed && isOpen && (
                        <div className="ml-7 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                          {item.children!.map((child) => (
                            <NavLink
                              key={child.title}
                              to={child.url}
                              className="block text-sm py-1.5 px-2 rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                              activeClassName="text-sidebar-foreground font-medium"
                            >
                              {child.title}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url!}
                        end={item.url === "/dashboard" || item.url === "/events/dashboard"}
                        className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                localStorage.removeItem("userRole");
                window.location.href = "/role-select";
              }}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Trocar Perfil</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="text-xs text-sidebar-foreground/40 pl-2">© 2026 Guardião Eventos</div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
