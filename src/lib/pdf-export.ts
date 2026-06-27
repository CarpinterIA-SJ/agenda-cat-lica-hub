import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================================
//  Geração client-side de relatórios financeiros em PDF.
//  Funções puras: recebem dados já tipados, não consultam o
//  Supabase. jsPDF (Helvetica padrão) + jspdf-autotable.
//
//  Não há logo em /public (apenas favicon/placeholder), então a
//  capa usa o nome "Guardião Eventos" como marca em texto.
// ============================================================

const GREEN: [number, number, number] = [22, 101, 52]; // #166534
const GREY_ROW: [number, number, number] = [245, 245, 245];
const MARGIN = 12;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents: number | null | undefined) => brl.format((cents ?? 0) / 100);

const pad = (n: number) => String(n).padStart(2, "0");
const dt = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dateOnly = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// ─── Tipos de entrada ───────────────────────────────────────

export interface PdfTxRow {
  eventName: string;
  organizationName: string;
  participantName: string;
  date: string | null; // ISO
  amountCents: number;
  feeCents: number;
  netCents: number;
  method: string; // já rotulado (Cartão / PIX / Boleto…)
  status: string; // já rotulado (Confirmado / Pendente…)
}

export interface FinancialReportInput {
  generatedBy: string;
  periodLabel: string;
  summary: {
    volume: number;
    taxa: number;
    aRepassar: number;
    repassado: number;
    ticketMedio: number;
  };
  transactions: PdfTxRow[];
}

export interface EventReportInput {
  generatedBy: string;
  event: {
    name: string;
    organizationName: string;
    date: string | null;
    location: string;
    capacity: number;
    vendidos: number;
    ocupacao: number | null;
    bruta: number;
    taxa: number;
    liquida: number;
  };
  tickets: { name: string; type: string; quantity: number; sold: number; priceCents: number }[];
  transactions: PdfTxRow[];
}

export interface AttendeesReportInput {
  generatedBy: string;
  event: {
    name: string;
    organizationName: string;
    date: string | null; // ISO
    slug: string;
    total: number;
  };
  attendees: {
    name: string;
    email: string;
    phone: string;
    ticket: string;
    status: string; // já rotulado (Confirmado / Pendente…)
    date: string | null; // ISO da inscrição
  }[];
}

export interface OrgReportInput {
  generatedBy: string;
  org: {
    name: string;
    arrecadado: number;
    taxaRetida: number;
    saldoDisponivel: number;
    totalSacado: number;
  };
  events: { name: string; status: string; brutaCents: number; vendidos: number }[];
  withdrawals: { date: string | null; amountCents: number; status: string }[];
}

// ─── Infra de layout ────────────────────────────────────────

const newDoc = () => new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

/** Marca discreta no topo de cada página (callback do autotable). */
const runningHeader = (doc: jsPDF) => () => {
  doc.setFontSize(9);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Guardião Eventos", MARGIN, 8);
  doc.setFont("helvetica", "normal");
};

/** Bloco de capa na página 1. Retorna o Y onde o conteúdo deve começar. */
const drawCover = (doc: jsPDF, title: string, lines: string[]): number => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text("Guardião Eventos", MARGIN, 24);

  doc.setFontSize(15);
  doc.setTextColor(40, 40, 40);
  doc.text(title, MARGIN, 33);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  lines.forEach((l, i) => doc.text(l, MARGIN, 42 + i * 5.5));

  const y = 42 + lines.length * 5.5 + 2;
  doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, doc.internal.pageSize.getWidth() - MARGIN, y);
  return y + 6;
};

const sectionTitle = (doc: jsPDF, text: string, y: number): number => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text(text, MARGIN, y);
  doc.setFont("helvetica", "normal");
  return y + 3;
};

const lastY = (doc: jsPDF): number => (doc as any).lastAutoTable?.finalY ?? 60;

const baseTableOpts = (doc: jsPDF) => ({
  theme: "striped" as const,
  headStyles: { fillColor: GREEN, textColor: 255, fontStyle: "bold" as const, fontSize: 8 },
  alternateRowStyles: { fillColor: GREY_ROW },
  styles: { fontSize: 8, cellPadding: 1.6, overflow: "linebreak" as const },
  margin: { left: MARGIN, right: MARGIN, top: 12 },
  didDrawPage: runningHeader(doc),
});

/** Rodapé (plataforma + página X de Y) em todas as páginas. Chamar por último. */
const drawFooters = (doc: jsPDF) => {
  const total = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("Guardião Eventos — Plataforma de Eventos", MARGIN, h - 6);
    doc.text(`Página ${i} de ${total}`, w - MARGIN, h - 6, { align: "right" });
  }
};

const fileName = (tipo: string) =>
  `guardiao-financeiro-${tipo}-${new Date().toISOString().slice(0, 10)}.pdf`;

const txHead = [[
  "Evento", "Organização", "Participante", "Data",
  "Bruto", "Taxa", "Líquido", "Método", "Status",
]];
const txBody = (rows: PdfTxRow[]) =>
  rows.map((t) => [
    t.eventName, t.organizationName, t.participantName, dt(t.date),
    money(t.amountCents), money(t.feeCents), money(t.netCents), t.method, t.status,
  ]);

// ─── 1. Relatório financeiro geral ──────────────────────────

export const generateFinancialReport = (input: FinancialReportInput): void => {
  const doc = newDoc();
  let y = drawCover(doc, "Relatório Financeiro", [
    `Período: ${input.periodLabel}`,
    `Gerado em: ${dt(new Date().toISOString())}`,
    `Gerado por: ${input.generatedBy}`,
  ]);

  y = sectionTitle(doc, "1. Resumo executivo", y);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: y,
    head: [["Indicador", "Valor"]],
    body: [
      ["Volume processado", money(input.summary.volume)],
      ["Taxa da plataforma arrecadada", money(input.summary.taxa)],
      ["Valor a repassar", money(input.summary.aRepassar)],
      ["Total já repassado", money(input.summary.repassado)],
      ["Ticket médio por inscrição", money(input.summary.ticketMedio)],
    ],
    columnStyles: { 1: { halign: "right" } },
  });

  y = sectionTitle(doc, "2. Transações do período", lastY(doc) + 8);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: y,
    head: txHead,
    body: txBody(input.transactions),
    columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
  });

  drawFooters(doc);
  doc.save(fileName("geral"));
};

// ─── 2. Relatório por evento ────────────────────────────────

export const generateEventReport = (input: EventReportInput): void => {
  const doc = newDoc();
  const ev = input.event;
  let y = drawCover(doc, `Relatório Financeiro — ${ev.name}`, [
    `Organização: ${ev.organizationName}`,
    `Gerado em: ${dt(new Date().toISOString())}`,
    `Gerado por: ${input.generatedBy}`,
  ]);

  y = sectionTitle(doc, "1. Dados do evento", y);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: y,
    head: [["Campo", "Valor"]],
    body: [
      ["Nome", ev.name],
      ["Organização", ev.organizationName],
      ["Data", dt(ev.date)],
      ["Local", ev.location],
      ["Capacidade", ev.capacity > 0 ? String(ev.capacity) : "—"],
      ["Ingressos vendidos", String(ev.vendidos)],
      ["Ocupação", ev.ocupacao !== null ? `${ev.ocupacao}%` : "—"],
      ["Receita bruta", money(ev.bruta)],
      ["Taxa plataforma", money(ev.taxa)],
      ["Receita líquida org", money(ev.liquida)],
    ],
    columnStyles: { 1: { halign: "left" } },
  });

  y = sectionTitle(doc, "2. Ingressos por tipo / lote", lastY(doc) + 8);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: y,
    head: [["Ingresso", "Tipo", "Qtd", "Vendidos", "Valor unitário", "Total vendido"]],
    body: input.tickets.map((t) => [
      t.name, t.type, String(t.quantity), String(t.sold),
      money(t.priceCents), money(t.priceCents * t.sold),
    ]),
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });

  y = sectionTitle(doc, "3. Transações do evento", lastY(doc) + 8);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: y,
    head: txHead,
    body: txBody(input.transactions),
    columnStyles: { 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
  });

  drawFooters(doc);
  doc.save(fileName("evento"));
};

// ─── 4. Relatório de inscritos (foco no participante) ───────

export const generateAttendeesReport = (input: AttendeesReportInput): void => {
  const doc = newDoc();
  const ev = input.event;
  const y = drawCover(doc, `Inscritos — ${ev.name}`, [
    `Organização: ${ev.organizationName}`,
    `Data do evento: ${dt(ev.date)}`,
    `Total de inscritos: ${ev.total}`,
    `Gerado em: ${dt(new Date().toISOString())}`,
    `Gerado por: ${input.generatedBy}`,
  ]);

  const yTable = sectionTitle(doc, "Lista de inscritos", y);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: yTable,
    head: [["Nome", "E-mail", "Telefone", "Tipo de ingresso", "Status", "Data de inscrição"]],
    body: input.attendees.map((a) => [a.name, a.email, a.phone, a.ticket, a.status, dt(a.date)]),
  });

  drawFooters(doc);
  doc.save(`inscritos-${ev.slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─── 3. Relatório por organização ───────────────────────────

export const generateOrgReport = (input: OrgReportInput): void => {
  const doc = newDoc();
  const org = input.org;
  let y = drawCover(doc, `Relatório Financeiro — ${org.name}`, [
    `Gerado em: ${dt(new Date().toISOString())}`,
    `Gerado por: ${input.generatedBy}`,
  ]);

  y = sectionTitle(doc, "1. Resumo da organização", y);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: y,
    head: [["Indicador", "Valor"]],
    body: [
      ["Total arrecadado", money(org.arrecadado)],
      ["Taxa retida pela plataforma", money(org.taxaRetida)],
      ["Saldo disponível para saque", money(org.saldoDisponivel)],
      ["Total já sacado", money(org.totalSacado)],
    ],
    columnStyles: { 1: { halign: "right" } },
  });

  y = sectionTitle(doc, "2. Eventos da organização", lastY(doc) + 8);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: y,
    head: [["Evento", "Status", "Ingressos vendidos", "Receita bruta"]],
    body: input.events.map((e) => [e.name, e.status, String(e.vendidos), money(e.brutaCents)]),
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
  });

  y = sectionTitle(doc, "3. Histórico de saques", lastY(doc) + 8);
  autoTable(doc, {
    ...baseTableOpts(doc),
    startY: y,
    head: [["Data da solicitação", "Valor", "Status"]],
    body: input.withdrawals.map((w) => [dateOnly(w.date), money(w.amountCents), w.status]),
    columnStyles: { 1: { halign: "right" } },
  });

  drawFooters(doc);
  doc.save(fileName("organizacao"));
};
