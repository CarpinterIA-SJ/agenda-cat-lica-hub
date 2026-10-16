# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Guardião Eventos** (guardiaoeventos.com): plataforma de eventos/inscrições católicos. SPA React + Supabase. Código, comentários, commits e UI em português.

## Comandos

```bash
npm run dev            # Vite em http://localhost:8080
npm run build          # tsc --noEmit -p tsconfig.app.json && vite build  (o tsc é o gate de tipos)
npm run lint           # eslint .
npm test               # vitest run (jsdom, arquivos src/**/*.{test,spec}.{ts,tsx})
npx vitest run src/caminho/arquivo.test.ts      # um teste unitário
npm run test:e2e       # Playwright (e2e/), sobe `npm run dev` sozinho; projetos chromium-desktop e chromium-mobile
npx playwright test e2e/landing-flow.spec.ts --project=chromium-desktop   # um spec/projeto
```

Cobertura de teste é mínima (`src/test/example.test.ts` é placeholder; um spec E2E). "Build verde" = `npm run build` passando.

## Stack

Vite + React 18 + TypeScript, react-router-dom v6, TanStack Query, shadcn/ui (Radix + Tailwind, componentes em `src/components/ui/`), react-hook-form + zod, Tiptap. Alias `@/` → `src/`. Projeto nasceu no Lovable (`lovable-tagger` no Vite dev).

## Arquitetura

- **Rotas em `src/App.tsx`** (~4.400 linhas). Além do `<Routes>`, ele contém os guards (`ProtectedRoute`, `RoleRoute`, `AdminRoute`, `SuperAdminRoute`) e **várias páginas do organizador definidas inline** (`OrganizerEventNewPage`, `...IngressosPage`, `...ParticipantesPage`, `...CuponsPage`, `...FinanceiroPage`, `...ConfiguracoesPage` etc.). Antes de procurar uma página em `src/pages/`, faça grep em `App.tsx`.
- Três áreas: `/organizador/*` e `/crm/*` (role organizer), `/participante/*` (role participant), `/admin/*` (`AdminLayout`, páginas em `src/pages/admin/`). Página pública do evento: `/evento/:slug` (`PublicEventPage`, exportada de `ExploreEventsPage.tsx`).
- **Auth/papéis**: `src/hooks/use-auth.tsx` (contexto) + `use-app-roles.ts`. Papel de UI (`organizer|participant|admin`) é escolhido em `/role-select`; `appRoles` vem do banco (super admin / platform admin).
- **Dados**: hooks por domínio em `src/hooks/use-*.ts` chamando `supabase` direto (sem camada de API própria). Autorização real é RLS + RPCs no Postgres.
- **Cliente Supabase** (`src/integrations/supabase/client.ts`): sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` válidos cai no `mock-client.ts`, que hoje **lança erro em qualquer uso** (o comentário em `e2e/landing-flow.spec.ts` dizendo que o mock devolve sessão está desatualizado). Em PROD o build quebra sem as envs.
- **`types.ts` é gerado (`supabase gen types`) mas tem ajuste manual** nos `Insert` de `events`/`event_tickets`. Ao regenerar, reaplicar o ajuste (ver aviso no topo do arquivo) ou o `tsc` do build reprova.

## Pagamentos e Edge Functions (`supabase/functions/`, Deno)

- Checkout ativo é **Asaas**: `EventRegistrationModal` → `AsaasCheckoutModal` → `asaas-checkout`; confirmação via `asaas-webhook` (token estático no header, `verify_jwt = false` em `supabase/config.toml`). O valor cobrado é o gravado em `payments` no checkout, nunca o do corpo do webhook.
- Stripe (`stripe-checkout`, `stripe-webhook`, `CheckoutModal`) coexiste em paralelo; mudanças em Asaas não tocam arquivos do Stripe.
- `reconcile-payments` roda agendado (migrations 024/028). `delete-account` = exclusão self-service.
- `_shared/cors.ts`: CORS por allowlist (`ALLOWED_ORIGINS`), nunca `*`. `_shared/option-counts.ts` e `asaas.ts` compartilhados.
- Constantes duplicadas front/Deno devem ficar em sincronia (ex.: `MIN_PAID_TICKET_CENTS` em `src/lib/pricing.ts` e em `stripe-checkout`).
- Valores monetários em centavos (`*_cents`). Carrinho multi-tipo: `registration_ticket_items` + RPC `reserve_ticket_items` (migration 044).

## Banco / migrations

- `supabase/migrations/NNN_descricao.sql` numeradas sequencialmente. Muitas foram **aplicadas manualmente no SQL Editor** e o arquivo é registro: escrever idempotente (`if not exists`, `create or replace`) e anotar no cabeçalho se/quando já foi aplicada.
- Rollbacks em `supabase/rollbacks/NNN_ROLLBACK.sql`, rodados manualmente, nunca via `db push`.
- Nesta máquina não há Docker: `supabase db pull/dump/diff/reset` não funcionam. Inspecionar produção com `supabase db query --linked`.
- Antes de `DROP POLICY`, confirmar o nome real em `pg_policies`. Evitar `IF EXISTS` em drop de policy: já mascarou um engano (migration 026, ver `SECURITY.md`).
- `CREATE OR REPLACE FUNCTION` não remove parâmetros; mudança de assinatura exige `DROP FUNCTION` da assinatura antiga.

## Segurança e config

- `VITE_*` vai para o bundle: só chaves públicas (anon key Supabase, `pk_` Stripe, site key Turnstile). Segredos via `supabase secrets set` (ver `.env.example`).
- `SECURITY.md` mapeia o pentest de 2026-07-24 para as correções; consultar ao mexer em RLS, CORS, RPC grants ou `payment_config`.
- `vercel.json` define CSP estrita e rewrite SPA. Novo domínio externo (script, fetch, iframe) precisa ser adicionado na CSP, senão quebra em produção.

## Fluxo de trabalho

- Deploy: Vercel publica a partir do `main`. Branch pushada não é produção. `gh` não está autenticado nesta máquina.
- Após tarefa concluída e build verde, commit `checkpoint: <descrição>`. Confirmar `git status` limpo antes de refatorar.
