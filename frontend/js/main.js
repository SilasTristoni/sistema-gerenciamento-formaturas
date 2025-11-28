import { api } from './services/api.js';
import { ui } from './components/ui.js';
import { modal } from './components/modal.js';
import { showToast } from './components/toast.js';

// Estado global da aplicação
let db = { turmas: [], alunos: [], eventos: [], financeiro: [], tarefas: [] };

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    setupNavigation();
    setupModalEvents();
});

// 1. Carregamento de Dados
async function carregarDados() {
    try {
        const [turmas, alunos, financeiro] = await Promise.all([
            api.buscar('turmas'),
            api.buscar('alunos'),
            api.buscar('financeiro')
            // adicione os outros aqui...
        ]);

        db = { turmas, alunos, financeiro }; // Atualiza estado
        
        ui.renderTurmas(db.turmas);
        ui.renderAlunos(db.alunos);
        ui.atualizarDashboard(db);
        
    } catch (error) {
        showToast("Erro ao conectar com servidor", "error");
    }
}

// 2. Eventos do Modal
function setupModalEvents() {
    // Expor funções globais para o HTML usar no onclick (gambiarra necessária ou adicionar EventListeners via JS)
    window.openModal = (mode, kind) => modal.open(kind, db.turmas);
    window.closeModal = () => modal.close();
    window.toggleModalFields = () => modal.toggleFields();
    
    // Salvar
    window.salvarFormulario = async (e) => {
        e.preventDefault();
        const btn = e.target;
        const originalText = btn.innerText;
        btn.innerText = "Salvando...";
        btn.disabled = true;

        const data = modal.getData();
        
        // Validação simples
        if(!data.nome) {
            showToast("Nome é obrigatório", "error");
            btn.innerText = originalText; btn.disabled = false;
            return;
        }

        // Montar Payload
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
            // ... lógica de montar payload igual ao anterior ...
            if(data.kind === 'aluno') {
                endpoint = '/aluno';
                payload = { nome: data.nome, contato: data.desc, turmaId: data.turmaId };
            }
            // ... adicione os outros ifs ...
        }

        try {
            await api.salvar(endpoint, payload);
            showToast("Salvo com sucesso!");
            modal.close();
            carregarDados(); // Recarrega a tela
        } catch (err) {
            showToast("Erro: " + err.message, "error");
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };
}

// 3. Navegação
function setupNavigation() {
    window.navigate = (screenId) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`screen-${screenId}`);
        if(target) target.classList.remove('hidden');
        // ... resto da lógica de navegação ...
    };
    window.navigate('dashboard'); // Inicia no dashboard
}