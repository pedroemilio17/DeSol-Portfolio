/**
 * Configuração do site. Tudo que o usuário ainda vai decidir mora aqui.
 * Troque os valores marcados com TROCAR antes de publicar.
 */
export const site = {
  name: 'DeSol',
  title: 'DeSol — O sol tira o sal da água',
  description:
    'Dessalinizador solar inteligente com monitoramento hídrico, criado por alunos do Senac Quantum em Cuiabá-MT. 3º lugar no Festival Estadual High Tech e melhor projeto pela Águas Cuiabá.',
  /** TROCAR: domínio final (usado em Open Graph, canonical e JSON-LD). */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://desol.example',
  /** TROCAR: e-mail de contato da equipe. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@desol.example',
  github: 'https://github.com/pedroemilio17/DeSol',
  locale: 'pt-BR',
  /** Estrutura pronta para EN: acrescente 'en' e um dicionário em lib/content.ts. */
  locales: ['pt-BR'] as const,
  sources: [
    {
      label: 'Senac-MT, 28/10/2026 — prêmios na Semana Nacional de Tecnologia',
      href: 'https://www.mt.senac.br/Noticias/Alunos-do-senac-mt-conquistam-tres-premios-na-semana-nacional-de-tecnologia-1169',
    },
    {
      label: 'Senac-MT, 20/10/2026 — DeSol finalista da MECTI',
      href: 'https://www.mt.senac.br/Noticias/Alunos-do-senac-criam-solucao-com-ia-para-levar-agua-de-qualidade-a-comunidades-em-mato-grosso-1158',
    },
    {
      label: 'Primeira Página, 21/10/2026',
      href: 'https://primeirapagina.com.br/tecnologia/estudantes-de-cuiaba-criam-equipamento-que-usa-o-sol-para-tirar-sal-da-agua-e-ajudar-comunidades-afastadas/',
    },
    { label: 'SNCT/MECTI MT — resultados', href: 'https://snctmt.com.br/resultados' },
  ],
};

export const mailto = (subject: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
