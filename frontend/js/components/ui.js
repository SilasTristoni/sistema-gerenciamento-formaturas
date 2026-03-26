export const ui = {
    renderTurmas(turmas) {
        const tbody = document.getElementById('turmasBody');
        if (!tbody) return;
        tbody.innerHTML = turmas.map(t => `
            <tr>
                <td class="px-6 py-4 font-medium text-white">${t.nome}</td>
                <td class="px-6 py-4">${t.curso}</td>
                <td class="px-6 py-4">${t.quantidadeAlunos || 0}</td>
                <td class="px-6 py-4 text-emerald-400 font-semibold">R$ ${(t.totalArrecadado || 0).toFixed(2)}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('turma', ${t.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('turma', ${t.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderAlunos(alunos) {
        const tbody = document.getElementById('alunosBody');
        if (!tbody) return;
        tbody.innerHTML = alunos.map(a => `
            <tr>
                <td class="px-6 py-4">
                    <div class="font-medium text-white">${a.nome}</div>
                    <div class="text-xs text-emerald-300 mt-1">@${a.identificador || 'sem-login'}</div>
                </td>
                <td class="px-6 py-4">${a.nomeTurma || '---'}</td>
                <td class="px-6 py-4">${a.contato || '---'}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${a.status === 'emdia' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}">
                        ${a.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('aluno', ${a.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('aluno', ${a.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
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
                <td class="px-6 py-4"><span class="px-2.5 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-semibold">${e.status || 'Ativo'}</span></td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('evento', ${e.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('evento', ${e.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
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
                <td class="px-6 py-4 font-bold ${f.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'}">R$ ${f.valor.toFixed(2)}</td>
                <td class="px-6 py-4">${f.dataLancamento || '---'}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('lancamento', ${f.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('lancamento', ${f.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderVotacoes(votacoes) {
        const container = document.getElementById('votacoesContainer');
        if (!container) return;
        container.innerHTML = votacoes.map(v => `
            <div class="bg-dark-800 p-5 rounded-[22px] border border-white/8 shadow-lg relative group overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none"></div>
                <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editarRegistro('votacao', ${v.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('votacao', ${v.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
                </div>
                <div class="relative flex justify-between items-center mb-4 pr-16 gap-3">
                    <h3 class="font-bold text-white text-lg leading-tight">${v.titulo}</h3>
                    <span class="text-xs bg-dark-700 px-2.5 py-1 rounded-full text-slate-300 whitespace-nowrap">Até ${v.dataFim || '---'}</span>
                </div>
                <div class="relative space-y-2.5 mt-4">
                    ${(v.opcoes || []).map(o => `
                        <button onclick="votar(${v.id}, ${o.id})" class="w-full text-left p-3.5 rounded-2xl border border-white/8 bg-dark-900 hover:border-primary-500/50 transition-colors flex justify-between items-center group/btn">
                            <span class="text-slate-300 group-hover/btn:text-white font-medium">${o.nomeFornecedor}</span>
                            <i class="ph-fill ph-check-circle text-primary-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></i>
                        </button>
                    `).join('')}
                </div>
                <button onclick="adicionarOpcaoUI(${v.id})" class="btn-admin mt-4 text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors" style="display:none;">
                    <i class="ph ph-plus-bold"></i> Adicionar opção
                </button>
            </div>
        `).join('');
    },

    atualizarDashboard(db) {
        const financeiro = db.financeiro || [];
        const receitas = financeiro.filter(f => f.tipo === 'receita').reduce((acc, curr) => acc + curr.valor, 0);
        const despesas = financeiro.filter(f => f.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
        const saldo = receitas - despesas;
        const inadimplentes = (db.alunos || []).filter(a => a.status === 'pendente' || a.status === 'atrasado').length;
        const proximoEvento = db.eventos && db.eventos.length > 0 ? db.eventos[0] : null;

        document.getElementById('totalReceita') && (document.getElementById('totalReceita').innerText = `R$ ${saldo.toFixed(2)}`);
        document.getElementById('txtEntradas') && (document.getElementById('txtEntradas').innerText = `R$ ${receitas.toFixed(2)}`);
        document.getElementById('txtSaidas') && (document.getElementById('txtSaidas').innerText = `R$ ${despesas.toFixed(2)}`);
        document.getElementById('totalInadimplencia') && (document.getElementById('totalInadimplencia').innerText = inadimplentes);
        document.getElementById('proximoEvento') && (document.getElementById('proximoEvento').innerText = proximoEvento?.nome || '--');
        document.getElementById('dataEvento') && (document.getElementById('dataEvento').innerText = proximoEvento?.dataEvento || '--');
        document.getElementById('kpiTurmas') && (document.getElementById('kpiTurmas').innerText = db.turmas?.length || 0);
        document.getElementById('kpiAlunos') && (document.getElementById('kpiAlunos').innerText = db.alunos?.length || 0);
        document.getElementById('kpiEventos') && (document.getElementById('kpiEventos').innerText = db.eventos?.length || 0);
    }
};
