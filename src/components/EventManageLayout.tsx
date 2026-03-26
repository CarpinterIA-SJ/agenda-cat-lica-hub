import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ExternalLink, ChevronLeft, Calendar, Info, Globe, Ticket, CreditCard, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventDetailsTab } from "@/components/event-dashboard/EventDetailsTab";
import { EventGeneralSettingsTab } from "@/components/event-dashboard/EventGeneralSettingsTab";
import { EventPageTab } from "@/components/event-dashboard/EventPageTab";
import { EventTicketsTab } from "@/components/event-dashboard/EventTicketsTab";
import { EventPaymentTab } from "@/components/event-dashboard/EventPaymentTab";
import { EventFormTab } from "@/components/event-dashboard/EventFormTab";
import { EventMessagesTab } from "@/components/event-dashboard/EventMessagesTab";
import { ParticipantsListTab } from "@/components/event-dashboard/ParticipantsListTab";
import { WaitlistTab } from "@/components/event-dashboard/WaitlistTab";
import { CouponsTab } from "@/components/event-dashboard/CouponsTab";
import { TransactionsTab } from "@/components/event-dashboard/TransactionsTab";
import { TransfersTab } from "@/components/event-dashboard/TransfersTab";

const tabs = [
  { id: "general", label: "Informações gerais", icon: Info },
  { id: "page", label: "Página do evento", icon: Globe },
  { id: "tickets", label: "Ingressos", icon: Ticket },
  { id: "payment", label: "Pagamento", icon: CreditCard },
  { id: "form", label: "Formulário de inscrição", icon: FileText },
  { id: "messages", label: "Mensagens", icon: MessageCircle },
];

const TABBAR_IDS = tabs.map((t) => t.id);

const EventManageLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const getEvent = () => {
    try {
      const stored = localStorage.getItem("created_events");
      if (stored) {
        const events = JSON.parse(stored);
        const found = events.find((e: any) => String(e.id) === String(id));
        if (found) return found;
      }
    } catch {}
    return {
      id,
      name: "FABRICIO CHRISTIAN DA SILVA CAVALCANTE",
      date: "21/10/2026 às 12:00 até 22/10/2026 às 18:00",
      status: "Publicado",
      tickets: [],
    };
  };

  const event = getEvent();
  const eventName = event.name || "Evento";
  const eventDate = event.date || "Data não definida";

  const showTabBar = TABBAR_IDS.includes(activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <EventDetailsTab event={event} />;
      case "general":
        return <EventGeneralSettingsTab event={event} />;
      case "page":
        return <EventPageTab />;
      case "tickets":
        return <EventTicketsTab event={event} />;
      case "payment":
        return <EventPaymentTab />;
      case "form":
        return <EventFormTab />;
      case "messages":
        return <EventMessagesTab />;
      case "participants-list":
        return <ParticipantsListTab />;
      case "waitlist":
        return <WaitlistTab />;
      case "coupons":
        return <CouponsTab />;
      case "transactions":
        return <TransactionsTab />;
      case "transfers":
        return <TransfersTab />;
      default:
        return <EventDetailsTab event={event} />;
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(210,30%,97%)]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {eventName}
              </h1>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{eventDate}</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/organizador/dashboard")}
            className="gap-2 text-sm font-medium border-primary/30 text-primary hover:bg-primary/5 rounded-lg shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para os meus eventos
          </Button>
        </div>

        {/* Alert Banner */}
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">
                Atualize os seus dados cadastrais na Guardião Eventos
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Esse cadastro é necessário para solicitar repasses de seu evento. Em caso de dúvidas, acesse:{" "}
                <a href="#" className="text-primary underline font-medium">Central de Ajuda</a>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-100 font-semibold shrink-0 rounded-lg"
          >
            Atualizar dados
          </Button>
        </div>
      </div>

      {/* Tab Bar */}
      {showTabBar && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div className="bg-card rounded-xl border shadow-sm overflow-x-auto">
            <div className="flex min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-6 py-4 text-xs font-medium transition-all border-b-2 min-w-[120px]",
                      isActive
                        ? "border-b-primary text-primary bg-primary/5"
                        : "border-b-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>

      {/* WhatsApp FAB */}
      <a
        href="https://wa.me/5500000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
};

export default EventManageLayout;
