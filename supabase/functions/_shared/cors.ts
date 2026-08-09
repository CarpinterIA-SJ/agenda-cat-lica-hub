// ============================================================
//  CORS compartilhado pelas Edge Functions.
//
//  Pentest 2026-07-24 (ALTO): `Access-Control-Allow-Origin: *`
//  permitia que qualquer site invocasse as functions com credenciais
//  do visitante. Passamos a refletir a origem SOMENTE quando ela
//  consta na allowlist; caso contrário nenhum ACAO é emitido e o
//  browser bloqueia a leitura da resposta.
//
//  Configuração: secret ALLOWED_ORIGINS (lista separada por vírgula).
//    supabase secrets set ALLOWED_ORIGINS="https://guardiaoeventos.com,https://www.guardiaoeventos.com"
//  Entradas podem conter '*' como curinga de subdomínio
//  (ex: https://*.vercel.app para previews).
// ============================================================

// Usados quando ALLOWED_ORIGINS não está configurado. Mantém o app de
// produção e o dev local funcionando sem exigir um passo extra de deploy.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://guardiaoeventos.com",
  "https://www.guardiaoeventos.com",
  "https://*.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
];

const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;

/** Converte uma entrada da allowlist (com '*' opcional) em RegExp exata. */
function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]+");
  return new RegExp(`^${escaped}$`);
}

const ALLOWED_PATTERNS = ALLOWED_ORIGINS.map(patternToRegExp);

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_PATTERNS.some((re) => re.test(origin));
}

/** Headers CORS para a requisição. Origem não permitida → sem ACAO. */
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    // Resposta varia por origem — impede que um cache sirva o ACAO de outra.
    "Vary": "Origin",
  };
  if (isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}

/**
 * Resposta ao preflight. Origem fora da allowlist recebe 403 — o browser
 * já bloquearia por falta de ACAO, mas o 403 deixa o log explícito.
 */
export function preflightResponse(req: Request): Response {
  const headers = corsHeadersFor(req);
  const allowed = "Access-Control-Allow-Origin" in headers;
  return new Response(allowed ? "ok" : "Origem não autorizada.", {
    status: allowed ? 200 : 403,
    headers,
  });
}
