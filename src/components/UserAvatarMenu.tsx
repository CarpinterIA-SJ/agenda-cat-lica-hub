import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutGrid,
  User,
  Ticket,
  Mail,
  Users,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Calendar,
  Camera,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const AVATAR_KEY = "user_avatar_photo";

const ADMIN_ALLOWLIST = ["fabricio.christian@gmail.com", "fabricio.christian@hotmail.com"];

const getInitials = (fullName?: string | null, email?: string | null): string => {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email?.trim()) {
    const local = email.split("@")[0];
    return local.slice(0, 2).toUpperCase();
  }
  return "U";
};

export const UserAvatarMenu = () => {
  const { user, signOut, setRole } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(() =>
    localStorage.getItem(AVATAR_KEY)
  );

  const isAdmin = !!user?.email && ADMIN_ALLOWLIST.includes(user.email.toLowerCase());

  const email = user?.email ?? "";
  const fullName = user?.user_metadata?.full_name as string | undefined;
  const initials = getInitials(fullName, email);
  const displayName = fullName?.trim() || email;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const goToProfile = (role: "participant" | "organizer" | "admin") => {
    setRole(role);
    if (role === "participant") navigate("/participante/meus-ingressos");
    else if (role === "organizer") navigate("/organizador/meus-eventos");
    else navigate("/admin");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Foto muito grande. Máximo: 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      localStorage.setItem(AVATAR_KEY, result);
      setPhotoUrl(result);
      toast.success("Foto atualizada!");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    localStorage.removeItem(AVATAR_KEY);
    setPhotoUrl(null);
    toast.success("Foto removida.");
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="outline-none group relative">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
              {photoUrl && (
                <AvatarImage src={photoUrl} alt="Foto de perfil" className="object-cover" />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm select-none">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Camera className="w-3.5 h-3.5 text-white drop-shadow" />
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 shadow-md">
          {/* User header */}
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar className="h-10 w-10 shrink-0">
              {photoUrl && (
                <AvatarImage src={photoUrl} alt="Foto de perfil" className="object-cover" />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              {fullName && (
                <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
              )}
              <p className="text-[11px] text-muted-foreground truncate">{email}</p>
            </div>
          </div>

          {/* Photo actions */}
          <div className="px-2 pb-1 flex gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              {photoUrl ? "Alterar foto" : "Adicionar foto"}
            </button>
            {photoUrl && (
              <button
                onClick={handleRemovePhoto}
                className="flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                title="Remover foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => goToProfile("participant")}>
            <Users className="w-4 h-4" />
            Sou Participante
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => goToProfile("organizer")}>
            <Calendar className="w-4 h-4" />
            Sou Organizador
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-emerald-700 focus:text-emerald-700"
              onClick={() => goToProfile("admin")}
            >
              <ShieldCheck className="w-4 h-4" />
              Sou Administrador
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/organizador/home")}>
            <LayoutGrid className="w-4 h-4" />
            Ver aplicações
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/minha-conta")}>
            <User className="w-4 h-4" />
            Minha conta
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/participante/meus-ingressos")}>
            <Ticket className="w-4 h-4" />
            Meus ingressos
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Mail className="w-4 h-4" />
            Convites pendentes
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/organizadores")}>
            <Users className="w-4 h-4" />
            Organizadores
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <HelpCircle className="w-4 h-4" />
            Ajuda
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
