const grid = document.querySelector("#game-grid");
const form = document.querySelector("#search-form");
const searchInput = document.querySelector("#campoPesquisa");
const genreFilter = document.querySelector("#genre-filter");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const clearButton = document.querySelector("#clear-search");

const normalize = (value = "") => value
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLocaleLowerCase("pt-BR")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const createCard = (game) => {
  const article = document.createElement("article");
  article.className = "game-card";

  const link = document.createElement("a");
  link.className = "game-card-link";
  link.href = game.href;
  link.setAttribute("aria-label", `Abrir guia de ${game.title}`);

  const image = document.createElement("img");
  image.src = game.image;
  image.alt = `Arte de ${game.title}`;
  image.width = 640;
  image.height = 400;
  image.loading = "lazy";
  image.decoding = "async";

  const content = document.createElement("div");
  content.className = "game-card-content";

  const genre = document.createElement("span");
  genre.className = "game-genre";
  genre.textContent = game.genre;

  const title = document.createElement("h3");
  title.textContent = game.title;

  const description = document.createElement("p");
  description.textContent = game.description;

  const action = document.createElement("span");
  action.className = "card-action";
  action.textContent = "Ver guia →";

  content.append(genre, title, description, action);
  link.append(image, content);
  article.append(link);
  return article;
};

const render = (games) => {
  grid.replaceChildren(...games.map(createCard));
  resultsCount.textContent = games.length === 1
    ? "1 jogo encontrado"
    : `${games.length} jogos encontrados`;
  emptyState.hidden = games.length !== 0;
};

const applyFilters = (games) => {
  const query = normalize(searchInput.value);
  const genre = genreFilter.value;

  const filtered = games.filter((game) => {
    const searchable = normalize([
      game.title,
      game.genre,
      ...(game.aliases || [])
    ].join(" "));
    const matchesQuery = !query || searchable.includes(query);
    const matchesGenre = !genre || game.genre === genre;
    return matchesQuery && matchesGenre;
  });

  render(filtered);
};

const initialize = async () => {
  try {
    const response = await fetch(new URL("../data/jogos.json", import.meta.url));
    if (!response.ok) throw new Error(`Falha ao carregar catálogo: HTTP ${response.status}`);

    const games = await response.json();
    if (!Array.isArray(games)) throw new TypeError("O catálogo precisa ser uma lista de jogos.");

    const genres = [...new Set(games.map((game) => game.genre).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    for (const genre of genres) {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      genreFilter.append(option);
    }

    form.addEventListener("submit", (event) => event.preventDefault());
    searchInput.addEventListener("input", () => applyFilters(games));
    genreFilter.addEventListener("change", () => applyFilters(games));
    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      genreFilter.value = "";
      applyFilters(games);
      searchInput.focus();
    });

    applyFilters(games);
  } catch (error) {
    resultsCount.textContent = "Não foi possível carregar os jogos.";
    emptyState.hidden = false;
    emptyState.textContent = "O catálogo não pôde ser carregado. Atualize a página ou tente novamente mais tarde.";
    console.error("Erro ao inicializar o catálogo PlatinumGames:", error);
  }
};

initialize();
