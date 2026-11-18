const main = document.querySelector("main.guide-main");

if (main) {
  const lists = [...main.querySelectorAll("ol, ul")];
  const items = lists.flatMap((list) => [...list.children].filter((item) => item.matches("li")));
  const pageKey = location.pathname.split("/").slice(-2).join("/");
  const storageKey = `platinumGames:progress:v1:${pageKey}`;
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

  const getItemLabel = (item) => {
    const heading = item.querySelector(":scope > h3, :scope > h4, :scope > h5, :scope > strong");
    return (heading?.textContent || item.textContent || "Objetivo").replace(/\s+/g, " ").trim().slice(0, 140);
  };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (Array.isArray(saved.completed)) saved.completed.forEach((key) => completed.add(key));
  } catch {
    // O guia continua utilizável mesmo se o armazenamento local estiver indisponível.
  }

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
  progress.setAttribute("aria-label", "Progresso dos objetivos do guia");

  const actions = document.createElement("div");
  actions.className = "progress-panel-actions";
  const reset = document.createElement("button");
  reset.className = "button button-secondary";
  reset.type = "button";
  reset.textContent = "Limpar progresso";

  heading.append(title, count);
  actions.append(reset);
  panel.append(heading, progress, actions);
  main.querySelector("h1")?.after(panel);


  const stageHeadings = [...main.querySelectorAll("h2")].filter((heading) => !heading.closest(".progress-panel"));
  if (stageHeadings.length) {
    const navigation = document.createElement("details");
    navigation.className = "guide-toc";
    const summary = document.createElement("summary");
    summary.textContent = "Navegar pelas etapas deste guia";
    const list = document.createElement("ol");

    stageHeadings.forEach((heading, index) => {
      const slug = heading.textContent
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
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

  const checkboxes = [];

  items.forEach((item) => {
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
    checkboxes.push({ checkbox, itemKey, item });
  });

  const update = () => {
    const done = checkboxes.filter(({ checkbox }) => checkbox.checked).length;
    count.textContent = `${done} de ${checkboxes.length} objetivos concluídos`;
    progress.max = Math.max(checkboxes.length, 1);
    progress.value = done;
    checkboxes.forEach(({ item, checkbox }) => item.classList.toggle("is-complete", checkbox.checked));

    try {
      localStorage.setItem(storageKey, JSON.stringify({
        version: 1,
        completed: checkboxes.filter(({ checkbox }) => checkbox.checked).map(({ itemKey }) => itemKey),
        total: checkboxes.length,
        updatedAt: new Date().toISOString()
      }));
    } catch {
      count.textContent += " — não foi possível salvar neste navegador";
    }
  };

  checkboxes.forEach(({ checkbox }) => checkbox.addEventListener("change", update));
  reset.addEventListener("click", () => {
    checkboxes.forEach(({ checkbox }) => { checkbox.checked = false; });
    update();
  });
  update();
}
