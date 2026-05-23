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
  Plus,
  UserCog,
  Building2,
  User,
} from "lucide-react";
import { SaoJoseIcon } from "@/components/icons/SaoJoseIcon";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AVATAR_KEY = "user_avatar_photo";

const getInitials = (fullName?: string | null, email?: string | null): string => {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email?.trim()) return email.slice(0, 2).toUpperCase();
  return "U";
};

interface NavItem {
  title: string;
  url?: string;
  icon: any;
  roles: string[];
  end?: boolean;
  children?: { title: string; url: string }[];
}

interface NavSection {
  label?: string;
  roles: string[];
  items: NavItem[];
}

const baseNavSections: NavSection[] = [
  {
    roles: ["organizer"],
    items: [
      { title: "Home", url: "/organizador/home", icon: LayoutDashboard, roles: ["organizer"], end: true },
      { title: "Meus Eventos", url: "/organizador/meus-eventos", icon: Calendar, roles: ["organizer"] },
      { title: "Criar Evento", url: "/organizador/evento/novo", icon: Plus, roles: ["organizer"] },
    ],
  },
  {
    label: "Gestão",
    roles: ["organizer"],
    items: [
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
      { title: "Organizadores", url: "/organizadores", icon: Building2, roles: ["organizer"] },
    ],
  },
  {
    label: "Conta",
    roles: ["organizer"],
    items: [
      { title: "Minha Conta", url: "/minha-conta", icon: User, roles: ["organizer"] },
      { title: "Suporte", url: "/support", icon: HelpCircle, roles: ["organizer"] },
    ],
  },
  {
    roles: ["participant"],
    items: [
      { title: "Meus Ingressos", url: "/participante/meus-ingressos", icon: Ticket, roles: ["participant"] },
      { title: "Explorar Eventos", url: "/participante/explorar", icon: Search, roles: ["participant"] },
    ],
  },
  {
    label: "Conta",
    roles: ["participant"],
    items: [
      { title: "Minha Conta", url: "/minha-conta", icon: User, roles: ["participant"] },
      { title: "Suporte", url: "/support", icon: HelpCircle, roles: ["participant"] },
    ],
  },
];

const buildOrganizerEventSections = (eventId: string): NavSection[] => [
  {
    roles: ["organizer"],
    items: [
      { title: "Dashboard", url: `/organizador/evento/${eventId}/dashboard`, icon: LayoutDashboard, roles: ["organizer"] },
    ],
  },
  {
    label: "Ingressos",
    roles: ["organizer"],
    items: [
      {
        title: "Gerenciar Ingressos",
        icon: Ticket,
        roles: ["organizer"],
        children: [{ title: "Ingressos", url: `/organizador/evento/${eventId}/ingressos` }],
      },
    ],
  },
  {
    label: "Participantes",
    roles: ["organizer"],
    items: [
      {
        title: "Participantes",
        icon: Users,
        roles: ["organizer"],
        children: [
          { title: "Lista de Participantes", url: `/organizador/evento/${eventId}/participantes` },
          { title: "Fila de Espera", url: `/organizador/evento/${eventId}/fila-de-espera` },
        ],
      },
    ],
  },
  {
    label: "Financeiro",
    roles: ["organizer"],
    items: [
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
    ],
  },
  {
    label: "Configurações",
    roles: ["organizer"],
    items: [
      {
        title: "Configurações",
        url: `/organizador/evento/${eventId}/configuracoes`,
        icon: Settings,
        roles: ["organizer"],
        children: [
          { title: "Informações Gerais", url: `/organizador/evento/${eventId}/configuracoes` },
          { title: "Página do Evento", url: `/organizador/evento/${eventId}/configuracoes/pagina` },
          { title: "Pagamento", url: `/organizador/evento/${eventId}/configuracoes/pagamento` },
          { title: "Formulário", url: `/organizador/evento/${eventId}/configuracoes/formulario` },
          { title: "Mensagens", url: `/organizador/evento/${eventId}/configuracoes/mensagem` },
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
    ],
  },
];

function NavItemRenderer({ item, collapsed, openGroups, setOpenGroups, location }: {
  item: NavItem;
  collapsed: boolean;
  openGroups: Record<string, boolean>;
  setOpenGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  location: ReturnType<typeof useLocation>;
}) {
  const navigate = useNavigate();
  const hasChildren = item.children && item.children.length > 0;
  const isItemActive = item.url
    ? (item.end ? location.pathname === item.url : location.pathname.startsWith(item.url))
    : item.children?.some((child) => location.pathname.startsWith(child.url));
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
              isActive={!!isItemActive}
              onClick={() => { if (collapsed && item.url) navigate(item.url); }}
              className="py-2.5 text-slate-700 hover:bg-emerald-50 hover:text-[#004d00] data-[active=true]:bg-emerald-50 data-[active=true]:text-[#004d00] rounded-lg transition-colors justify-between"
            >
              <span className="flex items-center gap-2">
                <item.icon className="w-4 h-4 shrink-0 text-[#004d00]" />
                {!collapsed && <span className="text-[13px]">{item.title}</span>}
              </span>
              {!collapsed && (
                <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              )}
            </SidebarMenuButton>
          </CollapsibleTrigger>
          {!collapsed && (
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3">
                {item.children!.map((child) => (
                  <NavLink
                    key={child.title}
                    to={child.url}
                    className="block text-[12px] py-1.5 px-2 rounded text-slate-500 hover:text-[#004d00] hover:bg-emerald-50 transition-colors"
                    activeClassName="text-[#004d00] font-semibold bg-emerald-50"
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
          end={item.end}
          className="text-slate-700 hover:bg-emerald-50 hover:text-[#004d00] rounded-lg transition-colors"
          activeClassName="bg-emerald-50 text-[#004d00] font-semibold"
        >
          <item.icon className="w-4 h-4 shrink-0 text-[#004d00]" />
          {!collapsed && <span className="text-[13px]">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, setRole, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const eventMatch = location.pathname.match(/^\/organizador\/evento\/([^/]+)/);
  const eventId = eventMatch?.[1] ?? "1";
  const isOrganizerEvent = role === "organizer" && location.pathname.startsWith("/organizador/evento") && !location.pathname.endsWith("/novo");

  const sections = isOrganizerEvent ? buildOrganizerEventSections(eventId) : baseNavSections;
  const filteredSections = sections.filter((s) => s.roles.includes(role || ""));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const photoUrl = typeof window !== "undefined" ? localStorage.getItem(AVATAR_KEY) : null;
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email ?? "";
  const initials = getInitials(fullName, email);

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 bg-white">
      <SidebarHeader className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <SaoJoseIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm leading-tight truncate">Guardião Eventos</p>
                <p className="text-[10px] text-emerald-700 font-medium capitalize">
                  {role === "organizer" ? "Organizador" : role === "participant" ? "Participante" : ""}
                </p>
              </div>
              <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-700 shrink-0 ml-2">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {filteredSections.map((section, si) => (
          <SidebarGroup key={si} className="py-0">
            {!collapsed && section.label && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-2 pt-3 pb-1">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => (
                  <NavItemRenderer
                    key={item.title}
                    item={item}
                    collapsed={collapsed}
                    openGroups={openGroups}
                    setOpenGroups={setOpenGroups}
                    location={location}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-100 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-1 py-1">
            <Avatar className="h-8 w-8 shrink-0">
              {photoUrl && <AvatarImage src={photoUrl} alt="Avatar" className="object-cover" />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              {fullName && <p className="text-xs font-semibold text-slate-800 truncate">{fullName}</p>}
              <p className="text-[11px] text-slate-400 truncate">{email}</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { setRole(null); navigate("/role-select"); }}
              tooltip="Trocar Perfil"
              className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-[13px]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Trocar Perfil</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && <div className="text-[10px] text-slate-300 pl-1">© 2026 Guardião Eventos</div>}
      </SidebarFooter>
    </Sidebar>
  );
}
