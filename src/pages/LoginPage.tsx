import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, User, CheckCircle } from "lucide-react";
import { SaoJoseIcon } from "@/components/icons/SaoJoseIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import authBg from "@/assets/auth-bg.jpg";

const LoginPage = () => {
  const navigate = useNavigate();
  const { session, setRole, signIn, signUp, signInWithGoogle } = useAuth();

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!session) return;

    const provider = session.user.app_metadata?.provider;

    if (provider === "google") {
      // Google users go straight to the organizer dashboard
      setRole("organizer");
      navigate("/organizador/evento/1/dashboard", { replace: true });
    } else {
      // Email users pick their role first
      navigate("/role-select", { replace: true });
    }
  }, [session, navigate, setRole]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    const { error } = await signIn(email, password);

    if (error) {
      setError(translateError(error.message));
      setLoading(false);
    }
    // On success the session useEffect handles the redirect
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    const { error } = await signUp(email, password, name);

    if (error) {
      setError(translateError(error.message));
    } else {
      setSuccess("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    clearMessages();
    await signInWithGoogle();
    // On success the browser navigates away; no need to reset loading
  };

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      {/* ── Left: form panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <SaoJoseIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Guardião Eventos</h1>
            </div>
            <p className="text-sm text-muted-foreground">Acesse sua conta ou crie uma nova</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
            {/* Feedback */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-3 bg-white border-slate-300 text-slate-700 hover:bg-slate-50 font-medium shadow-sm"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GoogleLogo />
              )}
              Entrar com Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 tracking-wider">
                  ou continue com e-mail
                </span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as "login" | "signup");
                clearMessages();
              }}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-lg p-1 h-10">
                <TabsTrigger value="login" className="rounded-md text-sm">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md text-sm">
                  Criar conta
                </TabsTrigger>
              </TabsList>

              {/* ── Login ── */}
              <TabsContent value="login" className="space-y-4 mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 h-11 rounded-lg"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <PasswordInput
                      id="login-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                      autoComplete="current-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* ── Sign up ── */}
              <TabsContent value="signup" className="space-y-4 mt-0">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        className="pl-10 h-11 rounded-lg"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10 h-11 rounded-lg"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password">Senha</Label>
                    <PasswordInput
                      id="signup-password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                    disabled={loading || googleLoading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar conta com e-mail"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-center text-xs text-slate-400">
            Ao continuar, você concorda com os{" "}
            <button className="underline hover:text-slate-600 transition-colors">
              Termos de Uso
            </button>{" "}
            e{" "}
            <button className="underline hover:text-slate-600 transition-colors">
              Política de Privacidade
            </button>
          </p>
        </div>
      </div>

      {/* ── Right: hero image ── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src={authBg}
          alt="Evento"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#004d00]/95 via-[#007600]/65 to-[#007600]/30" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-bold mb-3 leading-tight">
            Melhor plataforma de eventos do Brasil
          </h2>
          <p className="text-lg opacity-90 leading-relaxed">
            Gestão completa, CRM integrado e doações simplificadas para sua
            comunidade.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface PasswordInputProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  minLength?: number;
  autoComplete?: string;
}

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  minLength,
  autoComplete,
}: PasswordInputProps) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className="pl-10 pr-10 h-11 rounded-lg"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={minLength}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

/** Map common Supabase error messages to Portuguese. */
function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("User already registered"))
    return "Este e-mail já está cadastrado. Tente entrar.";
  if (msg.includes("Password should be at least"))
    return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("Unable to validate email address"))
    return "Endereço de e-mail inválido.";
  return msg;
}

export default LoginPage;
