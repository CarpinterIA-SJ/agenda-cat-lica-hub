# Prompt: vídeo de lançamento no Higgsfield (Claude chat)

Criado em 19/11/2026. Usar no claude.ai com o conector **Higgsfield** ativo.

**Antes de colar o prompt, anexe na conversa estes arquivos** (pasta `marketing/out/lancamento-higgsfield/`, capturados do site no ar; a pasta `out/` fica fora do git):

| Arquivo | O que é |
|---|---|
| `00-logo-selo.png` | Selo da marca (faísca branca em quadrado verde) |
| `00-logo-com-nome.png` | Logo com o nome "Guardião Eventos" |
| `01-landing-desktop-hero.png` | Topo do site no computador (print real) |
| `03-landing-celular.png` | Site no celular (print real, vertical) |
| `04-planos-celular.png` | Página de planos no celular (print real) |
| `08-card-pagamento.png` | Peça da marca já aprovada (referência de estilo) |
| `10-evento-celular.png` | Página do evento fictício "Congresso Renascer 2027" no celular |
| `12-evento-desktop.png` | A mesma página no computador |
| `21-ingresso-qr-close.png` | Ingresso do participante com o QR code de acesso |
| `31-participantes-desktop.png` | Painel do organizador: 25 confirmados, 3 pendentes, 14 check-ins |
| `32-checkin-celular.png` | Tela de check-in no celular com os últimos check-ins |
| `33-checkins-realizados-desktop.png` | Lista de check-ins realizados |

As telas 10 a 33 são do site real alimentado com um **evento fictício** (Congresso Renascer 2027, Salvador, 6 a 9/02/2027; participantes com nomes inventados e e-mails `@exemplo.com`). Nada foi gravado em produção. O script que gera as capturas fica no scratchpad da sessão e não está versionado; a pasta `out/` pode ser recriada pedindo ao Claude Code.

Não use `30-painel-evento-desktop.png` nem `34-painel-evento-celular.png` no vídeo: eles mostram o card "App de Check-in" (Google Play/App Store) e "Disponível para repasse R$ 0,00", que hoje não refletem o produto.

---

## Prompt (copiar daqui para baixo)

Você é diretor criativo e editor de vídeos virais para Reels/TikTok. Use o conector **Higgsfield** para produzir o **vídeo de lançamento do Guardião Eventos (guardiaoeventos.com)**, para Instagram, TikTok, YouTube Shorts e Facebook.

### 1. O produto (só isto pode ser prometido)

Guardião Eventos é uma plataforma brasileira de inscrições e pagamentos para eventos: retiros, congressos, shows, cursos, acampamentos, encontros e muito mais. **Não é exclusiva de eventos católicos**: atende qualquer organizador, e o público religioso é só um dos segmentos.

O que o sistema faz de verdade:
- Página do evento com link próprio, pronta para divulgar.
- Ficha de inscrição personalizada.
- Vários tipos de ingresso, com preço e limite de vagas.
- Cupons de desconto.
- Pagamento por **Pix, cartão e boleto**, com confirmação automática.
- Ingresso com **QR code** e **check-in pelo celular** na entrada.
- Painel com inscrições, pagamentos e check-ins em tempo real.
- Evento gratuito: **custo zero**, sem mensalidade, eventos ilimitados.
- Evento pago: taxa de 5% somada ao ingresso e paga pelo comprador; o organizador recebe o valor cheio.
- O inscrito **não precisa baixar aplicativo**.

**Proibido afirmar:** envio de ingresso por WhatsApp, "repasse automático", "a maior plataforma do Brasil", números de clientes, depoimentos inventados, comparação nominal com concorrentes (Sympla etc.). Não mencione "print de Pix" nem "planilha".

### 2. Identidade visual (seguir à risca, ver anexos)

- **Verde-floresta** `#0b3d2e` (fundo principal), **verde institucional** `#004d00`, **verde-menta** `#a7f3d0` (destaques no texto).
- **Laranja-âmbar** `#f59e0b` (botão/CTA, energia), âmbar escuro `#b45309`.
- **Creme** `#f7f3ea` (fundos claros), tinta `#10231b`.
- Tipografia: **Inter Black** nos títulos; **Fraunces itálico** para a palavra de destaque.
- Logo: selo quadrado de cantos arredondados, verde-floresta, com uma **faísca de 4 pontas** branca e duas faíscas pequenas. É o símbolo do "guardião": a faísca que acende e põe ordem no evento.
- Clima: luz quente de fim de tarde, brilho verde-esmeralda, partículas de luz. Premium, humano, acolhedor. Nada de visual "startup gelada" nem tons neon roxo/azul.
- Use os prints anexados como **referência real das telas**: quando aparecer um celular ou notebook no vídeo, a tela deve mostrar o site do Guardião (fundo verde, título branco "Inscrições e pagamentos do seu evento de um jeito simples", botão laranja "Criar Seu Evento").
- O evento de exemplo é o **"Congresso Renascer 2027"** (fictício, banner verde com raios dourados nos prints). Use-o em todas as telas de evento, ingresso e painel para o vídeo contar uma história só. Não invente outras telas do sistema: anime e enquadre os prints anexados (dentro de celular/notebook, flutuando em 3D, com zoom em detalhe).

### 3. Conceito: "Seu evento tem um guardião"

Gancho de contraste: o caos de organizar um evento (mensagens sem fim, papéis voando, fila na porta, gente perguntando "minha inscrição foi confirmada?") → **estalo** → a faísca verde do Guardião acende e uma onda de luz varre a tela, colocando tudo em ordem. Daí em diante, ritmo rápido, cortes no beat, tudo resolvido no celular.

Formato principal: **vertical 9:16, 1080x1920, 22 a 28 segundos**, cortes de 1 a 2 segundos, movimento de câmera em quase todo plano (dolly-in, whip pan, orbit, speed ramp). O primeiro 1,5 segundo precisa prender.

### 4. Roteiro de cenas

| # | Tempo | Imagem | Texto na tela | Locução |
|---|---|---|---|---|
| 1 | 0–2s | Close extremo de um celular vibrando sem parar em cima da mesa; notificações empilhando; papéis caindo em câmera lenta ao redor. Luz dura, tons dessaturados. | **ORGANIZAR EVENTO VIROU CAOS?** | "Organizar evento virou caos?" |
| 2 | 2–4s | Tudo congela no ar. Uma faísca de 4 pontas verde-menta acende no centro e explode numa onda de luz esmeralda que varre a cena; as cores voltam quentes. | — | (som de estalo + whoosh, drop da música) |
| 3 | 4–7s | Mão segurando o celular; câmera faz orbit e mostra a tela com o site real do Guardião (print `03-landing-celular.png`). | **Seu evento agora tem um guardião.** | "Seu evento agora tem um guardião." |
| 4 | 7–10s | Telas flutuando em 3D sobre fundo verde-floresta: a página do Congresso Renascer 2027 (`10-evento-celular.png` e `12-evento-desktop.png`) entra girando; zoom no banner. | **Crie. Divulgue. Receba inscrições.** | "Crie a página, compartilhe o link e receba inscrições." |
| 5 | 10–13s | Três cartões flutuantes giram e encaixam: **Pix**, **Cartão**, **Boleto**; um selo de check verde pulsa "Pago"; corta para o painel `31-participantes-desktop.png` com a coluna "Confirmado / Pago" acendendo. | **Pix, cartão e boleto. Confirmação automática.** | "Pix, cartão e boleto, com confirmação automática." |
| 6 | 13–16s | Entrada de evento ao entardecer: uma pessoa mostra no celular o ingresso com QR (`21-ingresso-qr-close.png`), a equipe confere no celular (`32-checkin-celular.png`), luz verde de aprovado, a pessoa entra sorrindo. | **Check-in por QR code.** | "Na porta, check-in pelo QR code. Sem fila, sem lista de papel." |
| 7 | 16–21s | Montagem rápida no beat, 1 segundo cada: retiro ao ar livre, congresso em auditório, show com luzes, acampamento com fogueira, curso/workshop, encontro de jovens. Pessoas reais, diversas, brasileiras, felizes. | **Retiros • Congressos • Shows • Cursos • Acampamentos** | "Retiro, congresso, show, curso, acampamento. Qualquer evento." |
| 8 | 21–24s | Fundo verde-floresta, partículas de luz; a faísca se desenha e forma o logo **Guardião Eventos** (anexo). | **Evento gratuito? Custo zero.** | "E se o seu evento for gratuito, é custo zero." |
| 9 | 24–27s | Logo central, botão laranja pulsando, URL grande. | **guardiaoeventos.com** + botão **Criar Seu Evento** | "Crie o seu em guardiaoeventos.com." |

### 5. Áudio

- **Locução** em português do Brasil, voz jovem e confiante, ritmo rápido, tom caloroso (nada de locutor de rádio). Gere com o Higgsfield e sincronize com as cenas.
- **Música**: batida eletrônica/pop positiva, ~120 BPM, com tensão nos 2 primeiros segundos e **drop** exatamente no estalo da cena 2. Sem letra cantada.
- Efeitos: vibração de celular, estalo, whoosh, "plim" no check de pagamento e no QR aprovado.

### 6. Como executar no Higgsfield

1. Leia as instruções do conector (`get_workflow_instructions`) e escolha o melhor fluxo para um vídeo de vários planos com locução.
2. Faça upload dos anexos e use-os como referência (logo e telas reais). Não invente outro logo.
3. Para cada cena, gere primeiro um **quadro-chave** (imagem 9:16) e depois anime com um modelo de **imagem→vídeo**. Use o modelo de vídeo mais forte disponível para as cenas 1, 2, 6 e 7 (movimento e pessoas).
4. **Texto na tela:** modelos de IA costumam errar letras em português. Gere os clipes **sem texto escrito** (exceto as telas reais e o logo vindos dos anexos) e me entregue a lista de legendas com tempo exato para eu aplicar no CapCut/Instagram. Se o Higgsfield tiver ferramenta de texto/edição confiável, pode aplicar e eu confiro.
5. **Antes de gastar créditos:** consulte meu saldo, estime o custo total (imagens + vídeos + áudio) e me mostre. Só gere depois do meu "ok". Gere em lote quando possível.
6. Depois de pronto, rode o **preditor de viralidade** no vídeo final, mostre a nota e sugira ajustes concretos (gancho, ritmo, legenda).
7. Gere também as versões **4:5 (feed do Instagram)** e **1:1**, reenquadrando sem cortar logo nem telas.

### 7. Entregas

1. Vídeo final 9:16 (22–28s) + versões 4:5 e 1:1.
2. Lista de legendas na tela com tempos (se não foram aplicadas no vídeo).
3. **Capa do Reels** (imagem 9:16): fundo verde-floresta, faísca brilhando, título "Seu evento tem um guardião".
4. **Legenda do post** pronta, com gancho na 1ª linha, CTA para o link na bio e 8 a 12 hashtags (misture amplas de eventos com nichos: retiros, congressos, encontros, eventos cristãos, shows).
5. Duas variações do gancho (cena 1) para eu testar A/B.

Seja ousado no movimento e no ritmo, mas fiel à marca e ao que o produto faz. Se algo deste briefing não for possível com as ferramentas do Higgsfield, me diga o que vai mudar antes de executar.
