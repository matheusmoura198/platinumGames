const root = document.querySelector(".guide-main");
const dataUrl = "../data/guias/hollowKnight.json";
const storageKey = "platinumGames:hollowKnight:detailChecklist:v1";

if (root) {
  fetch(dataUrl).then((response) => {
    if (!response.ok) throw new Error("Não foi possível carregar o guia detalhado.");
    return response.json();
  }).then((data) => render(data)).catch((error) => {
    const message = document.createElement("p");
    message.className = "guide-data-error";
    message.textContent = error.message;
    root.append(message);
  });
}

function render(data) {
  const section = document.createElement("section");
  section.className = "detailed-roadmap";
  section.id = "roteiro-platina";
  const title = document.createElement("h2");
  title.textContent = "Roteiro otimizado e checklist detalhado";
  const intro = document.createElement("p");
  intro.textContent = "Marque os subobjetivos conforme avançar. O progresso é salvo neste navegador.";
  const overall = document.createElement("div");
  overall.className = "roadmap-overall";
  const overallText = document.createElement("p");
  overallText.className = "roadmap-count";
  const overallBar = document.createElement("progress");
  overallBar.max = 1;
  overallBar.value = 0;
  overallBar.className = "guide-progress-bar";
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "button button-secondary";
  clear.textContent = "Limpar checklist";
  overall.append(overallText, overallBar, clear);
  section.append(title, intro, overall);

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch {}
  const inputs = [];
  const taskLookup = new Map();
  data.phases.forEach((phase) => phase.tasks.forEach((task) => taskLookup.set(task.id, task)));

  data.phases.forEach((phase) => {
    const phaseCard = document.createElement("details");
    phaseCard.className = "roadmap-phase";
    phaseCard.open = true;
    const summary = document.createElement("summary");
    summary.textContent = phase.title;
    const description = document.createElement("p");
    description.textContent = phase.summary;
    const phaseCount = document.createElement("p");
    phaseCount.className = "roadmap-phase-count";
    const list = document.createElement("div");
    list.className = "roadmap-task-list";
    phase.tasks.forEach((task) => {
      const card = document.createElement("article");
      card.className = "roadmap-task";
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(saved[task.id]);
      checkbox.dataset.task = task.id;
      const name = document.createElement("strong");
      name.textContent = task.title;
      label.append(checkbox, name);
      const detail = document.createElement("p");
      detail.textContent = task.details;
      card.append(label, detail);
      if (task.links?.length) {
        const links = document.createElement("p");
        links.className = "roadmap-relations";
        links.textContent = "Relaciona-se a: " + task.links.join(" • ");
        card.append(links);
      }
      list.append(card);
      inputs.push(checkbox);
    });
    phaseCard.append(summary, description, phaseCount, list);
    section.append(phaseCard);
    phaseCard.dataset.phase = phase.id;
    phaseCard._inputs = phase.tasks.map((task) => inputs.find((input) => input.dataset.task === task.id));
    phaseCard._count = phaseCount;
  });

  const editorial = document.createElement("section");
  editorial.className = "guide-editorial";
  const editorialTitle = document.createElement("h2");
  editorialTitle.textContent = "Verificação editorial";
  const editorialText = document.createElement("p");
  editorialText.textContent = data.metadata.status + ". Revisão: " + data.metadata.reviewed + ". Versão deste roteiro: " + data.metadata.guideVersion + ". Versão do jogo: " + data.metadata.gameVersion + ".";
  const caveat = document.createElement("p");
  caveat.textContent = data.metadata.reviewNotes;
  const sources = document.createElement("ul");
  data.sourceLinks.forEach((source) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = source.name;
    li.append(link);
    sources.append(li);
  });
  editorial.append(editorialTitle, editorialText, caveat, sources);
  section.append(editorial);

  const placeholder = document.getElementById("guia-detalhado");
  if (placeholder) placeholder.replaceWith(section);
  else root.append(section);

  const update = () => {
    const done = inputs.filter((input) => input.checked).length;
    overallText.textContent = done + " / " + inputs.length + " subobjetivos concluídos (" + (inputs.length ? Math.round(done / inputs.length * 100) : 0) + "%)";
    overallBar.max = Math.max(inputs.length, 1);
    overallBar.value = done;
    section.querySelectorAll(".roadmap-phase").forEach((phase) => {
      const phaseInputs = phase._inputs;
      const completed = phaseInputs.filter((input) => input.checked).length;
      phase._count.textContent = completed + " / " + phaseInputs.length + " concluídos";
    });
    const state = {};
    inputs.forEach((input) => { if (input.checked) state[input.dataset.task] = true; });
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch {}
  };
  inputs.forEach((input) => input.addEventListener("change", update));
  clear.addEventListener("click", () => {
    if (!confirm("Limpar o progresso deste roteiro?")) return;
    inputs.forEach((input) => { input.checked = false; });
    update();
  });
  update();
}
