const form = document.querySelector("#suggestion-form");

if (form) {
  const gameInput = form.querySelector("#suggestion-game");
  const reasonInput = form.querySelector("#suggestion-reason");
  const honeypot = form.querySelector("#suggestion-website");
  const submitButton = form.querySelector("#suggestion-submit");
  const status = form.querySelector("#suggestion-status");

  const showStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showStatus("");

    const game = gameInput.value.trim();
    const reason = reasonInput.value.trim();
    const formId = form.dataset.formspreeId?.trim();

    if (honeypot.value) return;

    if (!game) {
      showStatus("Informe o nome do jogo antes de enviar.", true);
      gameInput.focus();
      return;
    }

    if (!formId || formId === "SEU_ID_FORMSPREE") {
      showStatus("O formulário ainda precisa ser conectado ao Formspree. Consulte as instruções de configuração no README.", true);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Enviando…";

    try {
      const response = await fetch(`https://formspree.io/f/${encodeURIComponent(formId)}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jogo: game,
          justificativa: reason || "Não informada",
          origem: "Formulário de sugestões do PlatinumGames"
        })
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.errors?.map((item) => item.message).join(" ") || "Não foi possível enviar agora.");
      }

      form.reset();
      showStatus("Sugestão enviada! Obrigado por ajudar a melhorar o catálogo.");
    } catch (error) {
      showStatus(error.message || "Ocorreu um erro ao enviar. Tente novamente mais tarde.", true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar sugestão";
    }
  });
}
