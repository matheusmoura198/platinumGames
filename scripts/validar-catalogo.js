import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const report = (message) => errors.push(message);
const normalize = (value = "") => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("pt-BR")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

async function readProjectFile(path) {
  try {
    return await readFile(resolve(root, path), "utf8");
  } catch {
    report(`Arquivo obrigatório não encontrado ou ilegível: ${path}`);
    return "";
  }
}

async function existsInsideProject(path) {
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  if (rel.startsWith(".." + sep) || rel === "..") return false;
  try {
    await access(absolute, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const [catalogText, schemaText, home] = await Promise.all([
  readProjectFile("data/jogos.json"),
  readProjectFile("data/jogo.schema.json"),
  readProjectFile("index.html")
]);

let catalog = [];
let schema = {};
try { catalog = JSON.parse(catalogText); } catch { report("data/jogos.json contém JSON inválido."); }
try { schema = JSON.parse(schemaText); } catch { report("data/jogo.schema.json contém JSON inválido."); }

const required = ["id", "title", "aliases", "genre", "image", "href", "description"];
if (!Array.isArray(catalog)) report("O catálogo precisa ser uma lista JSON.");
if (schema.type !== "object" || schema.additionalProperties !== false) report("Schema deve definir um objeto e bloquear propriedades extras.");
if (JSON.stringify(schema.required) !== JSON.stringify(required)) report("Os campos obrigatórios do schema não correspondem ao contrato oficial.");
for (const field of required) {
  if (!schema.properties?.[field]) report(`Campo ausente no schema: ${field}`);
}

const ids = new Set();
const homepageGames = [
  ["god-of-war-ragnarok", "index.html#god-of-war-ragnarok", "god-of-war-ragnarok"],
  ["sally-face", "index.html#sally-face", "sally-face"],
  ["spongebob-battle-for-bikini-bottom", "index.html#bob-esponja", "bob-esponja"]
];

for (const [index, game] of (Array.isArray(catalog) ? catalog : []).entries()) {
  const label = game?.id || `registro ${index + 1}`;
  if (!game || typeof game !== "object" || Array.isArray(game)) {
    report(`Registro inválido no índice ${index}.`);
    continue;
  }

  const keys = Object.keys(game);
  for (const field of required) if (!(field in game)) report(`${label}: campo obrigatório ausente: ${field}`);
  for (const field of keys) if (!required.includes(field)) report(`${label}: campo não permitido: ${field}`);

  if (typeof game.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id)) report(`${label}: ID deve estar em kebab-case.`);
  if (ids.has(game.id)) report(`ID duplicado: ${game.id}`);
  ids.add(game.id);

  for (const field of ["title", "genre", "description"]) {
    if (typeof game[field] !== "string" || !game[field].trim()) report(`${label}: ${field} deve ser um texto não vazio.`);
  }
  if (typeof game.description === "string" && game.description.length > 240) report(`${label}: descrição ultrapassa 240 caracteres.`);

  if (!Array.isArray(game.aliases)) {
    report(`${label}: aliases deve ser uma lista.`);
  } else {
    const aliases = game.aliases.map(normalize);
    if (game.aliases.some((alias) => typeof alias !== "string" || !alias.trim())) report(`${label}: há alias vazio ou inválido.`);
    if (new Set(aliases).size !== aliases.length) report(`${label}: há aliases repetidos após normalização.`);
  }

  if (typeof game.image !== "string" || !/^imagens\/[^?#]+\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(game.image)) {
    report(`${label}: imagem deve ser um caminho local válido dentro de imagens/.`);
  } else if (!(await existsInsideProject(game.image))) {
    report(`${label}: arquivo de capa não encontrado: ${game.image}`);
  }

  if (typeof game.href !== "string" || !/^(?:jogos\/[^?#]+\.html|index\.html#[a-z0-9-]+)$/i.test(game.href)) {
    report(`${label}: destino deve ser jogos/arquivo.html ou uma âncora de index.html.`);
  } else {
    const [target, anchor] = game.href.split("#");
    if (!(await existsInsideProject(target))) {
      report(`${label}: página de destino não encontrada: ${target}`);
    } else if (anchor) {
      const html = target === "index.html" ? home : await readProjectFile(target);
      const anchorMatches = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
      if (!anchorMatches.includes(anchor)) report(`${label}: âncora não encontrada em ${target}: #${anchor}`);
    }
  }
}

for (const [id, href, anchor] of homepageGames) {
  const game = Array.isArray(catalog) ? catalog.find((item) => item?.id === id) : null;
  if (!game) report(`Jogo que deve permanecer na página inicial foi removido: ${id}`);
  else if (game.href !== href) report(`${id}: o destino deve permanecer em ${href}.`);
  const anchors = [...home.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  if (!anchors.includes(anchor)) report(`Âncora obrigatória ausente na página inicial: #${anchor}`);
}

const homeIds = [...home.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
const duplicateHomeIds = homeIds.filter((id, index) => homeIds.indexOf(id) !== index);
for (const id of new Set(duplicateHomeIds)) report(`ID HTML duplicado em index.html: ${id}`);

if (errors.length) {
  console.error("\nFalha na validação do catálogo PlatinumGames:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Catálogo validado: ${catalog.length} jogos, IDs únicos, capas e destinos existentes, âncoras válidas e contrato respeitado.`);
}
