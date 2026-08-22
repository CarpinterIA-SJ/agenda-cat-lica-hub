// ============================================================
//  Client compartilhado da API do Asaas.
//  Usado por asaas-checkout e asaas-webhook.
//
//  Diferenças relevantes em relação ao Stripe (fonte de bugs se
//  esquecidas):
//   - Autenticação por header `access_token` (NÃO Authorization/Bearer).
//   - `value` vai em REAIS decimais (25.9), não em centavos (2590).
//   - Não existe mapa de metadata: só `externalReference` (uma string).
//     Por isso o que o webhook precisa saber (quantidade, taxa) é
//     persistido por nós em payments.gateway_payload no checkout.
// ============================================================

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY") ?? "";

// 'sandbox' (default) ou 'production'. Default conservador: enquanto
// ASAAS_ENV não for explicitamente 'production', cobra no sandbox.
const ASAAS_ENV = (Deno.env.get("ASAAS_ENV") ?? "sandbox").toLowerCase();

export const ASAAS_BASE_URL = ASAAS_ENV === "production"
  ? "https://api.asaas.com/v3"
  : "https://api-sandbox.asaas.com/v3";

export const isAsaasConfigured = (): boolean => ASAAS_API_KEY.length > 0;

/** Erro de API do Asaas com a descrição legível já extraída. */
export class AsaasError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = "AsaasError";
  }
}

interface AsaasErrorBody {
  errors?: Array<{ code?: string; description?: string }>;
}

/**
 * Chamada crua à API. Lança AsaasError com a descrição do Asaas quando
 * a resposta não é 2xx — o `errors[].description` é em português e serve
 * direto ao usuário final na maioria dos casos.
 */
export async function asaasRequest<T>(
  path: string,
  init: { method?: string; body?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  if (!ASAAS_API_KEY) {
    throw new AsaasError("ASAAS_API_KEY não configurada no ambiente.", 500);
  }

  const { method = "GET", body, timeoutMs = 20_000 } = init;

  // Sem timeout, uma lentidão do Asaas seguraria o isolate até o limite
  // da plataforma e o comprador ficaria olhando um spinner infinito.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${ASAAS_BASE_URL}${path}`, {
      method,
      headers: {
        "access_token": ASAAS_API_KEY,
        "Content-Type": "application/json",
        "User-Agent": "GuardiaoEventos/1.0",
      },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new AsaasError("O Asaas não respondeu a tempo. Tente novamente.", 504);
    }
    throw new AsaasError(`Falha de rede ao falar com o Asaas: ${(err as Error).message}`, 502);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const first = (parsed as AsaasErrorBody)?.errors?.[0];
    throw new AsaasError(
      first?.description ?? `Asaas respondeu ${res.status}.`,
      res.status,
      first?.code ?? null,
    );
  }

  return parsed as T;
}

// ─── Customers ──────────────────────────────────────────────

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string | null;
  cpfCnpj?: string | null;
}

interface AsaasList<T> {
  data: T[];
  totalCount?: number;
}

/**
 * Busca o cliente pelo CPF/CNPJ e cria só se não existir.
 *
 * O Asaas não deduplica sozinho: um POST /customers com o mesmo cpfCnpj
 * cria um cliente novo a cada checkout. A busca prévia evita encher a
 * conta de duplicatas do mesmo comprador.
 */
export async function findOrCreateCustomer(input: {
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  externalReference?: string;
}): Promise<AsaasCustomer> {
  const cpfCnpj = onlyDigits(input.cpfCnpj);

  const found = await asaasRequest<AsaasList<AsaasCustomer>>(
    `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}&limit=1`,
  );
  if (found?.data?.length) return found.data[0];

  return await asaasRequest<AsaasCustomer>("/customers", {
    method: "POST",
    body: {
      name: input.name,
      cpfCnpj,
      email: input.email || undefined,
      mobilePhone: input.mobilePhone ? onlyDigits(input.mobilePhone) : undefined,
      externalReference: input.externalReference,
      notificationDisabled: true, // quem notifica o participante é o Guardião
    },
  });
}

// ─── Payments ───────────────────────────────────────────────

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: string;
  status: string;
  value: number;      // REAIS, não centavos
  netValue?: number;
  dueDate: string;    // YYYY-MM-DD
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  externalReference?: string | null;
  description?: string | null;
}

export async function createPayment(input: {
  customer: string;
  billingType: AsaasBillingType;
  valueCents: number;
  dueDate: string;
  description: string;
  externalReference: string;
}): Promise<AsaasPayment> {
  return await asaasRequest<AsaasPayment>("/payments", {
    method: "POST",
    body: {
      customer: input.customer,
      billingType: input.billingType,
      // Centavos → reais. toFixed(2) evita mandar 25.900000000000002.
      value: Number((input.valueCents / 100).toFixed(2)),
      dueDate: input.dueDate,
      description: input.description,
      externalReference: input.externalReference,
    },
  });
}

export interface AsaasPixQrCode {
  /** PNG em base64, SEM o prefixo `data:image/png;base64,`. */
  encodedImage: string;
  /** Copia-e-cola (BR Code). */
  payload: string;
  expirationDate?: string | null;
}

export const getPixQrCode = (paymentId: string): Promise<AsaasPixQrCode> =>
  asaasRequest<AsaasPixQrCode>(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`);

export interface AsaasBoletoIdentification {
  /** Linha digitável. */
  identificationField: string;
  nossoNumero?: string | null;
  barCode?: string | null;
}

export const getBoletoIdentification = (paymentId: string): Promise<AsaasBoletoIdentification> =>
  asaasRequest<AsaasBoletoIdentification>(
    `/payments/${encodeURIComponent(paymentId)}/identificationField`,
  );

export interface AsaasPaymentStatus {
  id: string;
  status: string;
}

/**
 * Cobrança liquidada no Asaas — usada em TODOS os pontos que precisam
 * responder "o dinheiro já entrou?": DUPLICATE_HOLD no asaas-checkout,
 * scan de pendentes e sweep de reservas vencidas no reconcile-payments.
 * Uma constante só, de propósito — os chamadores não podem divergir sobre
 * o que conta como pago (migration 039, checklist da Fase 5).
 */
export const ASAAS_PAID_STATUSES = new Set([
  "RECEIVED",
  "CONFIRMED",
  "RECEIVED_IN_CASH",
  "DUNNING_RECEIVED",
]);

/**
 * Status ATUAL de uma cobrança — GET simples, sem cache. Usada nos dois
 * pontos da Fase 5 que precisam reconsultar antes de decidir e nunca
 * confiar em status lido antes: resolução de DUPLICATE_HOLD no
 * asaas-checkout e o sweep de reservas vencidas no reconcile-payments.
 */
export const getPayment = (paymentId: string): Promise<AsaasPaymentStatus> =>
  asaasRequest<AsaasPaymentStatus>(`/payments/${encodeURIComponent(paymentId)}`);

export interface AsaasDeleteResult {
  deleted: boolean;
  id: string;
}

/**
 * Remove uma cobrança no Asaas. Usada em dois pontos da Fase 5: expiração
 * de reserva 'held' vencida (dobrada no reconcile-payments, sem cron novo)
 * e resolução de reserva 'held' duplicada no mesmo checkout (mesma
 * cobrança antiga, apagada antes de criar a nova).
 *
 * ARMADILHA (migration 031/039): o QR do PIX segue pagável por até 12
 * meses após o vencimento. A cobrança PRECISA ser apagada aqui ANTES de
 * qualquer `release_ticket_reservation` — nessa ordem, sempre. Uma reserva
 * liberada com a cobrança ainda viva reabre exatamente o overselling que
 * a Fase 5 existe para fechar.
 *
 * SEM PRIMITIVA ATÔMICA: a documentação do Asaas recomenda checar o status
 * antes de excluir, mas não garante um "delete-se-não-pago" atômico do
 * lado deles — o pagamento pode ser liquidado no intervalo entre a
 * consulta de status do chamador e esta chamada. Essa janela (1
 * round-trip) não é fechável por aqui. O chamador deve:
 *   1. Reconsultar o status IMEDIATAMENTE antes de chamar isto — nunca
 *      confiar num status lido minutos atrás.
 *   2. Tratar falha desta chamada (exceto 404, ver abaixo) como "não
 *      liberar a reserva" — nunca soltar vaga sem exclusão confirmada.
 *   3. Aceitar a janela residual como risco monitorado, não eliminável: se
 *      o pagamento cair bem nesse instante, confirm_ticket_reservation
 *      (039) classifica o caso como 'RELEASED' — alarme e reconciliação
 *      manual, nunca estouro silencioso de vaga.
 *
 * 404 (cobrança já não existe — ex.: PAYMENT_DELETED chegou antes de nós
 * tentarmos apagar) não é falha para quem chama: o efeito desejado
 * (cobrança morta) já está garantido. Decidir isso é do chamador, via
 * `e.status === 404` no catch — mesmo padrão já usado em
 * reconcile-payments para 404 de consulta.
 */
export const deletePayment = (paymentId: string): Promise<AsaasDeleteResult> =>
  asaasRequest<AsaasDeleteResult>(`/payments/${encodeURIComponent(paymentId)}`, {
    method: "DELETE",
  });

// ─── Utilidades ─────────────────────────────────────────────

export const onlyDigits = (v: string): string => String(v ?? "").replace(/\D/g, "");

/** Data no formato exigido pelo Asaas (YYYY-MM-DD), em horário de Brasília. */
export function asaasDueDate(daysFromNow: number): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000); // UTC-3
  brt.setUTCDate(brt.getUTCDate() + Math.max(0, Math.ceil(daysFromNow)));
  return brt.toISOString().slice(0, 10);
}

/**
 * Valida CPF (11 dígitos) ou CNPJ (14) pelos dígitos verificadores.
 *
 * O Asaas rejeita documento inválido na criação do cliente; validar aqui
 * devolve um erro claro ao comprador antes de qualquer chamada externa.
 */
export function isValidCpfCnpj(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length === 11) return isValidCpf(d);
  if (d.length === 14) return isValidCnpj(d);
  return false;
}

function isValidCpf(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  for (const [len, factor] of [[9, 10], [10, 11]] as const) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (factor - i);
    const check = (sum * 10) % 11 % 10;
    if (check !== Number(cpf[len])) return false;
  }
  return true;
}

function isValidCnpj(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number): number => {
    const weights = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cnpj[i]) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}
