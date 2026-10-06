(() => {
  const form = document.querySelector('.online-form');
  if (!form) return;

  const query = new URLSearchParams(location.search);
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const storageKey = 'bora_online_campaign';
  const entryKey = 'bora_online_entry_url';
  let campaign = {};

  try { campaign = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch {}
  campaignKeys.forEach(key => {
    const value = query.get(key);
    if (value) campaign[key] = value.slice(0, 180);
  });
  if (!campaign.utm_source) campaign.utm_source = 'direct';
  try { sessionStorage.setItem(storageKey, JSON.stringify(campaign)); } catch {}

  let entryUrl = location.href;
  try {
    entryUrl = sessionStorage.getItem(entryKey) || location.href;
    if (!sessionStorage.getItem(entryKey)) sessionStorage.setItem(entryKey, entryUrl);
  } catch {}

  let lastCta = 'direct';
  document.addEventListener('click', event => {
    const cta = event.target.closest('[data-cta-id]');
    if (cta) lastCta = cta.dataset.ctaId;
  });

  const button = form.querySelector('[type="submit"]');
  const status = form.querySelector('.form-status');
  const fallback = form.querySelector('.online-fallback');
  let busy = false;

  const validate = () => {
    ['nome', 'empresa', 'telefone', 'estagio', 'desafio'].forEach(name => {
      const field = form.elements[name];
      field.setCustomValidity(field.value.trim() ? '' : 'Preencha este campo.');
    });
    const phone = form.elements.telefone;
    if (phone.value.trim() && !/^\d{10,13}$/.test(phone.value.replace(/\D/g, ''))) {
      phone.setCustomValidity('Informe um WhatsApp com DDD.');
    }
    return form.reportValidity();
  };

  form.addEventListener('input', event => {
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
  });

  const whatsappUrl = data => {
    const message = [
      'Olá! Quero entender como o Bora Online pode ajudar minha empresa.',
      `Nome: ${data.nome}`,
      `Empresa: ${data.empresa}`,
      `Momento atual: ${data.estagio}`,
      `Principal desafio: ${data.desafio}`
    ].join('\n');
    return `https://wa.me/${BORA_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !validate()) return;

    const raw = new FormData(form);
    if (raw.get('website')) return;

    const data = Object.fromEntries(raw);
    delete data.website;
    Object.keys(data).forEach(key => data[key] = String(data[key] || '').trim());
    data.mensagem = [
      `Momento atual: ${data.estagio}`,
      `Principal desafio: ${data.desafio}`
    ].join(' | ');

    Object.assign(data, campaign, {
      produto: 'Bora Online',
      origem: 'bora-online',
      pagina: 'bora-online',
      pagina_url: location.href,
      pagina_origem: entryUrl,
      url_entrada: entryUrl,
      referrer: document.referrer || '',
      initial_referrer: document.referrer || '',
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
    window.dataLayer.push({
      event: 'lead_form_attempt',
      section_origin: 'bora-online',
      service_interest: 'bora_online',
      cta_id: lastCta,
      page_path: location.pathname
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(BORA_CONFIG.appsScriptUrl, {
        method: 'POST',
        body: new URLSearchParams(data),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.ok !== true) throw new Error(result.message || 'Registro não confirmado.');

      window.dataLayer.push({
        event: 'lead_form_success',
        section_origin: 'bora-online',
        service_interest: 'bora_online',
        page_path: location.pathname
      });
      status.dataset.state = 'success';
      status.textContent = 'Dados registrados. Vamos continuar pelo WhatsApp.';
      setTimeout(() => location.assign(whatsappUrl(data)), 900);
    } catch {
      window.dataLayer.push({
        event: 'lead_form_error',
        section_origin: 'bora-online',
        service_interest: 'bora_online',
        page_path: location.pathname
      });
      status.dataset.state = 'error';
      status.textContent = 'Não conseguimos confirmar o registro agora. Continue pelo WhatsApp.';
      fallback.href = whatsappUrl(data);
      fallback.hidden = false;
      busy = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    } finally {
      clearTimeout(timeout);
    }
  });
})();
