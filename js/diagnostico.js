/* Diagnóstico grátis da loja online (Bora Online).
   8 perguntas -> contato -> resultado na tela.
   O envio usa o mesmo Apps Script dos outros formulários (BORA_CONFIG.appsScriptUrl,
   definido em /js/main.js) e cai na aba "Leads" da planilha "Leads", com origem
   "diagnostico-loja". As respostas vão resumidas no campo "mensagem". */
(() => {
  const root = document.querySelector('[data-dg-root]');
  if (!root) return;

  const WA_NUMBER = (typeof BORA_CONFIG !== 'undefined' && BORA_CONFIG.whatsappNumber) || '5521967171986';
  const ENDPOINT = typeof BORA_CONFIG !== 'undefined' ? BORA_CONFIG.appsScriptUrl : '';

  /* ---------------- Perguntas ---------------- */
  const MOMENTO = {
    id: 'momento',
    label: 'Qual é o seu momento hoje?',
    options: [
      { value: 'ja_tenho_loja', text: 'Já tenho loja online, mas vende pouco' },
      { value: 'vendo_redes', text: 'Vendo pelo Instagram ou WhatsApp e quero uma loja online' },
      { value: 'nao_vendo_online', text: 'Ainda não vendo online' }
    ]
  };

  const SEGMENTO = {
    id: 'segmento',
    label: 'O que você vende?',
    options: [
      { value: 'moda', text: 'Moda e acessórios' },
      { value: 'casa', text: 'Casa, móveis e decoração' },
      { value: 'beleza', text: 'Beleza e cuidados' },
      { value: 'alimentos', text: 'Alimentos e bebidas' },
      { value: 'outro', text: 'Outro segmento' }
    ]
  };

  const CAMINHOS = {
    melhorar: [
      SEGMENTO,
      { id: 'plataforma', label: 'Em qual plataforma está sua loja?', options: [
        { value: 'nuvemshop', text: 'Nuvemshop' },
        { value: 'woocommerce', text: 'WooCommerce (WordPress)' },
        { value: 'shopify', text: 'Shopify' },
        { value: 'outra', text: 'Outra plataforma' },
        { value: 'nao_sei', text: 'Não sei dizer' }
      ] },
      { id: 'vendas', label: 'Quantas vendas a loja faz por mês?', options: [
        { value: 'zero', text: 'Nenhuma ou quase nenhuma' },
        { value: 'ate_20', text: 'De 1 a 20' },
        { value: 'ate_100', text: 'De 21 a 100' },
        { value: 'mais_100', text: 'Mais de 100' }
      ] },
      { id: 'trava', label: 'Na sua opinião, o que mais trava as vendas?', options: [
        { value: 'pouca_visita', text: 'Pouca gente visita a loja' },
        { value: 'visita_nao_compra', text: 'As pessoas visitam, mas não compram' },
        { value: 'nao_sei', text: 'Não sei dizer' }
      ] },
      { id: 'frete', label: 'O cliente consegue ver o frete antes de ir para o carrinho?', options: [
        { value: 'produto', text: 'Sim, na página do produto' },
        { value: 'checkout', text: 'Não, só no carrinho ou no pagamento' },
        { value: 'nao_sei', text: 'Não sei' }
      ] },
      { id: 'atendimento', label: 'Quando o cliente chama no WhatsApp à noite ou no fim de semana…', options: [
        { value: 'rapido', text: 'Respondemos em poucos minutos' },
        { value: 'dia_seguinte', text: 'Ele só recebe resposta no próximo dia útil' },
        { value: 'nem_sempre', text: 'Nem sempre conseguimos responder' }
      ] },
      { id: 'responsavel', label: 'Quem cuida da loja online no dia a dia?', options: [
        { value: 'eu_quando_da', text: 'Eu mesmo, quando sobra tempo' },
        { value: 'equipe', text: 'Uma pessoa da equipe' },
        { value: 'agencia', text: 'Uma agência ou parceiro' },
        { value: 'ninguem', text: 'Ninguém de forma fixa' }
      ] }
    ],
    criar: [
      SEGMENTO,
      { id: 'catalogo', label: 'Quantos produtos você quer vender online?', options: [
        { value: 'ate_50', text: 'Até 50' },
        { value: 'ate_300', text: 'De 51 a 300' },
        { value: 'mais_300', text: 'Mais de 300' }
      ] },
      { id: 'fotos', label: 'Como estão as fotos dos seus produtos?', options: [
        { value: 'boas', text: 'Tenho fotos boas e padronizadas' },
        { value: 'algumas', text: 'Tenho de alguns produtos' },
        { value: 'celular', text: 'Só fotos de celular, sem padrão' }
      ] },
      { id: 'cadastro', label: 'Onde ficam hoje os dados dos produtos (preço, estoque, medidas)?', options: [
        { value: 'sistema', text: 'Num sistema de gestão (ERP)' },
        { value: 'planilha', text: 'Numa planilha' },
        { value: 'cabeca', text: 'Na cabeça ou no caderno' }
      ] },
      { id: 'entrega', label: 'Como você entregaria os pedidos online?', options: [
        { value: 'correios', text: 'Correios ou transportadora' },
        { value: 'motoboy', text: 'Motoboy ou retirada na loja' },
        { value: 'nao_definido', text: 'Ainda não sei' }
      ] },
      { id: 'responsavel', label: 'Quem vai cuidar da loja online no dia a dia?', options: [
        { value: 'eu', text: 'Eu mesmo' },
        { value: 'equipe', text: 'Uma pessoa da equipe' },
        { value: 'nao_sei', text: 'Ainda não sei' }
      ] },
      { id: 'prazo', label: 'Quando você quer começar a vender online?', options: [
        { value: 'este_mes', text: 'O quanto antes, este mês' },
        { value: 'tres_meses', text: 'Nos próximos 3 meses' },
        { value: 'pesquisando', text: 'Ainda estou pesquisando' }
      ] }
    ]
  };

  /* ---------------- Prioridades ---------------- */
  // Ordem = peso. As 3 primeiras que se aplicarem entram no resultado.
  const REGRAS = {
    melhorar: [
      { when: (a) => a.trava === 'visita_nao_compra', title: 'Fazer quem visita comprar', text: 'Revisar fotos, descrição, preço e confiança nas páginas de produto e o caminho até o pagamento.' },
      { when: (a) => a.frete !== 'produto', title: 'Mostrar frete e prazo antes do carrinho', text: 'Frete que só aparece no final é um dos maiores motivos de desistência. A calculadora deve estar na página do produto.' },
      { when: (a) => a.atendimento !== 'rapido', title: 'Atender fora do horário', text: 'Resposta automática no WhatsApp com as dúvidas mais comuns e registro do contato para o vendedor retomar cedo.' },
      { when: (a) => a.trava === 'pouca_visita' || a.vendas === 'zero', title: 'Levar mais gente certa para a loja', text: 'Ligar o Instagram à loja, organizar o catálogo para o Google e usar anúncios para quem já visitou.' },
      { when: (a) => a.trava === 'nao_sei', title: 'Medir onde a venda se perde', text: 'Configurar as métricas da loja para saber em que etapa o cliente desiste.' },
      { when: (a) => a.responsavel === 'eu_quando_da' || a.responsavel === 'ninguem', title: 'Criar uma rotina semanal para a loja', text: 'Uma lista curta de tarefas por semana: estoque, preços, produtos parados e pedidos.' },
      { when: (a) => a.plataforma === 'nao_sei', title: 'Ter acesso e controle da sua loja', text: 'Saber em qual plataforma a loja está e ter os acessos em seu nome.' },
      { when: () => true, title: 'Organizar a vitrine', text: 'Mostrar primeiro os produtos com estoque e os mais vendidos, e esconder o que está esgotado.' },
      { when: () => true, title: 'Revisar o catálogo', text: 'Categorias claras, sem duplicadas, e nomes de produto que o cliente procura.' }
    ],
    criar: [
      { when: (a) => a.fotos !== 'boas', title: 'Padronizar as fotos dos produtos', text: 'Foto boa vende mais que descrição longa. Fundo limpo, boa luz e mais de um ângulo por produto.' },
      { when: (a) => a.cadastro !== 'sistema', title: 'Organizar o cadastro antes de abrir', text: 'Preço, estoque, medidas e variações numa planilha única, que vira a base da loja.' },
      { when: (a) => a.entrega !== 'correios', title: 'Definir frete e entrega', text: 'Escolher como entregar, quanto cobrar e mostrar o prazo para o cliente antes do pagamento.' },
      { when: (a) => a.responsavel === 'nao_sei', title: 'Definir quem vai operar a loja', text: 'Uma pessoa responsável, treinada para cadastrar produtos e acompanhar pedidos.' },
      { when: (a) => a.momento === 'vendo_redes', title: 'Levar quem já compra no Instagram para a loja', text: 'Link na bio, catálogo do Instagram ligado à loja e atendimento que fecha a venda no site.' },
      { when: (a) => a.catalogo === 'mais_300', title: 'Importar o catálogo de forma organizada', text: 'Com muitos produtos, cadastrar à mão não funciona. Importação por planilha ou pelo sistema.' },
      { when: (a) => a.catalogo === 'ate_50', title: 'Começar enxuto com os campeões de venda', text: 'Abrir com os produtos que mais saem e ir ampliando com base no que vende.' },
      { when: () => true, title: 'Escolher a plataforma certa', text: 'Nuvemshop, WooCommerce ou outra: a escolha depende do catálogo, da rotina e das integrações.' }
    ]
  };

  const PERFIS = {
    melhorar(a) {
      if (a.vendas === 'zero') return { title: 'Sua loja está no ar, mas ainda não virou canal de venda.', text: 'O site existe, mas falta o que transforma visita em pedido. A boa notícia: boa parte disso se resolve sem refazer a loja.' };
      if (a.vendas === 'ate_20') return { title: 'Sua loja vende, mas está deixando venda na mesa.', text: 'Já existe procura. Ajustes em vitrine, frete e atendimento costumam ter efeito rápido nesse estágio.' };
      return { title: 'Sua loja já vende. Agora é hora de organizar para crescer.', text: 'Com volume, o que limita é a operação: rotina, integração e números que mostrem onde agir.' };
    },
    criar(a) {
      const pendencias = [a.fotos !== 'boas', a.cadastro === 'cabeca', a.entrega === 'nao_definido', a.responsavel === 'nao_sei'].filter(Boolean).length;
      if (pendencias <= 1) return { title: 'Você está pronto para colocar a loja no ar.', text: 'A base está organizada. Dá para abrir a loja em poucas semanas, com tudo configurado e testado.' };
      return { title: 'Dá para abrir sua loja, começando pela base.', text: 'Antes do site, vale organizar produtos, fotos e entrega. É isso que faz a loja vender desde o primeiro dia.' };
    }
  };

  /* ---------------- Estado ---------------- */
  const state = { step: 0, answers: {}, path: null, lastCta: 'direct', started: false };
  let attribution = {};
  try { attribution = JSON.parse(sessionStorage.getItem('bora_attribution') || '{}'); } catch {}
  const query = new URLSearchParams(location.search);
  const campaign = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach((key) => {
    const value = query.get(key) || attribution[key];
    if (value) campaign[key] = String(value).slice(0, 180);
  });
  if (!campaign.utm_source) campaign.utm_source = 'direct';

  const el = {
    bar: root.querySelector('[data-dg-bar]'),
    label: root.querySelector('[data-dg-step-label]'),
    question: root.querySelector('[data-dg-question]'),
    form: root.querySelector('[data-dg-form]'),
    status: root.querySelector('[data-dg-status]'),
    result: root.querySelector('[data-dg-result]'),
    siteHint: root.querySelector('[data-dg-site-hint]')
  };

  const track = (event, params = {}) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, section_origin: 'diagnostico_loja', service_interest: 'bora_online', page_path: location.pathname, ...params });
  };

  const questions = () => [MOMENTO, ...(state.path ? CAMINHOS[state.path] : [])];
  const TOTAL = 8; // momento + 7 perguntas do caminho

  const setProgress = (done) => {
    el.bar.style.width = `${Math.round((done / (TOTAL + 1)) * 100)}%`;
  };

  /* ---------------- Render das perguntas ---------------- */
  function renderQuestion() {
    const list = questions();
    const q = list[state.step];
    el.form.hidden = true;
    el.result.hidden = true;
    el.question.hidden = false;
    el.label.textContent = `Pergunta ${state.step + 1} de ${TOTAL}`;
    setProgress(state.step);

    const name = `dg-${q.id}`;
    el.question.innerHTML = '';
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'dg-fieldset';
    const legend = document.createElement('legend');
    legend.className = 'dg-q';
    legend.textContent = q.label;
    fieldset.appendChild(legend);

    const options = document.createElement('div');
    options.className = 'dg-options';
    q.options.forEach((option, index) => {
      const id = `${name}-${index}`;
      const wrap = document.createElement('div');
      wrap.className = 'dg-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.id = id;
      input.value = option.value;
      input.checked = state.answers[q.id] === option.value;
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = option.text;
      input.addEventListener('change', () => choose(q, option.value));
      wrap.append(input, label);
      options.appendChild(wrap);
    });
    fieldset.appendChild(options);
    el.question.appendChild(fieldset);

    if (state.step > 0) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'dg-restart';
      back.textContent = 'Voltar';
      back.addEventListener('click', () => { state.step -= 1; renderQuestion(); focusQuestion(); });
      el.question.appendChild(back);
    }
  }

  const focusQuestion = () => {
    const first = el.question.querySelector('input:checked') || el.question.querySelector('input');
    first?.focus({ preventScroll: true });
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function choose(q, value) {
    if (!state.started) {
      state.started = true;
      track('diagnostico_start');
    }
    state.answers[q.id] = value;
    if (q.id === 'momento') {
      const newPath = value === 'ja_tenho_loja' ? 'melhorar' : 'criar';
      if (newPath !== state.path) {
        // Troca de caminho: limpa respostas do caminho anterior.
        state.answers = { momento: value };
        state.path = newPath;
      }
    }
    track('diagnostico_step', { step_number: state.step + 1, step_id: q.id });
    // Pequena pausa para a pessoa ver a opção marcada.
    setTimeout(() => {
      if (state.step + 1 < questions().length) {
        state.step += 1;
        renderQuestion();
        focusQuestion();
      } else {
        showForm();
      }
    }, 220);
  }

  /* ---------------- Contato ---------------- */
  function showForm() {
    el.question.hidden = true;
    el.result.hidden = true;
    el.form.hidden = false;
    el.label.textContent = 'Último passo';
    setProgress(TOTAL);
    const temLoja = state.path === 'melhorar';
    el.siteHint.textContent = temLoja ? '(para a análise da sua loja)' : '(opcional)';
    el.form.elements.site_loja.required = false;
    el.status.textContent = '';
    el.status.dataset.state = '';
    el.form.elements.nome.focus({ preventScroll: true });
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    track('diagnostico_contact_view');
  }

  el.form.querySelector('[data-dg-back]').addEventListener('click', () => {
    state.step = questions().length - 1;
    renderQuestion();
    focusQuestion();
  });
  el.form.addEventListener('input', (event) => event.target.setCustomValidity?.(''));

  const validate = () => {
    const f = el.form.elements;
    ['nome', 'empresa', 'telefone'].forEach((n) => f[n].setCustomValidity(f[n].value.trim() ? '' : 'Preencha este campo.'));
    if (f.telefone.value.trim() && !/^\d{10,13}$/.test(f.telefone.value.replace(/\D/g, ''))) {
      f.telefone.setCustomValidity('Informe um WhatsApp com DDD.');
    }
    return el.form.reportValidity();
  };

  /* ---------------- Resultado ---------------- */
  const textoDe = (id, value) => {
    const q = [MOMENTO, ...CAMINHOS.melhorar, ...CAMINHOS.criar].find((item) => item.id === id && item.options.some((o) => o.value === value));
    return q?.options.find((o) => o.value === value)?.text || value;
  };

  function computeResult() {
    const a = state.answers;
    const perfil = PERFIS[state.path](a);
    const prioridades = REGRAS[state.path].filter((r) => r.when(a)).slice(0, 3);
    return { perfil, prioridades };
  }

  const cleanSite = (value) => value.trim().replace(/\s+/g, '').slice(0, 200);
  const cleanInsta = (value) => {
    const v = value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '').replace(/^@?/, '');
    return v ? `@${v.slice(0, 60)}` : '';
  };

  function buildMessage(data, result) {
    const a = state.answers;
    const respostas = questions().filter((q) => q.id !== 'momento').map((q) => `${q.label} ${textoDe(q.id, a[q.id])}`);
    return [
      'DIAGNÓSTICO DA LOJA',
      `Momento: ${textoDe('momento', a.momento)}`,
      `Loja: ${data.site_loja || 'não informada'}`,
      `Instagram: ${data.instagram || 'não informado'}`,
      `Resultado: ${result.perfil.title}`,
      `Prioridades: ${result.prioridades.map((p, i) => `${i + 1}) ${p.title}`).join(' ')}`,
      `Respostas: ${respostas.join(' | ')}`
    ].join(' | ').slice(0, 1800);
  }

  function waLink(data) {
    const temSite = Boolean(data.site_loja);
    const texto = temSite
      ? `Olá! Sou ${data.nome}, da ${data.empresa}. Fiz o diagnóstico no site da Bora e quero a análise da minha loja: ${data.site_loja}`
      : `Olá! Sou ${data.nome}, da ${data.empresa}. Fiz o diagnóstico no site da Bora e quero conversar sobre ${state.path === 'criar' ? 'abrir minha loja online' : 'minha loja online'}.`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(texto)}`;
  }

  function showResult(data, result, registered) {
    el.form.hidden = true;
    el.question.hidden = true;
    el.result.hidden = false;
    el.label.textContent = '';
    setProgress(TOTAL + 1);

    const nome = data.nome.split(' ')[0];
    el.result.querySelector('[data-dg-result-eyebrow]').textContent = `Resultado de ${nome}`;
    el.result.querySelector('[data-dg-result-title]').textContent = result.perfil.title;
    el.result.querySelector('[data-dg-result-text]').textContent = result.perfil.text;

    const list = el.result.querySelector('[data-dg-priorities]');
    list.innerHTML = '';
    result.prioridades.forEach((p) => {
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = p.title;
      const span = document.createElement('span');
      span.textContent = p.text;
      li.append(b, span);
      list.appendChild(li);
    });

    const next = el.result.querySelector('[data-dg-next-text]');
    next.textContent = data.site_loja
      ? 'Agora a Bora vai olhar sua loja de verdade e mandar no seu WhatsApp o que encontrar, em até 1 dia útil. Se quiser adiantar, chame a gente:'
      : 'Quer ajuda para colocar isso em prática? Chame a Bora no WhatsApp e conte um pouco mais sobre o seu negócio:';
    const wa = el.result.querySelector('[data-dg-whatsapp]');
    wa.href = waLink(data);
    wa.textContent = data.site_loja
      ? 'Quero a análise da minha loja'
      : (state.path === 'criar' ? 'Quero ajuda para abrir minha loja' : 'Falar com a Bora no WhatsApp');

    const resultStatus = el.result.querySelector('[data-dg-result-status]');
    resultStatus.dataset.state = registered ? 'success' : 'error';
    resultStatus.textContent = registered
      ? ''
      : 'Não conseguimos registrar seus dados agora. Toque no botão acima para continuar pelo WhatsApp.';

    el.result.focus({ preventScroll: true });
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', (event) => {
    const cta = event.target.closest('[data-cta-id]');
    if (cta) state.lastCta = cta.dataset.ctaId;
  });

  let busy = false;
  el.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !validate()) return;
    const raw = new FormData(el.form);
    if (raw.get('website')) return; // armadilha anti-robô

    const data = {
      nome: String(raw.get('nome') || '').trim(),
      empresa: String(raw.get('empresa') || '').trim(),
      telefone: String(raw.get('telefone') || '').trim(),
      instagram: cleanInsta(String(raw.get('instagram') || '')),
      site_loja: cleanSite(String(raw.get('site_loja') || ''))
    };
    const result = computeResult();

    const payload = {
      ...campaign,
      nome: data.nome,
      empresa: data.empresa,
      telefone: data.telefone,
      email: '',
      mensagem: buildMessage(data, result),
      desafio: state.path === 'melhorar' ? 'Loja online que vende pouco' : 'Abrir loja online',
      produto: 'Bora Online · Diagnóstico da loja',
      origem: 'diagnostico-loja',
      pagina: 'diagnostico',
      pagina_url: location.href,
      pagina_origem: attribution.first_page || location.pathname,
      url_entrada: attribution.first_page || location.pathname,
      referrer: document.referrer || '',
      initial_referrer: attribution.initial_referrer || document.referrer || '',
      data_hora: new Date().toISOString(),
      dispositivo: matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
      servico_interesse: 'bora_online',
      cta_origem: attribution.cta_origin || state.lastCta,
      site_loja: data.site_loja,
      instagram: data.instagram,
      diagnostico_caminho: state.path,
      diagnostico_resultado: result.perfil.title,
      diagnostico_prioridades: result.prioridades.map((p) => p.title).join(' | '),
      diagnostico_respostas: JSON.stringify(state.answers)
    };

    busy = true;
    const button = el.form.querySelector('[type="submit"]');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    el.status.dataset.state = 'loading';
    el.status.textContent = 'Registrando e montando seu resultado…';
    track('lead_form_attempt', { cta_id: payload.cta_origem, diagnostico_caminho: state.path });

    let registered = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      if (!ENDPOINT) throw new Error('Endpoint não configurado');
      const response = await fetch(ENDPOINT, { method: 'POST', body: new URLSearchParams(payload), signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.ok !== true) throw new Error(json.message || 'Registro não confirmado.');
      registered = true;
      track('diagnostico_complete', { diagnostico_caminho: state.path, tem_site: data.site_loja ? 'sim' : 'nao' });
      track('lead_form_success', { cta_id: payload.cta_origem });
    } catch {
      track('lead_form_error', { cta_id: payload.cta_origem });
    } finally {
      clearTimeout(timeout);
      busy = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
    showResult(data, result, registered);
  });

  root.querySelector('[data-dg-restart]').addEventListener('click', () => {
    state.step = 0;
    state.answers = {};
    state.path = null;
    el.form.reset();
    renderQuestion();
    focusQuestion();
    track('diagnostico_restart');
  });

  renderQuestion();
})();
