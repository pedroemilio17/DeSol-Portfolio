# DeSol — Fatos, especificações e status dos números

Resumo do dossiê "DESOL_Historico_Completo_2026" (consolidado em 04/11/2026). Use para conferir qualquer frase do site.

## Identidade
- Nome de apresentação: **DeSol — Dessalinizador Solar Inteligente com Monitoramento Hídrico**.
- Nome acadêmico: Projeto DeSol: Sistema Modular de Dessalinização Solar Inteligente com Remineralização e Telemetria IoT.
- Origem: Senac Quantum, Cuiabá (MT), curso técnico em Inteligência Artificial, Programa Desenvolve AI.
- Equipe divulgada pela instituição (out/2026): Pedro Gomes, Lucas Pianesso, Matheus Santos. Orientação: João Pedro Cunha, instrutor do Senac-MT. **Não inventar divisão de autoria.**
- Nomes anteriores: PingoSolar, Conecta Água (identidade das apresentações e do MVP digital), DeSol.
- Origem acadêmica: pesquisa do mestrado do orientador, aprofundada com os alunos (Senac-MT, 28/10/2026).
- Estética usada nas apresentações: preto/amarelo, números em branco e amarelo, tipografia grossa.

## Linha do tempo 2026
| Data | Marco | Status |
| --- | --- | --- |
| Maio | Arquitetura com ESP32, sensores, LoRa | Planejamento |
| 19 jun | Protótipo compacto ~50 × 50 cm, vidro ~55 × 55 cm, ~1 L/dia idealizado | Proposta, não medido |
| 23 e 31 jul | Pitch social, explicação evaporação–condensação, banner e modelo 3D | Comunicação |
| 24–27 ago | Apresentação online; pilares problema, justificativa, inovação, sustentabilidade; MVP digital | Documentado |
| 27 ago | Passagem à fase regional, busca da etapa estadual MECTI | Histórico |
| 3–4 set | Dossiê técnico e short paper SBC/SEMATEC submetido (#35567) | Confirmado |
| 10 set | Classificação para a Etapa Estadual da XVIII MECTI, regional Centro-Sul, Engenharias | **Confirmado** |
| 17 set | Artigo **não aceito** na SEMATEC (pedidos de evidência experimental) | Confirmado |
| 9–10 out | Gêmeo digital r33 (GLB 3D, 12 componentes, DEMO, testes) | Confirmado (código) |
| 20 out | PR #1 "conexao esp32" mesclada (16 arquivos) | **Confirmado** |
| 20 out | Senac-MT divulga DeSol finalista da MECTI | Confirmado |
| 21–23 out | 23ª Semana Nacional de Ciência e Tecnologia, Centro de Eventos do Pantanal, Cuiabá | **Confirmado** |
| 21–23 out | **3º lugar no 2º Festival Estadual High Tech, Robótica, R$ 3.000** e **Melhor Projeto pela Águas Cuiabá (tablet)** | **Confirmado** (Senac-MT 28/10) |
| 31 out | Blueprint físico revisado | Projetado |

**Atenção:** MECTI e Festival High Tech são eventos distintos. Nunca escrever "3º lugar na MECTI".

## Como funciona
Água de entrada → bacia de água salobra → aquecimento solar → evaporação → vapor encontra cobertura mais fria → condensação → escoamento até a calha → coleta → remineralização (coluna de calcita e dolomita) → armazenamento.
- Separar sais não garante potabilidade; precisa de análise microbiológica e físico-química.
- Aquecimento é passivo (sol), mas a eletrônica consome energia → **não dizer "zero consumo elétrico"**.

## Especificações do módulo (para o 3D) — PROJETADO
### Módulo de referência (set)
| Elemento | Especificação |
| --- | --- |
| Área de evaporação | 0,5 m² |
| Lâmina de água | 15 mm |
| Volume em operação | 7,5 L |
| Bacia | Alumínio ~1,5 mm, preto fosco |
| Isolamento | EPS 40 mm |
| Cobertura | Vidro temperado 4 mm, inclinado 18° |
| Calha | Aço inox (AISI 316) |
| Estrutura | Compensado tratado + vedação |
| Resfriamento externo | Filme fino de água sobre o vidro (proposto) |

### Blueprint de outubro (usar como base de proporção do modelo)
- Caixa externa ~**112 × 62 cm**; alturas **15 cm** (lado baixo) e **35,1 cm** (lado alto); cobertura a **18°**.
- Bacia **100 × 50 × 4,5 cm**; água útil 15 mm (7,5 L).
- EPS 40 mm; madeira 12 mm; alumínio 1,5 mm; vidro temperado 4 mm.
- Calha inox ~**1000 × 20 × 20 mm**, declive 1%.

### Eletrônica
| Função | Sensor/mecanismo | Status |
| --- | --- | --- |
| Temperatura | DS18B20 | No firmware |
| Nível | Ultrassônico | No firmware |
| TDS / condutividade | ADC analógico | Sinal bruto; calibração não comprovada |
| pH | ADC analógico | Sinal bruto; calibração não comprovada |
| Bomba | Comando com histerese | Estado, não fluxo |
| Irradiância | Fotodiodo (proposto) | Só no gêmeo |
| Comunicação | Wi-Fi local; LoRa 915 MHz (proposto) | Enlace longo não validado |
| Energia | Painel ~10 W + LiFePO4 (proposto) | Projetado |
| Display | LCD I²C 0x27 (SDA 21, SCL 22) | No firmware |

## Números e como podem aparecer no site
| Indicador | Valor | No site |
| --- | --- | --- |
| Área do módulo | 0,5 m² | Sim, `PROJETADO` |
| Produção por m² | 4,8–5,4 L/m²/dia | Evitar; se usar, `ESTIMADO` |
| Produção por módulo | 2,4–2,7 L/dia | Só com `ESTIMADO` |
| Quatro módulos | 9,6–10,8 L/dia | Sim, `ESTIMADO` (cap. 7) |
| Eficiência térmica | 52–56% | **Não usar** |
| pH / TDS pós-mineralizador | ~7,4 / ~140 mg/L | **Não usar** |
| Custo de um módulo | R$ 500–610 | Evitar; se usar, `ESTIMADO` |
| Custo por litro (LCOW) | ~R$ 0,18/L | **Não usar** |
| Alcance LoRa | até 15 km | **Não usar** |
| Monitoramento remoto | até 400 km | **Não usar** |
| IA (PIML) 96,9%, R² 0,969 | — | **Não usar** (não validado) |
| População sem água tratada | ~33–35 mi (BR), >524 mil (MT) | Só com fonte oficial conferida |
| Prêmio Festival High Tech | R$ 3.000, 3º lugar, Robótica | Sim, `CONFIRMADO` |
| Águas Cuiabá | Melhor projeto | Sim, `CONFIRMADO` |

## Software existente
- Repositório público: https://github.com/pedroemilio17/DeSol
- Gêmeo digital r33: modelo `dessalinizador-solar-r33.glb`, 12 componentes, 360°, tela cheia, fallback WebGL, rotas /preditivo, /mapa, /operacional, API /api/v1. README: "DEMO: dados simulados — sem telemetria real" sem API configurada.
- Integração ESP32: ESP32 → `/api/dados` → proxy → navegador (`/api/esp32/telemetry`). Docs: `docs/esp32-integration.md`.

## Fontes públicas
- Senac-MT, 20/10/2026: https://www.mt.senac.br/Noticias/Alunos-do-senac-criam-solucao-com-ia-para-levar-agua-de-qualidade-a-comunidades-em-mato-grosso-1158
- Senac-MT, 28/10/2026: https://www.mt.senac.br/Noticias/Alunos-do-senac-mt-conquistam-tres-premios-na-semana-nacional-de-tecnologia-1169
- Primeira Página, 21/10/2026: https://primeirapagina.com.br/tecnologia/estudantes-de-cuiaba-criam-equipamento-que-usa-o-sol-para-tirar-sal-da-agua-e-ajudar-comunidades-afastadas/
- SNCT/MECTI MT: https://snctmt.com.br/resultados
