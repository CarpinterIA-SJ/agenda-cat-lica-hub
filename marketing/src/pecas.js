// Conteúdo de todas as peças estáticas (carrosséis e cards).
// Uso: pecas.html?set=<nome>. O render.mjs fotografa cada .slide.
const ICONE_SELO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>';
const ICONE_SETA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

const SETS = {
  "carrossel-1-planilha": [
    { tema: "escuro", tipo: "capa", eyebrow: "Para quem coordena retiros e encontros",
      titulo: "Inscrição no Forms, Pix por print e lista no <em>caderno</em>?",
      corpo: "Dá pra organizar o próximo retiro sem esse vai e vem. Estes são os 4 sinais de que a sua equipe já passou do limite." },
    { tema: "claro", titulo: "O retiro é lindo. <em>O antes dele</em> cansa.", medio: true,
      corpo: "Quem coordena encontro conhece a rotina: alguém confere comprovante no WhatsApp até meia-noite, outro cruza a planilha com o extrato do banco e, no dia, a fila do credenciamento trava porque a lista impressa está desatualizada. Nada disso é evangelização, e mesmo assim consome a energia da equipe que deveria estar rezando e servindo." },
    { tema: "claro", num: "1", titulo: "Conferir Pix virou trabalho de madrugada", medio: true,
      corpo: "Cada inscrito manda um print. Alguém abre o app do banco, procura o valor, confere o nome e marca na planilha. Com 150 inscritos são 150 conferências, e basta um print repetido para a conta não fechar. <b>No Guardião, Pix, cartão e boleto são confirmados pelo sistema</b> e a inscrição muda para paga sozinha." },
    { tema: "claro", num: "2", titulo: "A ficha não pergunta o que o retiro precisa", medio: true,
      corpo: "O Forms resolve nome e telefone, mas o retiro precisa saber paróquia, restrição alimentar, contato de emergência e tamanho da camiseta. Quando isso fica de fora, a equipe sai ligando um por um. <b>No Guardião você monta a ficha de inscrição do seu jeito</b>, e as respostas ficam junto da inscrição de cada pessoa." },
    { tema: "escuro", tipo: "citacao",
      titulo: "Cada hora gasta conferindo comprovante é uma hora a menos preparando o retiro.",
      corpo: "Organizar inscrição também é serviço, e merece ferramenta à altura. Quando a parte operacional roda sozinha, sobra tempo para o que ninguém pode fazer por vocês: acolher, rezar e cuidar de quem vem." },
    { tema: "claro", num: "3", titulo: "O credenciamento vira fila", medio: true,
      corpo: "No dia do evento, a lista impressa não bate com quem pagou ontem à noite, e a entrada vira caça ao nome. <b>No Guardião, cada inscrito tem um ingresso com QR code.</b> A equipe lê o código pelo celular na porta e o painel mostra quem já chegou, sem papel e sem lista paralela." },
    { tema: "claro", num: "4", titulo: "Ninguém sabe quantas vagas ainda restam", medio: true,
      corpo: "Com a informação espalhada entre planilha, WhatsApp e extrato, a pergunta \"ainda tem vaga?\" vira reunião. <b>No painel do Guardião você vê inscrições, pagamentos e vagas por tipo de ingresso</b> num lugar só, e ainda cria cupons de desconto para seminaristas, servos ou famílias." },
    { tema: "escuro", tipo: "cta", eyebrow: "Comece pelo próximo evento",
      titulo: "Evento gratuito usa o Guardião <em>sem pagar nada</em>.", medio: true,
      corpo: "Evento pago não tem mensalidade nem taxa de adesão. Crie o próximo retiro em guardiaoeventos.com ou envie este post para quem cuida das inscrições na sua comunidade.",
      botao: "guardiaoeventos.com" },
  ],

  "carrossel-2-carnaval": [
    { tema: "escuro", tipo: "capa", eyebrow: "Retiro de Carnaval 2027",
      titulo: "O link de inscrição do seu retiro pode estar no ar <em>ainda hoje</em>.",
      corpo: "O passo a passo no Guardião Eventos, do cadastro ao check-in." },
    { tema: "claro", titulo: "Carnaval de 2027 cai entre <em>6 e 9 de fevereiro</em>.", medio: true,
      corpo: "Quem abre inscrição em novembro e dezembro garante caixa para reservar casa de retiro, alimentação e transporte com antecedência. Quem deixa para janeiro costuma correr atrás de comprovante na semana do evento. O caminho abaixo leva poucos minutos e não pede cartão de crédito para começar." },
    { tema: "claro", num: "1", titulo: "Crie a conta e o evento", medio: true,
      corpo: "Entre em guardiaoeventos.com, crie sua conta de organizador e clique em <b>Criar evento</b>. Preencha nome, data, local e categoria: retiro, acampamento, encontro de formação, Seminário de Vida no Espírito Santo. Essas informações viram a página pública do evento, com endereço próprio para divulgar no Instagram e nos grupos." },
    { tema: "claro", num: "2", titulo: "Monte a página do evento", medio: true,
      corpo: "Suba o banner, escreva a programação, o que levar e as regras de participação. É essa página que as pessoas abrem pelo link da bio, então vale colocar horário de chegada, endereço da casa de retiro e contato da coordenação. Tudo fica num lugar só e ninguém precisa repetir a mesma resposta no direct." },
    { tema: "claro", num: "3", titulo: "Crie os tipos de ingresso", medio: true,
      corpo: "Defina se a inscrição é gratuita ou paga e crie quantos tipos precisar: participante, servo, casal, criança. Cada tipo tem preço e número de vagas. Quer dar desconto para seminaristas ou para quem serviu no ano passado? <b>Crie um cupom</b> com valor fixo ou percentual e mande o código só para quem tem direito." },
    { tema: "escuro", tipo: "citacao",
      titulo: "Vaga esgotada fecha sozinha. A planilha não avisa ninguém.",
      corpo: "Quando o limite de um tipo de ingresso é atingido, o Guardião para de aceitar inscrição naquele tipo. Ninguém precisa vigiar a contagem nem devolver dinheiro de quem pagou depois que o retiro lotou." },
    { tema: "claro", num: "4", titulo: "Pagamento e ficha de inscrição", medio: true,
      corpo: "Em evento pago, o inscrito escolhe <b>Pix, cartão ou boleto</b> e a confirmação acontece sem você conferir comprovante. Depois, ajuste a ficha com as perguntas do seu retiro, como paróquia, contato de emergência, restrição alimentar e tamanho da camiseta. Publique o evento e copie o link." },
    { tema: "claro", num: "5", titulo: "Divulgue e faça o check-in", medio: true,
      corpo: "Coloque o link na bio, no status do WhatsApp e nos avisos da missa. Acompanhe as inscrições pelo painel conforme elas chegam. No dia, a equipe abre o <b>leitor de QR code no celular</b> e confirma a entrada de cada participante em segundos, sem lista impressa." },
    { tema: "escuro", tipo: "cta", eyebrow: "Salve para a hora de abrir as inscrições",
      titulo: "Quer ajuda para montar o <em>primeiro evento</em>?", medio: true,
      corpo: "Chame o @guardiaoeventos no direct e a gente configura o retiro junto com a sua coordenação. Evento gratuito não paga nada, e evento pago não tem mensalidade.",
      botao: "Chame no direct" },
  ],

  "carrossel-3-perguntas": [
    { tema: "escuro", tipo: "capa", eyebrow: "Antes de trocar o Forms",
      titulo: "As 5 perguntas que toda coordenação faz antes de mudar a <em>inscrição do retiro</em>.",
      corpo: "Com resposta curta e sem letra miúda, para levar à reunião da equipe." },
    { tema: "claro", titulo: "Trocar de ferramenta assusta. <em>Com razão.</em>", medio: true,
      corpo: "Quem coordena um grupo responde pelo dinheiro da comunidade e pelos dados de quem se inscreve. Por isso a primeira reação a qualquer sistema novo é desconfiança, e ela é saudável. Estas são as dúvidas que mais chegam no nosso direct, começando pela que todo mundo faz primeiro: quanto isso custa?" },
    { tema: "claro", num: "1", titulo: "Quanto custa?", medio: true,
      corpo: "<b>Evento gratuito não paga nada.</b> Você cria quantos eventos quiser, com página, ficha de inscrição e check-in, sem mensalidade e sem taxa de adesão. Em evento pago, a taxa de serviço é de <b>5% por inscrição</b>, somada ao valor do ingresso e paga por quem se inscreve. Assim a comunidade recebe o valor cheio que definiu para cada ingresso." },
    { tema: "claro", num: "2", titulo: "O pagamento é seguro?", medio: true,
      corpo: "Os pagamentos são processados pelo Asaas, plataforma brasileira de cobrança, e a confirmação chega ao sistema direto do processador, sem depender de print. O inscrito paga por Pix, cartão ou boleto e a inscrição só aparece como paga quando o pagamento é confirmado. Ninguém da equipe recebe dinheiro na conta pessoal." },
    { tema: "escuro", tipo: "citacao",
      titulo: "O dinheiro do retiro não precisa passar pela conta pessoal de ninguém da equipe.",
      corpo: "Cada pagamento fica registrado com nome, data e forma de pagamento. Prestar contas ao padre ou ao conselho vira abrir o relatório, sem juntar comprovante de vinte conversas diferentes." },
    { tema: "claro", num: "3", titulo: "Como o dinheiro chega até nós?", medio: true,
      corpo: "O organizador cadastra a conta da comunidade no painel financeiro e <b>solicita o repasse</b> dos valores recebidos. O painel mostra o que entrou em cada evento, o que já foi repassado e o histórico de cada solicitação. A tesouraria acompanha tudo por ali, sem precisar de uma planilha paralela para fechar as contas." },
    { tema: "claro", num: "4", titulo: "Quem se inscreve precisa baixar aplicativo?", medio: true,
      corpo: "Não precisa. A inscrição acontece no navegador do celular, pelo link que vocês divulgam. A pessoa preenche a ficha, paga e encontra o ingresso com QR code na área <b>Meus Ingressos</b>. Isso facilita para quem tem pouca intimidade com o celular, porque não há nada para instalar nem atualizar." },
    { tema: "claro", num: "5", titulo: "E se alguém desistir?", medio: true,
      corpo: "A política de reembolso segue o Código de Defesa do Consumidor: compra feita pela internet pode ser cancelada em até 7 dias. A regra está publicada no site, então a coordenação não precisa inventar critério nem negociar caso a caso com cada inscrito que mudou de planos." },
    { tema: "escuro", tipo: "cta", eyebrow: "Ficou outra dúvida?",
      titulo: "Teste com um <em>evento gratuito</em> antes de divulgar.", medio: true,
      corpo: "Crie o evento em guardiaoeventos.com e veja a página de inscrição pronta. Se a dúvida não estava na lista, manda no direct do @guardiaoeventos que a gente responde.",
      botao: "guardiaoeventos.com" },
  ],

  "card-1-gratuito": [
    { tema: "escuro", tipo: "card", eyebrow: "Evento gratuito",
      titulo: "Inscrição online para o seu evento <em>sem pagar nada</em>.",
      corpo: "Retiros, encontros, catequese e seminários com página própria, ficha de inscrição do seu jeito e check-in por QR code. Sem mensalidade e sem taxa de adesão.",
      chips: ["Página do evento", "Ficha personalizada", "Check-in por QR code", "Eventos ilimitados"],
      botao: "guardiaoeventos.com" },
  ],
  "card-2-pagamento": [
    { tema: "claro", tipo: "card", eyebrow: "Evento pago",
      titulo: "Pix, cartão e boleto <em>sem conferir comprovante</em>.",
      corpo: "O inscrito paga no checkout e a inscrição muda para paga sozinha. A taxa de serviço de 5% é somada ao ingresso e paga por quem compra, então a comunidade recebe o valor cheio.",
      chips: ["Pix", "Cartão", "Boleto", "Cupons de desconto"],
      botao: "guardiaoeventos.com" },
  ],
  "card-3-story-carnaval": [
    { tema: "escuro", tipo: "card", story: true, eyebrow: "Retiro de Carnaval 2027",
      titulo: "6 a 9 de fevereiro. <em>A inscrição já pode abrir hoje.</em>",
      corpo: "Página do evento, ficha personalizada, Pix, cartão e boleto com confirmação automática e check-in por QR code. Evento gratuito não paga nada.",
      chips: ["Retiros", "Acampamentos", "Seminários", "Encontros"],
      botao: "Link na bio" },
  ],
};

function montar(nome) {
  const slides = SETS[nome] || [];
  const raiz = document.getElementById("raiz");
  slides.forEach((s, i) => {
    const el = document.createElement("section");
    el.className = `slide ${s.tema}${s.story ? " story" : ""}`;
    const ultimo = i === slides.length - 1;
    const isCard = s.tipo === "card";
    const contador = isCard ? "" : `<span class="contador">${i + 1}/${slides.length}</span>`;
    let miolo = "";
    if (s.tipo === "citacao") {
      miolo = `<p class="citacao">${s.titulo}</p><p class="corpo">${s.corpo}</p>`;
    } else {
      miolo = [
        s.eyebrow ? `<span class="eyebrow">${s.eyebrow}</span>` : "",
        s.num ? `<span class="num">${s.num}</span>` : "",
        `<h1 class="titulo${s.medio ? " medio" : ""}">${s.titulo}</h1>`,
        s.corpo ? `<p class="corpo">${s.corpo}</p>` : "",
        s.chips ? `<div class="lista-chips">${s.chips.map((c) => `<span class="chip">${c}</span>`).join("")}</div>` : "",
        s.botao ? `<span class="cta-botao">${s.botao}</span>` : "",
      ].join("");
    }
    const direita = ultimo || isCard ? `<span>guardiaoeventos.com</span>` : `<span class="seta">Arraste ${ICONE_SETA}</span>`;
    el.innerHTML = `
      <header class="topo"><span class="marca"><span class="selo">${ICONE_SELO}</span>Guardião Eventos</span>${contador}</header>
      <div class="miolo">${miolo}</div>
      <footer class="rodape"><span>@guardiaoeventos</span>${direita}</footer>`;
    raiz.appendChild(el);
  });
}

montar(new URLSearchParams(location.search).get("set") || "carrossel-1-planilha");
window.SETS_NOMES = Object.keys(SETS);
