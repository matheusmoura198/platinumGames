const grid = document.querySelector("#game-grid");
const form = document.querySelector("#search-form");
const searchInput = document.querySelector("#campoPesquisa");
const genreFilter = document.querySelector("#genre-filter");
const sortFilter = document.querySelector("#sort-filter");
const pageSizeFilter = document.querySelector("#page-size-filter");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const clearButton = document.querySelector("#clear-search");
const pagination = document.querySelector("#pagination");

const normalize = (value = "") => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
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

const createPageButton = (page, currentPage, label = String(page)) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pagination-button";
  button.textContent = label;
  button.disabled = page === currentPage;
  if (page === currentPage) button.setAttribute("aria-current", "page");
  button.setAttribute("aria-label", label === String(page) ? `Página ${page}` : label);
  button.addEventListener("click", () => {
    currentPage = page;
    renderPage();
    pagination.querySelector('[aria-current="page"]')?.focus();
  });
  return button;
};

let allGames = [];
let filteredGames = [];
let currentPage = 1;

const renderPagination = (totalPages) => {
  pagination.replaceChildren();
  if (totalPages <= 1) {
    pagination.hidden = true;
    return;
  }

  pagination.hidden = false;
  const previous = createPageButton(Math.max(1, currentPage - 1), currentPage, "Anterior");
  previous.disabled = currentPage === 1;
  previous.setAttribute("aria-label", "Página anterior");
  pagination.append(previous);

  const firstPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const lastPage = Math.min(totalPages, firstPage + 4);

  if (firstPage > 1) {
    pagination.append(createPageButton(1, currentPage));
    if (firstPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "…";
      pagination.append(ellipsis);
    }
  }

  for (let page = firstPage; page <= lastPage; page += 1) {
    pagination.append(createPageButton(page, currentPage));
  }

  if (lastPage < totalPages) {
    if (lastPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "…";
      pagination.append(ellipsis);
    }
    pagination.append(createPageButton(totalPages, currentPage));
  }

  const next = createPageButton(Math.min(totalPages, currentPage + 1), currentPage, "Próxima");
  next.disabled = currentPage === totalPages;
  next.setAttribute("aria-label", "Próxima página");
  pagination.append(next);
};

const renderPage = () => {
  const pageSize = Number(pageSizeFilter.value) || 8;
  const total = filteredGames.length;
  const totalPages = Math.ceil(total / pageSize);
  currentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const start = (currentPage - 1) * pageSize;
  const visibleGames = filteredGames.slice(start, start + pageSize);

  grid.replaceChildren(...visibleGames.map(createCard));
  emptyState.hidden = total !== 0;
  if (total === 0) {
    resultsCount.textContent = "Nenhum jogo encontrado";
  } else {
    const first = start + 1;
    const last = Math.min(start + pageSize, total);
    resultsCount.textContent = `Exibindo ${first}–${last} de ${total} ${total === 1 ? "jogo" : "jogos"}`;
  }
  renderPagination(totalPages);
};

const applyFilters = (resetPage = true) => {
  const query = normalize(searchInput.value);
  const genre = genreFilter.value;
  const sort = sortFilter.value;

  filteredGames = allGames.filter((game) => {
    const searchable = normalize([game.title, game.genre, ...(game.aliases || [])].join(" "));
    const matchesQuery = !query || searchable.includes(query);
    const matchesGenre = !genre || game.genre === genre;
    return matchesQuery && matchesGenre;
  });

  filteredGames.sort((a, b) => {
    const comparison = a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
    return sort === "za" ? -comparison : comparison;
  });

  if (resetPage) currentPage = 1;
  renderPage();
};

const initialize = async () => {
  try {
    const response = await fetch(new URL("../data/jogos.json", import.meta.url));
    if (!response.ok) throw new Error(`Falha ao carregar catálogo: HTTP ${response.status}`);

    const games = await response.json();
    if (!Array.isArray(games)) throw new TypeError("O catálogo precisa ser uma lista de jogos.");
    allGames = games;

    const genres = [...new Set(games.map((game) => game.genre).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));

    for (const genre of genres) {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      genreFilter.append(option);
    }

    form.addEventListener("submit", (event) => event.preventDefault());
    searchInput.addEventListener("input", () => applyFilters());
    genreFilter.addEventListener("change", () => applyFilters());
    sortFilter.addEventListener("change", () => applyFilters());
    pageSizeFilter.addEventListener("change", () => applyFilters());
    clearButton.addEventListener("click", () => {
      searchInput.value = "";
      genreFilter.value = "";
      sortFilter.value = "az";
      pageSizeFilter.value = "8";
      applyFilters();
      searchInput.focus();
    });

    applyFilters();
  } catch (error) {
    resultsCount.textContent = "Não foi possível carregar os jogos.";
    emptyState.hidden = false;
    emptyState.textContent = "O catálogo não pôde ser carregado. Atualize a página ou tente novamente mais tarde.";
    pagination.hidden = true;
    console.error("Erro ao inicializar o catálogo PlatinumGames:", error);
  }
};

initialize();
