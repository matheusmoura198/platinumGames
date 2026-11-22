const main = document.querySelector("main.guide-main");

if (main) {
  const allItems = [...main.querySelectorAll("li")];
  const items = allItems.filter((item) => !item.querySelector("li"));
  const pageKey = location.pathname.split("/").slice(-2).join("/");
  const storageKey = `platinumGames:progress:v2:${pageKey}`;\n  const homeStorageKey = `platinumGames:progress:v1:${pageKey}`;
  const completed = new Set();
  const occurrences = new Map();

  const hash = (value) => {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  };

  const getItemLabel = (item) => item.textContent.replace(/\s+/g, " ").trim().slice(0, 180);

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (Array.isArray(saved.completed)) saved.completed.forEach((key) => completed.add(key));
  } catch {}

  const stageHeadings = [...main.querySelectorAll("h2")];
  const stages = [];
  let currentStage = { title: "Objetivos gerais", heading: null, items: [] };
  stages.push(currentStage);

  items.forEach((item) => {
    let previousHeading = null;
    const headings = [...main.querySelectorAll("h2, h3")];
    headings.forEach((heading) => {
      if (heading.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING) previousHeading = heading;
    });
    if (previousHeading && previousHeading.tagName === "H2") {
      currentStage = stages.find((stage) => stage.heading === previousHeading);
      if (!currentStage) {
        currentStage = { title: previousHeading.textContent.trim(), heading: previousHeading, items: [] };
        stages.push(currentStage);
      }
    } else if (previousHeading && previousHeading.tagName === "H3") {
      const parent = previousHeading.previousElementSibling;
      if (parent?.tagName === "H2") {
        currentStage = stages.find((stage) => stage.heading === parent) || currentStage;
      }
    }
    currentStage.items.push(item);
  });

  const panel = document.createElement("section");
  panel.className = "progress-panel";
  panel.setAttribute("aria-labelledby", "progress-title");
  const heading = document.createElement("div");
  heading.className = "progress-panel-heading";
  const title = document.createElement("h2");
  title.id = "progress-title";
  title.textContent = "Meu progresso neste guia";
  const count = document.createElement("p");
  count.className = "progress-count";
  count.setAttribute("aria-live", "polite");
  const progress = document.createElement("progress");
  progress.className = "guide-progress-bar";
  progress.max = Math.max(items.length, 1);
  progress.value = 0;
  progress.setAttribute("aria-label", "Progresso geral do guia");
  const percent = document.createElement("strong");
  percent.className = "progress-percent";
  percent.textContent = "0%";
  const stageContainer = document.createElement("div");
  stageContainer.className = "progress-stage-list";
  const actions = document.createElement("div");
  actions.className = "progress-panel-actions";
  const reset = document.createElement("button");
  reset.className = "button button-secondary";
  reset.type = "button";
  reset.textContent = "Limpar progresso";
  heading.append(title, count);
  actions.append(reset);
  panel.append(heading, progress, percent, stageContainer, actions);
  main.querySelector("h1")?.after(panel);

  if (stageHeadings.length) {
    const navigation = document.createElement("details");
    navigation.className = "guide-toc";
    const summary = document.createElement("summary");
    summary.textContent = "Navegar pelas etapas deste guia";
    const list = document.createElement("ol");
    stageHeadings.forEach((heading, index) => {
      const slug = heading.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      heading.id ||= `etapa-${slug || "guia"}-${index + 1}`;
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.replace(/\s+/g, " ").trim();
      item.append(link);
      list.append(item);
    });
    navigation.append(summary, list);
    panel.after(navigation);
  }

  const tracked = [];
  stages.forEach((stage, index) => {
    if (!stage.items.length) return;
    const card = document.createElement("section");
    card.className = "progress-stage";
    const stageTitle = document.createElement("h3");
    stageTitle.textContent = stage.title;
    const stageCount = document.createElement("p");
    stageCount.className = "progress-stage-count";
    const stageBar = document.createElement("progress");
    stageBar.className = "guide-progress-bar";
    stageBar.max = stage.items.length;
    stageBar.value = 0;
    stageBar.setAttribute("aria-label", `Progresso: ${stage.title}`);
    card.append(stageTitle, stageCount, stageBar);
    stageContainer.append(card);
    stage.items.forEach((item) => {
      const label = getItemLabel(item);
      const signature = hash(label.toLocaleLowerCase("pt-BR"));
      const occurrence = occurrences.get(signature) || 0;
      occurrences.set(signature, occurrence + 1);
      const itemKey = `${signature}-${occurrence}`;
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "guide-progress-checkbox";
      checkbox.checked = completed.has(itemKey);
      checkbox.setAttribute("aria-label", `Marcar como concluído: ${label}`);
      const content = document.createElement("div");
      content.className = "guide-progress-content";
      while (item.firstChild) content.append(item.firstChild);
      item.classList.add("trackable-item");
      item.replaceChildren(checkbox, content);
      tracked.push({ checkbox, itemKey, item, stage });
    });
    stage.checkboxes = tracked.filter((entry) => entry.stage === stage);
    stage.countElement = stageCount;
    stage.progressElement = stageBar;
  });

  const update = () => {
    const done = tracked.filter(({ checkbox }) => checkbox.checked).length;
    count.textContent = `${done} de ${tracked.length} objetivos concluídos`;
    percent.textContent = `${tracked.length ? Math.round(done / tracked.length * 100) : 0}%`;
    progress.max = Math.max(tracked.length, 1);
    progress.value = done;
    tracked.forEach(({ item, checkbox }) => item.classList.toggle("is-complete", checkbox.checked));
    stages.forEach((stage) => {
      if (!stage.checkboxes?.length) return;
      const stageDone = stage.checkboxes.filter(({ checkbox }) => checkbox.checked).length;
      stage.countElement.textContent = `${stageDone} / ${stage.checkboxes.length} concluídos`;
      stage.progressElement.value = stageDone;
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        version: 2,
        completed: tracked.filter(({ checkbox }) => checkbox.checked).map(({ itemKey }) => itemKey),
        total: tracked.length,
        updatedAt: new Date().toISOString()
      }));
    } catch {
      count.textContent += " — não foi possível salvar neste navegador";
    }
  };

  tracked.forEach(({ checkbox }) => checkbox.addEventListener("change", update));
  reset.addEventListener("click", () => {
    if (!confirm("Deseja realmente limpar todo o progresso deste guia?")) return;
    tracked.forEach(({ checkbox }) => { checkbox.checked = false; });
    completed.clear();
    update();
  });
  update();
}