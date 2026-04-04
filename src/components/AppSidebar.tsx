import {
  LayoutDashboard,
  Ticket,
  Users,
  DollarSign,
  Settings,
  ClipboardCheck,
  ChevronLeft,
  LogOut,
  ChevronDown,
  Search,
  HelpCircle,
  Calendar,
} from "lucide-react";
import { SaoJoseIcon } from "@/components/icons/SaoJoseIcon";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  url?: string;
  icon: any;
  roles: string[];
  children?: { title: string; url: string }[];
}

const baseNavItems: NavItem[] = [
  { title: "Home", url: "/organizador/home", icon: LayoutDashboard, roles: ["organizer"] },
  {
    title: "Eventos",
    icon: Calendar,
    roles: ["organizer"],
    children: [
      { title: "Lista de eventos", url: "/organizador/meus-eventos" },
      { title: "Categorias", url: "/organizador/eventos/categorias" },
    ],
  },
  {
    title: "CRM",
    icon: Users,
    roles: ["organizer"],
    children: [
      { title: "Pessoas", url: "/crm/pessoas" },
      { title: "Grupos", url: "/crm/grupos" },
      { title: "Setores", url: "/crm/setores" },
      { title: "Minhas Tags", url: "/crm/tags" },
      { title: "Categorias", url: "/crm/categorias" },
    ],
  },
  { title: "Meus Ingressos", url: "/participante/meus-ingressos", icon: Ticket, roles: ["participant"] },
  { title: "Explorar Eventos", url: "/participante/explorar", icon: Search, roles: ["participant"] },
  { title: "Suporte", url: "/support", icon: HelpCircle, roles: ["organizer", "participant"] },
];

const buildOrganizerEventItems = (eventId: string): NavItem[] => [
  {
    title: "Dashboard",
    url: `/organizador/evento/${eventId}/dashboard`,
    icon: LayoutDashboard,
    roles: ["organizer"],
  },
  {
    title: "Gerenciar ingressos",
    icon: Ticket,
    roles: ["organizer"],
    children: [{ title: "Ingressos", url: `/organizador/evento/${eventId}/ingressos` }],
  },
  {
    title: "Participantes",
    icon: Users,
    roles: ["organizer"],
    children: [
      { title: "Lista de Participantes", url: `/organizador/evento/${eventId}/participantes` },
      { title: "Fila de Espera", url: `/organizador/evento/${eventId}/fila-de-espera` },
    ],
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    roles: ["organizer"],
    children: [
      { title: "Histórico de Transações", url: `/organizador/evento/${eventId}/financeiro` },
      { title: "Cupons de Desconto", url: `/organizador/evento/${eventId}/financeiro/cupons` },
      { title: "Solicitar Repasse", url: `/organizador/evento/${eventId}/financeiro/repasse` },
    ],
  },
  {
    title: "Configurações",
    url: `/organizador/evento/${eventId}/configuracoes`,
    icon: Settings,
    roles: ["organizer"],
    children: [
      { title: "Informações Gerais", url: `/organizador/evento/${eventId}/configuracoes` },
      { title: "Pagina do Evento", url: `/organizador/evento/${eventId}/configuracoes/pagina` },
      { title: "Pagamento", url: `/organizador/evento/${eventId}/configuracoes/pagamento` },
      { title: "Formulário de Cadastro", url: `/organizador/evento/${eventId}/configuracoes/formulario` },
      { title: "Mensagem", url: `/organizador/evento/${eventId}/configuracoes/mensagem` },
    ],
  },
  {
    title: "Check-ins",
    icon: ClipboardCheck,
    roles: ["organizer"],
    children: [
      { title: "Check-ins", url: `/organizador/evento/${eventId}/checkins` },
      { title: "Tipos de Check-in", url: `/organizador/evento/${eventId}/checkins/tipos` },
      { title: "Check-ins realizados", url: `/organizador/evento/${eventId}/checkins/realizados` },
    ],
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, setRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const eventMatch = location.pathname.match(/^\/organizador\/evento\/([^/]+)/);
  const eventId = eventMatch?.[1] ?? "1";
  const isOrganizerEvent = role === "organizer" && location.pathname.startsWith("/organizador/evento");

  const navItems = isOrganizerEvent ? buildOrganizerEventItems(eventId) : baseNavItems;
  const filteredNavItems = navItems.filter((item) => item.roles.includes(role || ""));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <SaoJoseIcon className="w-5 h-5 text-primary-foreground" />
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
            <SidebarMenu className="gap-1.5">
              {filteredNavItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isItemActive = item.url
                  ? location.pathname === item.url || location.pathname.startsWith(item.url)
                  : item.children?.some((child) => location.pathname === child.url);
                const isOpen = openGroups[item.title] ?? !!isItemActive;

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={isOpen}
                      onOpenChange={(open) => setOpenGroups((prev) => ({ ...prev, [item.title]: open }))}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isItemActive}
                            onClick={() => {
                              if (collapsed && item.url) {
                                navigate(item.url);
                              }
                            }}
                            className="py-2.5 text-slate-700 hover:bg-emerald-50 hover:text-[#004d00] data-[active=true]:bg-emerald-50 data-[active=true]:text-[#004d00] rounded-lg transition-colors justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <item.icon className="w-5 h-5 shrink-0 text-[#004d00]" />
                              {!collapsed && <span>{item.title}</span>}
                            </span>
                            {!collapsed && (
                              <ChevronDown
                                className={`w-4 h-4 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`}
                              />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!collapsed && (
                          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                            <div className="ml-7 mt-1 space-y-1 border-l border-slate-200 pl-3">
                              {item.children!.map((child) => (
                                <NavLink
                                  key={child.title}
                                  to={child.url}
                                  className="block text-[13px] py-1.5 px-2 rounded text-slate-500 hover:text-[#004d00] hover:bg-emerald-50 transition-colors"
                                  activeClassName="text-[#004d00] font-medium bg-emerald-50"
                                >
                                  {child.title}
                                </NavLink>
                              ))}
                            </div>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="py-2.5">
                      <NavLink
                        to={item.url!}
                        end={item.url === "/dashboard"}
                        className="text-slate-700 hover:bg-emerald-50 hover:text-[#004d00] rounded-lg transition-colors"
                        activeClassName="bg-emerald-50 text-[#004d00] font-medium"
                      >
                        <item.icon className="w-5 h-5 shrink-0 text-[#004d00]" />
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
                setRole(null);
                navigate("/role-select");
              }}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Trocar Perfil</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && <div className="text-xs text-sidebar-foreground/40 pl-2">© 2026 Guardião Eventos</div>}
      </SidebarFooter>
    </Sidebar>
  );
}
