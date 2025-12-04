export const ui = {
    // --- TABELAS ---

    renderTurmas(turmas) {
        const tbody = document.getElementById('turmasBody');
        if(!tbody) return;
        tbody.innerHTML = turmas.map(t => `
            <tr class="hover:bg-dark-800 transition-colors border-b border-dark-700/50 last:border-0">
                <td class="px-6 py-4 font-medium text-white">${t.nome}</td>
                <td class="px-6 py-4">${t.curso || '-'}</td>
                <td class="px-6 py-4 text-center">
                    <span class="bg-dark-700 text-slate-300 text-xs px-2.5 py-1 rounded-md font-semibold">${t.quantidadeAlunos || 0}</span>
                </td>
                <td class="px-6 py-4 text-emerald-400 font-medium">R$ ${(t.totalArrecadado || 0).toFixed(2)}</td>
                <td class="px-6 py-4 text-right">
                    <button class="text-slate-400 hover:text-white transition-colors"><i class="ph ph-dots-three-vertical text-xl"></i></button>
                </td>
            </tr>
        `).join('');
    },

    renderAlunos(alunos) {
        const tbody = document.getElementById('alunosBody');
        if(!tbody) return;
        tbody.innerHTML = alunos.map(a => {
            let nomeTurma = a.nomeTurma || (a.turma ? a.turma.nome : '-');
            let statusColor = 'text-slate-400 border-slate-600';
            if(a.status === 'pendente') statusColor = 'text-orange-400 border-orange-500/30 bg-orange-500/10';
            if(a.status === 'atrasado') statusColor = 'text-red-400 border-red-500/30 bg-red-500/10';
            if(a.status === 'regular' || !a.status) statusColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

            return `
            <tr class="hover:bg-dark-800 transition-colors border-b border-dark-700/50 last:border-0">
                <td class="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20">
                        ${a.nome.charAt(0)}
                    </div>
                    ${a.nome}
                </td>
                <td class="px-6 py-4 text-slate-400">${nomeTurma}</td>
                <td class="px-6 py-4">${a.contato || '-'}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs font-medium border ${statusColor} capitalize">${a.status || 'regular'}</span></td>
                <td class="px-6 py-4 text-right"><button class="text-slate-400 hover:text-white"><i class="ph ph-pencil-simple"></i></button></td>
            </tr>`;
        }).join('');
    },

    renderEventos(eventos) {
        const tbody = document.getElementById('eventosBody');
        if(!tbody) return;
        tbody.innerHTML = eventos.map(e => `
            <tr class="hover:bg-dark-800 transition-colors border-b border-dark-700/50 last:border-0">
                <td class="px-6 py-4 font-medium text-white flex items-center gap-2"><i class="ph ph-calendar-check text-primary-500"></i> ${e.nome}</td>
                <td class="px-6 py-4 text-slate-300">${new Date(e.dataEvento).toLocaleDateString('pt-BR')}</td>
                <td class="px-6 py-4 text-slate-400">${e.localEvento || 'A definir'}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">${e.status}</span></td>
                <td class="px-6 py-4 text-right"><button class="text-slate-400 hover:text-white"><i class="ph ph-dots-three-vertical"></i></button></td>
            </tr>
        `).join('');
    },

    renderFinanceiro(financeiro) {
        const tbody = document.getElementById('financeiroBody');
        if(!tbody) return;
        tbody.innerHTML = financeiro.map(f => {
            const isReceita = f.tipo === 'receita';
            return `
            <tr class="hover:bg-dark-800 transition-colors border-b border-dark-700/50 last:border-0">
                <td class="px-6 py-4 font-medium text-white">${f.descricao}</td>
                <td class="px-6 py-4 capitalize text-slate-400"><span class="flex items-center gap-1"><i class="ph ${isReceita ? 'ph-arrow-up-right' : 'ph-arrow-down-right'}"></i> ${f.tipo}</span></td>
                <td class="px-6 py-4 font-bold ${isReceita ? 'text-emerald-400' : 'text-red-400'}">${isReceita ? '+' : '-'} R$ ${f.valor.toFixed(2)}</td>
                <td class="px-6 py-4 text-slate-400 text-sm">${new Date(f.dataLancamento).toLocaleDateString('pt-BR')}</td>
                <td class="px-6 py-4 text-right"><button class="text-slate-400 hover:text-red-400 transition-colors"><i class="ph ph-trash"></i></button></td>
            </tr>`;
        }).join('');
    },

    // --- NOVA FUNÇÃO: RENDERIZAÇÃO DE VOTAÇÕES ---
    renderVotacoes(votacoes, alunos) {
        const container = document.getElementById('votacoesContainer');
        if(!container) return;

        if(votacoes.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10 bg-dark-800 rounded-lg border border-dark-700 border-dashed">
                <i class="ph ph-chart-bar text-4xl mb-2 text-slate-600"></i><br>
                Nenhuma votação ativa no momento.
            </div>`;
            return;
        }

        container.innerHTML = votacoes.map(v => {
            return `
            <div class="bg-dark-800 rounded-xl border border-dark-700 shadow-lg overflow-hidden flex flex-col hover:border-dark-600 transition-colors">
                <div class="p-5 border-b border-dark-700 flex justify-between items-start bg-gradient-to-r from-dark-800 to-dark-900">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-1 block flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span> Aberta</span>
                        <h3 class="text-lg font-bold text-white leading-tight">${v.titulo}</h3>
                    </div>
                    <div class="bg-dark-900 p-2 rounded-lg text-center min-w-[50px] border border-dark-700">
                        <span class="block text-xs text-slate-500">Fim</span>
                        <span class="block text-sm font-bold text-white">${new Date(v.dataFim).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}</span>
                    </div>
                </div>

                <div class="p-5 flex-1 space-y-3">
                    ${v.opcoes && v.opcoes.length > 0 ? v.opcoes.map(op => `
                        <div class="group">
                            <div class="flex justify-between text-sm text-slate-300 mb-1">
                                <span class="font-medium">${op.nomeFornecedor || 'Opção ' + op.id}</span>
                                <span class="text-xs text-slate-500 group-hover:text-primary-400 transition-colors cursor-pointer">Votar</span>
                            </div>
                            <button onclick="votar('${v.id}', '${op.id}')" class="w-full bg-dark-900 hover:bg-dark-750 border border-dark-700 hover:border-primary-500/50 rounded-lg p-3 text-left transition-all relative overflow-hidden group">
                                <div class="flex justify-between items-center z-10 relative">
                                    <span class="text-slate-400 group-hover:text-white transition-colors text-sm">Selecionar esta opção</span>
                                    <i class="ph-bold ph-check-circle text-dark-600 group-hover:text-primary-500 text-xl transition-colors"></i>
                                </div>
                                <div class="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </div>
                    `).join('') : '<div class="text-sm text-slate-500 italic text-center py-4">Nenhuma opção cadastrada.</div>'}
                </div>

                <div class="p-3 bg-dark-900/50 border-t border-dark-700 text-center">
                    <button onclick="adicionarOpcaoUI('${v.id}')" class="text-xs text-blue-400 hover:text-white font-medium flex items-center justify-center gap-1 w-full py-1 hover:bg-dark-800 rounded transition-colors">
                        <i class="ph-bold ph-plus"></i> Adicionar Opção
                    </button>
                </div>
            </div>`;
        }).join('');
    },

    // --- GRÁFICOS (Chart.js) ---

    renderCharts(financeiro) {
        const meses = {};
        let totalReceitaAbs = 0;
        let totalDespesaAbs = 0;
        const sortedFin = [...financeiro].sort((a,b) => new Date(a.dataLancamento) - new Date(b.dataLancamento));

        sortedFin.forEach(l => {
            const k = l.dataLancamento.substring(0, 7); 
            if(!meses[k]) meses[k] = {rec:0, desp:0};
            if(l.tipo === 'receita') { meses[k].rec += l.valor; totalReceitaAbs += l.valor; }
            else { meses[k].desp += l.valor; totalDespesaAbs += l.valor; }
        });

        const labels = Object.keys(meses).sort();
        const dataRec = labels.map(m => meses[m].rec);
        const dataDesp = labels.map(m => meses[m].desp);
        const labelsFmt = labels.map(l => {
            const [a, m] = l.split('-');
            return new Date(a, m - 1).toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
        });

        const ctxMain = document.getElementById('mainChart');
        if(ctxMain) {
            if(window.chartMain instanceof Chart) window.chartMain.destroy();
            const gradientRec = ctxMain.getContext('2d').createLinearGradient(0, 0, 0, 300);
            gradientRec.addColorStop(0, 'rgba(16, 185, 129, 0.4)'); gradientRec.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
            const gradientDesp = ctxMain.getContext('2d').createLinearGradient(0, 0, 0, 300);
            gradientDesp.addColorStop(0, 'rgba(239, 68, 68, 0.4)'); gradientDesp.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

            window.chartMain = new Chart(ctxMain, {
                type: 'line',
                data: {
                    labels: labelsFmt,
                    datasets: [
                        { label: 'Receitas', data: dataRec, borderColor: '#10b981', backgroundColor: gradientRec, borderWidth: 2, pointBackgroundColor: '#064e3b', fill: true, tension: 0.4 },
                        { label: 'Despesas', data: dataDesp, borderColor: '#ef4444', backgroundColor: gradientDesp, borderWidth: 2, pointBackgroundColor: '#7f1d1d', fill: true, tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { align: 'end', labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 6 } }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#cbd5e1', borderColor: '#334155', borderWidth: 1 } },
                    scales: { y: { grid: { color: '#334155', borderDash: [4, 4] }, ticks: { color: '#64748b', callback: (val) => 'R$ ' + val } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } }
                }
            });
        }

        const ctxDonut = document.getElementById('donutChart');
        if(ctxDonut) {
            if(window.chartDonut instanceof Chart) window.chartDonut.destroy();
            window.chartDonut = new Chart(ctxDonut, {
                type: 'doughnut',
                data: {
                    labels: ['Receitas', 'Despesas'],
                    datasets: [{ data: [totalReceitaAbs, totalDespesaAbs], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0, hoverOffset: 4 }]
                },
                options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
            const totalMov = totalReceitaAbs + totalDespesaAbs;
            const elTotal = document.getElementById('donutTotal');
            if(elTotal) elTotal.innerText = (totalMov / 1000).toFixed(1) + "k";
            if(totalMov > 0) {
                if(document.getElementById('percReceita')) document.getElementById('percReceita').innerText = Math.round((totalReceitaAbs / totalMov) * 100) + "%";
                if(document.getElementById('percDespesa')) document.getElementById('percDespesa').innerText = Math.round((totalDespesaAbs / totalMov) * 100) + "%";
            }
        }
    },

    // --- DASHBOARD UPDATE ---

    atualizarDashboard(db) {
        const lastUpdate = document.getElementById('lastUpdate');
        if(lastUpdate) lastUpdate.innerText = new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

        const totalReceita = db.financeiro.filter(f => f.tipo === 'receita').reduce((acc, curr) => acc + curr.valor, 0);
        const totalDespesa = db.financeiro.filter(f => f.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
        const saldo = totalReceita - totalDespesa;

        const elSaldo = document.getElementById('totalReceita');
        if(elSaldo) {
            elSaldo.innerText = "R$ " + saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            elSaldo.className = `text-3xl font-bold mt-1 tracking-tight ${saldo >= 0 ? 'text-white' : 'text-red-500'}`;
        }

        const maxVal = Math.max(totalReceita, totalDespesa) || 1; 
        if(document.getElementById('txtEntradas')) {
            document.getElementById('txtEntradas').innerText = "R$ " + totalReceita.toLocaleString();
            document.getElementById('barEntradas').style.width = ((totalReceita / maxVal) * 100) + "%";
        }
        if(document.getElementById('txtSaidas')) {
            document.getElementById('txtSaidas').innerText = "R$ " + totalDespesa.toLocaleString();
            document.getElementById('barSaidas').style.width = ((totalDespesa / maxVal) * 100) + "%";
        }

        const inadimplentes = db.alunos.filter(a => a.status === 'pendente' || a.status === 'atrasado').length;
        if(document.getElementById('totalInadimplencia')) document.getElementById('totalInadimplencia').innerText = inadimplentes;

        if(db.eventos && db.eventos.length > 0) {
             const hoje = new Date(); hoje.setHours(0,0,0,0);
             const futuros = db.eventos.filter(e => new Date(e.dataEvento + 'T00:00:00') >= hoje).sort((a,b) => new Date(a.dataEvento) - new Date(b.dataEvento));
             const prox = futuros.length > 0 ? futuros[0] : null;
             if(prox) {
                if(document.getElementById('proximoEvento')) document.getElementById('proximoEvento').innerText = prox.nome;
                if(document.getElementById('dataEvento')) document.getElementById('dataEvento').innerText = new Date(prox.dataEvento).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'});
             } else {
                if(document.getElementById('proximoEvento')) document.getElementById('proximoEvento').innerText = "Sem eventos";
             }
        }

        const tbodyRecent = document.getElementById('dashboardRecentTable');
        if(tbodyRecent && db.financeiro.length > 0) {
            const ultimos = [...db.financeiro].sort((a,b) => new Date(b.dataLancamento) - new Date(a.dataLancamento)).slice(0, 5);
            tbodyRecent.innerHTML = ultimos.map(f => `
                <tr class="border-b border-dark-700/50 last:border-0 hover:bg-dark-700/30 transition-colors">
                    <td class="px-6 py-3 font-medium text-white truncate max-w-[150px]">${f.descricao}</td>
                    <td class="px-6 py-3 text-xs text-slate-500">${new Date(f.dataLancamento).toLocaleDateString('pt-BR')}</td>
                    <td class="px-6 py-3 text-right font-bold ${f.tipo === 'receita' ? 'text-emerald-500' : 'text-red-500'}">R$ ${f.valor.toFixed(2)}</td>
                </tr>
            `).join('');
        }

        this.renderCharts(db.financeiro);
    }
};