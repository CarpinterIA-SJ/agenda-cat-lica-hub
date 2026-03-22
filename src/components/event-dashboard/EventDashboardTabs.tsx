import { Info, Globe, Ticket, CreditCard, FileText, MessageCircle } from "lucide-react";

const tabs = [
  { id: "general", label: "Informações gerais", icon: Info },
  { id: "page", label: "Página do evento", icon: Globe },
  { id: "tickets", label: "Ingressos", icon: Ticket },
  { id: "payment", label: "Pagamento", icon: CreditCard },
  { id: "form", label: "Formulário de inscrição", icon: FileText },
  { id: "messages", label: "Mensagens", icon: MessageCircle },
];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const EventDashboardTabs = ({ activeTab, onTabChange }: Props) => {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
      <div className="flex min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1.5 px-6 py-4 text-xs font-medium transition-all border-b-2 min-w-[120px] ${
                isActive
                  ? "border-b-primary text-primary bg-primary/5"
                  : "border-b-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
