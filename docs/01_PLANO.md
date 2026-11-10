# DeSol — Plano do site storytelling 3D

Versão de 09/11/2026 · autor: Pedro (com Claude). Doc vivo: https://claude.ai/artifact/BdRwn8KkTaBnumeNcrg2Bn

## 1. Visão e objetivo

O site conta a história do DeSol como um diorama 3D que se monta enquanto a pessoa rola: do problema da água salobra até o sistema premiado. Não é um painel nem um artigo: é uma vitrine que faz o visitante entender o projeto em 90 segundos e querer falar com a equipe.

| Público | O que precisa sair sabendo | Ação esperada |
| --- | --- | --- |
| Bancas e avaliadores (MECTI, feiras, editais) | O problema, a solução e o que já foi validado vs. o que é hipótese | Lembrar do projeto, pedir material técnico |
| Investidores e parceiros (futuro CNPJ) | Diferencial, estágio real, próximos marcos | Entrar em contato |
| Comunidade, imprensa, Senac | A trajetória e os prêmios | Compartilhar |

**Como deve se sentir:** ensolarado, otimista e tátil — um brinquedo de engenharia, não um relatório. O amarelo do logo é o sol; a água é o personagem principal.

**Princípio de honestidade:** o dossiê do projeto separa CONFIRMADO, PROJETADO, ESTIMADO e PENDENTE. O site segue essa regra: prêmios e eventos são afirmados; vazão, eficiência e potabilidade aparecem como meta ou hipótese, com selo visual próprio.

## 2. Direção de arte

Linguagem: **"diorama isométrico ensolarado sobre fundo escuro"** — o 3D estilizado e colorido da referência em vídeo (cidade em blocos arredondados, cards de vidro fosco sobre a cena, navegação lateral por pontos), com a segurança tipográfica do preto/amarelo que o DeSol já usa nas apresentações.

| Referência | Pegar | Evitar |
| --- | --- | --- |
| Vídeo (diorama isométrico, `referencias/`) | Mundo em miniatura, volumes arredondados, peças que se movem sozinhas (bicicletas, drones), cards de vidro fosco por cima, nav por pontos à direita | Paleta pastel lavada; excesso de detalhe que tira o foco do produto |
| Refero — Cinematic hardware / Apple | Produto como herói, muito respiro, um elemento por tela | Branco total sem personalidade |
| Refero — Linear / Auros | Seção técnica escura, precisa, "instrumento" (capítulo do sistema digital) | Monocromático frio no site inteiro |
| Refero — Acid lime accent / Duolingo | Coragem de cor: um acento saturado, formas cheias | Tom infantil, mascote |
| Refero — AI for Business (brutalist editorial) | Números gigantes, tipografia grossa nos marcos e prêmios | Grid quebrado demais |

### Paleta (ver `design/tokens.css`)

| Token | Cor | Uso |
| --- | --- | --- |
| `sun` | #FFF23F | Acento único, CTA, números-chave, o sol 3D |
| `ink` | #0E0F0C | Fundo das seções escuras, texto em fundo claro |
| `paper` | #F5F1E6 | Fundo das seções claras (quente, não branco puro) |
| `water` | #1EC8E6 | Água doce, condensado, dados "bons" |
| `brine` | #FF5A36 | Sal, salmoura, calor, problema |
| `leaf` | #2FBF71 | Comunidade, impacto, vegetação |
| `glass` | branco 8–12% + blur 20px | Cards sobre a cena |

Regra: no máximo duas cores vibrantes por tela além de `sun`. A história de cor é **"laranja vira azul"** (sal → água doce).

### Tipografia
- Títulos: **Unbounded** (700–800). Caixa alta só em rótulos curtos.
- Texto: **Inter Tight**, 18px no corpo, 1.55 de entrelinha.
- Dados e selos: **JetBrains Mono**.

### Proibido
- Gradiente em texto, roxo-azul genérico, neon em tudo.
- Poppins, Montserrat, ícones lucide genéricos em cards de três colunas.
- "elevate", "revolucionário", "o futuro da água", "solução inovadora".
- Fotos de banco de imagem.
- Animação que não explica nada: cada movimento mostra calor, vapor, gota ou dado.

## 3. Narrativa — capítulos

Arco: dor → dados → solução → diferencial → impacto, contado como **a viagem de uma gota**. Texto completo em `02_HISTORIA.md`.

| # | Capítulo | Frase-guia |
| --- | --- | --- |
| 0 | Abertura | "O sol tira o sal da água." |
| 1 | O problema | "Ter água não é o mesmo que poder beber." |
| 2 | A origem | "De uma pesquisa de mestrado para uma sala de aula." |
| 3 | Como funciona | "Aquece, evapora, condensa, coleta." |
| 4 | Por dentro do módulo | "Cada camada tem um trabalho." |
| 5 | O sistema digital | "Não é um painel bonito: é a prova." |
| 6 | A trajetória | "De Cuiabá para o pódio." |
| 7 | O próximo capítulo | "Agora, medir." |
| 8 | Equipe e contato | "Quer ver isso funcionando no seu território?" |

O capítulo 7 existe porque a rejeição do artigo na SEMATEC pediu evidência experimental: mostrar o plano de validação transforma a lacuna em credibilidade.

## 4. Experiência 3D e animações

Uma única cena 3D fixa ao fundo (canvas `position: sticky` / fixed) e uma câmera que viaja conforme o scroll. Os textos sobem em cards de vidro por cima.

**O mundo:** uma ilha isométrica de cerrado mato-grossense — casinhas, poço salobro, caixa d'água, árvores arredondadas, estrada sinuosa — com o módulo DeSol idealizado no centro. Low-poly suave, cantos arredondados (bevel), sombras macias, sol amarelo como luz principal. Fundo `ink`.

| Cap. | Câmera e cena | Movimento-assinatura | Interação |
| --- | --- | --- | --- |
| 0 Abertura | Close no logo; o "O" sobe e vira o sol; câmera recua e revela a ilha | God rays leves varrem a cena | Cursor move levemente o sol e a paralaxe |
| 1 Problema | Zoom no poço; água com partículas de sal cor `brine` | Cristais de sal giram em suspensão | Hover em cristal mostra o que representa (sal, distância, custo) |
| 2 Origem | Ilha em miniatura sobre mesa de laboratório, rascunhos ao redor | Três papéis (PingoSolar, Conecta Água, DeSol) se dobram em sequência | — |
| 3 Como funciona | Câmera entra no módulo, corte lateral | Scrub do ciclo: água laranja aquece → vapor sobe → gota forma no vidro → escorre ciano até a calha | Scroll controla o tempo do ciclo (avança e volta) |
| 4 Por dentro | Módulo explode em camadas no ar | Camadas se separam com mola suave e ganham rótulo | Clique na camada mostra especificação + selo |
| 5 Digital | Sensores acendem; linhas de dados viajam até um tablet flutuante | Pulso ESP32 → nuvem → painel | Prévia do app no tablet, selo DEMO |
| 6 Trajetória | Câmera percorre a estrada com placas por marco | Troféu e medalha 3D surgem nos marcos premiados | Números contam até o valor (3º, R$ 3.000) |
| 7 Próximo | Ilha se multiplica em quatro módulos; comunidades ao longe | Gotas enchem uma caixa d'água até a meta | Barra da meta com selo ESTIMADO |
| 8 Equipe | Câmera sobe ao pôr do sol, vista aérea | Sol se põe e vira o logo (fecha o ciclo) | Contato e links |

Polimento: cursor-gota (ciano sobre água, laranja sobre sal) · nav lateral por pontos com nome no hover · split text por linha · som opcional desligado por padrão · `prefers-reduced-motion` = cortes secos + posters estáticos.

## 5. Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js (App Router, `output: 'export'`) + TypeScript |
| 3D | three.js via @react-three/fiber + @react-three/drei |
| Scroll/animação | GSAP + ScrollTrigger + Lenis |
| Efeitos | @react-three/postprocessing (bloom leve, SMAA) + shaders próprios de vapor e gota |
| Estilo | Tailwind com os tokens de `design/` |
| Modelagem | Blender via MCP Higgsfield (ver `04_BLENDER_3D.md`) |
| Deploy | Vercel (quando o usuário pedir) |

Regras: GLB com Draco + KTX2 · módulo ≤ 3 MB, ilha ≤ 4 MB · animações de explosão e câmera no código (GSAP), não no Blender · luz assada na ilha, dinâmica só no módulo.

## 6. Performance e acessibilidade

| Meta | Alvo |
| --- | --- |
| Primeira pintura com título + poster | < 1,5 s em 4G |
| Peso inicial (HTML, CSS, JS crítico, poster) | < 400 KB |
| Total 3D sob demanda | < 8 MB |
| FPS | 60 notebook comum / 30+ celular intermediário |
| Lighthouse mobile | Performance ≥ 85, Acessibilidade ≥ 95 |

- Poster estático aparece na hora; canvas carrega depois; modelos de cada capítulo baixam quando o anterior entra na tela.
- Celular: cena simplificada, sem pós-processamento, `dpr` máx. 1,5; ciclo do cap. 3 vira 4 quadros ilustrados.
- Sem WebGL: imagens e vídeos curtos (< 1 MB cada).
- Contraste AA: amarelo só sobre `ink`, nunca texto amarelo sobre `paper`. Navegação por teclado entre capítulos.
- SEO: título, descrição, Open Graph com o diorama, JSON-LD de organização/projeto.

## 7. Fases e checkpoints

| Fase | Entrega | Checkpoint |
| --- | --- | --- |
| 0 Fundação | Next.js, tokens, Lenis + GSAP, 9 capítulos em HTML sem 3D | A história se lê inteira no celular, sem 3D |
| 2 Cena e câmera | Cena R3F fixa (com placeholders), câmera por capítulo, cards de vidro, nav por pontos, poster | 60 fps no notebook, scroll sem travadas |
| 3 Momentos-assinatura | Shader de vapor e gota, scrub do ciclo, vista explodida, sensores → tablet, contadores | Revisão independente das animações |
| 4 Polimento | Mobile, reduced motion, fallbacks, SEO/OG | Lighthouse 85+/95+ |
| 1 Modelagem 3D (**logo após a página**) | Ilha + módulo no Blender, camadas separadas, GLB Draco+KTX2, troca dos placeholders | Módulo ≤ 3 MB, ilha ≤ 4 MB, render aprovado |

Observação: a ordem foi ajustada a pedido do usuário — a página inteira é feita primeiro com placeholders e o 3D é criado imediatamente depois.
