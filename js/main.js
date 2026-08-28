const BORA_CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbwkUJDdyzdemm3-ntAloGPp5KKOL7hW3GnVDnh88MsNboxRCuMuV7PZvhmOzran28wC/exec",
  whatsappNumber: "5521967171986"
};

window.dataLayer = window.dataLayer || [];

const sessionKey = "bora_attribution";
const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
const query = new URLSearchParams(location.search);
let attribution = {};

try {
  attribution = JSON.parse(sessionStorage.getItem(sessionKey) || "{}");
} catch {
  attribution = {};
}

campaignKeys.forEach((key) => {
  const value = query.get(key);
  if (value) attribution[key] = value.slice(0, 180);
});

if (!attribution.first_page) attribution.first_page = location.pathname;
if (!attribution.initial_referrer && document.referrer) attribution.initial_referrer = document.referrer.slice(0, 300);
if (!attribution.service_interest && document.body.dataset.pageService) attribution.service_interest = document.body.dataset.pageService;

function persistAttribution() {
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify(attribution));
  } catch {}
}

persistAttribution();

function trackingContext() {
  return {
    page_path: location.pathname,
    page_title: document.title,
    section_origin: "",
    service_interest: attribution.service_interest || "",
    first_page: attribution.first_page || "",
    initial_referrer: attribution.initial_referrer || "",
    referrer: attribution.initial_referrer || "",
    utm_source: attribution.utm_source || "",
    utm_medium: attribution.utm_medium || "",
    utm_campaign: attribution.utm_campaign || "",
    utm_content: attribution.utm_content || "",
    utm_term: attribution.utm_term || ""
  };
}

function track(event, params = {}) {
  window.dataLayer.push({ event, ...trackingContext(), ...params });
}

const header = document.querySelector(".site-header");
function updateHeader() {
  header?.classList.toggle("is-scrolled", scrollY > 24);
}
updateHeader();
addEventListener("scroll", updateHeader, { passive: true });

const menuButton = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");

function closeMenu() {
  if (!menuButton || !nav) return;
  menuButton.setAttribute("aria-expanded", "false");
  nav.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("open", !open);
  document.body.classList.toggle("menu-open", !open);
});

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

addEventListener("resize", () => {
  if (innerWidth > 720) closeMenu();
});

document.addEventListener("click", (event) => {
  const element = event.target.closest("a,button");
  if (!element) return;

  const sectionOrigin = element.dataset.section || "unknown";
  const serviceInterest = element.dataset.serviceInterest || document.body.dataset.pageService || attribution.service_interest || "";

  if (element.dataset.serviceInterest) {
    attribution.service_interest = element.dataset.serviceInterest;
  }
  if (element.dataset.ctaId) {
    attribution.cta_origin = element.dataset.ctaId;
  }
  attribution.source_page = location.pathname;
  persistAttribution();

  if (element.dataset.ctaId) {
    track("cta_click", {
      section_origin: sectionOrigin,
      cta_id: element.dataset.ctaId,
      cta_text: (element.textContent || "").trim().slice(0, 80),
      service_interest: serviceInterest
    });
  }

  if (element.matches("[data-service-click]")) {
    track("service_click", {
      section_origin: sectionOrigin,
      service_name: serviceInterest,
      service_interest: serviceInterest
    });
  }

  if (element.matches("[data-case-cta]")) {
    track("case_cta_click", {
      section_origin: sectionOrigin,
      case_id: element.dataset.caseId || "",
      cta_id: element.dataset.ctaId || "",
      service_interest: serviceInterest
    });
  }

  if (element.href?.includes("/diagnostico")) {
    track("diagnostico_click", {
      section_origin: sectionOrigin,
      cta_id: element.dataset.ctaId || "navigation_diagnostico",
      service_interest: serviceInterest
    });
  }

  if (element.href?.includes("wa.me")) {
    track("whatsapp_click", {
      section_origin: sectionOrigin,
      whatsapp_location: element.dataset.location || "link",
      cta_id: element.dataset.ctaId || "",
      service_interest: serviceInterest
    });
  }
});

const observed = new Set();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || observed.has(entry.target)) return;
      observed.add(entry.target);

      if (entry.target.dataset.service) {
        track("service_view", {
          section_origin: entry.target.dataset.section || "services",
          service_name: entry.target.dataset.service
        });
      }

      if (entry.target.dataset.caseId) {
        track("case_view", {
          section_origin: "cases",
          case_id: entry.target.dataset.caseId
        });
      }

      if (entry.target.hasAttribute("data-method-section")) {
        track("method_view", {
          section_origin: "method"
        });
      }
    });
  }, { threshold: 0.45 });

  document.querySelectorAll("[data-service],.case-card[data-case-id],[data-method-section]").forEach((element) => observer.observe(element));
}

const depths = new Set();

addEventListener("scroll", () => {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  if (maximum <= 0) return;
  const current = Math.round(scrollY / maximum * 100);

  [25, 50, 75, 90].forEach((depth) => {
    if (current >= depth && !depths.has(depth)) {
      depths.add(depth);
      track("scroll_depth", { section_origin: "page", scroll_percent: depth });
    }
  });
}, { passive: true });

function postLead(data) {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    const post = document.createElement("form");
    const target = "lead-" + Date.now();

    frame.name = target;
    frame.hidden = true;
    post.method = "POST";
    post.action = BORA_CONFIG.appsScriptUrl;
    post.target = target;
    post.hidden = true;

    Object.entries(data).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.name = key;
      input.value = String(value);
      post.appendChild(input);
    });

    document.body.append(frame, post);

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      setTimeout(() => {
        frame.remove();
        post.remove();
      }, 1000);
      resolve();
    };

    frame.addEventListener("load", finish, { once: true });
    setTimeout(finish, 4500);
    post.submit();
  });
}

document.querySelectorAll("[data-lead-form]").forEach((form) => {
  let started = false;
  let busy = false;
  const status = form.querySelector(".form-status");

  form.addEventListener("input", () => {
    if (started) return;
    started = true;
    track("form_start", {
      section_origin: form.dataset.origin || "contact",
      service_interest: attribution.service_interest || document.body.dataset.pageService || "geral"
    });
  }, { once: true });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;

    const raw = new FormData(form);
    if (raw.get("website")) return;

    busy = true;
    const button = form.querySelector("[type=submit]");
    button.disabled = true;
    status.dataset.state = "";
    status.textContent = "Registrando seus dados para continuar no WhatsApp…";

    const data = Object.fromEntries(raw);
    delete data.website;

    Object.assign(data, attribution, {
      origem: form.dataset.origin || "site-v2",
      pagina: location.href,
      pagina_origem: attribution.source_page || attribution.first_page || location.pathname,
      servico_interesse: attribution.service_interest || document.body.dataset.pageService || "geral",
      cta_origem: attribution.cta_origin || "formulario_home"
    });

    track("lead_form_attempt", {
      section_origin: form.dataset.origin || "contact",
      cta_id: attribution.cta_origin || "lead_form",
      service_interest: data.servico_interesse
    });

    try {
      await postLead(data);
      status.dataset.state = "success";
      status.textContent = "Tentativa de registro enviada. O WhatsApp será aberto para continuar a conversa.";

      const message = `Olá, meu nome é ${data.nome}. Empresa: ${data.empresa || "não informada"}. Gostaria de conversar sobre ${data.mensagem || "as operações da Bora Fazer"}.`;
      window.open(`https://wa.me/${BORA_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        busy = false;
        button.disabled = false;
      }, 2500);
    } catch {
      status.dataset.state = "error";
      status.textContent = "Não foi possível tentar o registro agora. Use o botão de WhatsApp para continuar.";
      busy = false;
      button.disabled = false;
    }
  });
});

const diagnosticFrame = document.querySelector("[data-diagnostic-frame]");

if (diagnosticFrame) {
  const wrapper = diagnosticFrame.closest(".iframe-wrap");
  diagnosticFrame.addEventListener("load", () => {
    wrapper?.classList.add("loaded");
    track("diagnostico_iframe_load", {
      section_origin: "diagnostico_iframe",
      service_interest: attribution.service_interest || ""
    });
  }, { once: true });
}
