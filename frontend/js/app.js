/* ------------------------------------------------------------------
   CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
------------------------------------------------------------------ */
const API_BASE = 'http://localhost:8080/api/cadastro';
let db = { turmas: [], alunos: [], eventos: [], financeiro: [] }; // Cache local simples

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosBackend(); // Puxa tudo ao iniciar
});

/* ------------------------------------------------------------------
   CARREGAMENTO DE DADOS (GET)
------------------------------------------------------------------ */
async function carregarDadosBackend() {
    try {
        const [turmas, alunos, eventos, financas] = await Promise.all([
            fetch(`${API_BASE}/turmas`).then(r => r.json()),
            fetch(`${API_BASE}/alunos`).then(r => r.json()),
            fetch(`${API_BASE}/eventos`).then(r => r.json()),
            fetch(`${API_BASE}/financeiro`).then(r => r.json())
        ]);

        db.turmas = turmas;
        db.alunos = alunos;
        db.eventos = eventos;
        db.financeiro = financas;
        
        renderAll(); // Atualiza a tela com os dados reais
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

/* ------------------------------------------------------------------
   MODAL E FORMULÁRIO (POST)
------------------------------------------------------------------ */
const modalBackdrop = document.getElementById('modalBackdrop');
const modalPanel = document.getElementById('modalPanel');
const modalTurmaSelect = document.getElementById('modalTurmaSelect');
const modalDescricao = document.getElementById('modalDescricao');

function openModal(mode, kind) {
    document.getElementById('modalCategoria').value = kind;
    toggleModalFields(); // Ajusta campos (mostra select se for aluno)

    // Se for Aluno, preenche o Select de Turmas
    if(kind === 'aluno') {
        modalTurmaSelect.innerHTML = '<option value="">Selecione...</option>';
        db.turmas.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = t.nome;
            modalTurmaSelect.appendChild(opt);
        });
    }

    modalBackdrop.classList.remove('hidden');
    setTimeout(() => {
        modalBackdrop.classList.remove('opacity-0');
        modalPanel.classList.remove('scale-95', 'opacity-0');
        modalPanel.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function toggleModalFields() {
    const kind = document.getElementById('modalCategoria').value;
    const isAluno = kind === 'aluno';

    // Alterna entre TextArea e Select de Turma
    if (isAluno) {
        modalDescricao.classList.add('hidden');
        modalTurmaSelect.classList.remove('hidden');
        document.getElementById('lblDescricao').innerText = "Turma";
    } else {
        modalDescricao.classList.remove('hidden');
        modalTurmaSelect.classList.add('hidden');
        document.getElementById('lblDescricao').innerText = "Descrição / Detalhes";
    }
}

function closeModal() {
    modalPanel.classList.remove('scale-100', 'opacity-100');
    modalPanel.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modalBackdrop.classList.add('hidden'), 220);
}

// ENVIO DO FORMULÁRIO
document.getElementById('modalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const kind = document.getElementById('modalCategoria').value;
    const nome = document.getElementById('modalNome').value;
    const data = document.getElementById('modalData').value;
    const valor = document.getElementById('modalValor').value;
    const desc = document.getElementById('modalDescricao').value;
    const turmaId = document.getElementById('modalTurmaSelect').value;

    let endpoint = '';
    let payload = {};

    if(kind === 'turma') {
        endpoint = '/turma';
        payload = { nome: nome, curso: desc, totalArrecadado: valor || 0 };
    } 
    else if(kind === 'aluno') {
        endpoint = '/aluno';
        // Aqui enviamos o ID da turma selecionada
        payload = { nome: nome, contato: "Sem contato", turmaId: turmaId }; 
    } 
    else if(kind === 'evento') {
        endpoint = '/evento';
        payload = { nome: nome, data: data, local: desc };
    } 
    else if(kind === 'lancamento') {
        endpoint = '/lancamento';
        payload = { descricao: nome, valor: valor, tipo: valor >= 0 ? 'receita' : 'despesa', data: data, referencia: desc };
    }

    try {
        const response = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if(response.ok) {
            alert('Salvo com sucesso!');
            closeModal();
            carregarDadosBackend(); // Recarrega a tabela
        } else {
            alert('Erro ao salvar. Verifique os dados.');
        }
    } catch (error) {
        console.error("Erro no envio:", error);
    }
});

/* ------------------------------------------------------------------
   FUNÇÕES AUXILIARES (Manter as de renderização do exemplo anterior)
------------------------------------------------------------------ */
// ... (Mantenha as funções renderAll, renderTurmasTable etc. do arquivo anterior, 
// apenas lembre-se que agora os dados vêm de db.turmas, db.alunos que foram populados via API)