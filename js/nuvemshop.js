/* Landing /nuvemshop: galeria ampliável, botão fixo no celular e formulário de lead. */
(() => {
  const NS_MESSAGE = 'Olá! Vi a página da Bora com a Nuvemshop e quero conversar sobre a criação da minha loja.';
  const waNumber = (typeof BORA_CONFIG !== 'undefined' && BORA_CONFIG.whatsappNumber) || '5521967171986';
  const waUrl = (text = NS_MESSAGE) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

  /* ---------- Galeria ampliável ---------- */
  const shots = [
    { title: 'Moda feminina · loja demonstrativa Recife Couture', src: '/assets/nuvemshop/recife-moda-desktop-1600.webp', alt: 'Loja demonstrativa Recife Couture, de moda feminina, no tema Recife da Nuvemshop' },
    { title: 'Casa e decoração · loja demonstrativa Recife Casa', src: '/assets/nuvemshop/recife-casa-desktop-1600.webp', alt: 'Loja demonstrativa Recife Casa, de casa e decoração, no tema Recife da Nuvemshop' },
    { title: 'Beleza e cuidados · loja demonstrativa Recife', src: '/assets/nuvemshop/recife-beleza-desktop-1600.webp', alt: 'Loja demonstrativa Recife, de beleza e cuidados, no tema Recife da Nuvemshop' }
  ];
  const dialog = document.querySelector('.ns-lightbox');
  const lbImg = dialog?.querySelector('[data-lb-img]');
  const lbTitle = dialog?.querySelector('[data-lb-title]');
  let current = 0;
  let opener = null;

  const show = (index) => {
    current = (index + shots.length) % shots.length;
    const shot = shots[current];
    lbImg.src = shot.src;
    lbImg.alt = shot.alt;
    lbTitle.textContent = shot.title;
  };

  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-zoom]').forEach((button) => {
      button.addEventListener('click', () => {
        opener = button;
        show(Number(button.dataset.zoom));
        dialog.showModal();
        document.body.classList.add('ns-lb-open');
        dialog.querySelector('[data-lb-close]').focus();
        window.dataLayer?.push({ event: 'ns_gallery_open', gallery_item: current, page_path: location.pathname });
      });
    });
    dialog.querySelector('[data-lb-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-lb-prev]').addEventListener('click', () => show(current - 1));
    dialog.querySelector('[data-lb-next]').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') show(current - 1);
      if (event.key === 'ArrowRight') show(current + 1);
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('ns-lb-open');
      opener?.focus();
    });
  } else {
    // Sem suporte a <dialog>: abre a imagem ampliada diretamente.
    document.querySelectorAll('[data-zoom]').forEach((button) => {
      button.addEventListener('click', () => window.open(shots[Number(button.dataset.zoom)].src, '_blank', 'noopener'));
    });
  }

  /* ---------- Botão fixo no celular ---------- */
  const sticky = document.querySelector('.ns-sticky');
  const hero = document.querySelector('[data-ns-hero]');
  const finalSection = document.querySelector('[data-ns-final]');
  if (sticky && hero && finalSection && 'IntersectionObserver' in window) {
    const state = { heroVisible: true, finalVisible: false };
    const update = () => {
      const visible = !state.heroVisible && !state.finalVisible && !document.body.classList.contains('ns-lb-open');
      sticky.classList.toggle('is-visible', visible);
      sticky.setAttribute('aria-hidden', String(!visible));
      sticky.tabIndex = visible ? 0 : -1;
    };
    new IntersectionObserver(([entry]) => { state.heroVisible = entry.isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(([entry]) => { state.finalVisible = entry.isIntersecting; update(); }, { rootMargin: '0px 0px 80px 0px' }).observe(finalSection);
  }

  /* ---------- Formulário de lead (mesma integração do Apps Script) ---------- */
  const form = document.querySelector('.ns-form');
  if (!form) return;

  let attribution = {};
  try { attribution = JSON.parse(sessionStorage.getItem('bora_attribution') || '{}'); } catch {}
  const query = new URLSearchParams(location.search);
  const campaign = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach((key) => {
    const value = query.get(key) || attribution[key];
    if (value) campaign[key] = String(value).slice(0, 180);
  });
  if (!campaign.utm_source) campaign.utm_source = 'direct';

  let lastCta = 'direct';
  document.addEventListener('click', (event) => {
    const cta = event.target.closest('[data-cta-id]');
    if (cta) lastCta = cta.dataset.ctaId;
  });

  const button = form.querySelector('[type="submit"]');
  const status = form.querySelector('.form-status');
  const fallback = form.querySelector('.ns-fallback');
  let busy = false;
  let started = false;

  form.addEventListener('focusin', () => {
    if (started) return;
    started = true;
    window.dataLayer?.push({ event: 'form_start', section_origin: 'nuvemshop', service_interest: 'bora_online', page_path: location.pathname });
  });
  form.addEventListener('input', (event) => event.target.setCustomValidity?.(''));

  const validate = () => {
    ['nome', 'empresa', 'telefone', 'estagio'].forEach((name) => {
      const field = form.elements[name];
      field.setCustomValidity(field.value.trim() ? '' : 'Preencha este campo.');
    });
    const phone = form.elements.telefone;
    if (phone.value.trim() && !/^\d{10,13}$/.test(phone.value.replace(/\D/g, ''))) {
      phone.setCustomValidity('Informe um WhatsApp com DDD.');
    }
    return form.reportValidity();
  };

  const leadMessage = (data) => [
    NS_MESSAGE,
    `Nome: ${data.nome}`,
    `Marca ou empresa: ${data.empresa}`,
    `Momento: ${data.estagio}`
  ].join('\n');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !validate()) return;
    const raw = new FormData(form);
    if (raw.get('website')) return;

    const data = Object.fromEntries(raw);
    delete data.website;
    Object.keys(data).forEach((key) => { data[key] = String(data[key] || '').trim(); });

    Object.assign(data, campaign, {
      email: '',
      mensagem: `Momento atual: ${data.estagio} | Interesse: loja Nuvemshop com a Bora (condição de parceria)`,
      desafio: 'Criação de loja na Nuvemshop',
      produto: 'Bora Online · Nuvemshop',
      origem: 'nuvemshop',
      pagina: 'nuvemshop',
      pagina_url: location.href,
      pagina_origem: attribution.first_page || location.pathname,
      url_entrada: attribution.first_page || location.pathname,
      referrer: document.referrer || '',
      initial_referrer: attribution.initial_referrer || document.referrer || '',
      data_hora: new Date().toISOString(),
      dispositivo: matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
      servico_interesse: 'bora_online',
      cta_origem: lastCta
    });

    busy = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    fallback.hidden = true;
    status.dataset.state = 'loading';
    status.textContent = 'Registrando seus dados…';

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'lead_form_attempt', section_origin: 'nuvemshop', service_interest: 'bora_online', cta_id: lastCta, page_path: location.pathname });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(BORA_CONFIG.appsScriptUrl, { method: 'POST', body: new URLSearchParams(data), signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.ok !== true) throw new Error(result.message || 'Registro não confirmado.');

      window.dataLayer.push({ event: 'lead_form_success', section_origin: 'nuvemshop', service_interest: 'bora_online', page_path: location.pathname });
      status.dataset.state = 'success';
      status.textContent = 'Dados registrados. Vamos continuar pelo WhatsApp.';
      setTimeout(() => location.assign(waUrl(leadMessage(data))), 900);
    } catch {
      window.dataLayer.push({ event: 'lead_form_error', section_origin: 'nuvemshop', service_interest: 'bora_online', page_path: location.pathname });
      status.dataset.state = 'error';
      status.textContent = 'Não conseguimos confirmar o registro agora. Continue pelo WhatsApp.';
      fallback.href = waUrl(leadMessage(data));
      fallback.hidden = false;
      busy = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    } finally {
      clearTimeout(timeout);
    }
  });
})();
