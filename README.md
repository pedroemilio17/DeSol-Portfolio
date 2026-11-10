# DeSol — site storytelling 3D

Site do **DeSol** (Dessalinizador Solar Inteligente com Monitoramento Hídrico), projeto de alunos do Senac Quantum, Cuiabá-MT. Nove capítulos contados como a viagem de uma gota, sobre uma cena 3D fixa cuja câmera segue o scroll.

## Rodar

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:3000
npm run build      # export estático em out/
npm start          # serve out/ em http://localhost:3210
npm run posters    # regenera posters e og-image a partir do build (precisa do Chromium do Playwright e do ImageMagick)
```

## Onde mexer

| O quê | Arquivo |
| --- | --- |
| Domínio, e-mail de contato, GitHub, fontes citadas | `site.config.ts` |
| Todo o texto dos capítulos | `lib/content.ts` e `app/page.tsx` |
| Cores, tipografia, layout, mobile | `app/globals.css` (tokens de `design/tokens.css`) |
| Câmera por capítulo, sol, luzes, tablet | `components/scene/Experience.tsx` |
| Módulo (objetos `DS_*`), ciclo e vista explodida | `components/scene/Module.tsx` |
| Ilha (objetos `IS_*`), estrada, placas, prêmios | `components/scene/Island.tsx` |
| Scroll, navegação, cursor, listas interativas | `components/Client.tsx` |

## Como funciona

- `ScrollDriver` mede a posição do centro da tela em cada `<section data-chapter>` e grava em `lib/state.ts` (`live.f` = capítulo contínuo, `live.local[i]` = progresso dentro do capítulo). A cena lê esses valores a cada quadro, sem re-render do React.
- Sem WebGL (ou com `?static` na URL) a página vira um artigo com um poster por capítulo. Todo o conteúdo da cena existe em HTML.
- `prefers-reduced-motion`: sem scroll suave, câmera em cortes secos, animações ociosas paradas.
- Celular: sem pós-processamento, `dpr` máximo 1,5, cards rolando por baixo da cena.

## Estado do 3D

A cena usa **placeholders em código** com os nomes de objeto de `docs/04_BLENDER_3D.md`. A Etapa B (modelos no Blender, GLB em `public/models/`) ainda não foi feita: o Blender não estava conectado ao MCP Higgsfield.

## Regras de conteúdo

Prêmios e eventos são afirmados. Vazão, eficiência, custo e qualidade da água só aparecem com selo (`PROJETADO`, `ESTIMADO`, `DEMO`). Ver `docs/03_FATOS_DESOL.md` antes de mudar qualquer número.
