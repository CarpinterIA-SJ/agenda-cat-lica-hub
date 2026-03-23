import { useNavigate } from "react-router-dom";
import { Users, Calendar, ArrowRight, Ticket } from "lucide-react";
import { SaoJoseIcon } from "@/components/icons/SaoJoseIcon";
import { useAuth } from "@/hooks/use-auth";

const RoleSelectPage = () => {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const handleRoleSelect = (role: 'organizer' | 'participant') => {
    setRole(role);
    if (role === 'organizer') {
      navigate("/organizador/dashboard");
    } else {
      navigate("/participante/meus-ingressos");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <SaoJoseIcon className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Guardião Eventos</h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-800">Como você deseja acessar a plataforma?</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Escolha o perfil que melhor se adapta às suas necessidades no momento. Você poderá trocar depois.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Participant Card */}
          <button
            onClick={() => handleRoleSelect('participant')}
            className="group relative bg-white border border-slate-200 rounded-2xl p-10 text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:border-primary/30 flex flex-col items-start justify-between min-h-[320px]"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Users className="w-8 h-8 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Sou Participante</h3>
              <p className="text-slate-500 leading-relaxed">
                Quero encontrar eventos, comprar ingressos e gerenciar minhas participações e inscrições.
              </p>
            </div>
            <div className="w-full flex items-center justify-between mt-8 pt-6 border-t border-slate-50 group-hover:border-primary/10 transition-colors">
              <span className="text-primary font-semibold flex items-center gap-2">
                Acessar Área do Participante
              </span>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Organizer Card */}
          <button
            onClick={() => handleRoleSelect('organizer')}
            className="group relative bg-white border border-slate-200 rounded-2xl p-10 text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:border-primary/30 flex flex-col items-start justify-between min-h-[320px]"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Calendar className="w-8 h-8 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Sou Organizador</h3>
              <p className="text-slate-500 leading-relaxed">
                Quero criar e gerenciar eventos, acompanhar vendas, gerenciar inscritos e controlar financeiro.
              </p>
            </div>
            <div className="w-full flex items-center justify-between mt-8 pt-6 border-t border-slate-50 group-hover:border-primary/10 transition-colors">
              <span className="text-primary font-semibold flex items-center gap-2">
                Acessar Área do Organizador
              </span>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectPage;
