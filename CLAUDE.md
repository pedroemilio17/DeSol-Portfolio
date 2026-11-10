# DeSol — Kit de implementação do site storytelling 3D

Você vai construir o site do **DeSol** (Dessalinizador Solar Inteligente com Monitoramento Hídrico), projeto de alunos do Senac Quantum (Cuiabá-MT), premiado em 2026. Tudo o que você precisa está neste pacote. Leia nesta ordem antes de escrever código:

1. `docs/01_PLANO.md` — visão, direção de arte, narrativa, 3D, stack, performance, fases. **Fonte da verdade.**
2. `docs/02_HISTORIA.md` — o texto do site, capítulo por capítulo (copy pronta para usar).
3. `docs/03_FATOS_DESOL.md` — fatos, datas, especificações e o status de cada número (CONFIRMADO / PROJETADO / ESTIMADO / PENDENTE).
4. `docs/04_BLENDER_3D.md` — especificação dos modelos 3D e procedimento no Blender (via MCP Higgsfield).
5. `docs/05_PROMPT_MESTRE.md` — o briefing resumido (use como lembrete do todo).
6. `design/tokens.css` e `design/tokens.json` — cores, fontes, raios, sombras.
7. `assets/logo-desol.png` — logo oficial (amarelo #FFF23F sobre transparente).
8. `referencias/` — vídeo e quadros do diorama isométrico de referência + `refero.md`.

## Ordem de trabalho (obrigatória)

**Etapa A — a página completa.**
Construa o site inteiro (Fases 0, 2, 3 e 4 do plano) usando **placeholders 3D** feitos em código (primitivas do three.js com os mesmos nomes de objeto definidos em `04_BLENDER_3D.md`). Câmera, scroll, cards, cursor, navegação por pontos, animações de explosão e o ciclo de destilação já devem funcionar com os placeholders. Rode `npm run build` sem erros e confira em navegador (desktop e 390 px de largura).

**Etapa B — o 3D, imediatamente após a Etapa A.**
Assim que a página estiver pronta, **não pare para pedir aprovação**: vá direto ao Blender e crie os modelos seguindo `docs/04_BLENDER_3D.md`.
- Comece com `get_host_status`. Se o Blender não estiver conectado, avise o usuário para abrir o painel Higgsfield no Blender e clicar em Connect, e aguarde.
- Carregue as skills do Blender antes de qualquer mutação (`bl_get_skill` → `blender-scene` primeiro, depois os módulos que ele indicar).
- Exporte os GLB para `public/models/`, gere os posters em `public/posters/`, troque os placeholders pelos modelos reais e valide de novo (build + navegador + peso dos arquivos).

**Etapa C — entrega.**
Relatório curto: o que foi feito, prints de cada capítulo, pesos dos GLB, Lighthouse mobile, pendências. Deploy na Vercel só se o usuário pedir.

## Regras que não se negociam

- **Honestidade dos dados:** prêmios e eventos são afirmados. Vazão, eficiência, pH/TDS, custo por litro, alcance LoRa e IA são sempre marcados com selo (PROJETADO / ESTIMADO / DEMO). Nunca escrever "água potável", "comprovado", "zero consumo elétrico" ou "3º lugar na MECTI" (o 3º lugar é do Festival High Tech, Robótica).
- **Anti-AI-slop:** sem gradiente em texto, sem roxo-azul genérico, sem Poppins/Montserrat, sem cards de 3 colunas com ícone genérico, sem "elevate / revolucionário / o futuro da água / solução inovadora". Toda frase cita um fato, número ou ação.
- **O texto funciona sem o 3D.** Todo conteúdo da cena tem equivalente em HTML.
- `prefers-reduced-motion` e fallback sem WebGL são obrigatórios.
- Trabalhe por checkpoints: commit ao fim de cada fase com mensagem clara.

## Pendências que o usuário ainda decide (use o padrão entre parênteses)

- Domínio (deixe configurável) · Idioma (só PT, estrutura pronta para EN) · Fonte de títulos (**Unbounded**) · Prévia do app (vídeo/imagem com selo DEMO; iframe opcional para o repositório) · Fotos reais do protótipo (placeholder marcado "foto do protótipo") · Logos Senac/Águas Cuiabá (só texto, sem logo, até autorização) · CTA (link `mailto:` configurável em `site.config.ts`).
