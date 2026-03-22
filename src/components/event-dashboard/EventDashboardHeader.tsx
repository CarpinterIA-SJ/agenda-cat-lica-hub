import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, Calendar } from "lucide-react";

interface Props {
  organizerName: string;
  eventDate: string;
  onBack: () => void;
}

export const EventDashboardHeader = ({ organizerName, eventDate, onBack }: Props) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground uppercase tracking-wide">
            {organizerName}
          </h1>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{eventDate}</span>
        </div>
      </div>
      <Button variant="outline" onClick={onBack} className="gap-2 text-sm font-medium border-primary/30 text-primary hover:bg-primary/5">
        <ChevronLeft className="w-4 h-4" />
        Voltar para os meus eventos
      </Button>
    </div>
  );
};
