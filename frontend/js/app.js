// Configuração da API (Quando o Java estiver rodando, use a URL correta)
const API_URL = 'http://localhost:8080/api/dashboard';
const MOCK_MODE = true; // Mude para FALSE para conectar no Java real

// Função Principal ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    // Começa como Admin por padrão
    alterarPerfil('ADMIN');
    carregarDados();
});

// Simula a busca de dados (ou busca real se conectar no Java)
async function carregarDados() {
    try {
        let dados;
        
        if (MOCK_MODE) {
            // Dados simulados enquanto o Java não está pronto
            dados = {
                saldo: 45200.00,
                mensalidadeStatus: "Em dia"
            };
        } else {
            const response = await fetch(`${API_URL}/resumo`);
            dados = await response.json();
        }

        // Atualiza a tela (DOM)
        const saldoFormatado = dados.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('saldo-turma').innerText = saldoFormatado;

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

// Lógica de Permissões (Front-end)
function alterarPerfil(perfil) {
    const elementosAdmin = document.querySelectorAll('.admin-only');
    const elementosAluno = document.querySelectorAll('.student-only');
    
    // Atualiza botões do topo
    document.getElementById('btn-admin').classList.toggle('active', perfil === 'ADMIN');
    document.getElementById('btn-student').classList.toggle('active', perfil === 'STUDENT');

    // Atualiza Textos
    if (perfil === 'ADMIN') {
        document.getElementById('userName').innerText = "Olá, Arthur";
        document.getElementById('userRole').innerText = "Presidente da Comissão";
        
        // Mostra coisas de Admin
        elementosAdmin.forEach(el => el.style.display = 'flex');
        elementosAluno.forEach(el => el.style.display = 'none');
    } else {
        document.getElementById('userName').innerText = "Olá, Gabriel";
        document.getElementById('userRole').innerText = "Formando";
        
        // Mostra coisas de Aluno
        elementosAdmin.forEach(el => el.style.display = 'none');
        elementosAluno.forEach(el => el.style.display = 'flex');
    }
}

// Funções de Ação
function votarSimulado() {
    alert("Voto registrado com sucesso! (Auditável via Blockchain/Banco futuramente)");
}

function abrirMenuCriacao() {
    alert("Abrir modal para: \n1. Lançar Despesa\n2. Criar Evento\n3. Nova Votação");
}