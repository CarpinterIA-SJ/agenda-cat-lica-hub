// ============================================================
//  CaptchaWidget — Cloudflare Turnstile no fluxo de autenticação.
//  Pentest 24/07/2026, item 2 (cadastro aberto a bots).
//
//  Opt-in: sem VITE_TURNSTILE_SITE_KEY o componente não renderiza
//  nada e `useCaptcha()` devolve token undefined — dev local e os
//  testes seguem funcionando sem provisionar o serviço.
//
//  Para ativar, os DOIS lados precisam estar configurados:
//    frontend → VITE_TURNSTILE_SITE_KEY no build
//    backend  → [auth.captcha] enabled = true em supabase/config.toml
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";

export const TURNSTILE_SITE_KEY: string =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

export const CAPTCHA_ENABLED = TURNSTILE_SITE_KEY.length > 0;

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Carrega o script do Turnstile uma única vez por página. */
function loadTurnstile(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    script.addEventListener(
      "load",
      () => {
        if (window.turnstile) resolve(window.turnstile);
        else reject(new Error("Turnstile carregou sem expor a API."));
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Falha ao carregar o Turnstile.")),
      { once: true },
    );

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

export interface CaptchaState {
  /** Token a repassar em `options.captchaToken`. undefined quando desativado. */
  token: string | undefined;
  /** true quando o captcha está ativo e ainda não foi resolvido. */
  pending: boolean;
  /** Zera o desafio — obrigatório após erro (o token é de uso único). */
  reset: () => void;
  onSolved: (token: string) => void;
  onExpired: () => void;
  /** Incrementa a cada reset; o widget observa para reemitir o desafio. */
  resetSignal: number;
}

/** Estado do captcha para um formulário. Sem site key, é um no-op. */
export function useCaptcha(): CaptchaState {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [resetSignal, setResetSignal] = useState(0);

  const reset = useCallback(() => {
    setToken(undefined);
    setResetSignal((n) => n + 1);
  }, []);

  return {
    token,
    pending: CAPTCHA_ENABLED && !token,
    reset,
    onSolved: setToken,
    onExpired: reset,
    resetSignal,
  };
}

interface CaptchaWidgetProps {
  state: CaptchaState;
  className?: string;
}

/** Renderiza o desafio. Retorna null quando o captcha está desativado. */
export const CaptchaWidget = ({ state, className }: CaptchaWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const { onSolved, onExpired, resetSignal } = state;

  useEffect(() => {
    if (!CAPTCHA_ENABLED) return;

    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        // Reset re-executa o efeito: descarta o widget anterior antes de
        // renderizar o novo, senão o Turnstile empilha desafios na div.
        if (widgetIdRef.current) api.remove(widgetIdRef.current);
        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: onSolved,
          "expired-callback": onExpired,
          "error-callback": onExpired,
          theme: "auto",
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [onSolved, onExpired, resetSignal]);

  // Desmontagem: libera o widget do Turnstile.
  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!CAPTCHA_ENABLED) return null;

  return (
    <div className={className}>
      <div ref={containerRef} />
      {loadError && (
        <p className="mt-1 text-xs text-destructive">
          Não foi possível carregar a verificação de segurança. Recarregue a página.
        </p>
      )}
    </div>
  );
};
