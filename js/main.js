const CONFIG = {
  appsScriptUrl: "",
  whatsappNumber: ""
};

window.dataLayer = window.dataLayer || [];

const modal = document.getElementById("leadModal");
const form = document.getElementById("boraForm");
const statusMessage = document.getElementById("formStatus");
const openButton = document.querySelector("[data-open-lead-modal]");
const closeButton = document.querySelector("[data-close-lead-modal]");

function openModal() {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  window.dataLayer.push({ event: "open_lead_form" });
  form.elements.nome.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
  statusMessage.textContent = "";
}

openButton.addEventListener("click", openModal);
closeButton.addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form));

  // Não envie nome, e-mail ou telefone ao dataLayer.
  window.dataLayer.push({
    event: "lead_form_submit",
    servico_interesse: "geral"
  });

  if (CONFIG.appsScriptUrl) {
    try {
      await fetch(CONFIG.appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error("Não foi possível registrar o lead.", error);
    }
  }

  if (!CONFIG.whatsappNumber) {
    statusMessage.textContent = "Preview visual concluído. Configure o número do WhatsApp antes de publicar.";
    return;
  }

  const message = `Olá, meu nome é ${data.nome}. Gostaria de entender mais sobre as operações da Bora Fazer.`;
  const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  closeModal();
});
