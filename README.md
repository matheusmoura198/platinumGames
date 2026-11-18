# PlatinumGames

O **PlatinumGames** reúne informações e guias para ajudar jogadores a planejar suas conquistas e completar seus jogos favoritos.

## Funcionalidades

- Biblioteca de jogos alimentada por um catálogo JSON.
- Pesquisa por nome, apelidos e gênero, com normalização de acentos e diferenças de maiúsculas/minúsculas.
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

- A branch `main` não deve receber alterações diretamente durante a evolução desta refatoração.
- Mudanças devem ser feitas em branches de trabalho e revisadas antes de integrar.
- Os guias existentes devem ser preservados ao reorganizar páginas e componentes.
- Não adicionar frameworks ou serviços externos sem uma necessidade concreta.
- Imagens devem ser otimizadas e utilizadas respeitando direitos e licenças aplicáveis.
