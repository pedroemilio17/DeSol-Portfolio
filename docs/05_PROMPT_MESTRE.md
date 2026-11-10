# Prompt mestre (cole na sessão de implementação, com o ZIP extraído na pasta do projeto)

```
Você vai construir o site storytelling do DeSol, um dessalinizador solar inteligente
criado por alunos do Senac Quantum (Cuiabá-MT) e premiado em 2026.
Leia CLAUDE.md e todos os arquivos em docs/ antes de começar; eles são a fonte da verdade.

HISTÓRIA: a viagem de uma gota — da água salobra (laranja) à água doce (ciano), em 9
capítulos: Abertura, Problema, Origem, Como funciona, Por dentro do módulo, Sistema
digital, Trajetória, Próximo capítulo, Equipe e contato. Copy pronta em docs/02_HISTORIA.md.

FERRAMENTAS: Next.js + TypeScript (export estático), React Three Fiber + drei,
GSAP ScrollTrigger, Lenis, Tailwind, postprocessing. Modelos GLB do Blender (MCP Higgsfield).

VISUAL: diorama isométrico low-poly arredondado sobre uma ilha de cerrado, sol amarelo
#FFF23F como única luz-acento, fundos ink #0E0F0C e paper #F5F1E6, água #1EC8E6,
sal #FF5A36, vegetação #2FBF71. Cards de vidro fosco sobre a cena. Títulos em Unbounded;
corpo em Inter Tight; dados em JetBrains Mono. Tokens em design/.

ANIMAÇÕES: uma cena fixa e uma câmera guiada pelo scroll. Cap. 3 = scrub do ciclo
aquece→evapora→condensa→coleta. Cap. 4 = vista explodida clicável. Cursor em forma de
gota. Navegação lateral por pontos.

HONESTIDADE: selos CONFIRMADO / PROJETADO / ESTIMADO / DEMO em todo número.
Nunca afirmar potável, eficiência medida, ou "3º lugar na MECTI".

PROIBIDO: gradiente em texto, roxo-azul genérico, Poppins/Montserrat, cards de 3 colunas
com ícone genérico, "elevate", "revolucionário", "o futuro da água". Toda frase cita um
fato, número ou ação.

ORDEM: (A) construa a página inteira com placeholders 3D nomeados como em
docs/04_BLENDER_3D.md; (B) assim que a página estiver pronta e o build passar, vá
direto ao Blender, sem pedir aprovação, crie o módulo e a ilha, exporte os GLB e troque
os placeholders; (C) entregue relatório com prints, pesos e Lighthouse.
Commit ao fim de cada fase.
```
