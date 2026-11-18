// Reels animados de forma determinística: window.render(t) desenha o quadro do segundo t.
// Atributos usados pelo animador:
//   data-in / data-out  (s)  entrada e saída do elemento
//   data-anim           up | pop | fade | left | right
//   data-rot            rotação fixa em graus
//   data-count          "de,ate,inicio,fim" contador numérico
//   data-type           "inicio,fim" efeito de digitação
//   data-y              "topoInicial,topoFinal,inicio,fim" movimento vertical (px)
const SELO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>';

const CTA = (inicio) => `
  <section class="cena escuro" data-in="${inicio}" data-anim="fade" style="display:flex;flex-direction:column;justify-content:center;gap:56px">
    <div class="selo-g" data-in="${inicio + 0.2}" data-anim="pop">${SELO}</div>
    <div class="big" data-in="${inicio + 0.4}" data-anim="up">Crie o seu evento no <em>Guardião Eventos</em>.</div>
    <div class="peq" style="color:rgba(236,253,245,.85)" data-in="${inicio + 0.7}" data-anim="up">Evento gratuito não paga nada. Evento pago sem mensalidade.</div>
    <div data-in="${inicio + 1}" data-anim="pop"><span class="cta">guardiaoeventos.com</span></div>
  </section>`;

function qrHtml() {
  // padrão fixo pseudo-aleatório com os 3 quadrados de posição de um QR code
  let s = 7, html = "";
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const finder = (r, c, r0, c0) => {
    const y = r - r0, x = c - c0;
    if (y < 0 || x < 0 || y > 6 || x > 6) return null;
    return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
  };
  for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) {
    let v = finder(r, c, 0, 0) ?? finder(r, c, 0, 14) ?? finder(r, c, 14, 0);
    if (v === null) v = rnd() > 0.52;
    html += `<i class="${v ? "" : "b"}"></i>`;
  }
  return `<div class="qr">${html}</div>`;
}

const VIDEOS = {
  "reels-1-antes-depois": { duracao: 17, html: `
    <section class="cena claro" data-out="6.4">
      <div class="big" data-in="0.1" data-anim="up">Inscrição do retiro <em>hoje</em>:</div>
      <div class="abs bolha" style="left:90px;top:520px" data-in="0.7" data-anim="pop" data-rot="-3"><small>Grupo da coordenação</small>Já paguei, viu? Mandei o print.</div>
      <div class="abs arquivo" style="left:430px;top:720px" data-in="1.2" data-anim="pop" data-rot="4"><i class="img"></i>print_pix_0347.jpg</div>
      <div class="abs arquivo" style="left:110px;top:880px" data-in="1.7" data-anim="pop" data-rot="-5"><i></i>Planilha FINAL (3).xlsx</div>
      <div class="abs bolha" style="left:470px;top:1040px" data-in="2.2" data-anim="pop" data-rot="3"><small>Direct</small>Ainda tem vaga?</div>
      <div class="abs arquivo" style="left:80px;top:1200px" data-in="2.7" data-anim="pop" data-rot="2"><i class="cad"></i>Caderno de inscritos, pág. 4</div>
      <div class="abs bolha" style="left:380px;top:1370px" data-in="3.2" data-anim="pop" data-rot="-4"><small>23:47</small>Mandei o comprovante ontem!</div>
      <div class="abs med" style="left:84px;bottom:150px;right:84px;color:var(--ouro-escuro)" data-in="4.4" data-anim="up">Dá pra organizar diferente.</div>
    </section>
    <section class="cena escuro" data-in="6.2" data-out="13.6" data-anim="fade">
      <div class="med" data-in="6.5" data-anim="up">No <span style="color:var(--ouro)">Guardião Eventos</span>:</div>
      <div class="abs celular" style="left:84px;top:390px;transform-origin:center" data-in="6.8" data-anim="up">
        <div class="tela">
          <div class="tela-topo"><small>Painel do organizador</small>Retiro de Carnaval 2027</div>
          <div class="stats">
            <div class="stat"><b data-count="0,128,7.2,10.5">0</b><span>inscritos</span></div>
            <div class="stat"><b data-count="0,121,7.4,10.8">0</b><span>pagos</span></div>
            <div class="stat"><b data-count="200,72,7.2,10.5">200</b><span>vagas</span></div>
          </div>
          <div class="linha" data-in="7.8" data-anim="left">Ana P. · Participante <span class="badge">Pago</span></div>
          <div class="linha" data-in="8.4" data-anim="left">João M. · Servo <span class="badge">Pago</span></div>
          <div class="linha" data-in="9.0" data-anim="left">Carla e Rui · Casal <span class="badge">Pago</span></div>
          <div class="linha" data-in="9.6" data-anim="left">Pedro L. · Participante <span class="badge">Pago</span></div>
          <div class="linha" data-in="10.2" data-anim="left">Marta S. · Participante <span class="badge">Pago</span></div>
        </div>
      </div>
      <div class="abs" style="left:770px;top:520px;width:250px;display:flex;flex-direction:column;gap:70px">
        <div class="item-ok" style="flex-direction:column;align-items:flex-start;font-size:36px" data-in="8.0" data-anim="right"><span class="dot">✓</span>Pix confirmado sozinho</div>
        <div class="item-ok" style="flex-direction:column;align-items:flex-start;font-size:36px" data-in="9.3" data-anim="right"><span class="dot">✓</span>Ficha do seu jeito</div>
        <div class="item-ok" style="flex-direction:column;align-items:flex-start;font-size:36px" data-in="10.6" data-anim="right"><span class="dot">✓</span>Check-in por QR code</div>
      </div>
    </section>
    ${CTA(13.4)}` },

  "reels-2-link-4-passos": { duracao: 20, html: `
    <section class="cena escuro">
      <div class="med" data-in="0.1" data-anim="up">Link de inscrição do retiro em <span style="color:var(--ouro)">4 passos</span></div>
      <div class="abs celular" style="left:220px;top:420px" data-in="0.5" data-anim="up">
        <div class="tela">
          <div class="abs" style="inset:0" data-in="0.5" data-out="4.6" data-anim="fade">
            <div class="tela-topo"><small>Passo 1</small>Criar evento</div>
            <div class="campo"><small>Nome do evento</small><div data-type="1.2,2.4">Retiro de Carnaval 2027</div></div>
            <div class="campo"><small>Data</small><div data-type="2.4,3.0">06/02/2027 a 09/02/2027</div></div>
            <div class="campo"><small>Local</small><div data-type="3.0,3.6">Casa de Retiro</div></div>
            <div class="campo"><small>Categoria</small><div data-type="3.6,4.0">Retiros</div></div>
          </div>
          <div class="abs" style="inset:0" data-in="4.6" data-out="8.6" data-anim="fade">
            <div class="tela-topo"><small>Passo 2</small>Ingressos</div>
            <div class="linha" data-in="5.1" data-anim="left">Participante · 120 vagas <span class="badge">R$ 150</span></div>
            <div class="linha" data-in="5.6" data-anim="left">Servo · 40 vagas <span class="badge">R$ 80</span></div>
            <div class="linha" data-in="6.1" data-anim="left">Casal · 20 vagas <span class="badge">R$ 280</span></div>
            <div class="linha" data-in="6.9" data-anim="pop" style="border-color:var(--ouro)">Cupom SEMINARISTA <span class="badge" style="background:#fef3c7;color:#92400e">50% off</span></div>
          </div>
          <div class="abs" style="inset:0" data-in="8.6" data-out="12.6" data-anim="fade">
            <div class="tela-topo"><small>Passo 3</small>Ficha de inscrição</div>
            <div class="linha" data-in="9.1" data-anim="left"><span><span class="check">✓</span>Paróquia</span></div>
            <div class="linha" data-in="9.6" data-anim="left"><span><span class="check">✓</span>Contato de emergência</span></div>
            <div class="linha" data-in="10.1" data-anim="left"><span><span class="check">✓</span>Restrição alimentar</span></div>
            <div class="linha" data-in="10.6" data-anim="left"><span><span class="check">✓</span>Tamanho da camiseta</span></div>
          </div>
          <div class="abs" style="inset:0" data-in="12.6" data-anim="fade">
            <div class="tela-topo"><small>Passo 4</small>Publicar</div>
            <div class="campo" style="margin-top:40px"><small>Pagamento</small><div>Pix · Cartão · Boleto</div></div>
            <div class="botao" data-in="13.2" data-anim="pop">Publicar evento</div>
            <div class="linha" data-in="14.2" data-anim="up" style="flex-direction:column;align-items:flex-start;gap:8px;border-color:#16a34a"><span class="badge">Link copiado</span><span style="font-size:24px">guardiaoeventos.com/evento/retiro-carnaval-2027</span></div>
          </div>
        </div>
      </div>
      <div class="abs med" style="left:84px;right:84px;bottom:110px;text-align:center" data-in="1.0" data-out="4.6" data-anim="up">1. Crie o evento</div>
      <div class="abs med" style="left:84px;right:84px;bottom:110px;text-align:center" data-in="4.8" data-out="8.6" data-anim="up">2. Ingressos e cupons</div>
      <div class="abs med" style="left:84px;right:84px;bottom:110px;text-align:center" data-in="8.8" data-out="12.6" data-anim="up">3. Ficha do seu jeito</div>
      <div class="abs med" style="left:84px;right:84px;bottom:110px;text-align:center" data-in="12.8" data-anim="up">4. Publique e divulgue</div>
    </section>
    ${CTA(16.4)}` },

  "reels-3-checkin-qr": { duracao: 15, html: `
    <section class="cena claro" data-out="4.6">
      <div class="big" data-in="0.1" data-anim="up">Fila na entrada do <em>retiro</em>?</div>
      <div class="abs papel" style="left:120px;right:120px;top:560px" data-in="0.6" data-anim="up" data-rot="-2">
        <p>Adriana Souza</p><p>Benedito Alves</p><p>Cláudia Ramos</p><p>Daniel Prado</p><p>Eduarda Lima</p><p>Fábio Nunes</p><p>Gabriela Costa</p>
        <div class="abs" style="left:24px;right:24px;height:64px;background:rgba(245,158,11,.25);border-radius:12px" data-y="40,520,1.0,3.6"></div>
      </div>
      <div class="abs med" style="left:84px;right:84px;bottom:170px;color:var(--ouro-escuro)" data-in="2.4" data-anim="up">Procurando o nome na lista impressa...</div>
    </section>
    <section class="cena escuro" data-in="4.4" data-out="12.0" data-anim="fade">
      <div class="med" data-in="4.6" data-anim="up">Com o Guardião, é só <span style="color:var(--ouro)">apontar o celular</span>.</div>
      <div class="abs celular" style="left:220px;top:470px" data-in="4.9" data-anim="up">
        <div class="tela">
          <div class="visor"></div>
          <div class="tela-topo" style="position:relative"><small>Check-in</small>Chegaram <span data-count="86,88,6.6,9.6">86</span> de 120</div>
          <div class="abs" style="left:118px;top:348px" data-in="5.3" data-anim="pop">${qrHtml()}</div>
          <div class="mira"></div>
          <div class="scan" data-y="340,710,5.6,6.5" data-out="6.6"></div>
          <div class="ok-card" data-in="6.6" data-out="8.4" data-anim="up"><b>✓ Entrada confirmada</b>Maria S. · Participante</div>
          <div class="scan" data-y="340,710,8.5,9.4" data-in="8.5" data-out="9.5"></div>
          <div class="ok-card" data-in="9.5" data-anim="up"><b>✓ Entrada confirmada</b>José R. · Servo</div>
        </div>
      </div>
      <div class="abs peq" style="left:84px;right:84px;bottom:110px;text-align:center;color:rgba(236,253,245,.85)" data-in="7.0" data-anim="up">Cada inscrito tem um ingresso com QR code. O painel mostra quem já chegou.</div>
    </section>
    ${CTA(11.8)}` },
};

const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const clamp = (x) => Math.max(0, Math.min(1, x));

function render(t) {
  document.querySelectorAll("[data-in],[data-out],[data-rot]").forEach((el) => {
    const din = el.dataset.in !== undefined ? parseFloat(el.dataset.in) : -1;
    const dout = el.dataset.out !== undefined ? parseFloat(el.dataset.out) : Infinity;
    const anim = el.dataset.anim || "fade";
    const pIn = easeOut(clamp((t - din) / 0.45));
    const pOut = clamp((t - dout) / 0.35);
    const op = t < din ? 0 : pIn * (1 - pOut);
    let tr = "";
    if (anim === "up") tr = `translateY(${(1 - pIn) * 70}px)`;
    if (anim === "left") tr = `translateX(${(1 - pIn) * -80}px)`;
    if (anim === "right") tr = `translateX(${(1 - pIn) * 80}px)`;
    if (anim === "pop") tr = `scale(${0.6 + 0.4 * pIn + Math.sin(pIn * Math.PI) * 0.06})`;
    if (el.dataset.rot) tr += ` rotate(${el.dataset.rot}deg)`;
    el.style.opacity = op;
    el.style.transform = tr;
  });
  document.querySelectorAll("[data-count]").forEach((el) => {
    const [de, ate, a, b] = el.dataset.count.split(",").map(Number);
    el.textContent = Math.round(de + (ate - de) * easeOut(clamp((t - a) / (b - a))));
  });
  document.querySelectorAll("[data-type]").forEach((el) => {
    el.dataset.full ??= el.textContent;
    const [a, b] = el.dataset.type.split(",").map(Number);
    el.textContent = el.dataset.full.slice(0, Math.round(el.dataset.full.length * clamp((t - a) / (b - a))));
  });
  document.querySelectorAll("[data-y]").forEach((el) => {
    const [y0, y1, a, b] = el.dataset.y.split(",").map(Number);
    el.style.top = `${y0 + (y1 - y0) * clamp((t - a) / (b - a))}px`;
  });
}

const nome = new URLSearchParams(location.search).get("v") || "reels-1-antes-depois";
document.getElementById("palco").innerHTML = VIDEOS[nome].html;
window.DURACAO = VIDEOS[nome].duracao;
window.VIDEOS_NOMES = Object.keys(VIDEOS);
window.render = render;
render(0);
