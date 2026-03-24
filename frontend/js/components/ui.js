export const ui = {
    renderTurmas(turmas) {
        const tbody = document.getElementById('turmasBody');
        if (!tbody) return;
        tbody.innerHTML = turmas.map(t => `
            <tr>
                <td class="px-6 py-4 font-medium text-white">${t.nome}</td>
                <td class="px-6 py-4">${t.curso}</td>
                <td class="px-6 py-4">${t.quantidadeAlunos || 0}</td>
                <td class="px-6 py-4 text-emerald-500 font-medium">R$ ${(t.totalArrecadado || 0).toFixed(2)}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('turma', ${t.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display: none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('turma', ${t.id})" class="btn-admin text-red-500 hover:text-red-400" style="display: none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderAlunos(alunos) {
        const tbody = document.getElementById('alunosBody');
        if (!tbody) return;
        tbody.innerHTML = alunos.map(a => `
            <tr>
                <td class="px-6 py-4 font-medium text-white">${a.nome}</td>
                <td class="px-6 py-4">${a.nomeTurma || '---'}</td>
                <td class="px-6 py-4">${a.contato}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${a.status === 'emdia' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-orange-500/20 text-orange-500'}">
                        ${a.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('aluno', ${a.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display: none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('aluno', ${a.id})" class="btn-admin text-red-500 hover:text-red-400" style="display: none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderEventos(eventos) {
        const tbody = document.getElementById('eventosBody');
        if (!tbody) return;
        tbody.innerHTML = eventos.map(e => `
            <tr>
                <td class="px-6 py-4 font-medium text-white">${e.nome}</td>
                <td class="px-6 py-4">${e.dataEvento || '---'}</td>
                <td class="px-6 py-4">${e.localEvento || '---'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 bg-primary-500/20 text-primary-500 rounded text-xs">${e.status}</span>
                </td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('evento', ${e.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display: none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('evento', ${e.id})" class="btn-admin text-red-500 hover:text-red-400" style="display: none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderFinanceiro(financeiro) {
        const tbody = document.getElementById('financeiroBody');
        if (!tbody) return;
        tbody.innerHTML = financeiro.map(f => `
            <tr>
                <td class="px-6 py-4 text-white">${f.descricao}</td>
                <td class="px-6 py-4 uppercase text-xs tracking-wider">${f.tipo}</td>
                <td class="px-6 py-4 font-bold ${f.tipo === 'receita' ? 'text-emerald-500' : 'text-red-500'}">
                    R$ ${f.valor.toFixed(2)}
                </td>
                <td class="px-6 py-4">${f.dataLancamento || '---'}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('lancamento', ${f.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display: none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('lancamento', ${f.id})" class="btn-admin text-red-500 hover:text-red-400" style="display: none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderVotacoes(votacoes, alunos) {
        const container = document.getElementById('votacoesContainer');
        if (!container) return;
        container.innerHTML = votacoes.map(v => `
            <div class="bg-dark-800 p-5 rounded-xl border border-dark-700 shadow-lg relative group">
                <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editarRegistro('votacao', ${v.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display: none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('votacao', ${v.id})" class="btn-admin text-red-500 hover:text-red-400" style="display: none;"><i class="ph ph-trash text-lg"></i></button>
                </div>
                <div class="flex justify-between items-center mb-4 pr-16">
                    <h3 class="font-bold text-white text-lg">${v.titulo}</h3>
                    <span class="text-xs bg-dark-700 px-2 py-1 rounded text-slate-300">Até ${v.dataFim || '---'}</span>
                </div>
                <div class="space-y-2 mt-4">
                    ${(v.opcoes || []).map(o => `
                        <button onclick="votar(${v.id}, ${o.id})" class="w-full text-left p-3 rounded-lg border border-dark-600 bg-dark-900 hover:border-primary-500 transition-colors flex justify-between items-center group/btn">
                            <span class="text-slate-300 group-hover/btn:text-white font-medium">${o.nomeFornecedor}</span>
                            <i class="ph-fill ph-check-circle text-primary-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></i>
                        </button>
                    `).join('')}
                </div>
                <button onclick="adicionarOpcaoUI(${v.id})" class="btn-admin mt-4 text-sm font-medium text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors" style="display: none;">
                    <i class="ph ph-plus-bold"></i> Adicionar Opção
                </button>
            </div>
        `).join('');
    },

    atualizarDashboard(db) {
        const financeiro = db.financeiro || [];
        const receitas = financeiro.filter(f => f.tipo === 'receita').reduce((acc, curr) => acc + curr.valor, 0);
        const despesas = financeiro.filter(f => f.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
        
        const txtSaldo = document.getElementById('totalReceita');
        if (txtSaldo) txtSaldo.innerText = `R$ ${(receitas - despesas).toFixed(2)}`;
        
        const txtEntradas = document.getElementById('txtEntradas');
        if (txtEntradas) txtEntradas.innerText = `R$ ${receitas.toFixed(2)}`;
        
        const txtSaidas = document.getElementById('txtSaidas');
        if (txtSaidas) txtSaidas.innerText = `R$ ${despesas.toFixed(2)}`;

        const inadimplentes = (db.alunos || []).filter(a => a.status === 'pendente' || a.status === 'atrasado').length;
        const txtInadimplencia = document.getElementById('totalInadimplencia');
        if (txtInadimplencia) txtInadimplencia.innerText = inadimplentes;

        if (db.eventos && db.eventos.length > 0) {
            const prox = db.eventos[0];
            const elProx = document.getElementById('proximoEvento');
            const elData = document.getElementById('dataEvento');
            if(elProx) elProx.innerText = prox.nome;
            if(elData) elData.innerText = prox.dataEvento || 'A definir';
        }

        const recentTbody = document.getElementById('dashboardRecentTable');
        if (recentTbody) {
            recentTbody.innerHTML = financeiro.slice(-5).reverse().map(f => `
                <tr>
                    <td class="px-6 py-3 font-medium text-slate-300">${f.descricao}</td>
                    <td class="px-6 py-3">${f.dataLancamento || '---'}</td>
                    <td class="px-6 py-3 text-right font-bold ${f.tipo === 'receita' ? 'text-emerald-500' : 'text-red-500'}">
                        ${f.tipo === 'receita' ? '+' : '-'} R$ ${f.valor.toFixed(2)}
                    </td>
                </tr>
            `).join('');
        }
    }
};