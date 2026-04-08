import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { dashboardPrefs } from './services/dashboardPrefs.js';
import { ui } from './components/ui.js';
import { modal } from './components/modal.js';
import { showToast } from './components/toast.js';

let db = { turmas: [], alunos: [], eventos: [], financeiro: [], votacoes: [], dashboard: null };
let usuarioLogado = null;
let monthlyChart = null;
let categoryChart = null;
const LAST_TURMA_KEY = 'gestaoform.lastTurmaId';
const DASHBOARD_FILTER_KEY = 'gestaoform.dashboard.filters';
const DEFAULT_DASHBOARD_FILTERS = {
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

        const nome = usuarioLogado.nome || 'Usuario';
        const login = usuarioLogado.login || usuarioLogado.email || 'usuario';

        if (document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').innerText = nome;
        if (document.getElementById('userAvatar')) document.getElementById('userAvatar').innerText = nome.charAt(0).toUpperCase();
        if (document.getElementById('userRoleDisplay')) document.getElementById('userRoleDisplay').innerText = usuarioLogado.perfil === 'ROLE_COMISSAO' ? 'Comissao' : 'Formando(a)';
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
        const turmas = await api.buscar('turmas');
        normalizeDashboardFiltersForTurmas(turmas);
        populateMainDashboardTurmaFilter(turmas);
        syncMainDashboardFilterInputs();

        const [alunos, financeiro, eventos, votacoes, dashboard] = await Promise.all([
            api.buscar('alunos'),
            api.buscar('financeiro'),
            api.buscar('eventos'),
            api.buscar('votacoes'),
            api.dashboardResumo(getDashboardFilterPayload())
        ]);

        db = { turmas, alunos, financeiro, eventos, votacoes, dashboard };

        ui.renderTurmas(db.turmas);
        ui.renderAlunos(db.alunos);
        if (document.getElementById('eventosBody')) ui.renderEventos(db.eventos);
        if (document.getElementById('financeiroBody')) ui.renderFinanceiro(db.financeiro);
        if (document.getElementById('votacoesContainer')) ui.renderVotacoes(db.votacoes, db.alunos);
        renderIntegratedDashboard(db.dashboard);
        renderAgendaModule(db.eventos, db.turmas);

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

function getDashboardFilterPayload() {
    const filters = readDashboardFilters();
    return {
        turmaId: filters.turmaId ? Number(filters.turmaId) : undefined,
        periodMonths: Number(filters.periodMonths || DEFAULT_DASHBOARD_FILTERS.periodMonths)
    };
}

function syncMainDashboardFilterInputs() {
    const filters = readDashboardFilters();
    const turmaSelect = document.getElementById('mainDashboardTurmaFilter');
    const periodSelect = document.getElementById('mainDashboardPeriodFilter');

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

function renderSimpleList(containerId, items, formatter, emptyMessage) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = items?.length
        ? items.map(formatter).join('')
        : `<div class="command-empty">${escapeHtml(emptyMessage)}</div>`;
}

function destroyDashboardCharts() {
    monthlyChart?.destroy?.();
    categoryChart?.destroy?.();
    monthlyChart = null;
    categoryChart = null;
}

function renderDashboardCharts(monthlyFinancial = [], expenseCategories = []) {
    const monthlyCanvas = document.getElementById('monthlyChart');
    const categoryCanvas = document.getElementById('categoryChart');
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

    if (!categoryCanvas || !expenseCategories.length) return;

    categoryChart = new Chart(categoryCanvas, {
        type: 'doughnut',
        data: {
            labels: expenseCategories.map(item => item.categoria),
            datasets: [{
                data: expenseCategories.map(item => item.valor),
                backgroundColor: [
                    'rgba(79, 209, 197, 0.8)',
                    'rgba(246, 197, 95, 0.8)',
                    'rgba(248, 113, 113, 0.8)',
                    'rgba(96, 165, 250, 0.8)',
                    'rgba(196, 181, 253, 0.8)'
                ],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e2e8f0', usePointStyle: true, boxWidth: 10, padding: 18 }
                }
            }
        }
    });
}

function renderIntegratedDashboard(dashboard) {
    if (!dashboard) return;

    const overview = dashboard.overview || {};
    const nextEvent = dashboard.nextEvent || {};
    const forecast = dashboard.forecast || {};
    setText('lastUpdate', new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setText('statSaldo', formatCurrency(overview.saldoTotal));
    setText('statReceitas', formatCurrency(overview.totalReceitas));
    setText('statDespesas', formatCurrency(overview.totalDespesas));
    setText('statInadimplentes', overview.inadimplentes ?? 0);
    setText('nextEventName', nextEvent.nome || 'Nenhum evento agendado');
    setText('nextEventDate', nextEvent.data ? formatDate(nextEvent.data) : 'Sem data definida');
    setText('nextEventLocation', nextEvent.local || 'Local a definir');
    setText('nextEventCountdown', nextEvent.diasRestantes >= 0 ? `${nextEvent.diasRestantes} dias` : 'sem data');
    setText('financeSaldo', formatCurrency(overview.saldoTotal));
    setText('financeReceitas', formatCurrency(overview.totalReceitas));
    setText('financeDespesas', formatCurrency(overview.totalDespesas));
    setText('financeVotacoes', dashboard.operational?.votacoesAbertas ?? 0);
    setText('mainForecastBalance', formatCurrency(forecast.projectedNextBalance));
    setText('mainForecastHint', forecast.recommendation || 'Sem previsao calculada ainda.');
    setText('mainDashboardScopeLabel', dashboard.filters?.scopeLabel || 'Visao consolidada de todas as turmas');
    setText(
        'mainDashboardFilterHint',
        `${dashboard.filters?.turmaNome || 'Todas as turmas'} | Janela de ${dashboard.filters?.periodMonths || DEFAULT_DASHBOARD_FILTERS.periodMonths} meses | Tendencia ${forecast.trend || 'neutral'}`
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

    renderSimpleList('agendaPreviewList', dashboard.upcomingEvents, item => `
        <article class="simple-item">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.nome || 'Evento sem nome')}</p>
                <p class="simple-item__subtitle">${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.local || 'Local a definir')}</p>
            </div>
        </article>
    `, 'Nenhum evento cadastrado.');

    renderSimpleList('recentTransactions', dashboard.recentTransactions, item => `
        <article class="simple-item">
            <div class="simple-item__main">
                <p class="simple-item__title">${escapeHtml(item.descricao || 'Lancamento')}</p>
                <p class="simple-item__subtitle">${escapeHtml(formatDate(item.data))} | ${escapeHtml(item.referencia || 'Sem referencia')} | ${escapeHtml(item.turmaNome || 'Sem turma')}</p>
            </div>
            <div class="simple-item__side">
                <strong class="${(item.tipo || '').toLowerCase() === 'receita' ? 'money-positive' : 'money-negative'}">${(item.tipo || '').toLowerCase() === 'receita' ? '+' : '-'} ${escapeHtml(formatCurrency(item.valor))}</strong>
            </div>
        </article>
    `, 'Nenhum lancamento recente.');

    renderDashboardCharts(dashboard.monthlyFinancial, []);
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
                </div>
                <span class="agenda-item__badge">${escapeHtml(evento.status || 'agendado')}</span>
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
                </div>
                <span class="agenda-item__badge">${escapeHtml(evento.status || 'agendado')}</span>
            </article>
        `).join('')
        : '<div class="simple-empty">Nenhum proximo evento cadastrado.</div>';
}

function setupModalEvents() {
    window.openModal = (mode, kind) => modal.open(kind, db.turmas);
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
            payload = { nome: data.nome, curso: data.desc, instituicao: 'Senac' };
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
                        contato: data.desc,
                        turmaId: data.turmaId,
                        perfil: data.perfil,
                        senha: data.senha
                    };
                    break;
                case 'evento':
                    endpoint = '/evento';
                    payload = { nome: data.nome, data: data.data, local: data.desc, turmaId: data.turmaId };
                    break;
                case 'lancamento': {
                    endpoint = '/lancamento';
                    const val = parseFloat(data.valor || 0);
                    payload = { descricao: data.nome, tipo: val >= 0 ? 'receita' : 'despesa', valor: Math.abs(val), data: data.data, referencia: data.desc, turmaId: data.turmaId };
                    break;
                }
                case 'votacao':
                    endpoint = '/votacao';
                    payload = { titulo: data.nome, dataFim: data.data, turmaId: data.turmaId };
                    break;
                default:
                    showToast('Tipo nao implementado', 'error');
                    btn.innerText = originalText;
                    btn.disabled = false;
                    return;
            }
        }

        const method = data.id ? 'PUT' : 'POST';
        const finalEndpoint = data.id ? `${endpoint}/${data.id}` : endpoint;

        try {
            await api.salvar(finalEndpoint, payload, method);
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

    if (['aluno', 'evento', 'lancamento', 'votacao'].includes(data.kind) && !data.turmaId) {
        return 'Selecione uma turma.';
    }

    if (data.kind === 'aluno' && data.senha && data.senha.trim().length > 0 && data.senha.trim().length < 6) {
        return 'A senha do aluno precisa ter pelo menos 6 caracteres.';
    }

    if (['evento', 'lancamento', 'votacao'].includes(data.kind) && !data.data) {
        return 'Escolha uma data.';
    }

    if (data.kind === 'lancamento') {
        const valor = Number(data.valor);
        if (!Number.isFinite(valor) || valor === 0) {
            return 'Informe um valor diferente de zero para o lancamento.';
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
}

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
        showToast('Selecione uma data no calendario.', 'error');
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
    const nome = prompt('Nome da opcao (Ex: Banda X):');
    if (!nome) return;
    try {
        await api.salvar(`/votacao/${votacaoId}/opcao`, { nome }, 'POST');
        showToast('Opcao adicionada!', 'success');
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao adicionar opcao', 'error');
    }
};

window.importarAlunosCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (db.turmas.length === 0) {
        showToast('Cadastre uma turma primeiro!', 'error');
        event.target.value = '';
        return;
    }

    const turmasStr = db.turmas.map(t => `${t.id} - ${t.nome}`).join('\n');
    const turmaIdStr = prompt(`Digite o ID da turma para importar os alunos:\n\n${turmasStr}`);
    if (!turmaIdStr) {
        event.target.value = '';
        return;
    }

    try {
        showToast('Lendo o arquivo...', 'success');
        const resposta = await api.importarAlunosCSV(file, parseInt(turmaIdStr, 10));
        showToast(resposta || 'Importacao concluida!', 'success');
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao comunicar com o servidor', 'error');
    } finally {
        event.target.value = '';
    }
};

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
        showToast('Registro excluido com sucesso!', 'success');
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
    if (modalTitle) {
        const labels = {
            turma: 'Editar turma',
            aluno: 'Editar aluno',
            evento: 'Editar evento',
            lancamento: 'Editar lancamento',
            votacao: 'Editar votacao'
        };
        modalTitle.textContent = labels[kind] || 'Editar cadastro';
    }
    document.getElementById('modalItemId') && (document.getElementById('modalItemId').value = item.id);
    document.getElementById('modalCategoria') && (document.getElementById('modalCategoria').value = kind);
    modal.toggleFields();

    document.getElementById('modalNome') && (document.getElementById('modalNome').value = item.nome || item.descricao || item.titulo || '');
    if (kind !== 'turma') document.getElementById('modalTurmaSelect') && (document.getElementById('modalTurmaSelect').value = item.turma?.id || '');

    if (kind === 'aluno') {
        document.getElementById('modalDescricao') && (document.getElementById('modalDescricao').value = item.contato || '');
        document.getElementById('modalIdentificador') && (document.getElementById('modalIdentificador').value = item.identificador || '');
    } else if (kind === 'evento') {
        document.getElementById('modalData') && (document.getElementById('modalData').value = item.dataEvento || '');
        document.getElementById('modalDescricao') && (document.getElementById('modalDescricao').value = item.localEvento || '');
    } else if (kind === 'lancamento') {
        document.getElementById('modalValor') && (document.getElementById('modalValor').value = item.valor || '');
        document.getElementById('modalData') && (document.getElementById('modalData').value = item.dataLancamento || '');
        document.getElementById('modalDescricao') && (document.getElementById('modalDescricao').value = item.referencia || '');
    } else if (kind === 'votacao') {
        document.getElementById('modalData') && (document.getElementById('modalData').value = item.dataFim || '');
    }
};
