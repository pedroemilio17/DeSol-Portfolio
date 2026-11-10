/**
 * Copy do site (docs/02_HISTORIA.md). Só PT por enquanto; para EN, duplique
 * este objeto com as mesmas chaves e selecione pelo locale em site.config.ts.
 */
export type BadgeKind = 'confirmado' | 'projetado' | 'estimado' | 'demo' | 'pendente';

export const chapters = [
  { id: 'abertura', nav: 'Abertura', theme: 'ink' },
  { id: 'problema', nav: 'O problema', theme: 'ink' },
  { id: 'origem', nav: 'A origem', theme: 'paper' },
  { id: 'como-funciona', nav: 'Como funciona', theme: 'ink' },
  { id: 'por-dentro', nav: 'Por dentro do módulo', theme: 'ink' },
  { id: 'digital', nav: 'O sistema digital', theme: 'ink' },
  { id: 'trajetoria', nav: 'A trajetória', theme: 'paper' },
  { id: 'proximo', nav: 'O próximo capítulo', theme: 'ink' },
  { id: 'contato', nav: 'Equipe e contato', theme: 'ink' },
] as const;

export const crystals = [
  { name: 'Sal', text: 'Água disponível, qualidade inadequada.' },
  { name: 'Distância', text: 'Caminhão-pipa e galão chegam caro e chegam tarde.' },
  { name: 'Infraestrutura', text: 'Energia e manutenção que nem sempre existem.' },
];

export const names = ['PingoSolar', 'Conecta Água', 'DeSol'];

export const cycleSteps = [
  { title: 'Entra água salobra', text: 'numa bacia rasa e escura.' },
  { title: 'O sol aquece', text: 'a lâmina d’água.' },
  { title: 'A água evapora', text: '— o sal fica para trás.' },
  { title: 'O vapor encontra o vidro', text: 'inclinado, mais frio, e vira gota.' },
  { title: 'A gota escorre', text: 'até a calha, separada da água bruta.' },
  { title: 'A água coletada', text: 'passa por remineralização e é armazenada.' },
];
/** Início de cada passo no progresso 0–1 do ciclo. */
export const cycleStops = [0, 0.12, 0.3, 0.5, 0.66, 0.82];

export const layers = [
  {
    key: 'DS_Glass',
    title: 'Vidro temperado 4 mm, inclinado a 18°',
    text: 'Onde o vapor condensa e a gota escorre.',
  },
  {
    key: 'DS_Gutter',
    title: 'Calha de aço inox',
    text: 'Leva o condensado para fora, sem misturar com a água bruta.',
  },
  {
    key: 'DS_Basin',
    title: 'Bacia de alumínio preto fosco',
    text: 'Absorve o sol e passa o calor para a água.',
  },
  {
    key: 'DS_Water_Brine',
    title: 'Lâmina d’água de 15 mm',
    text: 'Pouca água aquece mais rápido. 7,5 L em 0,5 m².',
  },
  {
    key: 'DS_Insulation',
    title: 'Isolamento EPS 40 mm',
    text: 'Segura o calor que escaparia pelo fundo e laterais.',
  },
  {
    key: 'DS_Frame',
    title: 'Estrutura de compensado tratado',
    text: 'Suporte, vedação e manutenção.',
  },
  {
    key: 'DS_Sensors',
    title: 'Sensores',
    text: 'Temperatura (DS18B20), nível, TDS e pH (calibração pendente).',
  },
] as const;

/** Três níveis de evidência, do que já existe ao que falta medir. */
export const digital = [
  {
    title: 'Feito · Integração ESP32',
    text: 'Firmware, validação e ponte local integrados ao repositório em 20/10/2026.',
    badge: 'confirmado' as BadgeKind,
  },
  {
    title: 'Demonstração · Gêmeo digital 3D',
    text: '12 componentes inspecionáveis e visão 360°. As leituras da tela são simuladas e cada uma indica a origem: real, ausente ou simulada.',
    badge: 'demo' as BadgeKind,
  },
  {
    title: 'Falta medir · Ensaios físicos',
    text: 'Vazão, temperatura da bacia e qualidade da água ainda não têm série de medições. Nenhum valor de desempenho desta página vem de ensaio.',
    badge: 'pendente' as BadgeKind,
  },
];

export const timeline = [
  {
    date: 'Mai–Ago 2026',
    text: 'Arquitetura com ESP32 e sensores; pitch, banner e modelo 3D; apresentação online.',
    badge: null,
    prize: null,
  },
  {
    date: '10 set 2026',
    text: 'Classificado para a Etapa Estadual da XVIII MECTI · regional Centro-Sul · Engenharias.',
    badge: 'confirmado' as BadgeKind,
    prize: null,
  },
  {
    date: 'Out 2026',
    text: 'Gêmeo digital r33 e integração ESP32 no repositório.',
    badge: 'confirmado' as BadgeKind,
    prize: null,
  },
  {
    date: '21–23 out 2026',
    text: 'Apresentação na 23ª Semana Nacional de Ciência e Tecnologia, Centro de Eventos do Pantanal.',
    badge: 'confirmado' as BadgeKind,
    prize: null,
  },
  {
    date: '3º lugar',
    text: '2º Festival Estadual High Tech · categoria Robótica · R$ 3.000.',
    badge: 'confirmado' as BadgeKind,
    prize: 'trofeu',
  },
  {
    date: 'Melhor projeto',
    text: 'Escolhido pela Águas Cuiabá.',
    badge: 'confirmado' as BadgeKind,
    prize: 'medalha',
  },
];

export const nextSteps = [
  { title: 'Versão física congelada', text: 'desenho cotado, lista de materiais, fotos.' },
  { title: 'Série de ensaios', text: 'dados brutos por dia, sensores calibrados, volumes aferidos.' },
  { title: 'Qualidade da água', text: 'laudos de laboratório após a remineralização.' },
  { title: 'Telemetria de campo', text: 'ESP32, gateway e backend com dados persistidos.' },
  { title: 'Destino da salmoura', text: 'balanço de massa e cristalizador solar.' },
];

export const team = ['Pedro Gomes', 'Lucas Pianesso', 'Matheus Santos'];
