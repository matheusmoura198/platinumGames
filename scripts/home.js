const featuredGrid = document.querySelector("#featured-grid");
const journeyGrid = document.querySelector("#journey-grid");

const makeElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const makeGameCard = (game) => {
  const article = makeElement("article", "game-card");
  const link = makeElement("a", "game-card-link");
  link.href = game.href;
  link.setAttribute("aria-label", `Abrir guia de ${game.title}`);

  const image = makeElement("img");
  image.src = game.image;
  image.alt = `Arte de ${game.title}`;
  image.width = 640;
  image.height = 400;
  image.loading = "lazy";
  image.decoding = "async";

  const content = makeElement("div", "game-card-content");
  content.append(
    makeElement("span", "game-genre", game.genre),
    makeElement("h3", "", game.title),
    makeElement("p", "", game.description),
    makeElement("span", "card-action", "Abrir guia →")
  );
  link.append(image, content);
  article.append(link);
  return article;
};

const readProgress = (path) => {
  try {
    const value = JSON.parse(localStorage.getItem(`platinumGames:progress:v1:${path}`) || "null");
    if (!value || !Array.isArray(value.completed) || !Number.isFinite(value.total) || value.total <= 0) return null;
    return { done: value.completed.length, total: value.total };
  } catch {
    return null;
  }
};

const makeJourneyCard = (game, progress) => {
  const article = makeElement("article", "journey-card");
  const heading = makeElement("div", "journey-card-heading");
  heading.append(makeElement("h3", "", game.title), makeElement("span", "journey-percent", `${Math.round(progress.done / progress.total * 100)}%`));
  const bar = makeElement("progress", "journey-progress");
  bar.max = progress.total;
  bar.value = Math.min(progress.done, progress.total);
  bar.setAttribute("aria-label", `Progresso em ${game.title}`);
  const meta = makeElement("p", "", `${progress.done} de ${progress.total} objetivos concluídos`);
  const link = makeElement("a", "card-action", "Continuar guia →");
  link.href = game.href;
  article.append(heading, bar, meta, link);
  return article;
};

const initializeHome = async () => {
  try {
    const response = await fetch(new URL("../data/jogos.json", import.meta.url));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const games = await response.json();
    const featuredIds = ["hollow-knight", "cuphead", "red-dead-redemption-2"];
    const featured = featuredIds.map((id) => games.find((game) => game.id === id)).filter(Boolean);
    featuredGrid.replaceChildren(...featured.map(makeGameCard));

    const journeys = games
      .map((game) => ({ game, progress: readProgress(game.href) }))
      .filter((entry) => entry.progress && entry.progress.done > 0)
      .sort((a, b) => (b.progress.done / b.progress.total) - (a.progress.done / a.progress.total));

    if (journeys.length) {
      journeyGrid.replaceChildren(...journeys.map(({ game, progress }) => makeJourneyCard(game, progress)));
    } else {
      journeyGrid.replaceChildren(makeElement("p", "empty-state", "Você ainda não marcou objetivos. Abra um guia e marque as etapas concluídas para acompanhar sua jornada aqui."));
    }
  } catch (error) {
    featuredGrid.replaceChildren(makeElement("p", "empty-state", "Não foi possível carregar os destaques."));
    journeyGrid.replaceChildren(makeElement("p", "empty-state", "Seu progresso não pôde ser carregado agora."));
    console.error("Erro ao carregar recursos da página inicial:", error);
  }
};

initializeHome();
