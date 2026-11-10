import { CrystalList, Counter, Cursor, CycleSteps, DotNav, LayerList, Names, ScrollDriver, Stage } from '@/components/Client';
import { Badge, Kicker, LogoMark, Title } from '@/components/ui';
import { digital, nextSteps, team, timeline } from '@/lib/content';
import { mailto, site } from '@/site.config';

function Poster({ n, alt }: { n: number; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="poster" src={`/posters/poster-cap${n}.webp`} alt={alt} width={1600} height={1000} loading="lazy" decoding="async" />
  );
}

export default function Page() {
  return (
    <>
      <a className="skip" href="#problema">
        Pular para a história
      </a>
      <ScrollDriver />
      <Stage />
      <Cursor />
      <header className="top">
        <a href="#abertura" className="top__logo" aria-label="DeSol — voltar ao início">
          <LogoMark size={30} />
          <span>DeSol</span>
        </a>
        <a href="#contato" className="top__cta">
          Falar com a equipe
        </a>
      </header>
      <DotNav />

      <main>
        {/* 0 · Abertura */}
        <section id="abertura" data-chapter="0" data-theme="ink" className="ch ch--hero">
          <div className="pin">
            <div className="hero">
              <p className="label rv">Dessalinizador solar inteligente</p>
              <Title as="h1" className="title--hero">
                O sol tira o sal da água.
              </Title>
              <p className="lead rv">
                O DeSol usa calor solar para separar sal da água e sensores para provar o que acontece em cada litro.
              </p>
              <p className="hint rv">
                Role para seguir uma gota <span aria-hidden="true">↓</span>
              </p>
            </div>
            <p className="hero__foot">Senac Quantum · Cuiabá, Mato Grosso · 2026</p>
          </div>
        </section>

        {/* 1 · O problema */}
        <section id="problema" data-chapter="1" data-theme="ink" className="ch ch--right">
          <div className="pin">
            <Poster n={1} alt="Poço de água salobra na ilha, com três cristais de sal em suspensão" />
            <div className="card" data-cursor="brine">
              <div className="beat">
              <Kicker n={1}>O problema</Kicker>
              <Title>Ter água não é o mesmo que poder beber.</Title>
              <p className="rv">
                Em comunidades rurais e isoladas, existe poço, existe reservatório — mas a água é salobra. Os sais dissolvidos precisam sair
                antes do consumo.
              </p>
              </div>
              <div className="beat">
              <p className="rv">
                As soluções de fora dependem de estrada, eletricidade, troca de membrana e técnico. Quando uma dessas peças falha, a água
                para.
              </p>
              </div>
              <div className="beat">
              <CrystalList />
              </div>
            </div>
          </div>
        </section>

        {/* 2 · A origem */}
        <section id="origem" data-chapter="2" data-theme="paper" className="ch ch--left">
          <div className="pin">
            <Poster n={2} alt="A ilha em miniatura sobre uma mesa de laboratório, com três folhas de rascunho" />
            <div className="card">
              <div className="beat">
              <Kicker n={2}>A origem</Kicker>
              <Title>De uma pesquisa de mestrado para uma sala de aula.</Title>
              <p className="rv">
                O orientador João Pedro Cunha trouxe uma pesquisa do mestrado e decidiu aprofundá-la com os alunos do curso técnico em
                Inteligência Artificial do Senac Quantum, em Cuiabá, no Programa Desenvolve AI.
              </p>
              </div>
              <div className="beat">
              <p className="rv">
                O raciocínio foi uma decisão de engenharia, não a invenção de um princípio novo: água disponível mas imprópria → separar os
                sais → pouca energia e infraestrutura → usar o sol → evaporar, condensar e coletar num equipamento modular.
              </p>
              </div>
              <div className="beat">
              <Names />
              <p className="note rv">Três nomes, uma ideia ficando mais clara.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 · Como funciona */}
        <section id="como-funciona" data-chapter="3" data-theme="ink" className="ch ch--right ch--scrub">
          <div className="pin">
            <Poster n={3} alt="Corte lateral do módulo: água salobra na bacia, vapor subindo, gotas no vidro inclinado e calha de coleta" />
            <div className="card">
              <Kicker n={3}>Como funciona</Kicker>
              <Title>Aquece, evapora, condensa, coleta.</Title>
              <CycleSteps />
              <p className="note">
                Separar o sal não garante potabilidade sozinho. Qualidade da água exige análise de laboratório — e esse é o próximo passo do
                projeto.
              </p>
            </div>
          </div>
        </section>

        {/* 4 · Por dentro do módulo */}
        <section id="por-dentro" data-chapter="4" data-theme="ink" className="ch ch--left ch--long">
          <div className="pin">
            <Poster n={4} alt="Vista explodida do módulo, com as sete camadas separadas no ar" />
            <div className="card">
              <Kicker n={4}>Por dentro do módulo</Kicker>
              <Title>Cada camada tem um trabalho.</Title>
              <p className="sub">
                Especificação de referência do módulo <Badge kind="projetado" />
              </p>
              <LayerList />
              <p className="note">
                Área útil 0,5 m² · Caixa ~112 × 62 cm (desenho de outubro) <Badge kind="projetado" />
              </p>
            </div>
          </div>
        </section>

        {/* 5 · O sistema digital */}
        <section id="digital" data-chapter="5" data-theme="ink" className="ch ch--right ch--instrument">
          <div className="pin">
            <Poster n={5} alt="Sensores do módulo acesos, com linhas de dados chegando a um tablet com o painel em modo demonstração" />
            <div className="card">
              <div className="beat">
              <Kicker n={5}>O sistema digital</Kicker>
              <Title>Não é um painel bonito: é a prova.</Title>
              <p className="rv">O DeSol tem três camadas conectadas: o protótipo físico, o sistema digital e a investigação científica.</p>
              </div>
              <div className="beat">
              <p className="rv">
                Um ESP32 lê os sensores e envia os dados; o gêmeo digital mostra o equipamento em 3D, com histórico, eventos e a origem de
                cada leitura. Quando um dado é simulado, ele diz que é simulado.
              </p>
              </div>
              <div className="beat">
              <dl className="readouts">
                {digital.map((d) => (
                  <div key={d.title} className="rv">
                    <dt>
                      {d.title} {d.badge && <Badge kind={d.badge} />}
                    </dt>
                    <dd>{d.text}</dd>
                  </div>
                ))}
              </dl>
              <p className="rowline">
                <Badge kind="demo">Demo — dados simulados</Badge>
                <a className="link" href={site.github} target="_blank" rel="noopener noreferrer">
                  Ver o código no GitHub <span aria-hidden="true">→</span>
                </a>
              </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6 · A trajetória */}
        <section id="trajetoria" data-chapter="6" data-theme="paper" className="ch ch--left ch--flow">
          <div className="flow">
            <Poster n={6} alt="Estrada da ilha com placas de cada marco, troféu e medalha" />
            <div className="card">
              <Kicker n={6}>A trajetória</Kicker>
              <Title>De Cuiabá para o pódio.</Title>
              <p className="rv">Seis marcos de 2026, na ordem em que aconteceram.</p>
            </div>
            <ol className="tl">
              {timeline.map((t) => (
                <li key={t.date} className={`tl__item rv${t.prize ? ' tl__item--prize' : ''}`}>
                  <p className="tl__date">{t.date}</p>
                  <p>{t.text}</p>
                  {t.badge && <Badge kind={t.badge} />}
                </li>
              ))}
            </ol>
          </div>
          <div className="band">
            <ul className="band__nums">
              <li>
                <strong className="band__sun">
                  <Counter to={3} suffix="º" />
                </strong>
                <span>lugar no 2º Festival Estadual High Tech, categoria Robótica</span>
              </li>
              <li>
                <strong>
                  <Counter to={3000} prefix="R$ " />
                </strong>
                <span>de premiação no Festival</span>
              </li>
              <li>
                <strong>
                  <Counter to={2} /> <small>prêmios</small>
                </strong>
                <span>na 23ª Semana Nacional de Ciência e Tecnologia</span>
              </li>
            </ul>
            <p className="band__src">
              <Badge kind="confirmado" /> Fonte: Senac-MT, 28/10/2026.
            </p>
          </div>
        </section>

        {/* 7 · O próximo capítulo */}
        <section id="proximo" data-chapter="7" data-theme="ink" className="ch ch--right ch--long">
          <div className="pin">
            <Poster n={7} alt="Quatro módulos DeSol lado a lado e a caixa d'água da ilha enchendo" />
            <div className="card">
              <div className="beat">
              <Kicker n={7}>O próximo capítulo</Kicker>
              <Title>Agora, medir.</Title>
              <p className="rv">
                Prêmio mostra que a ideia convence. O próximo passo é provar, com dados, quanto o DeSol produz e com que qualidade.
              </p>
              </div>
              <div className="beat">
              <ol className="marks">
                {nextSteps.map((s, i) => (
                  <li key={s.title} className="rv">
                    <span>{i + 1}</span>
                    <p>
                      <strong>{s.title}</strong> — {s.text}
                    </p>
                  </li>
                ))}
              </ol>
              </div>
              <div className="beat goal">
                <p className="goal__label">Meta de escala · quatro módulos</p>
                <p className="goal__num">
                  9,6 a 10,8 <small>L/dia</small> <Badge kind="estimado" />
                </p>
                <div className="goal__bar" role="img" aria-label="Barra ilustrativa da meta estimada de 9,6 a 10,8 litros por dia">
                  <i />
                </div>
                <p className="note">Estimativa de projeto — será substituída por medição.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8 · Equipe e contato */}
        <section id="contato" data-chapter="8" data-theme="ink" className="ch ch--end">
          <Poster n={8} alt="Vista aérea da ilha ao pôr do sol" />
          <div className="end">
            <div className="beat">
              <Kicker n={8}>Equipe e contato</Kicker>
              <Title className="title--end">Quer ver isso funcionando no seu território?</Title>
            </div>
            <div className="end__grid rv">
              <dl className="beat">
                <div>
                  <dt>Equipe</dt>
                  <dd>{team.join(' · ')}</dd>
                </div>
                <div>
                  <dt>Orientação</dt>
                  <dd>João Pedro Cunha — instrutor do Senac-MT</dd>
                </div>
                <div>
                  <dt>Instituição</dt>
                  <dd>Senac Quantum · Programa Desenvolve AI · Cuiabá-MT</dd>
                </div>
              </dl>
              <div className="end__cta beat">
                <a className="btn btn--sun" href={mailto('Contato DeSol')}>
                  Falar com a equipe
                </a>
                <a className="btn" href={site.github} target="_blank" rel="noopener noreferrer">
                  Ver o código
                </a>
                <a className="btn" href={mailto('Kit técnico DeSol')}>
                  Pedir o kit técnico
                </a>
              </div>
            </div>
          </div>
          <footer className="foot">
            <div className="foot__logo">
              <LogoMark size={56} title="DeSol" />
            </div>
            <p>
              DeSol · 2026 · Projeto acadêmico em desenvolvimento. Valores marcados como projetados ou estimados ainda não foram medidos.
            </p>
            <ul>
              {site.sources.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </footer>
        </section>
      </main>
    </>
  );
}
