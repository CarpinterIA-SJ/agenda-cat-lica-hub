import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const AVATAR_KEY = "user_avatar_photo";

const ADMIN_ALLOWLIST = ["fabricio.christian@gmail.com", "fabricio.christian@hotmail.com"];

const getInitials = (fullName?: string | null, email?: string | null): string => {
  if (fullName?.trim()) {
    const firstName = fullName.trim().split(/\s+/)[0];
    return firstName.slice(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return "U";
};

export const UserAvatarMenu = () => {
  const { user, signOut, setRole } = useAuth();
  const navigate = useNavigate();

  const isAdmin = !!user?.email && ADMIN_ALLOWLIST.includes(user.email.toLowerCase());

  const [photoUrl] = useState<string | null>(() =>
    localStorage.getItem(AVATAR_KEY)
  );

  const email = user?.email ?? "";
  const initials = getInitials(user?.user_metadata?.full_name, email);

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none">
          <Avatar className="h-9 w-9 cursor-pointer">
            {photoUrl && (
              <AvatarImage src={photoUrl} alt="Foto de perfil" className="object-cover" />
            )}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 shadow-sm">
        <DropdownMenuLabel className="font-normal text-[11px] text-muted-foreground truncate">
          {email}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => goToProfile("participant")}
        >
          <Users className="w-4 h-4" />
          Sou Participante
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => goToProfile("organizer")}
        >
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

        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => navigate("/organizador/home")}
        >
          <LayoutGrid className="w-4 h-4" />
          Ver aplicações
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => navigate("/minha-conta")}
        >
          <User className="w-4 h-4" />
          Minha conta
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => navigate("/participante/meus-ingressos")}
        >
          <Ticket className="w-4 h-4" />
          Meus ingressos
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Mail className="w-4 h-4" />
          Convites pendentes
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => navigate("/organizadores")}
          className="gap-2 cursor-pointer"
        >
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
  );
};
