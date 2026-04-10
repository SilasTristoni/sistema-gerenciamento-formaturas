import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { showToast } from './components/toast.js';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
});
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

const mobileViewport = window.matchMedia('(max-width: 720px)');
let activeStudentSection = 'resumo';
let menuHideTimer = null;

function redirectToLogin() {
    window.location.href = './login.html';
}

function redirectToCommission() {
    window.location.href = './index.html';
}

function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
}

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatDate(value) {
    if (!value) return 'Sem data';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? 'Sem data' : dateFormatter.format(date);
}

function formatDaysRemaining(days) {
    if (days == null) return 'Sem prazo definido';
    if (days < 0) return 'Data ja passou';
    if (days === 0) return 'Acontece hoje';
    if (days === 1) return 'Falta 1 dia';
    return `Faltam ${days} dias`;
}

function formatCurrency(value) {
    return currencyFormatter.format(Number(value || 0));
}

function normalizeStatus(status = '') {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'confirmado' || normalized === 'emdia' || normalized === 'aberta') return 'positive';
    if (normalized === 'talvez' || normalized === 'pendente') return 'warning';
    if (normalized === 'nao vou' || normalized === 'atrasado' || normalized === 'encerrada') return 'danger';
    return 'neutral';
}

function showState({ loading = false, error = '' } = {}) {
    document.getElementById('loadingState')?.classList.toggle('hidden', !loading);
    document.getElementById('errorState')?.classList.toggle('hidden', !error);
    if (error) setText('errorMessage', error);
}

function renderEmpty(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="student-empty">${escapeHtml(message)}</div>`;
}

function getStudentSections() {
    return Array.from(document.querySelectorAll('[data-student-section]'));
}

function getStudentSectionButtons() {
    return Array.from(document.querySelectorAll('[data-student-section-target]'));
}

function setStudentMenuState(isOpen) {
    const toggle = document.getElementById('studentMenuToggle');
    const drawer = document.getElementById('studentNavDrawer');
    const backdrop = document.getElementById('studentNavBackdrop');
    if (!toggle || !drawer || !backdrop) return;

    if (menuHideTimer) {
        window.clearTimeout(menuHideTimer);
        menuHideTimer = null;
    }

    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    drawer.classList.toggle('is-open', isOpen);
    drawer.setAttribute('aria-hidden', String(!isOpen));
    document.body.classList.toggle('student-menu-open', isOpen);

    if (isOpen) {
        backdrop.hidden = false;
        window.requestAnimationFrame(() => {
            backdrop.classList.add('is-visible');
        });
        return;
    }

    backdrop.classList.remove('is-visible');
    menuHideTimer = window.setTimeout(() => {
        if (!drawer.classList.contains('is-open')) {
            backdrop.hidden = true;
        }
    }, 220);
}

function openStudentMenu() {
    if (!mobileViewport.matches) return;
    setStudentMenuState(true);
}

function closeStudentMenu() {
    setStudentMenuState(false);
}

function renderFinancialProgress(financeiro = {}) {
    const valorArrecadado = Number(financeiro.valorArrecadado || 0);
    const valorMeta = Number(financeiro.valorMeta || 0);
    const percentualAtingido = valorMeta <= 0
        ? 0
        : Number(financeiro.percentualAtingido ?? ((valorArrecadado / valorMeta) * 100));
    const percentualVisual = Math.max(0, Math.min(percentualAtingido, 100));
    const valorRestante = valorMeta <= 0
        ? 0
        : Number(financeiro.valorRestante ?? Math.max(valorMeta - valorArrecadado, 0));

    setText('studentGoalPercent', `${Math.round(percentualAtingido)}%`);
    setText('studentGoalRaised', formatCurrency(valorArrecadado));
    setText('studentGoalTarget', valorMeta > 0 ? formatCurrency(valorMeta) : 'Defina a meta');
    setText('studentGoalRemaining', valorMeta > 0 ? formatCurrency(valorRestante) : '--');

    const circle = document.getElementById('studentGoalProgressCircle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        circle.style.strokeDasharray = `${circumference}`;
        circle.style.strokeDashoffset = `${circumference * (1 - (percentualVisual / 100))}`;
        circle.style.stroke = valorMeta <= 0 ? '#64748b' : percentualAtingido >= 100 ? '#2dd4bf' : '#34d399';
    }

    const badge = document.getElementById('studentGoalBadge');
    const status = document.getElementById('studentGoalStatus');
    if (!badge || !status) return;

    if (valorMeta <= 0) {
        badge.textContent = 'Sem meta';
        badge.className = 'student-chip student-chip--neutral';
        status.textContent = 'A comissao ainda nao definiu a meta financeira da turma.';
        return;
    }

    if (percentualAtingido >= 100) {
        badge.textContent = 'Meta batida';
        badge.className = 'student-chip student-chip--success';
        status.textContent = `A turma ja arrecadou ${formatCurrency(valorArrecadado)} e atingiu o objetivo financeiro.`;
        return;
    }

    badge.textContent = percentualAtingido >= 60 ? 'Reta final' : 'Em andamento';
    badge.className = percentualAtingido >= 60 ? 'student-chip student-chip--success' : 'student-chip student-chip--warning';
    status.textContent = `Faltam ${formatCurrency(valorRestante)} para a turma atingir a meta definida.`;
}

function setActiveStudentSection(sectionId, { shouldScroll = true } = {}) {
    const sections = getStudentSections();
    const targetSection = sections.find((section) => section.dataset.studentSection === sectionId);
    if (!targetSection) return;

    activeStudentSection = sectionId;

    sections.forEach((section) => {
        section.classList.toggle('is-active', section.dataset.studentSection === sectionId);
    });

    getStudentSectionButtons().forEach((button) => {
        button.classList.toggle('is-active', button.dataset.studentSectionTarget === sectionId);
    });

    if (mobileViewport.matches) {
        closeStudentMenu();
        if (shouldScroll) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
    }

    if (shouldScroll) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function validateStudentSession() {
    const token = auth.getToken();
    if (!token) {
        auth.clearSession();
        redirectToLogin();
        return null;
    }

    try {
        const me = await api.me();
        if (me.perfil !== 'ROLE_ALUNO') {
            redirectToCommission();
            return null;
        }

        auth.saveSession({
            token,
            perfil: me.perfil,
            nome: me.nome,
            login: me.login || me.email || 'usuario'
        });

        setText('studentName', me.nome || 'Aluno');
        setText('studentMobileName', me.nome || 'Aluno');
        setText('studentLogin', `@${(me.login || me.email || 'usuario').replace('@gestaoform.local', '')}`);
        const avatar = document.getElementById('studentAvatar');
        if (avatar) avatar.textContent = (me.nome || 'A').charAt(0).toUpperCase();

        return me;
    } catch (error) {
        auth.clearSession();
        redirectToLogin();
        return null;
    }
}

function renderProfile(painel) {
    const aluno = painel.aluno || {};
    const resumo = painel.resumo || {};
    const financeiro = painel.financeiro || {};
    const proximoEvento = painel.proximoEvento || {};
    const turmaResumo = `${aluno.turmaNome || 'Sem turma'} - ${aluno.curso || 'Curso nao informado'}`;

    setText('studentTurma', turmaResumo);
    setText('studentMobileMeta', turmaResumo);
    setText('studentStatusText', (aluno.statusFinanceiro || 'pendente').toUpperCase());
    setText('studentCourse', aluno.curso || 'Nao informado');
    setText('studentContact', aluno.contato || 'Nao informado');
    setText('studentIdentifier', aluno.identificador || 'Nao informado');

    setText('summaryEvents', resumo.totalEventos ?? 0);
    setText('summaryPresence', resumo.eventosComPresencaRespondida ?? 0);
    setText('summaryVotesOpen', resumo.votacoesAbertas ?? 0);
    setText('summaryVotesDone', resumo.votacoesRespondidas ?? 0);
    setText('summaryPendingPresence', `${resumo.eventosPendentesConfirmacao ?? 0} pendentes`);

    setText('nextEventName', proximoEvento.nome || 'Nenhum evento agendado');
    setText('nextEventDate', proximoEvento.data ? formatDate(proximoEvento.data) : 'Sem data definida');
    setText('nextEventLocation', proximoEvento.local || 'Local a definir');
    setText('nextEventCountdown', formatDaysRemaining(proximoEvento.diasRestantes));
    renderFinancialProgress(financeiro);

    const badge = document.getElementById('studentStatusBadge');
    if (badge) {
        const status = proximoEvento.presencaStatus || proximoEvento.status || 'sem evento';
        badge.textContent = status;
        badge.className = `student-status-badge student-status-badge--${normalizeStatus(status)}`;
    }
}

function renderEvents(eventos = []) {
    const container = document.getElementById('eventList');
    if (!container) return;

    if (!eventos.length) {
        renderEmpty('eventList', 'Nenhum evento cadastrado para a sua turma.');
        return;
    }

    container.innerHTML = eventos.map((evento) => {
        const presenceStatus = evento.presencaStatus || 'pendente';
        const statusTone = normalizeStatus(presenceStatus);
        const disabled = evento.data && evento.diasRestantes < 0 ? 'disabled' : '';

        return `
            <article class="student-event-card">
                <div class="student-event-card__main">
                    <div class="student-event-card__top">
                        <div>
                            <p class="student-event-card__title">${escapeHtml(evento.nome || 'Evento sem nome')}</p>
                            <p class="student-event-card__meta">${escapeHtml(formatDate(evento.data))} - ${escapeHtml(evento.local || 'Local a definir')}</p>
                        </div>
                        <span class="student-status-badge student-status-badge--${statusTone}">${escapeHtml(presenceStatus)}</span>
                    </div>
                    <p class="student-event-card__copy">${escapeHtml(formatDaysRemaining(evento.diasRestantes))}</p>
                </div>
                <div class="student-presence-actions">
                    <button class="student-presence-btn ${presenceStatus === 'confirmado' ? 'is-active' : ''}" data-presenca-evento="${evento.id}" data-presenca-status="confirmado" ${disabled}>Vou</button>
                    <button class="student-presence-btn ${presenceStatus === 'talvez' ? 'is-active' : ''}" data-presenca-evento="${evento.id}" data-presenca-status="talvez" ${disabled}>Talvez</button>
                    <button class="student-presence-btn ${presenceStatus === 'nao vou' ? 'is-active' : ''}" data-presenca-evento="${evento.id}" data-presenca-status="nao vou" ${disabled}>Nao vou</button>
                </div>
            </article>
        `;
    }).join('');
}

function renderVotes(votacoes = []) {
    const container = document.getElementById('voteList');
    if (!container) return;

    if (!votacoes.length) {
        renderEmpty('voteList', 'Nenhuma votacao disponivel para a sua turma.');
        return;
    }

    container.innerHTML = votacoes.map((votacao) => {
        const disabled = !votacao.aberta || votacao.jaVotou;
        const tone = normalizeStatus(votacao.status || (votacao.aberta ? 'aberta' : 'encerrada'));

        return `
            <article class="student-vote-card">
                <div class="student-vote-card__head">
                    <div>
                        <p class="student-vote-card__title">${escapeHtml(votacao.titulo || 'Votacao sem titulo')}</p>
                        <p class="student-vote-card__meta">Prazo: ${escapeHtml(formatDate(votacao.dataFim))} - ${escapeHtml(formatDaysRemaining(votacao.diasRestantes))}</p>
                    </div>
                    <span class="student-status-badge student-status-badge--${tone}">${escapeHtml(votacao.aberta ? 'aberta' : 'encerrada')}</span>
                </div>
                ${votacao.jaVotou
                    ? `<div class="student-vote-card__result">Seu voto: <strong>${escapeHtml(votacao.opcaoSelecionadaNome || 'Opcao registrada')}</strong></div>`
                    : ''}
                <div class="student-option-list">
                    ${(votacao.opcoes || []).map((opcao) => `
                        <button class="student-option-btn" data-voto-id="${votacao.id}" data-opcao-id="${opcao.id}" ${disabled ? 'disabled' : ''}>
                            <span>${escapeHtml(opcao.nome || 'Opcao')}</span>
                            <i class="ph ph-check-circle"></i>
                        </button>
                    `).join('')}
                </div>
            </article>
        `;
    }).join('');
}

async function loadStudentArea() {
    showState({ loading: true, error: '' });

    const session = await validateStudentSession();
    if (!session) return;

    try {
        const painel = await api.alunoPainel();
        renderProfile(painel);
        renderEvents(painel.eventos || []);
        renderVotes(painel.votacoes || []);
        showState({ loading: false, error: '' });
    } catch (error) {
        showState({ loading: false, error: error.message || 'Nao foi possivel carregar seus dados.' });
    }
}

async function handlePresenceClick(button) {
    const eventoId = Number(button.dataset.presencaEvento);
    const status = button.dataset.presencaStatus;

    if (!eventoId || !status) return;

    try {
        await api.confirmarPresenca(eventoId, status);
        showToast('Presenca atualizada com sucesso!', 'success');
        await loadStudentArea();
    } catch (error) {
        showToast(error.message || 'Nao foi possivel atualizar sua presenca.', 'error');
    }
}

async function handleVoteClick(button) {
    const votacaoId = Number(button.dataset.votoId);
    const opcaoId = Number(button.dataset.opcaoId);

    if (!votacaoId || !opcaoId) return;

    try {
        await api.votar(votacaoId, opcaoId);
        showToast('Voto registrado com sucesso!', 'success');
        await loadStudentArea();
    } catch (error) {
        showToast(error.message || 'Nao foi possivel registrar seu voto.', 'error');
    }
}

document.addEventListener('click', (event) => {
    const presenceButton = event.target.closest('[data-presenca-evento]');
    if (presenceButton) {
        handlePresenceClick(presenceButton).catch(console.error);
        return;
    }

    const voteButton = event.target.closest('[data-voto-id]');
    if (voteButton) {
        handleVoteClick(voteButton).catch(console.error);
    }
});

getStudentSectionButtons().forEach((button) => {
    button.addEventListener('click', () => {
        setActiveStudentSection(button.dataset.studentSectionTarget);
    });
});

document.getElementById('studentMenuToggle')?.addEventListener('click', () => {
    if (document.getElementById('studentNavDrawer')?.classList.contains('is-open')) {
        closeStudentMenu();
        return;
    }

    openStudentMenu();
});

document.getElementById('studentMenuClose')?.addEventListener('click', () => {
    closeStudentMenu();
});

document.getElementById('studentNavBackdrop')?.addEventListener('click', () => {
    closeStudentMenu();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeStudentMenu();
    }
});

const handleViewportChange = (event) => {
    if (!event.matches) {
        closeStudentMenu();
    }

    setActiveStudentSection(activeStudentSection, { shouldScroll: false });
};

if (typeof mobileViewport.addEventListener === 'function') {
    mobileViewport.addEventListener('change', handleViewportChange);
} else if (typeof mobileViewport.addListener === 'function') {
    mobileViewport.addListener(handleViewportChange);
}

document.getElementById('refreshBtn')?.addEventListener('click', () => {
    closeStudentMenu();
    loadStudentArea().catch(console.error);
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    closeStudentMenu();
    auth.clearSession();
    redirectToLogin();
});

setActiveStudentSection(activeStudentSection, { shouldScroll: false });
loadStudentArea().catch(console.error);
