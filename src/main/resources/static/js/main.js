import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { dashboardPrefs } from './services/dashboardPrefs.js';
import { ui } from './components/ui.js';
import { modal } from './components/modal.js';
import { showToast } from './components/toast.js';

let db = { turmas: [], alunos: [], eventos: [], financeiro: [], votacoes: [], dashboard: null, contribuicoes: null, relatorio: null };
let usuarioLogado = null;
let monthlyChart = null;
const LAST_TURMA_KEY = 'gestaoform.lastTurmaId';
const DASHBOARD_FILTER_KEY = 'gestaoform.dashboard.filters';
const CONTRIBUTION_FILTER_KEY = 'gestaoform.contribuicoes.filters';
const REPORT_FILTER_KEY = 'gestaoform.relatorios.filters';
const DEFAULT_DASHBOARD_FILTERS = {
    turmaId: '',
    periodMonths: '6'
};
const DEFAULT_CONTRIBUTION_FILTERS = {
    turmaId: ''
};
const DEFAULT_REPORT_FILTERS = {
    turmaId: '',
    periodMonths: '6'
};
const agendaState = {
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDate: toDateInputValue(new Date())
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupDashboardFilterControls();
    setupModalEvents();
    dashboardPrefs.init();
    verificarSessao();
});

function redirectToLogin() {
    window.location.href = window.APP_CONFIG?.LOGIN_URL || 'login.html';
}

async function verificarSessao() {
    const token = auth.getToken();

    if (!token) {
        auth.clearSession();
        redirectToLogin();
        return;
    }

    try {
        usuarioLogado = await api.me();
        if (usuarioLogado.perfil !== 'ROLE_COMISSAO') {
            window.location.href = 'aluno.html';
            return;
        }

        auth.saveSession({
            token,
            perfil: usuarioLogado.perfil,
            nome: usuarioLogado.nome,
            login: usuarioLogado.login || usuarioLogado.email
        });

        const nome = usuarioLogado.nome || 'Usuário';
        const login = usuarioLogado.login || usuarioLogado.email || 'usuario';

        if (document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').innerText = nome;
        if (document.getElementById('userAvatar')) document.getElementById('userAvatar').innerText = nome.charAt(0).toUpperCase();
        if (document.getElementById('userRoleDisplay')) document.getElementById('userRoleDisplay').innerText = usuarioLogado.perfil === 'ROLE_COMISSAO' ? 'Comissão' : 'Formando(a)';
        if (document.getElementById('userLoginDisplay')) document.getElementById('userLoginDisplay').innerText = '@' + login.replace('@gestaoform.local', '');

        await carregarDados();
        document.body.classList.remove('auth-pending');
    } catch (error) {
        console.error(error);
        auth.clearSession();
        redirectToLogin();
    }
}

window.logout = () => {
    auth.clearSession();
    redirectToLogin();
};

export async function carregarDados() {
    try {
        syncMainDashboardFilterInputs();
        syncContributionFilterInputs();
        syncReportFilterInputs();
        const turmas = await api.buscar('turmas');
        normalizeDashboardFiltersForTurmas(turmas);
        normalizeContributionFiltersForTurmas(turmas);
        normalizeReportFiltersForTurmas(turmas);
        populateMainDashboardTurmaFilter(turmas);
        populateContributionTurmaFilter(turmas);
        populateReportTurmaFilter(turmas);
        syncMainDashboardFilterInputs();
        syncContributionFilterInputs();
        syncReportFilterInputs();

        const [alunos, financeiro, eventos, votacoes, dashboard, contribuicoes] = await Promise.all([
            api.buscar('alunos'),
            api.buscar('financeiro'),
            api.buscar('eventos'),
            api.buscar('votacoes'),
            api.dashboardResumo(getDashboardFilterPayload()),
            api.contribuicoesResumo(getContributionFilterPayload())
        ]);

        db = { ...db, turmas, alunos, financeiro, eventos, votacoes, dashboard, contribuicoes };

        ui.renderTurmas(db.turmas);
        ui.renderAlunos(db.alunos);
        if (document.getElementById('eventosBody')) ui.renderEventos(db.eventos);
        if (document.getElementById('financeiroBody')) ui.renderFinanceiro(db.financeiro);
        if (document.getElementById('votacoesContainer')) ui.renderVotacoes(db.votacoes, db.alunos);
        renderIntegratedDashboard(db.dashboard);
        renderAgendaModule(db.eventos, db.turmas);
        renderContributions(db.contribuicoes);
        renderReportModule(db.relatorio);

        document.querySelectorAll('.btn-admin').forEach(btn => {
            btn.style.display = usuarioLogado?.perfil === 'ROLE_COMISSAO' ? 'inline-flex' : 'none';
        });
    } catch (error) {
        console.error(error);
        if ((error.message || '').toLowerCase().includes('expirada')) {
            showToast('Sua sessão expirou.', 'error');
            setTimeout(window.logout, 1200);
            return;
        }
        showToast(error.message || 'Erro ao conectar com servidor', 'error');
    }
}
window.carregarDados = carregarDados;

function formatCurrency(value = 0) {
    return currencyFormatter.format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return 'Sem data';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Sem data';
    return date.toLocaleDateString('pt-BR');
}

function formatPercent(value = 0) {
    return `${Number(value || 0).toFixed(0)}%`;
}

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function readDashboardFilters() {
    try {
        const saved = JSON.parse(localStorage.getItem(DASHBOARD_FILTER_KEY) || '{}');
        return {
            turmaId: saved.turmaId || DEFAULT_DASHBOARD_FILTERS.turmaId,
            periodMonths: saved.periodMonths || DEFAULT_DASHBOARD_FILTERS.periodMonths
        };
    } catch (error) {
        return { ...DEFAULT_DASHBOARD_FILTERS };
    }
}

function writeDashboardFilters(filters) {
    localStorage.setItem(DASHBOARD_FILTER_KEY, JSON.stringify(filters));
}

function readContributionFilters() {
    try {
        const saved = JSON.parse(localStorage.getItem(CONTRIBUTION_FILTER_KEY) || '{}');
        return {
            turmaId: saved.turmaId || DEFAULT_CONTRIBUTION_FILTERS.turmaId
        };
    } catch (error) {
        return { ...DEFAULT_CONTRIBUTION_FILTERS };
    }
}

function writeContributionFilters(filters) {
    localStorage.setItem(CONTRIBUTION_FILTER_KEY, JSON.stringify(filters));
}

function readReportFilters() {
    try {
        const saved = JSON.parse(localStorage.getItem(REPORT_FILTER_KEY) || '{}');
        return {
            turmaId: saved.turmaId || DEFAULT_REPORT_FILTERS.turmaId,
            periodMonths: saved.periodMonths || DEFAULT_REPORT_FILTERS.periodMonths
        };
    } catch (error) {
        return { ...DEFAULT_REPORT_FILTERS };
    }
}

function writeReportFilters(filters) {
    localStorage.setItem(REPORT_FILTER_KEY, JSON.stringify(filters));
}

function getDashboardFilterPayload() {
    const filters = readDashboardFilters();
    return {
        turmaId: filters.turmaId ? Number(filters.turmaId) : undefined,
        periodMonths: Number(filters.periodMonths || DEFAULT_DASHBOARD_FILTERS.periodMonths)
    };
}

function getContributionFilterPayload() {
    const filters = readContributionFilters();
    return {
        turmaId: filters.turmaId ? Number(filters.turmaId) : undefined
    };
}

function getReportFilterPayload() {
    const filters = readReportFilters();
    return {
        turmaId: filters.turmaId ? Number(filters.turmaId) : undefined,
        periodMonths: Number(filters.periodMonths || DEFAULT_REPORT_FILTERS.periodMonths)
    };
}

function syncMainDashboardFilterInputs() {
    const filters = readDashboardFilters();
    const turmaSelect = document.getElementById('mainDashboardTurmaFilter');
    const periodSelect = document.getElementById('mainDashboardPeriodFilter');

    if (turmaSelect) turmaSelect.value = filters.turmaId;
    if (periodSelect) periodSelect.value = filters.periodMonths;
}

function syncContributionFilterInputs() {
    const filters = readContributionFilters();
    const turmaSelect = document.getElementById('contributionTurmaFilter');
    if (turmaSelect) turmaSelect.value = filters.turmaId;
}

function syncReportFilterInputs() {
    const filters = readReportFilters();
    const turmaSelect = document.getElementById('reportTurmaFilter');
    const periodSelect = document.getElementById('reportPeriodFilter');

    if (turmaSelect) turmaSelect.value = filters.turmaId;
    if (periodSelect) periodSelect.value = filters.periodMonths;
}

function parseLocalDate(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getPreferredTurmaId(turmas = []) {
    const lastTurmaId = localStorage.getItem(LAST_TURMA_KEY);
    if (turmas.some(turma => String(turma.id) === lastTurmaId)) return lastTurmaId;
    return turmas.length === 1 ? String(turmas[0].id) : '';
}

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function resolveNotificationAction(item = {}) {
    const label = String(item.actionLabel || 'Acompanhar');
    const lower = label.toLowerCase();
    if (lower.includes('agenda')) return "navigate('eventos')";
    if (lower.includes('contribu')) return "navigate('contribuicoes')";
    if (lower.includes('votac')) return "navigate('votacao')";
    if (lower.includes('turma')) return "navigate('turmas')";
    return "carregarDados()";
}

function renderSimpleList(containerId, items, formatter, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items?.length
        ? items.map(formatter).join('')
        : `<div class="command-empty">${escapeHtml(emptyMessage)}</div>`;
}

function destroyDashboardCharts() {
    monthlyChart?.destroy?.();
    monthlyChart = null;
}

function renderDashboardCharts(monthlyFinancial = [], expenseCategories = []) {
    const monthlyCanvas = document.getElementById('monthlyChart');
    if (!monthlyCanvas || typeof Chart === 'undefined') return;

    destroyDashboardCharts();

    monthlyChart = new Chart(monthlyCanvas, {
        type: 'bar',
        data: {
            labels: monthlyFinancial.map(item => item.monthLabel),
            datasets: [
                {
                    label: 'Receitas',
                    data: monthlyFinancial.map(item => item.receitas),
                    backgroundColor: 'rgba(52, 211, 153, 0.72)',
                    borderRadius: 10,
                    maxBarThickness: 26
                },
                {
                    label: 'Despesas',
                    data: monthlyFinancial.map(item => item.despesas),
                    backgroundColor: 'rgba(248, 113, 113, 0.72)',
                    borderRadius: 10,
                    maxBarThickness: 26
                },
                {
                    label: 'Saldo',
                    data: monthlyFinancial.map(item => item.saldo),
                    type: 'line',
                    tension: 0.38,
                    borderColor: '#4fd1c5',
                    pointBackgroundColor: '#4fd1c5',
                    pointRadius: 4
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0', usePointStyle: true, boxWidth: 10 }
                }
            },
            scales: {
                x: { ticks: { color: '#9fb1c7' }, grid: { display: false } },
                y: {
                    ticks: { color: '#9fb1c7', callback: value => formatCurrency(value) },
                    grid: { color: 'rgba(159, 177, 199, 0.12)' }
                }
            }
        }
    });

}

function renderIntegratedDashboard(dashboard) {
    if (!dashboard) return;

    const overview = dashboard.overview || {};
    const nextEvent = dashboard.nextEvent || {};
    const goalProgress = dashboard.goalProgress || {};
    const forecast = dashboard.forecast || {};
    setText('lastUpdate', new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setText('statSaldo', formatCurrency(overview.saldoTotal));
    setText('statReceitas', formatCurrency(overview.totalReceitas));
    setText('statDespesas', formatCurrency(overview.totalDespesas));
    setText('statTurmas', overview.totalTurmas ?? 0);
    setText('nextEventName', nextEvent.nome || 'Nenhum evento agendado');
    setText('nextEventDate', nextEvent.data ? formatDate(nextEvent.data) : 'Sem data definida');
    setText('nextEventLocation', nextEvent.local || 'Local a definir');
    setText('nextEventCountdown', nextEvent.diasRestantes >= 0 ? `${nextEvent.diasRestantes} dias` : 'sem data');
    renderGoalProgress(goalProgress);
    setText('mainForecastBalance', formatCurrency(forecast.projectedNextBalance));
    setText('mainForecastHint', forecast.recommendation || 'Sem previsão calculada ainda.');
    setText('mainDashboardScopeLabel', dashboard.filters?.scopeLabel || 'Visão consolidada de todas as turmas');
    setText(
        'mainDashboardFilterHint',
        `${dashboard.filters?.turmaNome || 'Todas as turmas'} | Janela de ${dashboard.filters?.periodMonths || DEFAULT_DASHBOARD_FILTERS.periodMonths} meses | Tendência ${forecast.trend || 'neutral'}`
    );
    setText('financeStatus', overview.saldoTotal >= 0
        ? 'Estamos acompanhando o caixa da turma.'
        : 'O caixa precisa de mais cuidado agora.');

    renderSimpleList('alertsList', dashboard.alerts, item => `
        <article class="simple-alert simple-alert--${escapeHtml(item.level || 'low')}">
            <p class="simple-alert__title">${escapeHtml(item.title || 'Sem alerta')}</p>
            <p class="simple-alert__copy">${escapeHtml(item.description || '')}</p>
        </article>
    `, 'Nenhum alerta relevante no momento.');

    renderSimpleList('notificationsList', dashboard.notifications, item => `
        <article class="simple-item simple-item--notification">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.title || 'Ação recomendada')}</p>
                <p class="simple-item__subtitle">${escapeHtml(item.description || '')}</p>
            </div>
            <div class="simple-item__side">
                <button type="button" onclick="${resolveNotificationAction(item)}" class="simple-pill simple-pill--${escapeHtml(item.level || 'info')}">${escapeHtml(item.actionLabel || 'Acompanhar')}</button>
            </div>
        </article>
    `, 'Nenhuma ação crítica no momento.');

    renderSimpleList('agendaPreviewList', dashboard.upcomingEvents, item => `
        <article class="simple-item">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.nome || 'Evento sem nome')}</p>
                <p class="simple-item__subtitle">${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.local || 'Local a definir')}</p>
                <p class="simple-item__subtitle">${escapeHtml(formatEventAttendance(item))}</p>
            </div>
        </article>
    `, 'Nenhum evento cadastrado.');

    renderSimpleList('recentTransactions', dashboard.recentTransactions, item => `
        <article class="simple-item">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.descricao || 'Lançamento')}</p>
                <p class="simple-item__subtitle">${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.referencia || 'Sem categoria')} | ${escapeHtml(item.turmaNome || 'Sem turma')}</p>
            </div>
            <div class="simple-item__side">
                <strong class="${(item.tipo || '').toLowerCase() === 'receita' ? 'money-positive' : 'money-negative'}">${(item.tipo || '').toLowerCase() === 'receita' ? '+' : '-'} ${escapeHtml(formatCurrency(item.valor))}</strong>
            </div>
        </article>
    `, 'Nenhum lançamento recente.');

    renderSimpleList('goalRankingList', dashboard.topTurmas, item => `
        <article class="simple-item simple-item--goal">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.nome || 'Turma')}</p>
                <p class="simple-item__subtitle">${escapeHtml(item.curso || 'Curso não informado')} | ${escapeHtml(formatCurrency(item.totalArrecadado || 0))} de ${escapeHtml(formatCurrency(item.metaArrecadacao || 0))}</p>
                <div class="goal-table-progress mt-3">
                    <div class="goal-table-progress__bar" style="width:${Math.max(0, Math.min(Number(item.percentualMeta || 0), 100))}%;"></div>
                </div>
            </div>
            <div class="simple-item__side">
                <strong>${Math.round(Number(item.percentualMeta || 0))}%</strong>
                <small class="block mt-1 text-slate-500">${item.metaArrecadacao > 0 ? escapeHtml(formatCurrency(item.valorRestanteMeta || 0)) + ' restantes' : 'sem meta'}</small>
            </div>
        </article>
    `, 'Cadastre metas nas turmas para comparar o progresso por arrecadação.');

    renderDashboardCharts(dashboard.monthlyFinancial, []);
}

function renderGoalProgress(goalProgress = {}) {
    const valorArrecadado = Number(goalProgress.valorArrecadado || 0);
    const valorMeta = Number(goalProgress.valorMeta || 0);
    const percentualAtingido = Number(goalProgress.percentualAtingido || 0);
    const percentualVisual = Math.max(0, Math.min(percentualAtingido, 100));
    const valorRestante = Number(goalProgress.valorRestante || 0);
    const metaDefinida = Boolean(goalProgress.metaDefinida);
    const metaAtingida = Boolean(goalProgress.metaAtingida);

    setText('goalProgressTitle', goalProgress.titulo || 'Meta ainda não definida');
    setText('goalProgressDescription', goalProgress.descricao || 'Cadastre uma meta para visualizar o progresso da arrecadação.');
    setText('goalProgressPercent', `${Math.round(percentualAtingido)}%`);
    setText('goalProgressRaised', formatCurrency(valorArrecadado));
    setText('goalProgressTarget', metaDefinida ? formatCurrency(valorMeta) : 'Defina uma meta');
    setText('goalProgressRemaining', metaDefinida ? formatCurrency(valorRestante) : '--');

    const badge = document.getElementById('goalProgressBadge');
    if (badge) {
        badge.textContent = !metaDefinida ? 'Sem meta' : metaAtingida ? 'Meta batida' : 'Em andamento';
        badge.className = `simple-goal-badge ${!metaDefinida ? 'simple-goal-badge--neutral' : metaAtingida ? 'simple-goal-badge--success' : 'simple-goal-badge--warning'}`;
    }

    const bar = document.getElementById('goalProgressBar');
    if (bar) {
        bar.style.width = `${percentualVisual}%`;
        bar.className = `simple-goal-progress__bar ${!metaDefinida ? 'simple-goal-progress__bar--neutral' : metaAtingida ? 'simple-goal-progress__bar--success' : ''}`;
    }
}

function sortEventsAsc(eventos = []) {
    return [...eventos].sort((a, b) => {
        const da = parseLocalDate(a.dataEvento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const dbDate = parseLocalDate(b.dataEvento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return da - dbDate;
    });
}

function eventsByDate(eventos = []) {
    return eventos.reduce((acc, evento) => {
        if (!evento.dataEvento) return acc;
        if (!acc[evento.dataEvento]) acc[evento.dataEvento] = [];
        acc[evento.dataEvento].push(evento);
        return acc;
    }, {});
}

function formatEventAttendance(evento = {}) {
    return `${Number(evento.presencas || 0)} presencas | ${Number(evento.talvez || 0)} talvez | ${Number(evento.faltas || 0)} faltas | ${Number(evento.pendentes || 0)} pendentes`;
}

function renderAgendaActions(evento = {}) {
    if (!evento.id) return '';
    return `
        <div class="agenda-item__actions btn-admin" style="display:none;">
            <button type="button" onclick="editarRegistro('evento', ${evento.id})" class="agenda-action-btn" aria-label="Editar evento"><i class="ph ph-pencil-simple"></i></button>
            <button type="button" onclick="excluirRegistro('evento', ${evento.id})" class="agenda-action-btn agenda-action-btn--danger" aria-label="Excluir evento"><i class="ph ph-trash"></i></button>
        </div>
    `;
}

function populateAgendaTurmas(turmas = []) {
    const select = document.getElementById('agendaQuickTurma');
    if (!select) return;
    const currentValue = select.value;
    const preferred = getPreferredTurmaId(turmas);
    select.innerHTML = turmas.length
        ? turmas.map(turma => `<option value="${turma.id}">${escapeHtml(turma.nome)}</option>`).join('')
        : '<option value="">Cadastre uma turma primeiro</option>';

    if (turmas.some(turma => String(turma.id) === currentValue)) {
        select.value = currentValue;
        return;
    }

    if (preferred) {
        select.value = preferred;
    }
}

function populateMainDashboardTurmaFilter(turmas = []) {
    const select = document.getElementById('mainDashboardTurmaFilter');
    if (!select) return;

    const currentValue = readDashboardFilters().turmaId;
    select.innerHTML = `
        <option value="">Todas as turmas</option>
        ${turmas.map(turma => `<option value="${turma.id}">${escapeHtml(turma.nome || 'Turma')}</option>`).join('')}
    `;
    select.value = turmas.some(turma => String(turma.id) === currentValue) ? currentValue : '';
}

function normalizeDashboardFiltersForTurmas(turmas = []) {
    const filters = readDashboardFilters();
    if (filters.turmaId && !turmas.some(turma => String(turma.id) === filters.turmaId)) {
        filters.turmaId = '';
        writeDashboardFilters(filters);
    }
}

function populateContributionTurmaFilter(turmas = []) {
    const select = document.getElementById('contributionTurmaFilter');
    if (!select) return;

    const currentValue = readContributionFilters().turmaId;
    select.innerHTML = `
        <option value="">Todas as turmas</option>
        ${turmas.map(turma => `<option value="${turma.id}">${escapeHtml(turma.nome || 'Turma')}</option>`).join('')}
    `;
    select.value = turmas.some(turma => String(turma.id) === currentValue) ? currentValue : '';
}

function normalizeContributionFiltersForTurmas(turmas = []) {
    const filters = readContributionFilters();
    if (filters.turmaId && !turmas.some(turma => String(turma.id) === filters.turmaId)) {
        filters.turmaId = '';
        writeContributionFilters(filters);
    }
}

function populateReportTurmaFilter(turmas = []) {
    const select = document.getElementById('reportTurmaFilter');
    if (!select) return;

    const currentValue = readReportFilters().turmaId;
    select.innerHTML = `
        <option value="">Todas as turmas</option>
        ${turmas.map(turma => `<option value="${turma.id}">${escapeHtml(turma.nome || 'Turma')}</option>`).join('')}
    `;
    select.value = turmas.some(turma => String(turma.id) === currentValue) ? currentValue : '';
}

function normalizeReportFiltersForTurmas(turmas = []) {
    const filters = readReportFilters();
    if (filters.turmaId && !turmas.some(turma => String(turma.id) === filters.turmaId)) {
        filters.turmaId = '';
        writeReportFilters(filters);
    }
}

function renderContributions(contribuicoes) {
    const summary = contribuicoes?.summary || {};
    const recentes = contribuicoes?.recentes || [];
    const turmas = contribuicoes?.turmas || [];

    setText('contributionTotal', formatCurrency(summary.totalContribuicoes || 0));
    setText('contributionScopeLabel', summary.scopeLabel || 'Contribuições de todas as turmas');
    setText('contributionCount', summary.quantidadeContribuicoes ?? 0);
    setText('contributionAverage', `Ticket médio ${formatCurrency(summary.ticketMedio || 0)}`);
    setText('contributionRemaining', formatCurrency(summary.metaRestante || 0));
    setText('contributionProgressLabel', `${Math.round(Number(summary.percentualMeta || 0))}% da meta atingida`);

    renderSimpleList('contributionRecentList', recentes, item => `
        <article class="simple-item">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.titulo || 'Contribuição')}</p>
                <p class="simple-item__subtitle">${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.turmaNome || 'Sem turma')} | ${escapeHtml(item.apoiadorNome || 'Apoiador da turma')}</p>
                <p class="simple-item__subtitle">${escapeHtml(item.mensagem || 'Sem mensagem adicional')}</p>
            </div>
            <div class="simple-item__side">
                <strong class="money-positive">+ ${escapeHtml(formatCurrency(item.valor || 0))}</strong>
            </div>
        </article>
    `, 'Nenhuma contribuição registrada ainda.');

    renderSimpleList('contributionTurmaList', turmas, item => `
        <article class="simple-item simple-item--goal">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.turmaNome || 'Turma')}</p>
                <p class="simple-item__subtitle">${item.quantidadeContribuicoes || 0} apoios | ${escapeHtml(formatCurrency(item.totalContribuicoes || 0))} registrados</p>
                <div class="goal-table-progress mt-3">
                    <div class="goal-table-progress__bar" style="width:${Math.max(0, Math.min(Number(item.percentualMeta || 0), 100))}%;"></div>
                </div>
            </div>
            <div class="simple-item__side">
                <strong>${Math.round(Number(item.percentualMeta || 0))}%</strong>
                <small class="block mt-1 text-slate-500">${escapeHtml(formatCurrency(item.metaRestante || 0))} restantes</small>
            </div>
        </article>
    `, 'Nenhuma turma encontrada para este filtro.');
}

function formatRunway(value = 0) {
    const numericValue = Number(value || 0);
    if (numericValue <= 0) return 'Sem base';
    return `${numericValue.toFixed(1).replace('.', ',')} meses`;
}

function renderReportModule(report) {
    const emptyState = document.getElementById('reportEmptyState');
    const resultPanel = document.getElementById('reportResultPanel');
    const exportButtons = [
        document.getElementById('exportReportPdfBtn'),
        document.getElementById('exportReportSummaryCsvBtn'),
        document.getElementById('exportReportTransactionsCsvBtn')
    ];
    const currentFilters = readReportFilters();
    const summary = report?.summary || {};
    const filters = report?.filters || {};

    if (!report) {
        if (emptyState) emptyState.hidden = false;
        if (resultPanel) resultPanel.hidden = true;
        exportButtons.forEach(button => button && (button.disabled = true));
        setText('reportScopeLabel', currentFilters.turmaId ? 'Relatorio preparado para turma selecionada' : 'Visao consolidada de todas as turmas');
        setText(
            'reportFilterHint',
            `${currentFilters.turmaId ? 'Filtro por turma ativo' : 'Todas as turmas'} | Janela de ${currentFilters.periodMonths || DEFAULT_REPORT_FILTERS.periodMonths} meses | Clique em gerar relatorio`
        );
        return;
    }

    if (emptyState) emptyState.hidden = true;
    if (resultPanel) resultPanel.hidden = false;
    exportButtons.forEach(button => button && (button.disabled = false));

    setText('reportCurrentBalance', formatCurrency(summary.saldoAtualEscopo || 0));
    setText('reportGeneratedAt', report.generatedAt ? `Gerado em ${new Date(report.generatedAt).toLocaleString('pt-BR')}` : 'Gerado agora');
    setText('reportPeriodRevenue', formatCurrency(summary.receitasPeriodo || 0));
    setText('reportAverageNet', `Resultado medio ${formatCurrency(summary.resultadoMedioMensal || 0)}`);
    setText('reportPeriodExpenses', formatCurrency(summary.despesasPeriodo || 0));
    setText('reportRunwayMonths', `Cobertura ${formatRunway(summary.coberturaCaixaMeses || 0)}`);
    setText('reportPeriodContributions', formatCurrency(summary.totalContribuicoesPeriodo || 0));
    setText('reportContributionShare', `Participacao ${formatPercent(summary.participacaoContribuicoesReceita || 0)}`);
    setText('reportScopeLabel', filters.scopeLabel || 'Visao consolidada de todas as turmas');
    setText(
        'reportFilterHint',
        `${filters.turmaNome || 'Todas as turmas'} | Janela de ${filters.periodMonths || DEFAULT_REPORT_FILTERS.periodMonths} meses | ${summary.totalLancamentosPeriodo || 0} lancamentos no recorte`
    );

    renderSimpleList('reportSummaryList', [
        {
            title: 'Escopo selecionado',
            description: filters.scopeLabel || 'Visao consolidada de todas as turmas'
        },
        {
            title: 'Periodo analisado',
            description: `${filters.periodMonths || DEFAULT_REPORT_FILTERS.periodMonths} meses`
        },
        {
            title: 'Lancamentos considerados',
            description: `${summary.totalLancamentosPeriodo || 0} registros no recorte`
        },
        {
            title: 'Contribuicoes registradas',
            description: `${formatCurrency(summary.totalContribuicoesPeriodo || 0)} no periodo`
        }
    ], item => `
        <article class="simple-item">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.title || 'Resumo')}</p>
                <p class="simple-item__subtitle">${escapeHtml(item.description || '')}</p>
            </div>
        </article>
    `, 'Nenhum resumo disponivel.');

    renderSimpleList('reportInsightsList', report?.insights || [], item => `
        <article class="simple-item">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.title || 'Leitura')}</p>
                <p class="simple-item__subtitle">${escapeHtml(item.description || '')}</p>
            </div>
            <div class="simple-item__side">
                <span class="simple-pill simple-pill--${escapeHtml(item.tone || 'info')}">${escapeHtml(item.tone || 'info')}</span>
            </div>
        </article>
    `, 'Nenhum insight disponivel para o recorte atual.');
}

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
}

function renderAgendaModule(eventos = [], turmas = []) {
    populateAgendaTurmas(turmas);

    const monthLabel = document.getElementById('agendaMonthLabel');
    if (monthLabel) {
        monthLabel.textContent = agendaState.currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    renderAgendaCalendar(eventos);
    renderAgendaSelectedDay(eventos);
    renderAgendaUpcoming(eventos);
}

function renderAgendaCalendar(eventos = []) {
    const container = document.getElementById('agendaCalendarGrid');
    if (!container) return;

    const firstDay = new Date(agendaState.currentMonth.getFullYear(), agendaState.currentMonth.getMonth(), 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - startOffset);
    const eventMap = eventsByDate(eventos);
    const todayValue = toDateInputValue(new Date());

    const days = [];
    for (let index = 0; index < 42; index += 1) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);

        const value = toDateInputValue(date);
        const isCurrentMonth = date.getMonth() === agendaState.currentMonth.getMonth();
        const isSelected = value === agendaState.selectedDate;
        const isToday = value === todayValue;
        const dayEvents = eventMap[value] || [];
        const preview = dayEvents[0]?.nome || '';

        days.push(`
            <button class="agenda-day ${isCurrentMonth ? '' : 'agenda-day--muted'} ${isSelected ? 'agenda-day--selected' : ''} ${isToday ? 'agenda-day--today' : ''}" onclick="selecionarDataAgenda('${value}')">
                <div class="agenda-day__top">
                    <span class="agenda-day__number">${date.getDate()}</span>
                    ${dayEvents.length ? `<span class="agenda-day__count">${dayEvents.length}</span>` : ''}
                </div>
                <div class="agenda-day__preview">${escapeHtml(preview)}</div>
            </button>
        `);
    }

    container.innerHTML = days.join('');
}

function renderAgendaSelectedDay(eventos = []) {
    const label = document.getElementById('agendaSelectedDateLabel');
    const container = document.getElementById('agendaDayEvents');
    if (!label || !container) return;

    const selected = parseLocalDate(agendaState.selectedDate);
    label.textContent = selected
        ? selected.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
        : 'Selecione um dia';

    const items = sortEventsAsc(eventos).filter(evento => evento.dataEvento === agendaState.selectedDate);
    container.innerHTML = items.length
        ? items.map(evento => `
            <article class="agenda-item">
                <div class="agenda-item__main">
                    <p class="agenda-item__title">${escapeHtml(evento.nome || 'Evento sem nome')}</p>
                    <p class="agenda-item__subtitle">${escapeHtml(evento.localEvento || 'Local a definir')}</p>
                    <p class="agenda-item__subtitle">${escapeHtml(formatEventAttendance(evento))}</p>
                </div>
                <div class="agenda-item__side">
                    <span class="agenda-item__badge">${escapeHtml(evento.status || 'agendado')}</span>
                    ${renderAgendaActions(evento)}
                </div>
            </article>
        `).join('')
        : '<div class="simple-empty">Nenhum evento marcado para esse dia.</div>';
}

function renderAgendaUpcoming(eventos = []) {
    const container = document.getElementById('agendaUpcomingList');
    if (!container) return;

    const today = toDateInputValue(new Date());
    const items = sortEventsAsc(eventos)
        .filter(evento => !evento.dataEvento || evento.dataEvento >= today)
        .slice(0, 6);

    container.innerHTML = items.length
        ? items.map(evento => `
            <article class="agenda-item">
                <div class="agenda-item__main">
                    <p class="agenda-item__title">${escapeHtml(evento.nome || 'Evento sem nome')}</p>
                    <p class="agenda-item__subtitle">${escapeHtml(formatDate(evento.dataEvento))} | ${escapeHtml(evento.localEvento || 'Local a definir')}</p>
                    <p class="agenda-item__subtitle">${escapeHtml(formatEventAttendance(evento))}</p>
                </div>
                <div class="agenda-item__side">
                    <span class="agenda-item__badge">${escapeHtml(evento.status || 'agendado')}</span>
                    ${renderAgendaActions(evento)}
                </div>
            </article>
        `).join('')
        : '<div class="simple-empty">Nenhum próximo evento cadastrado.</div>';
}

function setupModalEvents() {
    window.openModal = (mode, kind) => modal.open(kind, db.turmas, db.alunos);
    window.closeModal = () => modal.close();

    window.salvarFormulario = async (e) => {
        e.preventDefault();
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = 'Salvando...';
        btn.disabled = true;

        const data = modal.getData();
        const validationError = validateFormData(data);
        if (validationError) {
            showToast(validationError, 'error');
            btn.innerText = originalText;
            btn.disabled = false;
            return;
        }

        let endpoint = '';
        let payload = {};

        if (data.kind === 'turma') {
            endpoint = '/turma';
            payload = {
                nome: data.nome,
                curso: data.desc,
                instituicao: data.instituicao || 'Instituicao nao informada',
                anoSemestre: data.anoSemestre,
                representante: data.representante,
                status: data.statusTurma,
                metaArrecadacao: Number(data.valor || 0)
            };
        } else {
            if (!data.turmaId) {
                showToast('Selecione uma turma', 'error');
                btn.innerText = originalText;
                btn.disabled = false;
                return;
            }

            switch (data.kind) {
                case 'aluno':
                    endpoint = '/aluno';
                    payload = {
                        nome: data.nome,
                        identificador: data.identificador,
                        email: data.email,
                        whatsapp: data.whatsapp,
                        contato: data.email || data.whatsapp,
                        turmaId: data.turmaId,
                        status: data.statusAluno,
                        observacaoInterna: data.desc,
                        perfil: data.perfil,
                        senha: data.senha
                    };
                    break;
                case 'evento':
                    endpoint = '/evento';
                    payload = {
                        nome: data.nome,
                        descricao: data.desc,
                        data: data.data,
                        horario: data.horario || null,
                        local: data.localEvento || data.desc,
                        turmaId: data.turmaId,
                        tipo: data.tipoEvento,
                        responsavel: data.responsavelEvento,
                        status: data.statusEvento
                    };
                    break;
                case 'lancamento': {
                    endpoint = '/lancamento';
                    const val = Math.abs(parseFloat(data.valor || 0));
                    payload = {
                        descricao: data.nome,
                        tipo: data.tipoFinanceiro,
                        valor: val,
                        data: data.data,
                        dataVencimento: data.dataVencimento || null,
                        referencia: data.categoriaFinanceira,
                        categoria: data.categoriaFinanceira,
                        formaPagamento: data.formaPagamento,
                        status: data.statusFinanceiro,
                        observacao: data.desc,
                        campanha: data.campanha,
                        turmaId: data.turmaId
                    };
                    break;
                }
                case 'contribuicao':
                    payload = {
                        titulo: data.nome,
                        valor: Number(data.valor || 0),
                        data: data.data,
                        mensagem: data.desc,
                        campanha: data.campanha,
                        formaPagamento: data.formaPagamento,
                        status: data.statusFinanceiro,
                        turmaId: Number(data.turmaId),
                        alunoId: data.alunoId ? Number(data.alunoId) : null,
                        apoiadorNome: data.apoiadorNome,
                        anonima: data.anonima
                    };
                    break;
                case 'votacao':
                    endpoint = '/votacao';
                    payload = {
                        titulo: data.nome,
                        descricao: data.desc,
                        dataInicio: data.dataInicioVotacao || data.data,
                        dataFim: data.data,
                        turmaId: data.turmaId,
                        status: data.statusVotacao,
                        tipo: data.tipoVotacao,
                        visibilidadeResultado: data.visibilidadeResultado,
                        anonima: data.votacaoAnonima,
                        quorumMinimo: data.quorumMinimo ? Number(data.quorumMinimo) : null
                    };
                    break;
                default:
                    showToast('Tipo não implementado', 'error');
                    btn.innerText = originalText;
                    btn.disabled = false;
                    return;
            }
        }

        const method = data.id ? 'PUT' : 'POST';
        const finalEndpoint = data.id ? `${endpoint}/${data.id}` : endpoint;

        try {
            if (data.kind === 'contribuicao') {
                if (data.id) throw new Error('Edição de contribuição ainda não está disponível.');
                await api.registrarContribuicao(payload);
            } else {
                await api.salvar(finalEndpoint, payload, method);
            }
            showToast(data.id ? 'Cadastro atualizado com sucesso!' : 'Cadastro salvo com sucesso!', 'success');
            modal.close();
            await carregarDados();
        } catch (err) {
            showToast('Erro: ' + err.message, 'error');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
}

function validateFormData(data) {
    if (!data.kind) return 'Selecione o tipo de cadastro.';

    if (!data.nome) return 'Preencha o nome principal do cadastro.';

    if (data.kind === 'turma' && !data.desc) {
        return 'Informe o curso da turma.';
    }

    if (data.kind === 'turma' && data.valor) {
        const meta = Number(data.valor);
        if (!Number.isFinite(meta) || meta < 0) {
            return 'Informe uma meta válida para a turma.';
        }
    }

    if (['aluno', 'evento', 'lancamento', 'contribuicao', 'votacao'].includes(data.kind) && !data.turmaId) {
        return 'Selecione uma turma.';
    }

    if (data.kind === 'aluno' && data.senha && data.senha.trim().length > 0 && data.senha.trim().length < 6) {
        return 'A senha do aluno precisa ter pelo menos 6 caracteres.';
    }

    if (['evento', 'lancamento', 'contribuicao', 'votacao'].includes(data.kind) && !data.data) {
        return 'Escolha uma data.';
    }

    if (data.kind === 'lancamento') {
        const valor = Number(data.valor);
        if (!Number.isFinite(valor) || valor === 0) {
            return 'Informe um valor diferente de zero para o lançamento.';
        }
    }

    if (data.kind === 'contribuicao') {
        const valor = Number(data.valor);
        if (!Number.isFinite(valor) || valor <= 0) {
            return 'Informe um valor positivo para a contribuição.';
        }
    }

    return '';
}

function setupNavigation() {
    window.navigate = (screenId) => {
        document.querySelectorAll('.screen').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('active');
        });
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        const target = document.getElementById(`screen-${screenId}`);
        const btn = document.getElementById(`nav-${screenId}`);
        target?.classList.remove('hidden');
        target?.classList.add('active');
        btn?.classList.add('active');
    };

    window.navigate('dashboard');
}

function setupDashboardFilterControls() {
    syncMainDashboardFilterInputs();
    syncContributionFilterInputs();
    syncReportFilterInputs();

    document.getElementById('mainDashboardTurmaFilter')?.addEventListener('change', event => {
        const filters = readDashboardFilters();
        filters.turmaId = event.target.value || '';
        writeDashboardFilters(filters);
        carregarDados().catch(console.error);
    });

    document.getElementById('mainDashboardPeriodFilter')?.addEventListener('change', event => {
        const filters = readDashboardFilters();
        filters.periodMonths = event.target.value || DEFAULT_DASHBOARD_FILTERS.periodMonths;
        writeDashboardFilters(filters);
        carregarDados().catch(console.error);
    });

    document.getElementById('contributionTurmaFilter')?.addEventListener('change', event => {
        const filters = readContributionFilters();
        filters.turmaId = event.target.value || '';
        writeContributionFilters(filters);
        carregarDados().catch(console.error);
    });

    document.getElementById('reportTurmaFilter')?.addEventListener('change', event => {
        const filters = readReportFilters();
        filters.turmaId = event.target.value || '';
        writeReportFilters(filters);
        db.relatorio = null;
        renderReportModule(null);
    });

    document.getElementById('reportPeriodFilter')?.addEventListener('change', event => {
        const filters = readReportFilters();
        filters.periodMonths = event.target.value || DEFAULT_REPORT_FILTERS.periodMonths;
        writeReportFilters(filters);
        db.relatorio = null;
        renderReportModule(null);
    });
}

window.generateReport = async () => {
    const button = document.getElementById('generateReportBtn');
    const originalLabel = button?.innerHTML;

    try {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="ph ph-spinner-gap animate-spin"></i> Gerando...';
        }

        const report = await api.relatorioFinanceiro(getReportFilterPayload());
        db.relatorio = report;
        renderReportModule(report);
        showToast('Relatorio gerado com sucesso!', 'success');
    } catch (error) {
        showToast(error.message || 'Erro ao gerar relatorio', 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalLabel || 'Gerar relatorio';
        }
    }
};

window.exportReportFile = async (resourcePath) => {
    try {
        if (!db.relatorio) {
            showToast('Gere o relatorio antes de exportar.', 'error');
            return;
        }
        const { blob, filename } = await api.exportarRelatorioFinanceiro(resourcePath, getReportFilterPayload());
        downloadBlob(blob, filename);
        showToast('Relatorio exportado com sucesso!', 'success');
    } catch (error) {
        showToast(error.message || 'Erro ao exportar relatorio', 'error');
    }
};

window.mudarMesAgenda = (delta) => {
    agendaState.currentMonth = new Date(agendaState.currentMonth.getFullYear(), agendaState.currentMonth.getMonth() + delta, 1);
    renderAgendaModule(db.eventos, db.turmas);
};

window.selecionarDataAgenda = (dateValue) => {
    agendaState.selectedDate = dateValue;
    const selected = parseLocalDate(dateValue);
    if (selected) {
        agendaState.currentMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
    }
    renderAgendaModule(db.eventos, db.turmas);
};

window.abrirNovoEventoDataSelecionada = () => {
    window.openModal('new', 'evento');
    const modalData = document.getElementById('modalData');
    if (modalData) modalData.value = agendaState.selectedDate;
};

window.salvarEventoRapido = async () => {
    const nome = document.getElementById('agendaQuickName')?.value?.trim() || '';
    const local = document.getElementById('agendaQuickLocal')?.value?.trim() || '';
    const turmaId = document.getElementById('agendaQuickTurma')?.value || '';

    if (!agendaState.selectedDate) {
        showToast('Selecione uma data no calendário.', 'error');
        return;
    }

    if (!nome) {
        showToast('Digite o nome do evento.', 'error');
        return;
    }

    if (!turmaId) {
        showToast('Selecione uma turma para o evento.', 'error');
        return;
    }

    try {
        localStorage.setItem(LAST_TURMA_KEY, turmaId);
        await api.salvar('/evento', {
            nome,
            data: agendaState.selectedDate,
            local,
            turmaId: Number(turmaId)
        }, 'POST');

        const quickName = document.getElementById('agendaQuickName');
        const quickLocal = document.getElementById('agendaQuickLocal');
        if (quickName) quickName.value = '';
        if (quickLocal) quickLocal.value = '';

        showToast('Evento salvo na agenda!', 'success');
        await carregarDados();
        window.navigate('eventos');
    } catch (err) {
        showToast(err.message || 'Erro ao salvar evento', 'error');
    }
};

window.exportTableCSV = (tableId, filename) => {
    const table = document.getElementById(tableId);
    if (!table) return showToast('Tabela vazia', 'error');

    const csv = [];
    table.querySelectorAll('tr').forEach(rowEl => {
        const row = [];
        rowEl.querySelectorAll('td, th').forEach(col => {
            let data = col.innerText.replace(/(\r\n|\n|\r)/gm, '').trim();
            data = data.replace(/"/g, '""');
            row.push('"' + data + '"');
        });
        csv.push(row.join(';'));
    });

    const csvFile = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(csvFile);
    link.download = filename + '.csv';
    link.click();
};


window.votar = async (votacaoId, opcaoId) => {
    try {
        await api.votar(Number(votacaoId), Number(opcaoId));
        showToast('Voto computado com sucesso!', 'success');
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao votar', 'error');
    }
};

window.adicionarOpcaoUI = async (votacaoId) => {
    openOptionModal(votacaoId);
};

function ensureOptionModal() {
    let modalEl = document.getElementById('optionModal');
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.id = 'optionModal';
    modalEl.className = 'fixed inset-0 bg-dark-900/80 backdrop-blur-sm hidden items-center justify-center z-[75] p-4';
    modalEl.innerHTML = `
        <div class="bg-dark-800 w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="modal-intro__eyebrow">Opção de votação</p>
                    <h3 class="text-xl font-bold text-white">Adicionar opção</h3>
                </div>
                <button type="button" id="optionModalClose" class="text-slate-400 hover:text-white"><i class="ph ph-x"></i></button>
            </div>
            <div class="mt-5 space-y-4">
                <input id="optionModalVotacaoId" type="hidden" />
                <div><label class="form-label">Nome da opção</label><input id="optionModalNome" type="text" class="form-input" placeholder="Ex.: Fornecedor Alpha" /></div>
                <div><label class="form-label">Descrição curta</label><textarea id="optionModalDescricao" rows="3" class="form-input" placeholder="Diferenciais ou observações da opção"></textarea></div>
            </div>
            <div class="mt-6 flex gap-3">
                <button type="button" id="optionModalCancel" class="flex-1 btn-outline">Cancelar</button>
                <button type="button" id="optionModalSave" class="flex-1 btn-gradient">Salvar opção</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalEl);
    document.getElementById('optionModalClose')?.addEventListener('click', closeOptionModal);
    document.getElementById('optionModalCancel')?.addEventListener('click', closeOptionModal);
    document.getElementById('optionModalSave')?.addEventListener('click', salvarOpcaoModal);
    return modalEl;
}

function openOptionModal(votacaoId) {
    const modalEl = ensureOptionModal();
    document.getElementById('optionModalVotacaoId').value = votacaoId;
    document.getElementById('optionModalNome').value = '';
    document.getElementById('optionModalDescricao').value = '';
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
    window.setTimeout(() => document.getElementById('optionModalNome')?.focus(), 30);
}

function closeOptionModal() {
    const modalEl = document.getElementById('optionModal');
    modalEl?.classList.add('hidden');
    modalEl?.classList.remove('flex');
}

async function salvarOpcaoModal() {
    const votacaoId = document.getElementById('optionModalVotacaoId')?.value;
    const nome = document.getElementById('optionModalNome')?.value?.trim() || '';
    const descricaoCurta = document.getElementById('optionModalDescricao')?.value?.trim() || '';
    if (!nome) {
        showToast('Informe o nome da opção.', 'error');
        return;
    }
    try {
        await api.salvar(`/votacao/${votacaoId}/opcao`, { nome, descricaoCurta, detalhes: descricaoCurta }, 'POST');
        showToast('Opção adicionada com sucesso!', 'success');
        closeOptionModal();
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao adicionar opção.', 'error');
    }
}

window.importarAlunosCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (db.turmas.length === 0) {
        showToast('Cadastre uma turma primeiro!', 'error');
        event.target.value = '';
        return;
    }

    openCsvImportModal(file, event.target);
};

function ensureCsvImportModal() {
    let modalEl = document.getElementById('csvImportModal');
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.id = 'csvImportModal';
    modalEl.className = 'fixed inset-0 bg-dark-900/80 backdrop-blur-sm hidden items-center justify-center z-[75] p-4';
    modalEl.innerHTML = `
        <div class="bg-dark-800 w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="modal-intro__eyebrow">Importação CSV</p>
                    <h3 class="text-xl font-bold text-white">Importar alunos</h3>
                    <p class="mt-2 text-sm text-slate-400">Modelo esperado: nome;identificador;email;whatsapp;status;observacao. A senha temporária será gerada automaticamente.</p>
                </div>
                <button type="button" id="csvImportClose" class="text-slate-400 hover:text-white"><i class="ph ph-x"></i></button>
            </div>
            <div class="mt-5 space-y-4">
                <p id="csvImportFileName" class="text-sm text-slate-300"></p>
                <div><label class="form-label">Turma de destino</label><select id="csvImportTurma" class="form-input form-select"></select></div>
            </div>
            <div class="mt-6 flex gap-3">
                <button type="button" id="csvImportCancel" class="flex-1 btn-outline">Cancelar</button>
                <button type="button" id="csvImportSave" class="flex-1 btn-gradient">Importar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalEl);
    document.getElementById('csvImportClose')?.addEventListener('click', closeCsvImportModal);
    document.getElementById('csvImportCancel')?.addEventListener('click', closeCsvImportModal);
    document.getElementById('csvImportSave')?.addEventListener('click', confirmarImportacaoCsv);
    return modalEl;
}

let csvImportState = { file: null, input: null };

function openCsvImportModal(file, input) {
    csvImportState = { file, input };
    const modalEl = ensureCsvImportModal();
    const select = document.getElementById('csvImportTurma');
    if (select) {
        select.innerHTML = db.turmas.map(turma => `<option value="${turma.id}">${escapeHtml(turma.nome || 'Turma')}</option>`).join('');
        const lastTurmaId = localStorage.getItem(LAST_TURMA_KEY);
        if (db.turmas.some(turma => String(turma.id) === lastTurmaId)) select.value = lastTurmaId;
    }
    setText('csvImportFileName', `Arquivo selecionado: ${file.name}`);
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
}

function closeCsvImportModal() {
    const modalEl = document.getElementById('csvImportModal');
    modalEl?.classList.add('hidden');
    modalEl?.classList.remove('flex');
    if (csvImportState.input) csvImportState.input.value = '';
    csvImportState = { file: null, input: null };
}

async function confirmarImportacaoCsv() {
    const turmaId = document.getElementById('csvImportTurma')?.value;
    const file = csvImportState.file;
    if (!file || !turmaId) {
        showToast('Selecione arquivo e turma para importar.', 'error');
        return;
    }
    try {
        showToast('Lendo o arquivo...', 'success');
        localStorage.setItem(LAST_TURMA_KEY, turmaId);
        const resposta = await api.importarAlunosCSV(file, parseInt(turmaId, 10));
        showToast(resposta || 'Importação concluída!', 'success');
        closeCsvImportModal();
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao comunicar com o servidor', 'error');
    } finally {
        if (csvImportState.input) csvImportState.input.value = '';
    }
}

let registroParaExcluir = null;
window.excluirRegistro = (kind, id) => {
    registroParaExcluir = { kind, id };
    const modalConfirm = document.getElementById('confirmModal');
    if (modalConfirm) {
        modalConfirm.classList.remove('hidden');
        modalConfirm.classList.add('flex');
        modalConfirm.querySelector('.bg-dark-800')?.classList.replace('scale-95', 'scale-100');
        modalConfirm.querySelector('.bg-dark-800')?.classList.replace('opacity-0', 'opacity-100');
    }
};

window.fecharConfirmacao = () => {
    registroParaExcluir = null;
    const modalConfirm = document.getElementById('confirmModal');
    if (modalConfirm) {
        modalConfirm.querySelector('.bg-dark-800')?.classList.replace('scale-100', 'scale-95');
        modalConfirm.querySelector('.bg-dark-800')?.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => {
            modalConfirm.classList.add('hidden');
            modalConfirm.classList.remove('flex');
        }, 200);
    }
};

window.confirmarExclusaoAcao = async () => {
    if (!registroParaExcluir) return;
    const { kind, id } = registroParaExcluir;
    try {
        await api.deletar(`/${kind}/${id}`);
        showToast('Registro excluído com sucesso!', 'success');
        window.fecharConfirmacao();
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao excluir', 'error');
        window.fecharConfirmacao();
    }
};

window.editarRegistro = (kind, id) => {
    let lista = [];
    if (kind === 'turma') lista = db.turmas;
    else if (kind === 'aluno') lista = db.alunos;
    else if (kind === 'evento') lista = db.eventos;
    else if (kind === 'lancamento') lista = db.financeiro;
    else if (kind === 'votacao') lista = db.votacoes;

    const item = lista.find(i => i.id === id);
    if (!item) return;

    window.openModal('edit', kind);
    const modalTitle = document.querySelector('#modalTitle span');
    const modalLead = document.getElementById('modalLead');
    const modalHelp = document.getElementById('modalHelp');
    const modalSubmitButton = document.getElementById('modalSubmitButton');
    if (modalTitle) {
        const labels = {
            turma: 'Editar turma',
            aluno: 'Editar aluno',
            evento: 'Editar evento',
            lancamento: 'Editar lançamento',
            votacao: 'Editar votação'
        };
        modalTitle.textContent = labels[kind] || 'Editar cadastro';
    }
    if (modalLead) {
        const labels = {
            turma: 'Atualize os dados da turma e da meta',
            aluno: 'Revise acesso, contato e perfil do aluno',
            evento: 'Ajuste data, local e informações do evento',
            lancamento: 'Corrija valores ou categoria do movimento',
            votacao: 'Atualize o tema ou o prazo da votação'
        };
        modalLead.textContent = labels[kind] || 'Revise os dados do cadastro';
    }
    if (modalHelp) {
        modalHelp.textContent = 'As alterações serão aplicadas imediatamente ao painel e ao portal do aluno.';
    }
    if (modalSubmitButton) {
        modalSubmitButton.textContent = 'Salvar alterações';
    }
    document.getElementById('modalItemId') && (document.getElementById('modalItemId').value = item.id);
    document.getElementById('modalCategoria') && (document.getElementById('modalCategoria').value = kind);
    modal.toggleFields();

    document.getElementById('modalNome') && (document.getElementById('modalNome').value = item.nome || item.descricao || item.titulo || '');
    if (kind !== 'turma') document.getElementById('modalTurmaSelect') && (document.getElementById('modalTurmaSelect').value = item.turma?.id || '');

    if (kind === 'turma') {
        document.getElementById('modalDescricao') && (document.getElementById('modalDescricao').value = item.curso || '');
        document.getElementById('modalValor') && (document.getElementById('modalValor').value = item.metaArrecadacao ?? '');
        document.getElementById('modalInstituicao') && (document.getElementById('modalInstituicao').value = item.instituicao || '');
        document.getElementById('modalAnoSemestre') && (document.getElementById('modalAnoSemestre').value = item.anoSemestre || '');
        document.getElementById('modalRepresentante') && (document.getElementById('modalRepresentante').value = item.representante || '');
        document.getElementById('modalStatusTurma') && (document.getElementById('modalStatusTurma').value = (item.status || 'ATIVA').toUpperCase());
    } else if (kind === 'aluno') {
        document.getElementById('modalDescricao') && (document.getElementById('modalDescricao').value = item.observacaoInterna || '');
        document.getElementById('modalIdentificador') && (document.getElementById('modalIdentificador').value = item.identificador || '');
        document.getElementById('modalEmailAluno') && (document.getElementById('modalEmailAluno').value = item.email || item.contato || '');
        document.getElementById('modalWhatsappAluno') && (document.getElementById('modalWhatsappAluno').value = item.whatsapp || '');
        document.getElementById('modalStatusAluno') && (document.getElementById('modalStatusAluno').value = (item.status || 'ATIVO').toUpperCase());
    } else if (kind === 'evento') {
        document.getElementById('modalData') && (document.getElementById('modalData').value = item.dataEvento || '');
        document.getElementById('modalDescricao') && (document.getElementById('modalDescricao').value = item.descricao || '');
        document.getElementById('modalHorarioEvento') && (document.getElementById('modalHorarioEvento').value = item.horario || '');
        document.getElementById('modalLocalEvento') && (document.getElementById('modalLocalEvento').value = item.localEvento || '');
        document.getElementById('modalTipoEvento') && (document.getElementById('modalTipoEvento').value = (item.tipo || 'REUNIAO_GERAL').toUpperCase());
        document.getElementById('modalStatusEvento') && (document.getElementById('modalStatusEvento').value = (item.status || 'AGENDADO').toUpperCase());
        document.getElementById('modalResponsavelEvento') && (document.getElementById('modalResponsavelEvento').value = item.responsavel || '');
    } else if (kind === 'lancamento') {
        const valor = Math.abs(Number(item.valor || 0));
        document.getElementById('modalValor') && (document.getElementById('modalValor').value = valor);
        document.getElementById('modalData') && (document.getElementById('modalData').value = item.dataLancamento || '');
        document.getElementById('modalDescricao') && (document.getElementById('modalDescricao').value = item.observacao || item.referencia || '');
        document.getElementById('modalTipoFinanceiro') && (document.getElementById('modalTipoFinanceiro').value = (item.tipo || 'RECEITA').toUpperCase());
        document.getElementById('modalCategoriaFinanceira') && (document.getElementById('modalCategoriaFinanceira').value = item.categoria || item.referencia || 'OUTROS');
        document.getElementById('modalFormaPagamento') && (document.getElementById('modalFormaPagamento').value = item.formaPagamento || 'PIX');
        document.getElementById('modalStatusFinanceiro') && (document.getElementById('modalStatusFinanceiro').value = (item.status || 'CONFIRMADO').toUpperCase());
        document.getElementById('modalDataVencimento') && (document.getElementById('modalDataVencimento').value = item.dataVencimento || '');
        document.getElementById('modalCampanha') && (document.getElementById('modalCampanha').value = item.campanha || 'META_GERAL');
    } else if (kind === 'votacao') {
        document.getElementById('modalData') && (document.getElementById('modalData').value = item.dataFim || '');
        document.getElementById('modalDescricao') && (document.getElementById('modalDescricao').value = item.descricao || '');
        document.getElementById('modalDataInicioVotacao') && (document.getElementById('modalDataInicioVotacao').value = item.dataInicio || '');
        document.getElementById('modalStatusVotacao') && (document.getElementById('modalStatusVotacao').value = (item.status || 'ABERTA').toUpperCase());
        document.getElementById('modalTipoVotacao') && (document.getElementById('modalTipoVotacao').value = (item.tipo || 'ESCOLHA_UNICA').toUpperCase());
        document.getElementById('modalVisibilidadeResultado') && (document.getElementById('modalVisibilidadeResultado').value = (item.visibilidadeResultado || 'APOS_ENCERRAMENTO').toUpperCase());
        document.getElementById('modalQuorumMinimo') && (document.getElementById('modalQuorumMinimo').value = item.quorumMinimo ?? '');
        document.getElementById('modalVotacaoAnonima') && (document.getElementById('modalVotacaoAnonima').checked = item.anonima !== false);
    }
};
