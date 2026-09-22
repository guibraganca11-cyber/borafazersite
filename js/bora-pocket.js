const pocketViews = {
  vendas: {
    title: 'Suas vendas em perspectiva.', description: 'O que entrou, de onde veio e como está evoluindo.', graph: 'Evolução do faturamento',
    metrics: [['Faturamento', 'R$ 184,2 mil', '↗ 12,4% no período'], ['Pedidos', '1.248', '↗ 8,2% no período'], ['Ticket médio', 'R$ 147,60', '↗ 3,8% no período']],
    insight: 'As vendas cresceram nos últimos meses. Seu melhor canal representa 46% do total.', rankingTitle: 'De onde vêm as vendas', ranking: [['Loja online', '46%'], ['Marketplace', '34%'], ['Outros canais', '20%']], bars: [37, 52, 48, 64, 72, 90]
  },
  financeiro: {
    title: 'Seu dinheiro com mais clareza.', description: 'Receitas, despesas e margem em uma mesma visão.', graph: 'Receita e resultado',
    metrics: [['Receita', 'R$ 218,4 mil', '↗ 9,6% no período'], ['Despesas', 'R$ 142,1 mil', '↘ 2,1% no período'], ['Margem', '35,0%', '↗ 4,2 p.p. no período']],
    insight: 'A margem melhorou enquanto as despesas ficaram mais estáveis.', rankingTitle: 'Composição da receita', ranking: [['Recorrente', '52%'], ['Projetos', '31%'], ['Outros', '17%']], bars: [48, 57, 54, 65, 71, 83]
  },
  estoque: {
    title: 'Estoque sob controle.', description: 'O que gira, o que para e o que precisa de atenção.', graph: 'Movimento de produtos',
    metrics: [['Itens em estoque', '8.420', '↗ 5,1% no período'], ['Produtos críticos', '12', '↘ 6 vs. mês anterior'], ['Giro médio', '32 dias', '↘ 4 dias no período']],
    insight: 'Doze produtos pedem reposição. Os itens de maior giro estão concentrados em três categorias.', rankingTitle: 'Categorias em movimento', ranking: [['Linha A', '44%'], ['Linha B', '36%'], ['Linha C', '20%']], bars: [75, 61, 79, 65, 86, 73]
  },
  comercial: {
    title: 'O comercial em movimento.', description: 'Oportunidades, conversão e metas que saem do papel.', graph: 'Oportunidades abertas',
    metrics: [['Oportunidades', '186', '↗ 14,2% no período'], ['Conversão', '27,4%', '↗ 3,1 p.p. no período'], ['Meta atingida', '82%', '↗ 7 p.p. no período']],
    insight: 'A conversão subiu. Há oportunidades próximas do fechamento que merecem acompanhamento.', rankingTitle: 'Etapas do funil', ranking: [['Proposta', '42%'], ['Negociação', '35%'], ['Fechamento', '23%']], bars: [31, 43, 47, 60, 67, 84]
  },
  operacao: {
    title: 'A rotina sem pontos cegos.', description: 'Prazos, produtividade e alertas reunidos.', graph: 'Pedidos no prazo',
    metrics: [['Pedidos no prazo', '94,8%', '↗ 2,4 p.p. no período'], ['Em atraso', '18', '↘ 7 vs. mês anterior'], ['Atendimentos', '328', '↗ 11% no período']],
    insight: 'Os atrasos caíram. Um grupo pequeno de pedidos ainda concentra as pendências.', rankingTitle: 'Situação dos pedidos', ranking: [['No prazo', '94,8%'], ['Em atenção', '3,7%'], ['Atrasados', '1,5%']], bars: [64, 72, 70, 78, 81, 93]
  }
};

const tabs = [...document.querySelectorAll('[data-view]')];
const panel = document.querySelector('#demo-panel');
let switchTimer;

function showPocketView(key) {
  const view = pocketViews[key];
  if (!view || !panel) return;
  clearTimeout(switchTimer);
  panel.classList.add('switching');
  switchTimer = setTimeout(() => {
    document.querySelector('#demo-category').textContent = key.toUpperCase();
    document.querySelector('#demo-title').textContent = view.title;
    document.querySelector('#demo-description').textContent = view.description;
    document.querySelector('#demo-graph-title').textContent = view.graph;
    document.querySelector('#demo-insight').textContent = view.insight;
    document.querySelector('#ranking-title').textContent = view.rankingTitle;
    view.metrics.forEach(([label, value, change], i) => {
      document.querySelector(`#metric-label-${i + 1}`).textContent = label;
      document.querySelector(`#metric-value-${i + 1}`).textContent = value;
      document.querySelector(`#metric-change-${i + 1}`).textContent = change;
    });
    document.querySelector('#ranking-list').replaceChildren(...view.ranking.map(([name, value]) => {
      const row = document.createElement('div');
      const label = document.createElement('span');
      const amount = document.createElement('b');
      label.textContent = name;
      amount.textContent = value;
      row.append(label, amount);
      return row;
    }));
    [...document.querySelectorAll('#demo-bars span')].forEach((bar, i) => bar.style.setProperty('--h', `${view.bars[i]}%`));
    tabs.forEach(tab => {
      const active = tab.dataset.view === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panel.classList.remove('switching');
  }, 140);
}

tabs.forEach((tab, index) => {
  tab.tabIndex = index === 0 ? 0 : -1;
  tab.addEventListener('click', () => showPocketView(tab.dataset.view));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus();
    showPocketView(tabs[next].dataset.view);
  });
});

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach(item => item.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
}

if (!reduceMotion) {
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = element => {
    const target = Number(element.dataset.count);
    const integer = element.dataset.locale === 'integer';
    const format = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: integer ? 0 : 1, minimumFractionDigits: integer ? 0 : 1 });
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / 950, 1);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = `${element.dataset.prefix || ''}${format.format(target * eased)}${element.dataset.suffix || ''}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    });
    counters.forEach(element => counterObserver.observe(element));
  }
}
