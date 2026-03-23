import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { EventDashboardHeader } from "@/components/event-dashboard/EventDashboardHeader";
import { EventDashboardTabs } from "@/components/event-dashboard/EventDashboardTabs";
import { EventDetailsTab } from "@/components/event-dashboard/EventDetailsTab";
import { EventTicketsTab } from "@/components/event-dashboard/EventTicketsTab";
import { EventCollaboratorsTab } from "@/components/event-dashboard/EventCollaboratorsTab";
import { EventIntegrationsTab } from "@/components/event-dashboard/EventIntegrationsTab";
import { EventPageTab } from "@/components/event-dashboard/EventPageTab";
import { EventPaymentTab } from "@/components/event-dashboard/EventPaymentTab";
import { EventFormTab } from "@/components/event-dashboard/EventFormTab";
import { EventMessagesTab } from "@/components/event-dashboard/EventMessagesTab";

const mockEvents = [
  {
    id: 1,
    name: "Retiro de Quaresma",
    date: "28 Mar 2026",
    start_date: "2026-03-28T08:00",
    end_date: "2026-03-28T18:00",
    location: "Paróquia São José",
    type: "Presencial",
    status: "Ativo",
    visibility: "public",
    attendees: 120,
    tickets: [{ id: "1", name: "Inscrição Geral", price: "0", quantity: 100, status: "Ativo", visibility: "Público", repass: false }],
    is_free: true,
  },
];

const EventDashboardPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("custom_events") || "[]");
      const allEvents = [...storedEvents, ...mockEvents];
      const found = allEvents.find((e: any) => String(e.id) === id);
      if (found) {
        setEvent(found);
      } else {
        setEvent({
          id: id,
          name: "Evento não encontrado",
          date: "",
          start_date: "",
          end_date: "",
          location: "",
          status: "Rascunho",
          visibility: "public",
          attendees: 0,
          tickets: [],
          is_free: true,
        });
      }
    } catch {
      setEvent(null);
    }
  }, [id]);

  if (!event) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Carregando...</div>;
  }

  const eventDate = event.start_date
    ? `${new Date(event.start_date).toLocaleDateString("pt-BR")} às ${new Date(event.start_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${event.end_date ? ` até ${new Date(event.end_date).toLocaleDateString("pt-BR")} às ${new Date(event.end_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}`
    : event.date || "";

  return (
    <div className="space-y-6">
      <EventDashboardHeader
        organizerName={event.name}
        eventDate={eventDate}
        onBack={() => navigate("/organizador/dashboard")}
      />

      <EventDashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "general" && <EventDetailsTab event={event} />}
      {activeTab === "tickets" && <EventTicketsTab event={event} />}
      {activeTab === "collaborators" && <EventCollaboratorsTab />}
      {activeTab === "integrations" && <EventIntegrationsTab />}
      {activeTab === "page" && (
        <div className="text-muted-foreground text-center py-12">Página do evento — em breve</div>
      )}
      {activeTab === "payment" && (
        <div className="text-muted-foreground text-center py-12">Pagamento — em breve</div>
      )}
      {activeTab === "form" && (
        <div className="text-muted-foreground text-center py-12">Formulário de inscrição — em breve</div>
      )}
      {activeTab === "messages" && (
        <div className="text-muted-foreground text-center py-12">Mensagens — em breve</div>
      )}
    </div>
  );
};

export default EventDashboardPage;
