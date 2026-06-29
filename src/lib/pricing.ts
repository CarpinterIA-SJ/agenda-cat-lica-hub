// ============================================================
//  Regras de preço de ingresso pago.
// ============================================================

/**
 * Valor mínimo de um ingresso PAGO, em centavos.
 *
 * Motivo: o checkout oferece cartão + boleto no MESMO PaymentIntent, e o
 * Stripe Brasil rejeita boleto < R$ 5,00 (erro `amount_too_small`). Como o
 * mínimo efetivo é o MAIOR entre os métodos habilitados, vale R$ 5,00
 * enquanto o boleto estiver ativo. (Cartão ~R$ 0,50; PIX baixo — se um dia o
 * checkout passar a oferecer só cartão/PIX, dá pra baixar esta constante.)
 *
 * NB: a Edge Function `stripe-checkout` tem uma cópia desta constante
 * (runtime Deno, fora de src/). Mantenha as duas em sincronia.
 */
export const MIN_PAID_TICKET_CENTS = 500;
export const MIN_PAID_TICKET_BRL = MIN_PAID_TICKET_CENTS / 100;

export const MIN_PAID_TICKET_MESSAGE =
  "Ingressos pagos devem custar no mínimo R$ 5,00 (exigência da processadora de pagamento). Para valores menores, considere deixar o ingresso gratuito.";

/** Converte um input em reais ("2,00" / "2.50") para centavos. NaN → 0. */
export const brlInputToCents = (input: string): number =>
  Math.round((parseFloat(String(input).replace(",", ".")) || 0) * 100);
