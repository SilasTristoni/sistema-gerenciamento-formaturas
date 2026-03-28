import { api } from './services/api.js';
import { auth } from './services/auth.js';

let monthlyChart = null;
let categoryChart = null;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const formatCurrency = (value = 0) => currencyFormatter.format(Number(value || 0));

function formatDate(value) {
  if (!value) return 'Sem data';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

function monthKey(value) {
  if (!value) return 'Sem data';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  if (key === 'Sem data') return key;
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function sortByDateAsc(items = [], field = 'dataEvento') {
  return [...items].sort((a, b) => {
    const da = a?.[field] ? new Date(`${a[field]}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
    const db = b?.[field] ? new Date(`${b[field]}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
    return da - db;
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function buildMonthlySeries(financeiro = []) {
  const grouped = new Map();

  financeiro.forEach(item => {
    const key = monthKey(item.dataLancamento);
    if (!grouped.has(key)) grouped.set(key, { receitas: 0, despesas: 0 });

    const entry = grouped.get(key);
    if ((item.tipo || '').toLowerCase() === 'receita') {
      entry.receitas += Number(item.valor || 0);
    } else {
      entry.despesas += Number(item.valor || 0);
    }
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, values]) => ({ label: monthLabel(key), ...values }));
}

function buildCategorySeries(financeiro = []) {
  const grouped = new Map();
  financeiro
    .filter(item => (item.tipo || '').toLowerCase() === 'despesa')
    .forEach(item => {
      const category = item.referencia || item.descricao || 'Sem categoria';
      grouped.set(category, (grouped.get(category) || 0) + Number(item.valor || 0));
    });

  return [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function destroyCharts() {
  monthlyChart?.destroy?.();
  categoryChart?.destroy?.();
  monthlyChart = null;
  categoryChart = null;
}

function renderCharts(financeiro) {
  const monthlyCanvas = document.getElementById('monthlyChart');
  const categoryCanvas = document.getElementById('categoryChart');
  if (!monthlyCanvas || !categoryCanvas || typeof Chart === 'undefined') return;

  destroyCharts();

  const monthlySeries = buildMonthlySeries(financeiro);
  const categorySeries = buildCategorySeries(financeiro);

  monthlyChart = new Chart(monthlyCanvas, {
    type: 'bar',
    data: {
      labels: monthlySeries.map(item => item.label),
      datasets: [
        {
          label: 'Receitas',
          data: monthlySeries.map(item => item.receitas),
          backgroundColor: 'rgba(16, 185, 129, 0.76)',
          borderRadius: 10,
          maxBarThickness: 28
        },
        {
          label: 'Despesas',
          data: monthlySeries.map(item => item.despesas),
          backgroundColor: 'rgba(239, 68, 68, 0.72)',
          borderRadius: 10,
          maxBarThickness: 28
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#cbd5e1', usePointStyle: true, boxWidth: 10 }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
        y: {
          ticks: { color: '#94a3b8', callback: value => formatCurrency(value) },
          grid: { color: 'rgba(148,163,184,0.08)' }
        }
      }
    }
  });

  categoryChart = new Chart(categoryCanvas, {
    type: 'doughnut',
    data: {
      labels: categorySeries.map(item => item[0]),
      datasets: [{
        data: categorySeries.map(item => item[1]),
        backgroundColor: [
          'rgba(16, 185, 129, 0.82)',
          'rgba(59, 130, 246, 0.82)',
          'rgba(168, 85, 247, 0.82)',
          'rgba(249, 115, 22, 0.82)',
          'rgba(236, 72, 153, 0.82)'
        ],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#cbd5e1', usePointStyle: true, boxWidth: 10, padding: 18 }
        }
      }
    }
  });
}

function renderList(containerId, items, formatter) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = items.map(formatter).join('') || '<div class="summary-card"><p>Nenhum registro disponível.</p></div>';
}

function showTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelectorAll('.side-nav__item').forEach(item => item.classList.remove('active'));
  document.getElementById(`tab-${tabId}`)?.classList.add('active');
  document.querySelector(`.side-nav__item[data-tab-target="${tabId}"]`)?.classList.add('active');
}

function bindNavigation() {
  document.querySelectorAll('[data-tab-target]').forEach(item => {
    item.addEventListener('click', () => showTab(item.dataset.tabTarget));
  });

  document.getElementById('scrollChartsBtn')?.addEventListener('click', () => {
    document.getElementById('chartsSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function redirectToLogin() {
  window.location.href = './login.html';
}

async function validateSession() {
  const token = auth.getToken();
  if (!token) {
    redirectToLogin();
    return null;
  }

  try {
    const me = await api.me();
    const login = me.login || me.email || 'usuario';
    setText('userName', me.nome || 'Usuário');
    setText('userRole', me.perfil === 'ROLE_COMISSAO' ? 'Comissão' : 'Formando(a)');
    const avatar = document.getElementById('userAvatar');
    if (avatar) avatar.textContent = (me.nome || 'U').charAt(0).toUpperCase();
    auth.saveSession({ token, perfil: me.perfil, nome: me.nome, login });
    return me;
  } catch (error) {
    auth.clearSession();
    redirectToLogin();
    return null;
  }
}

async function loadDashboard() {
  const me = await validateSession();
  if (!me) return;

  const [turmas, alunos, financeiro, eventos, votacoes] = await Promise.all([
    api.buscar('turmas'),
    api.buscar('alunos'),
    api.buscar('financeiro'),
    api.buscar('eventos'),
    api.buscar('votacoes')
  ]);

  const receitas = financeiro.filter(item => (item.tipo || '').toLowerCase() === 'receita')
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const despesas = financeiro.filter(item => (item.tipo || '').toLowerCase() === 'despesa')
    .reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const saldo = receitas - despesas;
  const inadimplentes = alunos.filter(aluno => ['pendente', 'atrasado'].includes((aluno.status || '').toLowerCase())).length;
  const orderedEvents = sortByDateAsc(eventos, 'dataEvento');
  const nextEvent = orderedEvents[0] || {};

  setText('statSaldo', formatCurrency(saldo));
  setText('statReceitas', formatCurrency(receitas));
  setText('statDespesas', formatCurrency(despesas));
  setText('statInadimplentes', inadimplentes);
  setText('nextEventName', nextEvent.nome || 'Nenhum agendado');
  setText('nextEventDate', nextEvent.dataEvento ? formatDate(nextEvent.dataEvento) : 'Sem data');
  setText('nextEventLocation', nextEvent.localEvento || 'Local a definir');

  setText('summaryEvents', eventos.length);
  setText('summaryNextEvent', nextEvent.nome || 'Nenhum');
  setText('financeSaldo', formatCurrency(saldo));
  setText('financeReceitas', formatCurrency(receitas));
  setText('financeDespesas', formatCurrency(despesas));
  setText('lastUpdate', new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  renderCharts(financeiro);

  renderList('agendaPreviewList', orderedEvents.slice(0, 4), evento => `
    <article class="list-item">
      <div class="list-item__meta">
        <p class="list-item__title">${evento.nome || 'Evento sem nome'}</p>
        <small class="list-item__subtitle">${formatDate(evento.dataEvento)} • ${evento.localEvento || 'Local a definir'}</small>
      </div>
      <span class="badge">${evento.status || 'Agendado'}</span>
    </article>
  `);

  renderList('agendaTimeline', orderedEvents.slice(0, 10), evento => `
    <article class="list-item">
      <div class="list-item__date">
        <span>${evento.dataEvento ? formatDate(evento.dataEvento).split('/')[0] : '--'}</span>
        <small>${evento.dataEvento ? formatDate(evento.dataEvento).split('/').slice(1).join('/') : 'sem data'}</small>
      </div>
      <div class="list-item__meta">
        <p class="list-item__title">${evento.nome || 'Evento sem nome'}</p>
        <small class="list-item__subtitle">${evento.localEvento || 'Local a definir'}</small>
      </div>
      <span class="badge">${evento.status || 'Agendado'}</span>
    </article>
  `);

  renderList('recentTransactions', [...financeiro].slice(-5).reverse(), item => `
    <article class="list-item">
      <div class="list-item__meta">
        <p class="list-item__title">${item.descricao}</p>
        <small class="list-item__subtitle">${item.dataLancamento ? formatDate(item.dataLancamento) : 'Sem data'} • ${item.referencia || 'Financeiro'}</small>
      </div>
      <strong class="${(item.tipo || '').toLowerCase() === 'receita' ? 'money-positive' : 'money-negative'}">
        ${(item.tipo || '').toLowerCase() === 'receita' ? '+' : '-'} ${formatCurrency(item.valor)}
      </strong>
    </article>
  `);

  renderList('financeList', [...financeiro].reverse().slice(0, 8), item => `
    <article class="list-item">
      <div class="list-item__meta">
        <p class="list-item__title">${item.descricao}</p>
        <small class="list-item__subtitle">${item.dataLancamento ? formatDate(item.dataLancamento) : 'Sem data'} • ${item.referencia || 'Sem referência'}</small>
      </div>
      <strong class="${(item.tipo || '').toLowerCase() === 'receita' ? 'money-positive' : 'money-negative'}">
        ${(item.tipo || '').toLowerCase() === 'receita' ? '+' : '-'} ${formatCurrency(item.valor)}
      </strong>
    </article>
  `);
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  auth.clearSession();
  redirectToLogin();
});

document.getElementById('refreshBtn')?.addEventListener('click', () => {
  loadDashboard().catch(console.error);
});

bindNavigation();
loadDashboard().catch(console.error);
