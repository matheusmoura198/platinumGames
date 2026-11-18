import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(resolve(root, "data/jogos.json"), "utf8"));
const htmlFiles = ["index.html", ...catalog.filter((game) => game.href.startsWith("jogos/")).map((game) => game.href)];

test("catálogo: campos obrigatórios e identificadores únicos", () => {
  assert.ok(catalog.length >= 8);
  const ids = catalog.map((game) => game.id);
  assert.equal(new Set(ids).size, ids.length);

  for (const game of catalog) {
    assert.ok(game.title);
    assert.ok(game.genre);
    assert.ok(game.image);
    assert.ok(game.href);
    assert.ok(Array.isArray(game.aliases));
  }
});

test("catálogo: destinos internos e imagens locais existem", () => {
  for (const game of catalog) {
    const [target] = game.href.split("#");
    if (target && !target.startsWith("http")) {
      assert.ok(existsSync(resolve(root, target)), `Destino não encontrado: ${game.href}`);
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

test("página inicial: destaques e retomada de progresso", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const script = await readFile(resolve(root, "scripts/home.js"), "utf8");
  assert.match(html, /id="featured-grid"/);
  assert.match(html, /id="journey-grid"/);
  assert.match(script, /featuredIds/);
  assert.match(script, /readProgress/);
});
