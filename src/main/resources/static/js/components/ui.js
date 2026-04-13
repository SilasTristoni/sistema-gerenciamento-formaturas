const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatCurrency(value = 0) {
    return currencyFormatter.format(Number(value || 0));
}

function formatGoalProgress(meta = 0, arrecadado = 0) {
    const normalizedMeta = Number(meta || 0);
    const normalizedRaised = Number(arrecadado || 0);
    if (normalizedMeta <= 0) return 'Meta nao definida';
    return `${Math.round((normalizedRaised / normalizedMeta) * 100)}% da meta`;
}

function goalBar(percentual = 0) {
    const visual = Math.max(0, Math.min(Number(percentual || 0), 100));
    return `
        <div class="goal-table-progress">
            <div class="goal-table-progress__bar" style="width:${visual}%;"></div>
        </div>
    `;
}

function formatDate(value) {
    if (!value) return '---';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? '---' : date.toLocaleDateString('pt-BR');
}

function sortByName(items = [], field = 'nome') {
    return [...items].sort((a, b) => String(a?.[field] || '').localeCompare(String(b?.[field] || ''), 'pt-BR'));
}

function sortByDateAsc(items = [], field) {
    return [...items].sort((a, b) => {
        const da = a?.[field] ? new Date(`${a[field]}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b?.[field] ? new Date(`${b[field]}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
    });
}

function sortByDateDesc(items = [], field) {
    return sortByDateAsc(items, field).reverse();
}

function renderEmptyRow(message, columns) {
    return `
        <tr>
            <td colspan="${columns}" class="px-6 py-8 text-center text-sm text-slate-500">${escapeHtml(message)}</td>
        </tr>
    `;
}

function statusBadge(status = '') {
    const normalized = String(status || '').toLowerCase();
    const className = normalized === 'emdia'
        ? 'bg-emerald-500/20 text-emerald-400'
        : normalized === 'aberta' || normalized === 'agendado'
            ? 'bg-sky-500/20 text-sky-300'
            : 'bg-orange-500/20 text-orange-400';

    return `<span class="px-2.5 py-1 rounded-full text-xs font-semibold ${className}">${escapeHtml(status || '---')}</span>`;
}

export const ui = {
    renderTurmas(turmas) {
        const tbody = document.getElementById('turmasBody');
        if (!tbody) return;

        const ordered = sortByName(turmas);
        tbody.innerHTML = ordered.length ? ordered.map(t => `
            <tr>
                <td class="px-6 py-4 font-medium text-white">${escapeHtml(t.nome)}</td>
                <td class="px-6 py-4">${escapeHtml(t.curso || '---')}</td>
                <td class="px-6 py-4">${escapeHtml(String(t.quantidadeAlunos || 0))}</td>
                <td class="px-6 py-4">
                    <div class="font-semibold text-white">${escapeHtml(formatCurrency(t.metaArrecadacao || 0))}</div>
                    <div class="mt-1 text-xs text-slate-500">${(t.metaArrecadacao || 0) > 0 ? 'Objetivo financeiro' : 'Defina a meta da turma'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-emerald-400 font-semibold">${escapeHtml(formatCurrency(t.totalArrecadado || 0))}</div>
                    <div class="mt-2">${goalBar(t.percentualMeta ?? (((t.metaArrecadacao || 0) > 0) ? (((t.totalArrecadado || 0) / (t.metaArrecadacao || 1)) * 100) : 0))}</div>
                    <div class="mt-1 text-xs text-slate-500">${escapeHtml(formatGoalProgress(t.metaArrecadacao, t.totalArrecadado))}</div>
                </td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('turma', ${t.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('turma', ${t.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('') : renderEmptyRow('Nenhuma turma cadastrada ainda.', 6);
    },

    renderAlunos(alunos) {
        const tbody = document.getElementById('alunosBody');
        if (!tbody) return;

        const ordered = sortByName(alunos);
        tbody.innerHTML = ordered.length ? ordered.map(a => `
            <tr>
                <td class="px-6 py-4">
                    <div class="font-medium text-white">${escapeHtml(a.nome)}</div>
                    <div class="text-xs text-emerald-300 mt-1">@${escapeHtml(a.identificador || 'sem-login')}</div>
                </td>
                <td class="px-6 py-4">${escapeHtml(a.nomeTurma || '---')}</td>
                <td class="px-6 py-4">${escapeHtml(a.contato || '---')}</td>
                <td class="px-6 py-4">${statusBadge(a.status)}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('aluno', ${a.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('aluno', ${a.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('') : renderEmptyRow('Nenhum aluno cadastrado ainda.', 5);
    },

    renderEventos(eventos) {
        const tbody = document.getElementById('eventosBody');
        if (!tbody) return;

        const ordered = sortByDateAsc(eventos, 'dataEvento');
        tbody.innerHTML = ordered.length ? ordered.map(e => `
            <tr>
                <td class="px-6 py-4 font-medium text-white">${escapeHtml(e.nome)}</td>
                <td class="px-6 py-4">${escapeHtml(formatDate(e.dataEvento))}</td>
                <td class="px-6 py-4">${escapeHtml(e.localEvento || '---')}</td>
                <td class="px-6 py-4">${statusBadge(e.status || 'agendado')}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('evento', ${e.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('evento', ${e.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('') : renderEmptyRow('Nenhum evento cadastrado ainda.', 5);
    },

    renderFinanceiro(financeiro) {
        const tbody = document.getElementById('financeiroBody');
        if (!tbody) return;

        const ordered = sortByDateDesc(financeiro, 'dataLancamento');
        tbody.innerHTML = ordered.length ? ordered.map(f => `
            <tr>
                <td class="px-6 py-4 text-white">${escapeHtml(f.descricao)}</td>
                <td class="px-6 py-4 uppercase text-xs tracking-wider">${escapeHtml(f.tipo || '---')}</td>
                <td class="px-6 py-4 font-bold ${(f.tipo || '').toLowerCase() === 'receita' ? 'text-emerald-400' : 'text-red-400'}">${escapeHtml(formatCurrency(f.valor || 0))}</td>
                <td class="px-6 py-4">${escapeHtml(formatDate(f.dataLancamento))}</td>
                <td class="px-6 py-4 text-right flex justify-end gap-3">
                    <button onclick="editarRegistro('lancamento', ${f.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('lancamento', ${f.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
                </td>
            </tr>
        `).join('') : renderEmptyRow('Nenhum lancamento financeiro cadastrado ainda.', 5);
    },

    renderVotacoes(votacoes) {
        const container = document.getElementById('votacoesContainer');
        if (!container) return;

        const ordered = sortByDateAsc(votacoes, 'dataFim');
        container.innerHTML = ordered.length ? ordered.map(v => `
            <div class="bg-dark-800 p-5 rounded-[22px] border border-white/8 shadow-lg relative group overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none"></div>
                <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editarRegistro('votacao', ${v.id})" class="btn-admin text-primary-500 hover:text-primary-400" style="display:none;"><i class="ph ph-pencil-simple text-lg"></i></button>
                    <button onclick="excluirRegistro('votacao', ${v.id})" class="btn-admin text-red-500 hover:text-red-400" style="display:none;"><i class="ph ph-trash text-lg"></i></button>
                </div>
                <div class="relative flex justify-between items-center mb-4 pr-16 gap-3">
                    <h3 class="font-bold text-white text-lg leading-tight">${escapeHtml(v.titulo)}</h3>
                    <span class="text-xs bg-dark-700 px-2.5 py-1 rounded-full text-slate-300 whitespace-nowrap">Ate ${escapeHtml(formatDate(v.dataFim))}</span>
                </div>
                <div class="relative flex items-center justify-between gap-3 text-xs text-slate-400">
                    ${statusBadge(v.status || 'aberta')}
                    <span>${escapeHtml(v.turma?.nome || 'Sem turma')}</span>
                </div>
                <p class="relative mt-3 text-sm text-slate-400">A comissao organiza as opcoes aqui. A votacao em si acontece no portal do aluno.</p>
                <div class="relative space-y-2.5 mt-4">
                    ${(v.opcoes || []).length ? (v.opcoes || []).map(o => `
                        <div class="rounded-2xl border border-white/8 bg-dark-900/90 p-3.5">
                            <div class="flex items-center justify-between gap-3">
                                <span class="text-slate-200 font-medium">${escapeHtml(o.nomeFornecedor || 'Opcao sem nome')}</span>
                                ${o.valorProposta != null ? `<strong class="text-emerald-300">${escapeHtml(formatCurrency(o.valorProposta))}</strong>` : ''}
                            </div>
                            ${o.detalhesProposta ? `<p class="mt-2 text-sm text-slate-400">${escapeHtml(o.detalhesProposta)}</p>` : ''}
                        </div>
                    `).join('') : '<div class="rounded-2xl border border-dashed border-white/10 bg-dark-900/70 p-4 text-sm text-slate-500">Nenhuma opcao cadastrada ainda.</div>'}
                </div>
                <div class="relative mt-4 flex items-center justify-between gap-3 text-sm">
                    <span class="text-slate-500">${escapeHtml(String((v.opcoes || []).length))} opcoes cadastradas</span>
                    <button onclick="adicionarOpcaoUI(${v.id})" class="btn-admin text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors" style="display:none;">
                        <i class="ph ph-plus-bold"></i> Adicionar opcao
                    </button>
                </div>
            </div>
        `).join('') : '<div class="text-sm text-slate-500">Nenhuma votacao cadastrada ainda.</div>';
    },

    atualizarDashboard() {
        // Mantido por compatibilidade. A home atual usa o endpoint consolidado da dashboard.
    }
};
