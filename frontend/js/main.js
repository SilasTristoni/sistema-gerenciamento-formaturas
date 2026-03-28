import { api } from './services/api.js';
import { auth } from './services/auth.js';
import { dashboardPrefs } from './services/dashboardPrefs.js';
import { ui } from './components/ui.js';
import { modal } from './components/modal.js';
import { showToast } from './components/toast.js';

let db = { turmas: [], alunos: [], eventos: [], financeiro: [], votacoes: [] };
let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
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
        const [turmas, alunos, financeiro, eventos, votacoes] = await Promise.all([
            api.buscar('turmas'),
            api.buscar('alunos'),
            api.buscar('financeiro'),
            api.buscar('eventos'),
            api.buscar('votacoes')
        ]);

        db = { turmas, alunos, financeiro, eventos, votacoes };

        ui.renderTurmas(db.turmas);
        ui.renderAlunos(db.alunos);
        if (document.getElementById('eventosBody')) ui.renderEventos(db.eventos);
        if (document.getElementById('financeiroBody')) ui.renderFinanceiro(db.financeiro);
        if (document.getElementById('votacoesContainer')) ui.renderVotacoes(db.votacoes, db.alunos);
        ui.atualizarDashboard(db);

        document.querySelectorAll('.btn-admin').forEach(btn => {
            btn.style.display = usuarioLogado?.perfil === 'ROLE_COMISSAO' ? 'inline-flex' : 'none';
        });

        if (document.getElementById('lastUpdate')) {
            document.getElementById('lastUpdate').innerText = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    } catch (error) {
        console.error(error);
        if (error.message === 'Sessão expirada') {
            showToast('Sua sessão expirou.', 'error');
            setTimeout(window.logout, 1200);
            return;
        }
        showToast(error.message || 'Erro ao conectar com servidor', 'error');
    }
}
window.carregarDados = carregarDados;

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

        if (!data.nome && !data.desc && data.kind !== 'tarefa') {
            showToast('Preencha os campos obrigatórios', 'error');
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
                        perfil: data.perfil
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
                    showToast('Tipo não implementado', 'error');
                    btn.innerText = originalText;
                    btn.disabled = false;
                    return;
            }
        }

        const method = data.id ? 'PUT' : 'POST';
        const finalEndpoint = data.id ? `${endpoint}/${data.id}` : endpoint;

        try {
            await api.salvar(finalEndpoint, payload, method);
            showToast(data.id ? 'Atualizado com sucesso!' : 'Salvo com sucesso!', 'success');
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
    const nome = prompt('Nome da opção (Ex: Banda X):');
    if (!nome) return;
    try {
        await api.salvar(`/votacao/${votacaoId}/opcao`, { nome }, 'POST');
        showToast('Opção adicionada!', 'success');
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao adicionar opção', 'error');
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
        showToast(resposta || 'Importação concluída!', 'success');
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
