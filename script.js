const extraStyles = document.createElement("link");
extraStyles.rel = "stylesheet";
extraStyles.href = "anniversary (1).css?v=2";
document.head.append(extraStyles);

const menuToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const form = document.querySelector("[data-form]");
const status = document.querySelector(".form-status");

menuToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("open") ?? false;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

const whatsappNumber = "5521967171986";
const endpoint =
  "https://script.google.com/macros/s/AKfycbyoi5bYWhfFN3w3CMOD2H5rwKkHcAN9jtiBERKfmLU6A0wXaMVNA8WB8xJ80Fzussh8yA/exec";

function saveLead(data) {
  const frame = document.createElement("iframe");
  const post = document.createElement("form");

  frame.name = `lead-${Date.now()}`;
  frame.hidden = true;
  post.method = "post";
  post.action = endpoint;
  post.target = frame.name;
  post.hidden = true;

  Object.entries(data).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.name = key;
    input.value = value;
    post.append(input);
  });

  document.body.append(frame, post);
  post.submit();

  setTimeout(() => {
    frame.remove();
    post.remove();
  }, 1800);
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  if (status) {
    status.textContent = "Registrando seus dados e abrindo o WhatsApp…";
  }

  saveLead(data);

  const message = `Olá, quero solicitar um diagnóstico com a Bora Fazer.

Nome: ${data.nome}
Empresa: ${data.empresa}
Telefone: ${data.telefone}
E-mail: ${data.email}

Mensagem: ${data.mensagem}`;

  window.open(
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener"
  );
});

const anniversaryExpires = new Date("2026-07-25T00:00:00-03:00");

if (new Date() < anniversaryExpires) {
  document.querySelectorAll(".logo").forEach((logo) => {
    const badge = document.createElement("span");
    badge.className = "anniversary-badge";
    badge.textContent = "1";
    logo.append(badge);
  });
}
