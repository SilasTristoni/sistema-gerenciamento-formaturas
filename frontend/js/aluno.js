import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { showToast } from './components/toast.js';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
});

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
    const proximoEvento = painel.proximoEvento || {};

    setText('studentTurma', `${aluno.turmaNome || 'Sem turma'} · ${aluno.curso || 'Curso nao informado'}`);
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

    container.innerHTML = eventos.map(evento => {
        const presenceStatus = evento.presencaStatus || 'pendente';
        const statusTone = normalizeStatus(presenceStatus);
        const disabled = evento.data && evento.diasRestantes < 0 ? 'disabled' : '';

        return `
            <article class="student-event-card">
                <div class="student-event-card__main">
                    <div class="student-event-card__top">
                        <div>
                            <p class="student-event-card__title">${escapeHtml(evento.nome || 'Evento sem nome')}</p>
                            <p class="student-event-card__meta">${escapeHtml(formatDate(evento.data))} · ${escapeHtml(evento.local || 'Local a definir')}</p>
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

    container.innerHTML = votacoes.map(votacao => {
        const disabled = !votacao.aberta || votacao.jaVotou;
        const tone = normalizeStatus(votacao.status || (votacao.aberta ? 'aberta' : 'encerrada'));

        return `
            <article class="student-vote-card">
                <div class="student-vote-card__head">
                    <div>
                        <p class="student-vote-card__title">${escapeHtml(votacao.titulo || 'Votacao sem titulo')}</p>
                        <p class="student-vote-card__meta">Prazo: ${escapeHtml(formatDate(votacao.dataFim))} · ${escapeHtml(formatDaysRemaining(votacao.diasRestantes))}</p>
                    </div>
                    <span class="student-status-badge student-status-badge--${tone}">${escapeHtml(votacao.aberta ? 'aberta' : 'encerrada')}</span>
                </div>
                ${votacao.jaVotou
                    ? `<div class="student-vote-card__result">Seu voto: <strong>${escapeHtml(votacao.opcaoSelecionadaNome || 'Opcao registrada')}</strong></div>`
                    : ''}
                <div class="student-option-list">
                    ${(votacao.opcoes || []).map(opcao => `
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

document.getElementById('refreshBtn')?.addEventListener('click', () => {
    loadStudentArea().catch(console.error);
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    auth.clearSession();
    redirectToLogin();
});

loadStudentArea().catch(console.error);
