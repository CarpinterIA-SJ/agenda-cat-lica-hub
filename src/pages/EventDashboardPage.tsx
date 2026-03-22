import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { EventDashboardHeader } from "@/components/event-dashboard/EventDashboardHeader";
import { EventDashboardTabs } from "@/components/event-dashboard/EventDashboardTabs";
import { EventDetailsTab } from "@/components/event-dashboard/EventDetailsTab";
import { EventTicketsTab } from "@/components/event-dashboard/EventTicketsTab";
import { EventCollaboratorsTab } from "@/components/event-dashboard/EventCollaboratorsTab";
import { EventIntegrationsTab } from "@/components/event-dashboard/EventIntegrationsTab";

const EventDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    // Load most recent event or mock
    try {
      const stored = JSON.parse(localStorage.getItem("custom_events") || "[]");
      if (stored.length > 0) {
        setEvent(stored[0]);
      } else {
        setEvent({
          id: 1,
          name: user?.user_metadata?.full_name || "Meu Evento",
          date: "21/10/2026 às 12:00 até 22/10/2026 às 18:00",
          start_date: "2026-10-21T12:00",
          end_date: "2026-10-22T18:00",
          location: "Paróquia São José",
          status: "Publicado",
          visibility: "public",
          attendees: 0,
          tickets: [{ id: "1", name: "Inscrição Geral", price: "0", quantity: 100, status: "Ativo", visibility: "Público", repass: false }],
          is_free: true,
        });
      }
    } catch {
      setEvent(null);
    }
  }, [user]);

  if (!event) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground">Carregando...</div>;
  }

  const organizerName = user?.user_metadata?.full_name || "Organizador";
  const eventDate = event.start_date
    ? `${new Date(event.start_date).toLocaleDateString("pt-BR")} às ${new Date(event.start_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${event.end_date ? ` até ${new Date(event.end_date).toLocaleDateString("pt-BR")} às ${new Date(event.end_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}`
    : event.date || "";

  return (
    <div className="space-y-6">
      <EventDashboardHeader
        organizerName={organizerName}
        eventDate={eventDate}
        onBack={() => navigate("/events")}
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
