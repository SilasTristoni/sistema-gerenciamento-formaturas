import { api } from './services/api.js';
import { ui } from './components/ui.js';
import { modal } from './components/modal.js';
import { showToast } from './components/toast.js';

let db = { turmas: [], alunos: [], eventos: [], financeiro: [], votacoes: [] };
let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarSessao();
    setupNavigation();
    setupModalEvents();
});

async function verificarSessao() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        usuarioLogado = await api.me();

        if (document.getElementById('userNameDisplay')) {
            document.getElementById('userNameDisplay').innerText = usuarioLogado.nome || 'Usuário';
            document.getElementById('userAvatar').innerText = (usuarioLogado.nome || 'U').charAt(0).toUpperCase();

            if (usuarioLogado.perfil === 'ROLE_COMISSAO') {
                document.getElementById('userRoleDisplay').innerText = 'Comissão';
                document.querySelectorAll('.btn-admin').forEach(btn => btn.style.display = 'inline-flex');
            } else {
                document.getElementById('userRoleDisplay').innerText = 'Formando(a)';
                document.querySelectorAll('.btn-admin').forEach(btn => btn.style.display = 'none');
            }
        }

        await carregarDados();
    } catch (error) {
        console.error(error);
        localStorage.removeItem('token');
        localStorage.removeItem('perfil');
        localStorage.removeItem('nomeUsuario');
        window.location.href = 'login.html';
    }
}

window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('perfil');
    localStorage.removeItem('nomeUsuario');
    window.location.href = 'login.html';
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
    window.toggleModalFields = () => modal.toggleFields();

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
            payload = {
                nome: data.nome,
                curso: data.desc,
                instituicao: 'Senac'
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
                        contato: data.desc,
                        turmaId: data.turmaId
                    };
                    break;

                case 'evento':
                    endpoint = '/evento';
                    payload = {
                        nome: data.nome,
                        data: data.data,
                        local: data.desc,
                        turmaId: data.turmaId
                    };
                    break;

                case 'lancamento': {
                    endpoint = '/lancamento';
                    const val = parseFloat(data.valor || 0);

                    payload = {
                        descricao: data.nome,
                        tipo: val >= 0 ? 'receita' : 'despesa',
                        valor: Math.abs(val),
                        data: data.data,
                        referencia: data.desc,
                        turmaId: data.turmaId
                    };
                    break;
                }

                case 'votacao':
                    endpoint = '/votacao';
                    payload = {
                        titulo: data.nome,
                        dataFim: data.data,
                        turmaId: data.turmaId
                    };
                    break;

                default:
                    showToast('Tipo não implementado', 'error');
                    btn.innerText = originalText;
                    btn.disabled = false;
                    return;
            }
        }

        try {
            await api.salvar(endpoint, payload);
            showToast('Salvo com sucesso!');
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
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('bg-primary-500/10', 'text-primary-500', 'font-medium');
            el.classList.add('text-slate-400', 'hover:bg-dark-700');
        });

        const target = document.getElementById(`screen-${screenId}`);
        const btn = document.getElementById(`nav-${screenId}`);

        if (target) target.classList.remove('hidden');
        if (btn) {
            btn.classList.remove('text-slate-400', 'hover:bg-dark-700');
            btn.classList.add('bg-primary-500/10', 'text-primary-500', 'font-medium');
        }
    };

    window.navigate('dashboard');
}

window.exportTableCSV = (tableId, filename) => {
    const table = document.getElementById(tableId);
    if (!table) {
        showToast('Tabela vazia', 'error');
        return;
    }

    let csv = [];
    const rows = table.querySelectorAll('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = [];
        const cols = rows[i].querySelectorAll('td, th');

        for (let j = 0; j < cols.length; j++) {
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').trim();
            data = data.replace(/"/g, '""');
            row.push('"' + data + '"');
        }

        csv.push(row.join(';'));
    }

    const csvFile = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(csvFile);
    link.download = filename + '.csv';
    link.click();
};

window.votar = async (votacaoId, opcaoId) => {
    try {
        await api.votar(Number(votacaoId), Number(opcaoId));
        showToast('Voto computado com sucesso!');
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao votar', 'error');
    }
};

window.adicionarOpcaoUI = async (votacaoId) => {
    const nome = prompt('Nome da opção (Ex: Banda X):');
    if (!nome) return;

    try {
        await api.salvar(`/votacao/${votacaoId}/opcao`, { nome });
        showToast('Opção adicionada!');
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
        showToast('Lendo arquivo...', 'success');
        const resposta = await api.importarAlunosCSV(file, parseInt(turmaIdStr, 10));
        showToast(resposta || 'Importação concluída!', 'success');
        await carregarDados();
    } catch (err) {
        showToast(err.message || 'Erro ao comunicar com o servidor', 'error');
        console.error(err);
    } finally {
        event.target.value = '';
    }
};