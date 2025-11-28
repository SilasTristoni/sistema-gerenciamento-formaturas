/* ------------------------------------------------------------------
   CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
------------------------------------------------------------------ */
const API_BASE = 'http://localhost:8080/api/cadastro';
let db = { turmas: [], alunos: [], eventos: [], financeiro: [], tarefas: [] };

document.addEventListener('DOMContentLoaded', () => {
    carregarDadosBackend(); 
    // Começa na dashboard
    navigate('dashboard');
});

/* ------------------------------------------------------------------
   NAVEGAÇÃO (CORREÇÃO DO ERRO navigate is not defined)
------------------------------------------------------------------ */
function navigate(screenId) {
    // 1. Esconde todas as seções
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));

    // 2. Mostra a seção desejada
    const target = document.getElementById(`screen-${screenId}`);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    // 3. Atualiza estilo do menu lateral (opcional)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-primary-500/10', 'text-primary-500');
        btn.classList.add('text-slate-400');
    });
    const activeBtn = document.getElementById(`nav-${screenId}`);
    if(activeBtn) {
        activeBtn.classList.remove('text-slate-400');
        activeBtn.classList.add('bg-primary-500/10', 'text-primary-500');
    }
}

/* ------------------------------------------------------------------
   CARREGAMENTO DE DADOS (GET)
------------------------------------------------------------------ */
async function carregarDadosBackend() {
    try {
        // Tenta buscar dados. Se falhar, usa array vazio para não travar a tela
        const [turmas, alunos, eventos, financas, tarefas] = await Promise.all([
            fetch(`${API_BASE}/turmas`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/alunos`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/eventos`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/financeiro`).then(r => r.ok ? r.json() : []),
            fetch(`${API_BASE}/tarefas`).then(r => r.ok ? r.json() : [])
        ]);

        db.turmas = turmas;
        db.alunos = alunos;
        db.eventos = eventos;
        db.financeiro = financas;
        db.tarefas = tarefas;
        
        renderAll();
    } catch (error) {
        console.error("Erro ao carregar dados (O Backend está rodando?):", error);
    }
}

/* ------------------------------------------------------------------
   RENDERIZAÇÃO (PREENCHIMENTO DAS TABELAS)
------------------------------------------------------------------ */
function renderAll() {
    renderTurmasTable();
    renderAlunosTable();
    renderEventosTable();
    renderFinanceiroTable();
    atualizarDashboard();
}

function renderTurmasTable() {
    const tbody = document.getElementById('turmasBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    db.turmas.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-dark-800 transition-colors";
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-white">${t.nome}</td>
            <td class="px-6 py-4">${t.curso || '-'}</td>
            <td class="px-6 py-4 text-center">
                <span class="bg-dark-700 text-white text-xs px-2 py-1 rounded-md">${t.quantidadeAlunos || 0}</span>
            </td>
            <td class="px-6 py-4 text-emerald-400 font-medium">R$ ${t.totalArrecadado || 0}</td>
            <td class="px-6 py-4 text-right">
                <button class="text-slate-400 hover:text-white"><i class="ph ph-dots-three-vertical text-xl"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAlunosTable() {
    const tbody = document.getElementById('alunosBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    db.alunos.forEach(a => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-dark-800 transition-colors";
        // Tenta pegar o nome da turma. Se vier do JSON, usa. Senão, procura no array de turmas pelo ID.
        let nomeTurma = a.nomeTurma || '-';
        if(nomeTurma === '-' && a.turma && a.turma.nome) nomeTurma = a.turma.nome;

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-white flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                    ${a.nome.charAt(0)}
                </div>
                ${a.nome}
            </td>
            <td class="px-6 py-4 text-slate-400">${nomeTurma}</td>
            <td class="px-6 py-4">${a.contato || '-'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    ${a.status}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button class="text-slate-400 hover:text-white"><i class="ph ph-pencil-simple"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEventosTable() {
    const tbody = document.getElementById('eventosTable')?.querySelector('tbody');
    if(!tbody) return; // Se a tabela não existir na tela, ignora
    tbody.innerHTML = ''; // Limpa antes de renderizar

    db.eventos.forEach(e => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-dark-800 transition-colors";
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-white">${e.nome}</td>
            <td class="px-6 py-4">${e.dataEvento || '-'}</td>
            <td class="px-6 py-4">${e.localEvento || '-'}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">${e.status}</span></td>
            <td class="px-6 py-4 text-right"><button class="text-slate-400"><i class="ph ph-dots-three-vertical"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderFinanceiroTable() {
    const tbody = document.getElementById('financeiroTable')?.querySelector('tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    db.financeiro.forEach(f => {
        const isReceita = f.tipo === 'receita';
        const tr = document.createElement('tr');
        tr.className = "hover:bg-dark-800 transition-colors";
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-white">${f.descricao}</td>
            <td class="px-6 py-4">
                <span class="${isReceita ? 'text-emerald-400' : 'text-red-400'} text-xs uppercase font-bold">
                    ${f.tipo}
                </span>
            </td>
            <td class="px-6 py-4 text-white">R$ ${f.valor}</td>
            <td class="px-6 py-4 text-slate-500 text-xs">${f.dataLancamento || '-'}</td>
            <td class="px-6 py-4 text-right"><button class="text-slate-400"><i class="ph ph-dots-three-vertical"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function atualizarDashboard() {
    // Exemplo simples de totais (pode ser melhorado calculando real)
    document.getElementById('totalAlunos').innerText = db.alunos.length;
    document.getElementById('turmasAtivas').innerText = db.turmas.length + " Turmas";
    
    // Calcula receita total
    const total = db.financeiro
        .filter(f => f.tipo === 'receita')
        .reduce((acc, curr) => acc + curr.valor, 0);
    
    document.getElementById('totalReceita').innerText = "R$ " + total.toFixed(2);
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
    toggleModalFields();

    // Se for Aluno, Evento, Tarefa ou Financeiro, precisa selecionar a Turma
    if(['aluno', 'evento', 'lancamento', 'tarefa', 'votacao'].includes(kind)) {
        modalTurmaSelect.innerHTML = '<option value="">Selecione a Turma...</option>';
        modalTurmaSelect.classList.remove('hidden');
        db.turmas.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = t.nome;
            modalTurmaSelect.appendChild(opt);
        });
    } else {
        modalTurmaSelect.classList.add('hidden');
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
    const lblDesc = document.getElementById('lblDescricao');
    
    // Lógica simples para mudar labels
    if(kind === 'turma') {
        modalTurmaSelect.classList.add('hidden');
        lblDesc.innerText = "Curso / Instituição";
    } else {
        modalTurmaSelect.classList.remove('hidden');
        lblDesc.innerText = "Descrição / Detalhes";
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

    // Mapeamento para os DTOs do Java
    if(kind === 'turma') {
        endpoint = '/turma';
        // Turma não precisa de turmaId
        payload = { nome: nome, curso: desc, instituicao: "Senac" }; 
    } 
    else {
        // Todos os outros precisam de turmaId. Se não tiver selecionado, alerta.
        if(!turmaId) {
            alert("Por favor, selecione uma turma!");
            return;
        }

        if(kind === 'aluno') {
            endpoint = '/aluno';
            payload = { nome: nome, contato: "Sem contato", turmaId: turmaId }; 
        } 
        else if(kind === 'evento') {
            endpoint = '/evento';
            payload = { nome: nome, data: data, local: desc, turmaId: turmaId };
        } 
        else if(kind === 'lancamento') {
            endpoint = '/lancamento';
            payload = { 
                descricao: nome, 
                valor: valor, 
                tipo: valor >= 0 ? 'receita' : 'despesa', 
                data: data, 
                referencia: desc,
                turmaId: turmaId 
            };
        }
        else if(kind === 'tarefa') {
            endpoint = '/tarefa';
            payload = { titulo: nome, descricao: desc, dataLimite: data, turmaId: turmaId };
        }
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
            carregarDadosBackend(); // Recarrega tudo
        } else {
            const txt = await response.text();
            alert('Erro ao salvar: ' + txt);
        }
    } catch (error) {
        console.error("Erro no envio:", error);
        alert("Erro de conexão com o servidor.");
    }
});