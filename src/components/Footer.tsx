import { useNavigate } from "react-router-dom";
import { Sparkles, Instagram, Facebook, Youtube, Mail, Phone } from "lucide-react";

/**
 * Rodapé público — Landing, Planos, página do evento e páginas jurídicas.
 * Fora das áreas logadas (DashboardLayout/AdminLayout), de propósito: são
 * shells de app autenticado, sem precedente de rodapé.
 */
export const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0b3d2e] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Guardião Eventos</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A plataforma de eventos para a comunidade católica do Brasil.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://instagram.com/guardiaoeventos" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="https://facebook.com/guardiaoeventos" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-400 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="https://youtube.com/@guardiaoeventos" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-slate-400 hover:text-white transition-colors"><Youtube className="w-5 h-5" /></a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm">Eventos</h4>
            <ul className="space-y-2 text-sm">
              {["Todos os Eventos", "Retiros", "Congressos e Seminários", "Acampamentos", "Shows Católicos"].map((l) => (
                <li key={l}><button onClick={() => navigate("/participante/explorar")} className="hover:text-white transition-colors">{l}</button></li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm">Para Organizadores</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Criar Evento", route: "/login" },
                { label: "Planos e Preços", route: "/planos" },
                { label: "Painel do Organizador", route: "/login" },
                { label: "Central de Ajuda", route: "/support" },
              ].map((l) => (
                <li key={l.label}><button onClick={() => navigate(l.route)} className="hover:text-white transition-colors">{l.label}</button></li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#004d00] shrink-0" /> contato@guardiaoeventos.com</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#004d00] shrink-0" /> (00) 0000-0000</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© 2026 Guardião Eventos. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/termos")} className="hover:text-white transition-colors">Termos de Uso</button>
            <button onClick={() => navigate("/privacidade")} className="hover:text-white transition-colors">Privacidade</button>
            <button onClick={() => navigate("/reembolso")} className="hover:text-white transition-colors">Reembolso</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
