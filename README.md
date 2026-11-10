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
| Módulo: ciclo, corte e vista explodida | `components/scene/Module.tsx` |
| Ilha: placas, prêmios, bicicleta, drone | `components/scene/Island.tsx` |
| Geometria dos modelos | `blender/build_desol.py` |
| Scroll, navegação, cursor, listas interativas | `components/Client.tsx` |

## Como funciona

- `ScrollDriver` mede a posição do centro da tela em cada `<section data-chapter>` e grava em `lib/state.ts` (`live.f` = capítulo contínuo, `live.local[i]` = progresso dentro do capítulo). A cena lê esses valores a cada quadro, sem re-render do React.
- Sem WebGL (ou com `?static` na URL) a página vira um artigo com um poster por capítulo. Todo o conteúdo da cena existe em HTML.
- `prefers-reduced-motion`: sem scroll suave, câmera em cortes secos, animações ociosas paradas.
- Celular: sem pós-processamento, `dpr` máximo 1,5, cards rolando por baixo da cena.

## 3D

Os modelos são gerados por script no Blender e carregados pelo site como GLB:

| Arquivo | Peso | Triângulos |
| --- | --- | --- |
| `public/models/desol-module.glb` | 60 KB | 10,5 mil |
| `public/models/desol-island.glb` | 179 KB | 28,7 mil |

Para mudar um modelo:

1. Edite `blender/build_desol.py` (dimensões no sistema do site; `T()` converte para o Blender).
2. No Blender, rode o script e chame `build_all()` e `export_all()`; os GLB sem compressão saem em `blender/export/`.
3. `npm run models` aplica Draco e grava em `public/models/`.
4. `npm run build && npm run posters` atualiza os posters.

O `.blend` mestre fica em `blender/desol-master.blend`. O código acha as peças pelo nome (`DS_*`, `IS_*`) e avisa no console, em desenvolvimento, se alguma faltar. Vapor, raios de sol, cristais de sal, gotas e as folhas que se dobram continuam feitos em código.

Diferenças em relação a `docs/04_BLENDER_3D.md`: a luz da ilha não foi assada (o site calcula sombras em tempo real), os props foram modelados à mão em vez de gerados, e os posters saem do próprio site, não de renders do Blender.

## Regras de conteúdo

Prêmios e eventos são afirmados. Vazão, eficiência, custo e qualidade da água só aparecem com selo (`PROJETADO`, `ESTIMADO`, `DEMO`). Ver `docs/03_FATOS_DESOL.md` antes de mudar qualquer número.
