import { api } from './services/api.js';
import { ui } from './components/ui.js';
import { modal } from './components/modal.js';
import { showToast } from './components/toast.js';

// Estado global da aplicação
let db = { turmas: [], alunos: [], eventos: [], financeiro: [], votacoes: [] };

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    setupNavigation();
    setupModalEvents();
});

// 1. CARREGAMENTO
async function carregarDados() {
    try {
        const [turmas, alunos, financeiro, eventos, votacoes] = await Promise.all([
            api.buscar('turmas'),
            api.buscar('alunos'),
            api.buscar('financeiro'),
            api.buscar('eventos'),
            api.buscar('votacoes') // Novo endpoint
        ]);

        db = { turmas, alunos, financeiro, eventos, votacoes }; 
        
        ui.renderTurmas(db.turmas);
        ui.renderAlunos(db.alunos);
        if(document.getElementById('eventosBody')) ui.renderEventos(db.eventos);
        if(document.getElementById('financeiroBody')) ui.renderFinanceiro(db.financeiro);
        if(document.getElementById('votacoesContainer')) ui.renderVotacoes(db.votacoes, db.alunos);
        
        ui.atualizarDashboard(db);
        
    } catch (error) {
        console.error(error);
        showToast("Erro ao conectar com servidor", "error");
    }
}

// 2. MODAL & FORMULÁRIOS
function setupModalEvents() {
    window.openModal = (mode, kind) => modal.open(kind, db.turmas);
    window.closeModal = () => modal.close();
    window.toggleModalFields = () => modal.toggleFields();
    
    window.salvarFormulario = async (e) => {
        e.preventDefault();
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = "Salvando...";
        btn.disabled = true;

        const data = modal.getData();
        
        if(!data.nome && !data.desc && data.kind !== 'tarefa') {
            showToast("Preencha os campos obrigatórios", "error");
            btn.innerText = originalText; btn.disabled = false;
            return;
        }

        let endpoint = '';
        let payload = {};

        if(data.kind === 'turma') {
            endpoint = '/turma';
            payload = { nome: data.nome, curso: data.desc, instituicao: "Senac" };
        } else {
            if(!data.turmaId) {
                 showToast("Selecione uma turma", "error");
                 btn.innerText = originalText; btn.disabled = false;
                 return;
            }
            
            switch(data.kind) {
                case 'aluno':
                    endpoint = '/aluno';
                    payload = { nome: data.nome, contato: data.desc, turmaId: data.turmaId };
                    break;
                case 'evento':
                    endpoint = '/evento';
                    payload = { nome: data.nome, data: data.data, local: data.desc, turmaId: data.turmaId };
                    break;
                case 'lancamento':
                    endpoint = '/lancamento';
                    const val = parseFloat(data.valor);
                    payload = { 
                        descricao: data.nome, 
                        tipo: val >= 0 ? 'receita' : 'despesa',
                        valor: Math.abs(val),
                        data: data.data,
                        referencia: data.desc,
                        turmaId: data.turmaId 
                    };
                    break;
                case 'votacao':
                    endpoint = '/votacao';
                    payload = { titulo: data.nome, dataFim: data.data, turmaId: data.turmaId };
                    break;
                default:
                    showToast("Tipo não implementado", "error");
                    btn.innerText = originalText; btn.disabled = false;
                    return;
            }
        }

        try {
            await api.salvar(endpoint, payload);
            showToast("Salvo com sucesso!");
            modal.close();
            carregarDados();
        } catch (err) {
            showToast("Erro: " + err.message, "error");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
}

// 3. NAVEGAÇÃO
function setupNavigation() {
    window.navigate = (screenId) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-btn').forEach(el => {
            el.classList.remove('bg-primary-500/10', 'text-primary-500', 'font-medium');
            el.classList.add('text-slate-400', 'hover:bg-dark-700');
        });

        const target = document.getElementById(`screen-${screenId}`);
        const btn = document.getElementById(`nav-${screenId}`);
        
        if(target) target.classList.remove('hidden');
        if(btn) {
            btn.classList.remove('text-slate-400', 'hover:bg-dark-700');
            btn.classList.add('bg-primary-500/10', 'text-primary-500', 'font-medium');
        }
    };
    window.navigate('dashboard');
}

// 4. FUNÇÕES GLOBAIS (Exportação e Votação)
window.exportTableCSV = (tableId, filename) => {
    const table = document.getElementById(tableId);
    if (!table) { showToast("Tabela vazia", "error"); return; }
    
    let csv = [];
    const rows = table.querySelectorAll("tr");
    for (let i = 0; i < rows.length; i++) {
        const row = [], cols = rows[i].querySelectorAll("td, th");
        for (let j = 0; j < cols.length; j++) {
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, "").trim();
            data = data.replace(/"/g, '""');
            row.push('"' + data + '"');
        }
        csv.push(row.join(";"));
    }
    const csvFile = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(csvFile);
    link.download = filename + ".csv";
    link.click();
};

// --- AÇÕES DE VOTAÇÃO ---
window.votar = async (votacaoId, opcaoId) => {
    if(db.alunos.length === 0) {
        showToast("Cadastre alunos antes de votar!", "error");
        return;
    }

    // Simulação de login: pede o ID do aluno
    const alunoIdStr = prompt(`ID do Aluno (Disponíveis: ${db.alunos.map(a=>a.id).join(', ')})`);
    if(!alunoIdStr) return;

    const payload = {
        votacaoId: parseInt(votacaoId),
        opcaoId: parseInt(opcaoId),
        alunoId: parseInt(alunoIdStr)
    };

    try {
        // Usa a api.salvar mas para um endpoint específico
        await fetch('http://localhost:8080/api/cadastro/votar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        }).then(async res => {
            if(!res.ok) throw new Error(await res.text());
            showToast("Voto computado!");
            // Não recarrega tudo para não perder o flow, mas idealmente sim
        });
    } catch (err) {
        showToast(err.message, "error");
    }
};

window.adicionarOpcaoUI = async (votacaoId) => {
    const nome = prompt("Nome da opção (Ex: Banda X):");
    if(!nome) return;

    try {
        const response = await fetch(`http://localhost:8080/api/cadastro/votacao/${votacaoId}/opcao`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nome: nome })
        });
        
        if(response.ok) {
            showToast("Opção adicionada!");
            carregarDados();
        } else {
            showToast("Erro ao adicionar opção", "error");
        }
    } catch(e) { console.error(e); }
};