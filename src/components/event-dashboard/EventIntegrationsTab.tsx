import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

const integrations = [
  {
    id: "facebook",
    name: "Facebook Pixel",
    description: "Rastreie conversões e otimize seus anúncios do Facebook com o Pixel.",
    status: "Não configurado",
  },
  {
    id: "google",
    name: "Google Analytics",
    description: "Acompanhe o tráfego e o comportamento dos visitantes na página do evento.",
    status: "Não configurado",
  },
];

export const EventIntegrationsTab = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">Integrações</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardContent className="p-6 space-y-4">
              <h4 className="font-bold text-foreground">{integration.name}</h4>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-muted text-muted-foreground font-semibold">
                  {integration.status}
                </Badge>
                <Button variant="outline" className="gap-2 font-semibold border-primary/30 text-primary hover:bg-primary/5">
                  <Settings className="w-4 h-4" /> Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
