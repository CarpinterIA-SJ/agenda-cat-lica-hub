import { useParams } from "react-router-dom";
import { useEvent } from "@/hooks/use-events";

// Nome e período do evento da rota /organizador/evento/:id/*, usados nos
// cabeçalhos das páginas do organizador. O useEvent compartilha cache
// (React Query), então os dois componentes na mesma tela fazem uma só consulta.

const formatarDataHora = (iso: string) => {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
};

export const EventName = () => {
  const { id } = useParams();
  const { data: event } = useEvent(id);
  return <>{event?.name ?? ""}</>;
};

export const EventPeriod = () => {
  const { id } = useParams();
  const { data: event } = useEvent(id);
  if (!event) return null;
  if (!event.start_at) return <>Data a definir</>;
  const inicio = formatarDataHora(event.start_at);
  return <>{event.end_at ? `${inicio} até ${formatarDataHora(event.end_at)}` : inicio}</>;
};
