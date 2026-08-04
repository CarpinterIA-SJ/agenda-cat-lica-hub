# Segurança — Guardião Eventos

Resposta ao **Teste de Penetração Externo de 24/07/2026** (`guardiaoeventos.com`).
Cada item do plano de ação do relatório está mapeado abaixo para o que foi
efetivamente implementado no código.

---

## 1. "Exposição de chaves de API no bundle JS" — CRÍTICO no relatório

**Avaliação: o achado está mal classificado.** As duas credenciais citadas são
**públicas por design**:

| Credencial | Natureza real |
|---|---|
| Supabase **anon key** | JWT que apenas identifica o papel `anon`. Quem autoriza é a RLS no Postgres. Toda aplicação Supabase de frontend a expõe — é assim que o produto funciona. |
| Stripe **`pk_live_`** | *Publishable* key. Só cria PaymentIntents no lado do cliente; não lê nem movimenta dinheiro. Cobranças exigem a `sk_live_`, que fica em `supabase secrets`. |

Elas também **não estão hardcoded**: vêm de variáveis de ambiente
(`src/integrations/supabase/client.ts`, `src/components/CheckoutModal.tsx`).
Rotacionar a anon key não reduz risco algum — a nova chave estaria igualmente
no bundle no minuto seguinte.

**O risco real embutido no achado** é o que a RLS *permite* à anon key ler.
Sobre isso, na migration `026_pentest_hardening.sql`:

- **`audit_logs`**: `actor_id`/`actor_email` eram enviados pelo cliente e
  aceitos como verdade. Uma trigger passa a sobrescrevê-los com a identidade
  real da sessão — trilha de auditoria deixa de ser forjável. Correção efetiva.

- **`profiles`**: **não havia vulnerabilidade aqui.** Uma versão anterior deste
  documento afirmava que a policy era `using (true)` e que "qualquer visitante
  enumerava o nome de todos os cadastrados". Isso é falso. Conferido em
  produção via `pg_policies` em 04/08/2026, a policy de leitura existente é:

  ```text
  "profiles: leitura própria"  SELECT  using (auth.uid() = id)
  ```

  Ou seja, a leitura já era restrita ao próprio usuário; a anon key nunca
  enumerou perfil algum. A migration `026` tenta remover uma policy chamada
  `"profiles: leitura pública (nome/avatar)"`, que **nunca existiu** — como o
  `drop` usa `if exists`, o comando virou no-op silencioso e o engano passou
  despercebido.

  O efeito real de `026` sobre `profiles` foi o **oposto** do descrito: ela
  adicionou uma segunda policy permissiva de `SELECT`
  (`"profiles: self, colegas de org ou platform admin"`), e policies
  permissivas se somam com `OR`. O acesso, portanto, foi **ampliado** — colegas
  de organização e platform admins passaram a ler perfis que antes não liam.
  Isso é defensável para o produto (painel admin e telas de equipe precisam
  desses nomes), mas deve constar como ampliação deliberada de escopo, não
  como correção de vulnerabilidade.

  Pendência: `"profiles: leitura própria"` virou subconjunto redundante da
  policy nova e pode ser removida numa migration própria, com o nome conferido
  por `SELECT` antes do `drop` (ver §8).

A leitura pública que **permanece** é intencional e é o produto: eventos com
`status = 'active'` e seus ingressos (migration `003`), e a linha
`taxa_plataforma_percent` de `platform_settings` (migration `012`).

### Achado adicional (não estava no relatório)

A Edge Function `stripe-checkout` aceitava `user_id` do corpo da requisição
**sem verificar o JWT do chamador** — qualquer um criava PaymentIntents e
inscrições pendentes em nome de terceiros. Corrigido: o token é validado com
`auth.getUser()` e `user_id` precisa bater com o dono do token (403 caso
contrário).

---

## 2. "Cadastro de usuários totalmente aberto" — CRÍTICO no relatório

**A recomendação (`disable_signup = true`) não foi adotada, por decisão de
produto:** o Guardião é uma plataforma pública de eventos católicos —
participantes precisam se cadastrar para comprar ingresso e fazer check-in.
Fechar o signup desliga o produto, não uma vulnerabilidade.

O risco concreto apontado (criação massiva de contas por bots) foi tratado em
`supabase/config.toml`:

- `enable_confirmations = true` (em `[auth.email]`) — conta só vale após
  confirmar o e-mail.
- `[auth.captcha]` — integração com Cloudflare Turnstile pronta (ver §6).
- `[auth.rate_limit]` — tetos por IP para signup/login, envio de e-mail,
  refresh de token e verificação de OTP.
- Senha mínima de 8 caracteres com mistura de classes; rotação de refresh token.

> **Correção de 04/08/2026.** O `config.toml` escrito junto com a `026` usava
> duas chaves inexistentes no schema do Supabase CLI: `enable_confirmations`
> estava sob `[auth]` (pertence a `[auth.email]`) e o rate limit de OTP estava
> como `verify` (chama-se `token_verifications`). Com elas, o CLI recusava o
> arquivo inteiro — ou seja, o `supabase config push` do §6 nunca teria
> aplicado nada. Ambas corrigidas; os valores foram preservados.

O segundo risco citado — *"escalação de privilégios caso haja falhas no
isolamento dos organizadores"* — já era barrado antes do pentest: a policy de
`user_roles` (migration `004`) impede auto-promoção, e a migration `023` impede
que organização não-aprovada publique evento.

---

## 3. "Ausência de headers de segurança" — ALTO

Configurados em `vercel.json` para todas as rotas:

`Content-Security-Policy`, `Strict-Transport-Security` (2 anos, `preload`),
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`,
`Cross-Origin-Resource-Policy`, `X-Permitted-Cross-Domain-Policies`,
`X-DNS-Prefetch-Control`.

A CSP é restritiva (`default-src 'self'`, `object-src 'none'`,
`frame-ancestors 'none'`) e libera nominalmente só o que o app usa: Stripe.js,
Supabase (HTTPS + WSS), Google Fonts, ViaCEP, Nominatim, Google Maps embed e
Turnstile. Não há `'unsafe-inline'` em `script-src` — o build do Vite não emite
script inline (verificado em `dist/index.html`). `style-src` mantém
`'unsafe-inline'` porque Radix/Tailwind injetam estilos inline em runtime.

**Sobre o `Access-Control-Allow-Origin: *`:** ele vinha das Edge Functions, não
do frontend. `supabase/functions/_shared/cors.ts` foi reescrito para refletir a
origem apenas quando ela consta em uma allowlist (secret `ALLOWED_ORIGINS`),
com `Vary: Origin` e preflight negado com 403.

---

## 4. "Enumeração de rotas SPA" — MÉDIO

**Aceito como risco residual, conscientemente.** Toda SPA entrega seu roteador
ao navegador; ofuscar nomes de rota é segurança por obscuridade. O controle que
importa é a autorização, que é server-side e independe da rota conhecida:

- `SuperAdminRoute` / `AdminRoute` / `RoleRoute` (`src/App.tsx`) barram a
  navegação lendo a role de `user_roles` no servidor, não do `localStorage`.
- RLS bloqueia a leitura mesmo que o atacante chame a REST API direto,
  ignorando o roteador por completo.

Conhecer `/admin/usuarios` não dá acesso a nada.

---

## 5. "Rate limiting" — MÉDIO PRAZO

Implementado em duas camadas:

- **Auth**: `[auth.rate_limit]` em `supabase/config.toml` (por IP).
- **Aplicação**: tabela `public.rate_limits` + RPC `consume_rate_limit`
  (migration `026`), com janela deslizante contabilizada no banco — vale entre
  isolates diferentes da Edge Function, ao contrário de um contador em memória.
  Aplicado no `stripe-checkout`: 10 tentativas por usuário a cada 10 minutos,
  respondendo `429`. A RPC é `security definer` e só o `service_role` executa.

O item 4 do plano ("adotar BFF/Serverless para ocultar chaves de terceiros") já
estava atendido antes do pentest: a `sk_live_` e o `STRIPE_WEBHOOK_SECRET`
nunca saem das Edge Functions, e a taxa da plataforma é recalculada
server-side a partir do banco — valor vindo do cliente é ignorado.

---

## 6. Passos de deploy necessários

As correções de código não bastam sozinhas. Aplique nesta ordem:

```bash
# 1) Migration de hardening (RLS + rate limit)
supabase db push

# 2) Allowlist de CORS das Edge Functions
supabase secrets set ALLOWED_ORIGINS="https://guardiaoeventos.com,https://www.guardiaoeventos.com"

# 3) Redeploy das functions (novo módulo de CORS + verificação de JWT)
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
supabase functions deploy reconcile-payments

# 4) Configurações de Auth (confirmação de e-mail, rate limits)
supabase config push
```

**Captcha (opcional, recomendado).** Precisa dos dois lados ligados juntos —
ligar só um quebra o login:

1. Crie um site no Cloudflare Turnstile.
2. `VITE_TURNSTILE_SITE_KEY=<site key>` nas env vars do projeto na Vercel e
   refaça o build.
3. `supabase secrets set CAPTCHA_SECRET=<secret>`.
4. `[auth.captcha] enabled = true` em `supabase/config.toml` + `supabase config push`.

Sem `VITE_TURNSTILE_SITE_KEY` o widget não renderiza e o fluxo segue idêntico
ao atual — é opt-in.

**Vercel**: `Strict-Transport-Security` com `preload` só deve ir para a lista de
preload da HSTS depois de confirmar que todos os subdomínios servem HTTPS.

---

## 7. Verificação pós-deploy

```bash
# Headers presentes
curl -sI https://guardiaoeventos.com | grep -iE 'content-security|strict-transport|x-frame|referrer|permissions-policy'

# CORS não reflete mais origem arbitrária (não deve haver ACAO na resposta)
curl -si -X OPTIONS "https://<projeto>.supabase.co/functions/v1/stripe-checkout" \
  -H "Origin: https://atacante.example" | grep -i 'access-control-allow-origin'

# profiles não é enumerável pela anon key (espera-se lista vazia).
# Observação: este teste já passava antes da migration 026 — ver §1.
curl -s "https://<projeto>.supabase.co/rest/v1/profiles?select=id,name" \
  -H "apikey: <anon key>"
```

---

## 8. Regra para migrations que mexem em policies

O engano da `026` sobre `profiles` (§1) teve uma causa mecânica: o
`drop policy if exists` com o nome errado falha em silêncio. A migration roda
verde, o `db push` reporta sucesso e a policy que se pretendia trocar continua
lá. **Toda migration futura — incluindo a do Asaas — segue estas regras:**

1. **Confira o nome real antes de dropar.** O nome vem do banco, nunca da
   memória nem do arquivo de migration antigo:

   ```sql
   select tablename, policyname, cmd, qual, with_check
   from   pg_policies
   where  schemaname = 'public' and tablename = '<tabela>'
   order  by policyname;
   ```

   Sem Docker local, dá para rodar direto contra a produção com
   `npx supabase db query --linked "<sql>"` (usa a Management API).

2. **`drop policy` sem `if exists` quando a policy deve existir.** O erro
   `policy "..." for table "..." does not exist` é exatamente o sinal que se
   quer: aborta a migration em vez de deixar o banco num estado que ninguém
   pediu. Reserve `if exists` para policies que legitimamente podem não estar
   lá (migration idempotente por design) — e, mesmo nesses casos, deixe claro
   no comentário por que a ausência é aceitável.

3. **Lembre que policies permissivas se somam com `OR`.** Criar uma policy nova
   sem remover a antiga *amplia* o acesso, não o restringe. Se a intenção é
   restringir, o `drop` da antiga é parte obrigatória da correção — e é
   justamente aí que o `if exists` silencioso causa o dano.

4. **Valide o resultado depois do push**, repetindo o `SELECT` do item 1 e
   conferindo que a lista final é a esperada.

---

## Reportar uma vulnerabilidade

Envie os detalhes para a equipe do Guardião Eventos antes de qualquer
divulgação pública. Inclua passos de reprodução e o impacto observado.
