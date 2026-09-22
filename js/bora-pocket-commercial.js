// Bora Pocket uses the same Apps Script endpoint and GTM container as the main site.
// The endpoint returns JSON with { ok: true } only after the lead is saved.
(() => {
  const form = document.querySelector('.pocket-form');
  if (!form) return;

  const query = new URLSearchParams(location.search);
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const storageKey = 'bora_pocket_campaign';
  const entryKey = 'bora_pocket_entry_url';
  let stored = {};
  try { stored = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); } catch {}
  campaignKeys.forEach(key => {
    const value = query.get(key);
    if (value) stored[key] = value.slice(0, 180);
  });
  if (!stored.utm_source) stored.utm_source = 'direct';
  try { sessionStorage.setItem(storageKey, JSON.stringify(stored)); } catch {}

  let entryUrl = location.href;
  try {
    entryUrl = sessionStorage.getItem(entryKey) || location.href;
    if (!sessionStorage.getItem(entryKey)) sessionStorage.setItem(entryKey, entryUrl);
  } catch {}

  let mode = 'vendas';
  let lastCta = 'direct';
  const pushed = new Set();
  window.dataLayer = window.dataLayer || [];
  const eventContext = () => ({
    page_path: location.pathname,
    utm_source: stored.utm_source,
    utm_medium: stored.utm_medium || '',
    utm_campaign: stored.utm_campaign || '',
    utm_content: stored.utm_content || '',
    utm_term: stored.utm_term || '',
    dashboard_mode: mode
  });
  const emit = (event, extra = {}) => window.dataLayer.push({ event, ...eventContext(), ...extra });
  const once = (event, extra = {}) => {
    if (pushed.has(event)) return;
    pushed.add(event);
    emit(event, extra);
  };

  once('pocket_page_view');

  document.addEventListener('click', event => {
    const cta = event.target.closest('[data-pocket-cta]');
    if (cta) {
      lastCta = cta.dataset.pocketCta;
      emit('pocket_cta_click', { cta_position: lastCta });
    }
    const whatsapp = event.target.closest('[data-pocket-whatsapp]');
    if (whatsapp) emit('pocket_whatsapp_click', { cta_position: whatsapp.dataset.pocketWhatsapp });
  });

  document.querySelectorAll('[data-view]').forEach(tab => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.view;
      emit('pocket_demo_interaction', { dashboard_mode: mode });
    });
  });

  const contact = document.querySelector('#contato');
  if (contact && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        once('pocket_form_view');
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(contact);
  }
  form.addEventListener('focusin', event => {
    if (event.target.matches('input:not([name="website"]), textarea')) once('pocket_form_start');
  });

  let scrollScheduled = false;
  const checkScroll = () => {
    scrollScheduled = false;
    const total = document.documentElement.scrollHeight - innerHeight;
    if (total <= 0) return;
    const depth = scrollY / total;
    if (depth >= 0.5) once('pocket_scroll_50');
    if (depth >= 0.9) once('pocket_scroll_90');
  };
  addEventListener('scroll', () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(checkScroll);
  }, { passive: true });

  const button = form.querySelector('[type="submit"]');
  const status = form.querySelector('.form-status');
  const fallback = form.querySelector('[data-pocket-whatsapp="error"]');
  let busy = false;
  const fields = ['nome', 'empresa', 'telefone', 'email'];
  const validate = () => {
    fields.forEach(name => {
      const input = form.elements[name];
      input.setCustomValidity(input.value.trim() ? '' : 'Preencha este campo.');
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
  button.addEventListener('click', event => {
    if (busy) return;
    emit('pocket_form_submit_attempt', { cta_position: 'final' });
    if (!validate()) event.preventDefault();
  });

  const whatsappUrl = data => {
    const message = [
      'Olá! Conheci o Bora Pocket e quero entender se funciona para a minha empresa.',
      data.nome && `Nome: ${data.nome}`,
      data.empresa && `Empresa: ${data.empresa}`,
      data.mensagem && `Principal informação desejada: ${data.mensagem}`
    ].filter(Boolean).join('\n');
    return `https://wa.me/${BORA_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !validate()) return;
    const raw = new FormData(form);
    if (raw.get('website')) return;
    busy = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    fallback.hidden = true;
    status.dataset.state = 'loading';
    status.textContent = 'Registrando seus dados…';

    const data = Object.fromEntries(raw);
    delete data.website;
    fields.forEach(name => data[name] = String(data[name] || '').trim());
    data.mensagem = String(data.mensagem || '').trim();
    Object.assign(data, stored, {
      produto: 'Bora Pocket',
      origem: 'bora-pocket',
      pagina: 'bora-pocket',
      pagina_url: location.href,
      pagina_origem: entryUrl,
      url_entrada: entryUrl,
      referrer: document.referrer || '',
      initial_referrer: document.referrer || '',
      data_hora: new Date().toISOString(),
      dispositivo: matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
      servico_interesse: 'bora_pocket',
      cta_origem: lastCta
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
      emit('pocket_form_submit_success', { cta_position: 'final' });
      status.dataset.state = 'success';
      status.textContent = 'Dados registrados. Vamos continuar pelo WhatsApp.';
      setTimeout(() => location.assign(whatsappUrl(data)), 1100);
    } catch (error) {
      emit('pocket_form_submit_error', { cta_position: 'final' });
      status.dataset.state = 'error';
      status.textContent = 'Não conseguimos confirmar o registro agora. Tente novamente ou continue pelo WhatsApp.';
      fallback.href = whatsappUrl(data);
      fallback.hidden = false;
      button.disabled = false;
      button.removeAttribute('aria-busy');
      busy = false;
    } finally {
      clearTimeout(timeout);
    }
  });
})();
