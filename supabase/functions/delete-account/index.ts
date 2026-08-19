// ============================================================
//  Edge Function: delete-account
//  Exclusão self-service da conta do usuário logado (LGPD).
//
//  NÃO faz DELETE físico em auth.users: organizations.owner_id →
//  profiles(id) ON DELETE CASCADE e payments.organization_id →
//  organizations(id) ON DELETE RESTRICT fariam um hard delete travar
//  (ou apagar dados de inscritos de terceiros) assim que o usuário for
//  dono de uma organização com evento/venda. Ver migration 040.
//
//  Fluxo:
//   1. Autentica o chamador pelo Bearer token (só o dono do token pode
//      excluir a própria conta — não há "excluir em nome de outro").
//   2. Se dono de organização com evento OU pagamento → bloqueia e
//      devolve os nomes das orgs, direcionando ao canal manual já
//      previsto em /privacidade (carpinteria.ia.sj@gmail.com).
//   3. Caso contrário: apaga organizações vazias de que é owner (cascade
//      cuida de members/projects/etc.), remove memberships em orgs de
//      terceiros, anonimiza nome/avatar em profiles, marca deleted_at
//      e bane o login via auth.admin.updateUserById.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@^3.23.8";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Banimento "permanente" — Supabase Auth não tem um valor nativo de
// "para sempre", 100 anos cumpre o mesmo papel na prática.
const PERMANENT_BAN_DURATION = "876000h";

const DELETE_RATE_MAX = 5;
const DELETE_RATE_WINDOW_SECONDS = 3600;

const requestSchema = z.object({
  confirmation: z.string(),
  password: z.string().optional(),
});

const CONFIRMATION_PHRASE = "EXCLUIR";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflightResponse(req);

  const cors = corsHeadersFor(req);
  const json = (payload: unknown, status = 200): Response =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Configuração do servidor incompleta." }, 500);
    }

    // 1) Autenticação — só o dono do token exclui a própria conta.
    const authHeader = req.headers.get("Authorization") ?? "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      return json({ error: "Autenticação obrigatória." }, 401);
    }
    const { data: caller, error: callerErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (callerErr || !caller?.user) {
      return json({ error: "Sessão inválida ou expirada. Faça login novamente." }, 401);
    }
    const callerId = caller.user.id;
    const callerEmail = caller.user.email ?? "";
    const hasPasswordIdentity = (caller.user.identities ?? []).some((i) => i.provider === "email");

    const raw = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return json({ error: "Dados inválidos." }, 400);
    }
    const { confirmation, password } = parsed.data;

    if (confirmation.trim().toUpperCase() !== CONFIRMATION_PHRASE) {
      return json({ error: `Digite "${CONFIRMATION_PHRASE}" para confirmar.` }, 400);
    }

    // 2) Rate limit — poucas tentativas por hora, evita força-bruta na senha.
    const { data: allowed, error: rateErr } = await supabaseAdmin.rpc("consume_rate_limit", {
      p_key: `delete-account:${callerId}`,
      p_max: DELETE_RATE_MAX,
      p_window_seconds: DELETE_RATE_WINDOW_SECONDS,
    });
    if (rateErr) {
      console.warn("[delete-account] consume_rate_limit indisponível:", rateErr.message);
    } else if (allowed === false) {
      return json({
        error: "rate_limited",
        message: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
      }, 429);
    }

    // 3) Reautenticação por senha — só se a conta tiver login por senha
    //    (contas só-Google não têm senha pra revalidar aqui).
    if (hasPasswordIdentity) {
      if (!password) {
        return json({ error: "Informe sua senha atual para confirmar." }, 400);
      }
      const scopedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { error: signInErr } = await scopedClient.auth.signInWithPassword({
        email: callerEmail,
        password,
      });
      if (signInErr) {
        return json({ error: "Senha incorreta." }, 401);
      }
    }

    // 4) Bloqueio: dono de organização com evento ou pagamento associado.
    const { data: ownedOrgs, error: ownedErr } = await supabaseAdmin
      .from("organizations")
      .select("id, name")
      .eq("owner_id", callerId);
    if (ownedErr) {
      console.error("[delete-account] erro ao ler organizations:", ownedErr.message);
      return json({ error: "Erro interno ao verificar organizações." }, 500);
    }

    const blockingOrgs: { id: string; name: string }[] = [];
    const emptyOrgIds: string[] = [];

    for (const org of ownedOrgs ?? []) {
      const [{ count: eventCount }, { count: paymentCount }] = await Promise.all([
        supabaseAdmin
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id),
        supabaseAdmin
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id),
      ]);
      if ((eventCount ?? 0) > 0 || (paymentCount ?? 0) > 0) {
        blockingOrgs.push(org);
      } else {
        emptyOrgIds.push(org.id);
      }
    }

    if (blockingOrgs.length > 0) {
      return json({
        error: "org_owner_blocked",
        message:
          "Você é dono de organização(ões) com eventos ou vendas registradas. " +
          "Exclusão automática não é permitida nesse caso — envie sua solicitação para " +
          "carpinteria.ia.sj@gmail.com para tratarmos manualmente.",
        organizations: blockingOrgs.map((o) => o.name),
      }, 409);
    }

    // 5) Sem bloqueio: apaga orgs vazias (cascade cuida do resto).
    if (emptyOrgIds.length > 0) {
      const { error: delOrgErr } = await supabaseAdmin
        .from("organizations")
        .delete()
        .in("id", emptyOrgIds);
      if (delOrgErr) {
        console.error("[delete-account] erro ao apagar orgs vazias:", delOrgErr.message);
        return json({ error: "Erro interno ao excluir organizações vazias." }, 500);
      }
    }

    // 6) Remove memberships remanescentes em orgs de terceiros.
    const { error: memErr } = await supabaseAdmin
      .from("organization_members")
      .delete()
      .eq("user_id", callerId);
    if (memErr) {
      console.warn("[delete-account] erro ao remover memberships:", memErr.message);
    }

    // 7) Anonimiza o perfil.
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ name: "Conta excluída", avatar_url: null, deleted_at: new Date().toISOString() })
      .eq("id", callerId);
    if (profErr) {
      console.error("[delete-account] erro ao anonimizar profile:", profErr.message);
      return json({ error: "Erro interno ao anonimizar o perfil." }, 500);
    }

    // 8) Bane o login. Última etapa — se algo acima falhou, o usuário
    //    ainda consegue entrar e tentar de novo em vez de ficar trancado
    //    de fora com a exclusão pela metade.
    const { error: banErr } = await supabaseAdmin.auth.admin.updateUserById(callerId, {
      ban_duration: PERMANENT_BAN_DURATION,
    });
    if (banErr) {
      console.error("[delete-account] erro ao banir usuário:", banErr.message);
      return json({ error: "Erro interno ao desativar o login." }, 500);
    }

    console.log("[delete-account] conta excluída:", { userId: callerId });
    return json({ success: true });
  } catch (e) {
    console.error("[delete-account] erro inesperado:", e);
    return json({ error: "Erro interno inesperado." }, 500);
  }
});
