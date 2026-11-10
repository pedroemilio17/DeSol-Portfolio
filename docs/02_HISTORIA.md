# DeSol — A história do site (copy por capítulo)

Texto pronto para usar. Tom: direto, otimista, concreto. Frases curtas. Cada número traz seu selo.
Selos: `CONFIRMADO` (sun sobre ink) · `PROJETADO` (paper/contorno) · `ESTIMADO` (brine contorno) · `DEMO` (water contorno). Fonte mono, caixa alta, 11px.

---

## 0 · Abertura

**Rótulo:** DESSALINIZADOR SOLAR INTELIGENTE
**Título:** O sol tira o sal da água.
**Linha de apoio:** O DeSol usa calor solar para separar sal da água e sensores para provar o que acontece em cada litro.
**Microcopy:** Role para seguir uma gota. ↓
**Rodapé da tela:** Senac Quantum · Cuiabá, Mato Grosso · 2026

---

## 1 · O problema

**Título:** Ter água não é o mesmo que poder beber.
**Texto:**
Em comunidades rurais e isoladas, existe poço, existe reservatório — mas a água é salobra. Os sais dissolvidos precisam sair antes do consumo.
As soluções de fora dependem de estrada, eletricidade, troca de membrana e técnico. Quando uma dessas peças falha, a água para.
**Três cristais (hover):**
- **Sal** — água disponível, qualidade inadequada.
- **Distância** — caminhão-pipa e galão chegam caro e chegam tarde.
- **Infraestrutura** — energia e manutenção que nem sempre existem.
**Nota de dado:** números nacionais de saneamento só entram com fonte oficial conferida (SNIS/Trata Brasil, ano-base explícito). Até lá, sem número.

---

## 2 · A origem

**Título:** De uma pesquisa de mestrado para uma sala de aula.
**Texto:**
O orientador João Pedro Cunha trouxe uma pesquisa do mestrado e decidiu aprofundá-la com os alunos do curso técnico em Inteligência Artificial do Senac Quantum, em Cuiabá, no Programa Desenvolve AI.
O raciocínio foi uma decisão de engenharia, não a invenção de um princípio novo: água disponível mas imprópria → separar os sais → pouca energia e infraestrutura → usar o sol → evaporar, condensar e coletar num equipamento modular.
**Três nomes (papéis que se dobram):** PingoSolar → Conecta Água → **DeSol**
**Legenda:** Três nomes, uma ideia ficando mais clara.

---

## 3 · Como funciona

**Título:** Aquece, evapora, condensa, coleta.
**Passos (sincronizados com o scrub do scroll):**
1. **Entra água salobra** numa bacia rasa e escura.
2. **O sol aquece** a lâmina d'água.
3. **A água evapora** — o sal fica para trás.
4. **O vapor encontra o vidro** inclinado, mais frio, e vira gota.
5. **A gota escorre** até a calha, separada da água bruta.
6. **A água coletada** passa por remineralização e é armazenada.
**Nota honesta (pequena):** separar o sal não garante potabilidade sozinho. Qualidade da água exige análise de laboratório — e esse é o próximo passo do projeto.

---

## 4 · Por dentro do módulo

**Título:** Cada camada tem um trabalho.
**Subtítulo:** Especificação de referência do módulo · `PROJETADO`
**Camadas (clique em cada uma):**
- **Vidro temperado 4 mm, inclinado a 18°** — onde o vapor condensa e a gota escorre.
- **Calha de aço inox** — leva o condensado para fora, sem misturar com a água bruta.
- **Bacia de alumínio preto fosco** — absorve o sol e passa o calor para a água.
- **Lâmina d'água de 15 mm** — pouca água aquece mais rápido. 7,5 L em 0,5 m².
- **Isolamento EPS 40 mm** — segura o calor que escaparia pelo fundo e laterais.
- **Estrutura de compensado tratado** — suporte, vedação e manutenção.
- **Sensores** — temperatura (DS18B20), nível, TDS e pH (calibração pendente).
**Rodapé:** Área útil 0,5 m² · Caixa ~112 × 62 cm (desenho de outubro) `PROJETADO`

---

## 5 · O sistema digital

**Título:** Não é um painel bonito: é a prova.
**Texto:**
O DeSol tem três camadas conectadas: o protótipo físico, o sistema digital e a investigação científica.
Um ESP32 lê os sensores e envia os dados; o gêmeo digital mostra o equipamento em 3D, com histórico, eventos e a origem de cada leitura. Quando um dado é simulado, ele diz que é simulado.
**Destaques (cards de vidro, estilo instrumento escuro):**
- **Gêmeo digital 3D** — 12 componentes inspecionáveis, visão 360°, modo apresentação.
- **Integração ESP32** — firmware, validação e ponte local integrados ao repositório em 20/10/2026. `CONFIRMADO`
- **Origem de cada leitura** — real, ausente ou simulada, sempre indicada.
**Selo no tablet:** `DEMO — dados simulados`
**Link:** Ver o código no GitHub → https://github.com/pedroemilio17/DeSol

---

## 6 · A trajetória

**Título:** De Cuiabá para o pódio.
**Linha do tempo (placas na estrada):**
- **Mai–Ago 2026** — Arquitetura com ESP32 e sensores; pitch, banner e modelo 3D; apresentação online.
- **10 set 2026** — Classificado para a Etapa Estadual da XVIII MECTI · regional Centro-Sul · Engenharias. `CONFIRMADO`
- **Out 2026** — Gêmeo digital r33 e integração ESP32 no repositório. `CONFIRMADO`
- **21–23 out 2026** — Apresentação na 23ª Semana Nacional de Ciência e Tecnologia, Centro de Eventos do Pantanal. `CONFIRMADO`
- **🏆 3º lugar** — 2º Festival Estadual High Tech · categoria Robótica · **R$ 3.000**. `CONFIRMADO`
- **🏅 Melhor projeto** — escolhido pela Águas Cuiabá. `CONFIRMADO`
(Os emojis acima são só marcação para o dev — no site, usar o troféu e a medalha 3D, sem emoji.)
**Números grandes:** **3º** · **R$ 3.000** · **2 prêmios**
**Fonte (rodapé):** Senac-MT, 28/10/2026.

---

## 7 · O próximo capítulo

**Título:** Agora, medir.
**Texto:**
Prêmio mostra que a ideia convence. O próximo passo é provar, com dados, quanto o DeSol produz e com que qualidade.
**Próximos marcos:**
1. **Versão física congelada** — desenho cotado, lista de materiais, fotos.
2. **Série de ensaios** — dados brutos por dia, sensores calibrados, volumes aferidos.
3. **Qualidade da água** — laudos de laboratório após a remineralização.
4. **Telemetria de campo** — ESP32, gateway e backend com dados persistidos.
5. **Destino da salmoura** — balanço de massa e cristalizador solar.
**Meta de escala:** quatro módulos, **9,6 a 10,8 L/dia** `ESTIMADO`
**Legenda da meta:** Estimativa de projeto — será substituída por medição.

---

## 8 · Equipe e contato

**Título:** Quer ver isso funcionando no seu território?
**Equipe:** Pedro Gomes · Lucas Pianesso · Matheus Santos
**Orientação:** João Pedro Cunha — instrutor do Senac-MT
**Instituição:** Senac Quantum · Programa Desenvolve AI · Cuiabá-MT
**CTAs:**
- **Falar com a equipe** (primário, `sun`) → `mailto:` configurável
- **Ver o código** → GitHub
- **Pedir o kit técnico** → `mailto:` com assunto "Kit técnico DeSol"
**Rodapé:** DeSol · 2026 · Projeto acadêmico em desenvolvimento. Valores marcados como projetados ou estimados ainda não foram medidos.

---

## Metadados

- **Title:** DeSol — O sol tira o sal da água
- **Description:** Dessalinizador solar inteligente com monitoramento hídrico, criado por alunos do Senac Quantum em Cuiabá-MT. 3º lugar no Festival Estadual High Tech e melhor projeto pela Águas Cuiabá.
- **OG image:** render aéreo da ilha ao pôr do sol com o logo.
