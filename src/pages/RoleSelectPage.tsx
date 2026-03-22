import { useNavigate } from "react-router-dom";
import { Church, Users, Ticket, Calendar } from "lucide-react";

const RoleSelectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Church className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Guardião Eventos</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Como deseja prosseguir?</h2>
          <p className="text-muted-foreground">Selecione o perfil que melhor se aplica a você</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Participant Card */}
          <button
            onClick={() => {
              localStorage.setItem("userRole", "participant");
              navigate("/events");
            }}
            className="group bg-card border rounded-xl p-8 text-left shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-xl bg-info/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Ticket className="w-7 h-7 text-info" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Sou Participante</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visualize seus ingressos, acompanhe cancelamentos e descubra novos eventos na sua comunidade.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-info">
              <span>Acessar como participante</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* Organizer Card */}
          <button
            onClick={() => {
              localStorage.setItem("userRole", "organizer");
              navigate("/dashboard");
            }}
            className="group bg-card border rounded-xl p-8 text-left shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Sou Organizador</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Crie e gerencie eventos, controle CRM, finanças e doações da sua organização.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
              <span>Acessar como organizador</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectPage;
