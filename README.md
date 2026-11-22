# PlatinumGames

O **PlatinumGames** reúne informações e guias para ajudar jogadores a planejar suas conquistas e completar seus jogos favoritos.

## Funcionalidades

- Biblioteca de jogos alimentada por um catálogo JSON.
- Pesquisa por nome, apelidos e gênero, com normalização de acentos e diferenças de maiúsculas/minúsculas.
- Paginação da biblioteca, com 8, 12 ou 24 jogos por página.
- Ordenação alfabética crescente ou decrescente, combinada com os filtros.
- Cards com links para os guias.
- Recomendações editoriais e descoberta de jogos por gênero.
- Formulário de sugestões de jogos com envio pelo Formspree (após configuração do identificador do formulário).
- Acompanhamento de objetivos com caixas de seleção em cada guia.
- Salvamento local do progresso por jogo e painel para continuar a jornada na página inicial.
- Páginas individuais com navegação compartilhada.
- Guias históricos preservados durante a refatoração.
- Layout responsivo para telas grandes e pequenas.
- Verificações automatizadas do catálogo, dos arquivos locais e da estrutura básica das páginas.

## Tecnologias

- HTML5 semântico.
- CSS3 com estilos globais e uma folha separada para os estilos históricos dos guias.
- JavaScript ES modules.
- JSON para os dados do catálogo.
- Node.js (somente para executar os testes automatizados).

Não há backend próprio, banco de dados ou dependência de framework nesta etapa. O formulário de sugestões utiliza o serviço externo Formspree para processar e encaminhar mensagens.

## Configurar o recebimento de sugestões

O formulário da página inicial usa o Formspree. Para ativar o envio:

1. Crie uma conta em [formspree.io](https://formspree.io/) e cadastre um novo formulário.
2. Configure como destinatário o endereço de e-mail que deseja receber as sugestões e conclua a verificação solicitada pelo serviço.
3. Copie o identificador do formulário fornecido pelo Formspree.
4. No arquivo `index.html`, localize o formulário `#suggestion-form` e substitua o valor `SEU_ID_FORMSPREE` do atributo `data-formspree-id` pelo identificador real.
5. Publique a alteração e faça um envio de teste pelo site.

O identificador do formulário é público e pode ficar no HTML; a configuração do destinatário e a verificação do e-mail são gerenciadas no painel do Formspree. Não coloque senhas ou chaves privadas no repositório. Enquanto o identificador não for configurado, o formulário informa que o envio ainda não está ativado.

## Executar localmente

Como o catálogo é carregado por `fetch()`, abra o projeto por um servidor HTTP local, e não diretamente por `file://`.

Com Python:

```bash
python -m http.server 8000
```

Depois, acesse:

```text
http://localhost:8000
```

Também é possível utilizar a extensão Live Server do Visual Studio Code.

## Testes

É necessário ter Node.js instalado. Execute na raiz do projeto:

```bash
npm test
```

Os testes verificam:

- Estrutura mínima e identificadores únicos do catálogo.
- Existência dos destinos internos e imagens locais cadastrados.
- Idioma, viewport e elemento principal das páginas individuais.
- Referências locais de imagens, folhas de estilo e scripts.
- Textos alternativos e ausência de manipuladores JavaScript inline.

A suíte automatizada não substitui testes visuais em navegadores reais. A validação final de layout em diferentes celulares, tablets e computadores ainda deve ser feita manualmente ou com testes de navegador.

## Organização

```text
platinumGames/
├── data/
│   └── jogos.json
├── imagens/
├── jogos/
│   └── páginas individuais dos jogos
├── scripts/
│   └── pesquisa.js
├── styles/
│   └── legacy-guides.css
├── tests/
│   └── catalogo.test.js
├── index.html
├── style.css
└── package.json
```

### Dados dos jogos

O arquivo `data/jogos.json` é a fonte central do catálogo. Cada registro contém:

- `id`: identificador único.
- `title`: nome apresentado.
- `aliases`: termos alternativos para pesquisa.
- `genre`: categoria usada no filtro.
- `image`: caminho da imagem.
- `href`: destino do guia.
- `description`: resumo exibido no card.

O progresso é armazenado somente no `localStorage` do navegador e não é sincronizado entre dispositivos. Limpar os dados do navegador pode apagar esse progresso.

Ao adicionar um jogo, atualize o JSON e confira se o destino e a imagem existem.

## Decisões de manutenção

- Prefira branches de trabalho e Pull Requests para mudanças relevantes; alterações diretas na `main` devem ocorrer somente quando explicitamente autorizadas.
- Os guias existentes devem ser preservados ao reorganizar páginas e componentes.
- Não adicionar frameworks ou serviços externos sem uma necessidade concreta.
- Imagens devem ser otimizadas e utilizadas respeitando direitos e licenças aplicáveis.


## Padrão oficial de cadastro de jogos

O catálogo é **manual**: cada novo título deve ser revisado e adicionado pela equipe em `data/jogos.json`. Não há importação automática de uma API externa.

O contrato de cada registro está documentado em `data/jogo.schema.json`. Os sete campos obrigatórios são:

| Campo | Regra |
| --- | --- |
| `id` | Identificador único em `kebab-case`, estável mesmo se o título mudar. |
| `title` | Nome do jogo apresentado no site. |
| `aliases` | Lista de nomes alternativos para a pesquisa; não repetir termos no mesmo jogo. |
| `genre` | Gênero principal, escrito de forma consistente com os demais registros. |
| `image` | Caminho relativo para uma capa existente dentro de `imagens/`. |
| `href` | Caminho para um guia em `jogos/*.html` ou para uma seção de guia existente em `index.html#...`. |
| `description` | Resumo curto para os cards, com até 240 caracteres. |

### Regras de cadastro

1. Não reutilize o `id` de outro jogo e não o altere depois que o jogo já tiver progresso salvo pelos visitantes.
2. Use nomes oficiais, acentuação correta e aliases úteis para variações de busca.
3. Adicione a capa ao repositório antes de referenciá-la no JSON; prefira nomes de arquivo claros e sem espaços. Enquanto a capa definitiva não estiver disponível, use `imagens/capa-pendente.svg` e substitua o caminho no catálogo e no guia quando enviar a imagem.
4. Não invente dados ausentes. Informações adicionais só devem ser incluídas quando forem confirmadas e o contrato for atualizado.
5. Todo registro deve levar a um guia acessível: uma página individual ou uma seção de guia na página inicial.
6. O cadastro é manual e editorial. Uma sugestão enviada por visitante não entra automaticamente no catálogo.

### Jogos que permanecem na página inicial

God of War Ragnarök, Sally Face e Bob Esponja: Batalha pela Fenda do Biquíni permanecem na página inicial, com seus guias nas respectivas âncoras. Eles não devem ser movidos para páginas individuais sem uma decisão posterior.

### Exemplo de registro

```json
{
  "id": "nome-do-jogo",
  "title": "Nome do Jogo",
  "aliases": ["nome alternativo"],
  "genre": "Ação e aventura",
  "image": "imagens/nome-do-jogo.jpg",
  "href": "jogos/nome-do-jogo.html",
  "description": "Resumo objetivo do jogo para apresentar no catálogo."
}
```

Antes de concluir qualquer lote, execute `npm test` e confira visualmente a capa, o card, o destino do guia e a pesquisa na página inicial.


## Padrão oficial das páginas de guias

O modelo reutilizável está em `templates/guia-jogo.html`, e seus estilos compartilhados em `styles/guide-template.css`. Para criar uma página individual, copie o modelo para `jogos/`, substitua os campos editoriais e mantenha a identidade visual e a navegação do site.

Toda página individual deve seguir esta sequência:

1. **Cabeçalho e apresentação do jogo:** nome, capa local válida e resumo introdutório.
2. **Informações gerais e dificuldade:** dificuldade, tempo estimado, total de troféus, jogadores, perdíveis e edição/plataforma. Só preencher dados verificados; quando não houver confirmação, informar isso claramente.
3. **Organização dos troféus:** separar Bronze, Prata, Ouro e Platina, com nome, objetivo e orientação de cada conquista quando disponível.
4. **Etapas da conquista:** apresentar uma ordem recomendada, dividida em etapas claras, com objetivos que possam ser acompanhados no painel.
5. **Avisos sobre troféus perdíveis:** destacar o que pode ser perdido, em que momento e como evitar; declarar que não há perdíveis somente quando isso estiver confirmado.
6. **Colecionáveis e objetivos secundários:** organizar por região, capítulo, categoria ou sequência útil.
7. **Painel de progresso:** manter o script compartilhado `scripts/progresso.js`, que cria caixas de seleção, salva o andamento no navegador e permite limpar o progresso.
8. **Navegação entre seções:** manter títulos de seção em `h2`; o script compartilhado cria um índice navegável a partir deles.

### Regras editoriais e técnicas dos guias

- Preserve o conteúdo útil já existente ao atualizar guias antigos; não descarte etapas, dicas ou listas específicas.
- Não invente dificuldade, duração, quantidade de troféus, perdíveis, rotas ou requisitos.
- Use imagens locais do repositório sempre que possível, com texto alternativo descritivo.
- Cada objetivo que deva ser acompanhado deve ficar em um item de lista (`li`), pois o painel de progresso transforma esses itens em caixas de seleção.
- Mantenha os identificadores das seções únicos e os links de navegação funcionais.
- Teste em computador e celular. Os guias legados permanecem preservados; a migração deles para o modelo compartilhado deve ser feita sem perda de conteúdo.


### Validação automatizada do catálogo

O comando `npm run validate:catalogo` verifica o contrato dos registros, IDs únicos, aliases repetidos, capas locais existentes, páginas de destino, âncoras válidas e a preservação dos três guias que permanecem na página inicial. Ele também identifica IDs duplicados no HTML principal. O comando `npm test` executa a suíte de testes e essa validação automaticamente; o GitHub Actions executa o mesmo comando a cada atualização da branch principal.
\n\n## Padrão de qualidade para novos guias (fase 3)\n\n- Cada guia deve identificar o escopo (platina/troféus), plataforma/versão quando verificadas e data de revisão.\n- Objetivos novos devem usar IDs estáveis; evitar usar apenas o texto exibido como identidade do item.\n- Dados de rastreadores devem ser separados do comportamento e do CSS.\n- Cada módulo deve incluir pesquisa/filtros somente quando úteis, estado persistido e reset explícito, com confirmação.\n- Usar `textContent` e criação de elementos para conteúdo dinâmico; não interpolar dados não confiáveis em `innerHTML`.\n- Explicitar incompletude, fontes e requisitos ainda não verificados; não chamar listas parciais de definitivas.\n- Validar arquivos, JSON, IDs únicos, integração HTML e testes automatizados antes de publicar.\n- Confirmar acessibilidade: labels, teclado, foco, estado de progresso, contraste e mobile.\n- Evitar módulos genéricos sem necessidade; cada jogo recebe rastreadores específicos para sua platina.\n