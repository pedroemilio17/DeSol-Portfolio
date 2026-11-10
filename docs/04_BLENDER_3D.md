# DeSol — Especificação 3D e procedimento no Blender

**Quando:** imediatamente depois que a página estiver pronta com placeholders (ver `CLAUDE.md`, Etapa B). Não esperar aprovação para começar.

## 0. Procedimento no Blender (MCP Higgsfield)

1. `get_host_status` → confirmar `blr: true`. Se falso: pedir ao usuário para abrir o painel Higgsfield no Blender e clicar em **Connect**; esperar.
2. `bl_get_skill` sem nome (índice) → `bl_get_skill('blender-scene')` **antes de qualquer mutação**. Depois carregar só os módulos que ele indicar para esta tarefa: `blender-scene-spec` (Scene Passport), `blender-modeling`, `blender-lookdev`, `blender-lighting-camera`, `blender-generation` (se usar geração Higgsfield), `blender-audit-finalize`. Seguir a ordem deles.
3. Escrever o **Scene Passport** a partir deste documento (unidades em metros, Z para cima, rotações em radianos).
4. Block-out → checar pela câmera → detalhar → materiais → luz → auditoria.
5. Geração Higgsfield (`bl_generate_3d`, `bl_image_to_3d`, `bl_generate_image`) é permitida para **props da ilha** (árvores, casinhas, troféu, medalha). O **módulo DeSol é modelado à mão** (primitivas + bevel + booleans), porque as camadas precisam ser peças separadas com nomes exatos.
6. A cena aqui é **estática**: animações vivem no código (GSAP). Não criar keyframes de explosão no Blender (exceção: nenhuma).
7. Salvar o `.blend` mestre em `blender/desol-master.blend` e exportar os GLB (seção 5).

## 1. Estilo visual
- Diorama isométrico low-poly **arredondado** (bevel 2–4 segmentos em tudo), sem texturas fotográficas: cores chapadas + leve gradiente por vertex color / AO.
- Referência: `referencias/video-referencia-diorama.mp4` e `video-referencia-quadros.jpg` (Ace Design). Pegar a linguagem, **não copiar** prédios ou composição.
- Paleta dos materiais (Principled BSDF, roughness 0.55–0.7 salvo indicado):

| Material | Cor | Notas |
| --- | --- | --- |
| `M_sun` | #FFF23F | Emissão 3–6 para o sol e LEDs |
| `M_ink` | #0E0F0C | Bacia preta fosca (roughness 0.85) |
| `M_paper` | #F5F1E6 | Casas, placas |
| `M_water` | #1EC8E6 | Água doce, gotas (transmission 0.6, roughness 0.05) |
| `M_brine` | #FF5A36 | Água salobra na bacia e cristais de sal |
| `M_leaf` | #2FBF71 | Vegetação |
| `M_cerrado` | #C98B4A | Terra vermelha do cerrado |
| `M_wood` | #B07A4F | Estrutura de compensado |
| `M_eps` | #E8E4DA | Isolamento (leve ruído de bolinhas) |
| `M_alu` | #9AA3A8 | metallic 1, roughness 0.35 |
| `M_steel` | #C9D1D6 | Calha inox, metallic 1, roughness 0.2 |
| `M_glass` | — | transmission 1, roughness 0.05, IOR 1.5, leve tint ciano |

## 2. Módulo DeSol (`desol-module.glb`) — versão idealizada, proporções do blueprint de outubro

Escala real em metros (o código reescala). Origem do módulo no centro da base, chão em Z=0.

| Nome do objeto (exato) | Forma | Dimensões de referência | Material |
| --- | --- | --- | --- |
| `DS_Frame` | Caixa de madeira com laterais trapezoidais (cunha) | 1,12 × 0,62 m; altura 0,15 m (frente) → 0,351 m (fundo) | `M_wood` |
| `DS_Insulation` | Revestimento interno (fundo + laterais) | espessura 0,04 m | `M_eps` |
| `DS_Basin` | Bandeja | 1,00 × 0,50 × 0,045 m, parede 1,5 mm | `M_ink` |
| `DS_Water_Brine` | Lâmina d'água dentro da bacia | 1,00 × 0,50 × 0,015 m | `M_brine` (o código troca a cor) |
| `DS_Glass` | Placa inclinada 18° fechando o topo | 4 mm, cobre a caixa | `M_glass` |
| `DS_Gutter` | Calha em U na borda baixa, sob o vidro | 1,00 × 0,02 × 0,02 m, declive 1% | `M_steel` |
| `DS_Outlet` | Tubo curto saindo da calha | Ø 0,015 m | `M_steel` |
| `DS_Collector` | Reservatório de água coletada | ~0,18 × 0,18 × 0,25 m, translúcido | `M_glass` + `DS_Water_Fresh` dentro |
| `DS_Water_Fresh` | Água dentro do coletor | — | `M_water` |
| `DS_Mineralizer` | Coluna cilíndrica entre calha e coletor | Ø 0,06 × 0,22 m | `M_paper` + faixa `M_leaf` |
| `DS_Sensor_Temp` | Sonda fina na bacia | — | `M_alu` + ponto `M_sun` emissivo |
| `DS_Sensor_Level` | Caixinha ultrassônica sobre o coletor | — | `M_paper` |
| `DS_Sensor_TDS` | Sonda no coletor | — | `M_alu` |
| `DS_Electronics` | Caixa do ESP32 com LCD na lateral | ~0,12 × 0,08 × 0,04 m | `M_ink` + tela `M_sun` emissiva |
| `DS_SolarPanel` | Painel pequeno em haste | ~0,35 × 0,25 m | `M_ink` + grade `M_alu` |
| `DS_Antenna` | Antena LoRa curta | — | `M_ink` |
| `DS_Legs` | 4 pés baixos | — | `M_wood` |

Regras do módulo:
- Cada linha acima é **um objeto separado**, com o nome exato (o código usa os nomes para explodir camadas, trocar cores e acender sensores).
- Pivô de cada camada no seu próprio centro (o código desloca em Z na explosão).
- Ordem da explosão (de baixo para cima): `DS_Legs` → `DS_Frame` → `DS_Insulation` → `DS_Basin` → `DS_Water_Brine` → `DS_Gutter` → `DS_Glass`. Periféricos (`DS_Collector`, `DS_Mineralizer`, sensores, eletrônica, painel) se afastam lateralmente.
- Adicionar 6–10 objetos `DS_Drop_01…` (gotas pequenas, `M_water`) na face interna do vidro, e um `DS_Vapor_Anchor` (Empty) sobre a água para o shader de vapor.
- "Idealizado": cantos arredondados, proporções levemente heroicas, sem parafusos realistas. Deve ler como **produto**, não como protótipo de bancada.
- Meta: ≤ 40k triângulos, ≤ 3 MB em GLB com Draco.

## 3. Ilha do cerrado (`desol-island.glb`)

Base: ilha hexagonal/arredondada ~12 × 12 m com borda de terra (`M_cerrado`) em camadas, topo de grama (`M_leaf` mais escuro). Elementos (prefixo `IS_`):

| Objeto | Descrição |
| --- | --- |
| `IS_Ground` | Base em camadas, borda arredondada |
| `IS_Road` | Estrada sinuosa que percorre a ilha (cap. 6), com 4 pontos `IS_Sign_01..04` (placas `M_paper`) |
| `IS_Well` | Poço salobro com balde; água `M_brine` (cap. 1) |
| `IS_WaterTower` | Caixa d'água elevada; preenchimento `IS_WaterTower_Fill` separado (cap. 7) |
| `IS_House_01..04` | Casinhas simples, telhado colorido (`M_brine`, `M_paper`, `M_sun`) |
| `IS_Tree_*` | Árvores do cerrado arredondadas (ipê amarelo `M_sun` em 2 delas, demais `M_leaf`) |
| `IS_Module_Slot` | Empty no centro onde o código posiciona o módulo |
| `IS_Module_Slot_2..4` | Empties para os 4 módulos do cap. 7 |
| `IS_LabTable` | Mesa de laboratório (cap. 2) — **arquivo separado** `desol-lab.glb` se passar do peso |
| `IS_Trophy` | Troféu (3º lugar) estilizado `M_sun` |
| `IS_Medal` | Medalha (Águas Cuiabá) `M_water` + fita |
| `IS_Bike`, `IS_Drone` | 1–2 elementos móveis pequenos (o código anima) |

Regras da ilha:
- Luz **assada** (bake de AO + luz difusa em vertex color ou lightmap 1K) — o site não calcula sombras na ilha.
- ≤ 80k triângulos, ≤ 4 MB.
- Sem texto 3D (textos vivem no HTML).

## 4. Luz e câmera de referência (para renders e posters)
- Luz principal: Sun, cor #FFF6C8, elevação 45°, vinda do canto superior esquerdo; preenchimento suave ciano frio do lado oposto.
- Mundo: `ink` #0E0F0C, sem HDRI fotográfico (no máximo um HDRI de estúdio neutro com força baixa).
- Câmera isométrica: ortográfica, rotação X 54,7°, Z 45°.
- Renders (EEVEE ou Cycles, 1600 px, PNG + WebP):
  - `poster-hero.webp` — ilha inteira, sol ao alto
  - `poster-cap1.webp` … `poster-cap8.webp` — um por capítulo, na mesma câmera que o site usa
  - `poster-cycle-1..4.webp` — os 4 quadros do ciclo (mobile)
  - `og-image.png` — 1200 × 630, vista aérea ao pôr do sol com espaço para o logo

## 5. Exportação
- glTF Binary (`.glb`), +Y up, aplicar modificadores, **Draco** (nível 6), só objetos da coleção correspondente.
- Depois, no projeto: `npx @gltf-transform/cli optimize desol-module.glb public/models/desol-module.glb --texture-compress ktx2` (idem para a ilha).
- Destinos: `public/models/desol-module.glb`, `public/models/desol-island.glb` (+ `desol-lab.glb` se separado), `public/posters/*`.
- Conferir no código: `useGLTF` encontra todos os nomes `DS_*` e `IS_*` listados; logar no console os ausentes durante o desenvolvimento.

## 6. Critérios de pronto do 3D
- [ ] Todos os nomes de objeto existem e batem com o código.
- [ ] Pesos dentro da meta (módulo ≤ 3 MB, ilha ≤ 4 MB, total ≤ 8 MB).
- [ ] Explosão do cap. 4 funciona com o modelo real sem interpenetração.
- [ ] Render dos posters gerado e usado no carregamento/reduced-motion.
- [ ] Auditoria final da skill `blender-audit-finalize` aprovada; `.blend` salvo.
- [ ] Prints de cada capítulo com o modelo real anexados ao relatório.
