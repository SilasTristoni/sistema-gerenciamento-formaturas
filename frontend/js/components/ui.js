export const ui = {
    renderTurmas(turmas) {
        const tbody = document.getElementById('turmasBody');
        if(!tbody) return;
        tbody.innerHTML = turmas.map(t => `
            <tr class="hover:bg-dark-800 transition-colors">
                <td class="px-6 py-4 font-medium text-white">${t.nome}</td>
                <td class="px-6 py-4">${t.curso || '-'}</td>
                <td class="px-6 py-4 text-center"><span class="bg-dark-700 text-white text-xs px-2 py-1 rounded-md">${t.quantidadeAlunos || 0}</span></td>
                <td class="px-6 py-4 text-emerald-400 font-medium">R$ ${t.totalArrecadado || 0}</td>
                <td class="px-6 py-4 text-right"><button class="text-slate-400 hover:text-white"><i class="ph ph-dots-three-vertical text-xl"></i></button></td>
            </tr>
        `).join('');
    },

    renderAlunos(alunos) {
        const tbody = document.getElementById('alunosBody');
        if(!tbody) return;
        tbody.innerHTML = alunos.map(a => {
            let nomeTurma = a.nomeTurma || (a.turma ? a.turma.nome : '-');
            return `
            <tr class="hover:bg-dark-800 transition-colors">
                <td class="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">${a.nome.charAt(0)}</div>
                    ${a.nome}
                </td>
                <td class="px-6 py-4 text-slate-400">${nomeTurma}</td>
                <td class="px-6 py-4">${a.contato || '-'}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">${a.status}</span></td>
                <td class="px-6 py-4 text-right"><button class="text-slate-400 hover:text-white"><i class="ph ph-pencil-simple"></i></button></td>
            </tr>`;
        }).join('');
    },

    // ... Faça o mesmo para Eventos e Financeiro se quiser limpar mais ...

    atualizarDashboard(db) {
        document.getElementById('totalAlunos').innerText = db.alunos.length;
        document.getElementById('turmasAtivas').innerText = db.turmas.length + " Turmas";
        const total = db.financeiro
            .filter(f => f.tipo === 'receita')
            .reduce((acc, curr) => acc + curr.valor, 0);
        document.getElementById('totalReceita').innerText = "R$ " + total.toFixed(2);
    }
};