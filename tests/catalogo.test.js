import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(resolve(root, "data/jogos.json"), "utf8"));
const schema = JSON.parse(await readFile(resolve(root, "data/jogo.schema.json"), "utf8"));
const htmlFiles = ["index.html", ...catalog.filter((game) => game.href.startsWith("jogos/")).map((game) => game.href)];

const normalize = (value = "") => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("pt-BR")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

test("contrato do catálogo: schema documenta todos os campos obrigatórios", () => {
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, ["id", "title", "aliases", "genre", "image", "href", "description"]);
  for (const field of schema.required) {
    assert.ok(schema.properties[field], `Campo sem definição no schema: ${field}`);
  }
});

test("catálogo: campos obrigatórios, formato e identificadores únicos", () => {
  assert.ok(catalog.length >= 8);
  const ids = catalog.map((game) => game.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const game of catalog) {
    assert.match(game.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `ID fora do padrão: ${game.id}`);
    assert.ok(game.title?.trim(), `Título ausente: ${game.id}`);
    assert.ok(game.genre?.trim(), `Gênero ausente: ${game.id}`);
    assert.ok(game.image?.startsWith("imagens/"), `Imagem deve estar em imagens/: ${game.id}`);
    assert.match(game.image, /^imagens\/.+\.(avif|gif|jpe?g|png|webp)$/i, game.id);
    assert.ok(game.href, `Destino ausente: ${game.id}`);
    assert.match(game.href, /^(jogos\/.+\.html|index\.html#[a-z0-9-]+)$/i, game.id);
    assert.ok(game.description?.trim(), `Descrição ausente: ${game.id}`);
    assert.ok(Array.isArray(game.aliases), `Aliases devem ser uma lista: ${game.id}`);
    assert.equal(
      new Set(game.aliases.map(normalize)).size,
      game.aliases.length,
      `Aliases repetidos no jogo: ${game.id}`
    );
    assert.ok(game.aliases.every((alias) => typeof alias === "string" && alias.trim()), game.id);
    assert.ok(game.description.length <= 240, `Descrição muito longa: ${game.id}`);
    for (const key of Object.keys(game)) {
      assert.ok(schema.properties[key], `Campo não documentado no schema: ${key}`);
    }
  }
});

test("catálogo: God of War Ragnarök, Sally Face e Bob Esponja permanecem na página inicial", async () => {
  const home = await readFile(resolve(root, "index.html"), "utf8");
  const expected = [
    ["god-of-war-ragnarok", "index.html#god-of-war-ragnarok", "god-of-war-ragnarok"],
    ["sally-face", "index.html#sally-face", "sally-face"],
    ["spongebob-battle-for-bikini-bottom", "index.html#bob-esponja", "bob-esponja"]
  ];

  for (const [id, href, anchor] of expected) {
    const game = catalog.find((item) => item.id === id);
    assert.ok(game, `Jogo ausente do catálogo: ${id}`);
    assert.equal(game.href, href, `Destino deve continuar na página inicial: ${id}`);
    assert.match(home, new RegExp(`\\bid=["']${anchor}["']`, "i"), `Âncora ausente: ${anchor}`);
  }
});

test("catálogo: destinos internos e imagens locais existem", () => {
  for (const game of catalog) {
    const [target, anchor] = game.href.split("#");
    if (target && !target.startsWith("http")) {
      assert.ok(existsSync(resolve(root, target)), `Destino não encontrado: ${game.href}`);
    }
    if (anchor) {
      assert.equal(target, "index.html", `Âncora interna deve apontar para a página inicial: ${game.href}`);
    }
    if (game.image.startsWith("imagens/")) {
      assert.ok(existsSync(resolve(root, game.image)), `Imagem não encontrada: ${game.image}`);
    }
  }
});

test("páginas individuais: idioma, viewport e elemento main", async () => {
  for (const game of catalog.filter((item) => item.href.startsWith("jogos/"))) {
    const html = await readFile(resolve(root, game.href), "utf8");
    assert.match(html, /<html[^>]+lang=["']pt-BR["']/i, game.href);
    assert.match(html, /name=["']viewport["'][^>]+width=device-width/i, game.href);
    assert.equal((html.match(/<main\b/gi) || []).length, 1, game.href);
  }
});

test("HTML: referências locais, textos alternativos e sem handlers inline", async () => {
  for (const file of htmlFiles) {
    const html = await readFile(resolve(root, file), "utf8");
    const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map((match) => match[1]);

    for (const ref of refs) {
      if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) continue;
      const path = ref.split(/[?#]/)[0];
      if (!path) continue;
      assert.ok(
        existsSync(resolve(root, dirname(file), path)),
        `Referência local quebrada em ${file}: ${ref}`
      );
    }

    const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    for (const image of images) {
      assert.match(image, /\balt=["'][^"']*["']/i, `Imagem sem alt em ${file}`);
    }
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `Handler inline encontrado em ${file}`);
    assert.match(html, /<main\b/i, `Elemento main ausente em ${file}`);
  }
});

test("guias individuais: painel de progresso e script compartilhado", async () => {
  for (const game of catalog.filter((item) => item.href.startsWith("jogos/"))) {
    const html = await readFile(resolve(root, game.href), "utf8");
    assert.match(html, /scripts\/progresso\.js/, game.href);
  }
  const script = await readFile(resolve(root, "scripts/progresso.js"), "utf8");
  assert.match(script, /localStorage/);
  assert.match(script, /guide-progress-checkbox/);
  assert.match(script, /Limpar progresso/);
  assert.match(script, /Navegar pelas etapas deste guia/);
});


test("modelo oficial de guia: contém as seções e integrações obrigatórias", async () => {
  const template = await readFile(resolve(root, "templates/guia-jogo.html"), "utf8");
  const styles = await readFile(resolve(root, "styles/guide-template.css"), "utf8");
  for (const id of ["informacoes-gerais", "trofeus", "etapas", "perdiveis", "colecionaveis"]) {
    assert.match(template, new RegExp(`id=["']${id}["']`), `Seção ausente no modelo: ${id}`);
  }
  assert.match(template, /scripts\/progresso\.js/);
  assert.match(template, /guide-hero/);
  assert.match(template, /guide-trophy-groups/);
  assert.match(template, /guide-warning/);
  assert.match(styles, /\.guide-section/);
  assert.match(styles, /@media/);
});


test("biblioteca: paginação, ordenação e filtros possuem controles acessíveis", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const script = await readFile(resolve(root, "scripts/pesquisa.js"), "utf8");
  const styles = await readFile(resolve(root, "style.css"), "utf8");
  for (const id of ["sort-filter", "page-size-filter", "pagination"]) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Controle ausente: ${id}`);
  }
  assert.match(html, /aria-label="Paginação da biblioteca"/);
  assert.match(script, /filteredGames\.slice\(start, start \+ pageSize\)/);
  assert.match(script, /matchesQuery/);
  assert.match(script, /matchesGenre/);
  assert.match(script, /localeCompare/);
  assert.match(script, /sort !== "catalog"/);
  assert.match(styles, /\.pagination-button/);
});

test("página inicial: destaques e retomada de progresso", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const script = await readFile(resolve(root, "scripts/home.js"), "utf8");
  assert.match(html, /id="featured-grid"/);
  assert.match(html, /id="journey-grid"/);
  assert.match(script, /recommendedIds/);
  assert.match(script, /readProgress/);
});

test("página inicial: recomendações editoriais e filtros por gênero", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const script = await readFile(resolve(root, "scripts/home.js"), "utf8");
  assert.match(html, /id="featured-grid"/);
  assert.match(html, /id="genre-discovery"/);
  assert.match(script, /recommendedIds/);
  assert.match(script, /makeGenreButton/);
  assert.match(script, /dispatchEvent\(new Event\("change"/);
});

test("página inicial: formulário de sugestões com configuração externa", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const script = await readFile(resolve(root, "scripts/sugestoes.js"), "utf8");
  assert.match(html, /id="suggestion-form"/);
  assert.match(html, /name="jogo"[^>]+required/);
  assert.match(html, /name="_gotcha"/);
  assert.match(html, /data-formspree-id="[a-z0-9]+"/);
  assert.match(script, /https:\/\/formspree\.io\/f\//);
  assert.match(script, /response\.ok/);
  assert.match(script, /submitButton\.disabled = true/);
});
