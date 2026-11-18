const featuredGrid = document.querySelector("#featured-grid");
const genreDiscovery = document.querySelector("#genre-discovery");
const journeyGrid = document.querySelector("#journey-grid");
const genreFilter = document.querySelector("#genre-filter");

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

const makeGenreButton = (genre, count) => {
  const button = makeElement("button", "genre-chip", genre);
  button.type = "button";
  button.setAttribute("aria-label", `Ver ${count} jogos do gênero ${genre}`);
  button.addEventListener("click", () => {
    genreFilter.value = genre;
    genreFilter.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector("#biblioteca").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  return button;
};

const initializeHome = async () => {
  try {
    const response = await fetch(new URL("../data/jogos.json", import.meta.url));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const games = await response.json();
    if (!Array.isArray(games)) throw new TypeError("O catálogo precisa ser uma lista.");

    const recommendedIds = ["hollow-knight", "cuphead", "red-dead-redemption-2"];
    const recommended = recommendedIds.map((id) => games.find((game) => game.id === id)).filter(Boolean);
    featuredGrid.replaceChildren(...recommended.map(makeGameCard));

    const genreCounts = games.reduce((counts, game) => {
      if (game.genre) counts.set(game.genre, (counts.get(game.genre) || 0) + 1);
      return counts;
    }, new Map());
    const genreButtons = [...genreCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
      .map(([genre, count]) => makeGenreButton(genre, count));
    genreDiscovery.replaceChildren(...genreButtons);

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
    featuredGrid.replaceChildren(makeElement("p", "empty-state", "Não foi possível carregar as recomendações."));
    genreDiscovery.replaceChildren(makeElement("p", "empty-state", "Não foi possível carregar os gêneros."));
    journeyGrid.replaceChildren(makeElement("p", "empty-state", "Seu progresso não pôde ser carregado agora."));
    console.error("Erro ao carregar recursos da página inicial:", error);
  }
};

initializeHome();
