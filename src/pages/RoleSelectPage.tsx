import { useNavigate } from "react-router-dom";
import { Users, Calendar, ArrowRight, ShieldCheck } from "lucide-react";
import { SaoJoseIcon } from "@/components/icons/SaoJoseIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth, UserRole } from "@/hooks/use-auth";

const RoleSelectPage = () => {
  const navigate = useNavigate();
  const { setRole, user } = useAuth();

  // Allowlist de administradores — restringe o cartão "Administrador" a e-mails autorizados.
  const adminAllowlist = ["fabricio.christian@gmail.com", "fabricio.christian@hotmail.com"];
  const isAdminAllowed = !!user?.email && adminAllowlist.includes(user.email.toLowerCase());

  const handleRoleSelect = (role: UserRole) => {
    setRole(role);
    if (role === "organizer") navigate("/organizador/meus-eventos");
    else if (role === "admin") navigate("/admin");
    else navigate("/participante/meus-ingressos");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="max-w-5xl w-full space-y-12">
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

        <div className={`grid ${isAdminAllowed ? "md:grid-cols-3" : "md:grid-cols-2"} gap-8`}>
          <button
            onClick={() => handleRoleSelect("participant")}
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
              <span className="text-primary font-semibold flex items-center gap-2">Acessar Área do Participante</span>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("organizer")}
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
              <span className="text-primary font-semibold flex items-center gap-2">Acessar Área do Organizador</span>
              <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {isAdminAllowed && (
            <button
              onClick={() => handleRoleSelect("admin")}
              className="group relative bg-white border border-emerald-200 rounded-2xl p-10 text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:border-emerald-500 flex flex-col items-start justify-between min-h-[320px]"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors duration-300">
                  <ShieldCheck className="w-8 h-8 text-emerald-700 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Sou Administrador</h3>
                <p className="text-slate-500 leading-relaxed">
                  Acesso interno à gestão de usuários, eventos, financeiro e configurações da plataforma.
                </p>
              </div>
              <div className="w-full flex items-center justify-between mt-8 pt-6 border-t border-slate-50 group-hover:border-emerald-100 transition-colors">
                <span className="text-emerald-700 font-semibold flex items-center gap-2">Acessar Painel Administrativo</span>
                <ArrowRight className="w-5 h-5 text-emerald-700 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectPage;
