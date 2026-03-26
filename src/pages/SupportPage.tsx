import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, MessageCircle, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const SupportPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
      <p className="text-muted-foreground mt-1">Como podemos ajudar?</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { title: "Central de Ajuda", desc: "Artigos e tutoriais", icon: FileText },
        { title: "Chat ao Vivo", desc: "Fale com nossa equipe", icon: MessageCircle },
        { title: "E-mail", desc: "suporte@guardiaoeventos.com", icon: Mail },
      ].map((item) => (
        <Card key={item.title} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-card-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default SupportPage;
