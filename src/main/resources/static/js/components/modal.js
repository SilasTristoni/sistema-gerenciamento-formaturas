const LAST_TURMA_KEY = 'gestaoform.lastTurmaId';
const MODAL_LABELS = {
    turma: 'Nova turma',
    aluno: 'Novo aluno',
    evento: 'Novo evento',
    lancamento: 'Novo lançamento',
    contribuicao: 'Nova contribuição',
    votacao: 'Nova votação'
};
const MODAL_META = {
    turma: {
        eyebrow: 'Planejamento',
        lead: 'Configure a turma e sua meta financeira',
        help: 'Defina nome, curso e objetivo de arrecadação para acompanhar o progresso desde o início.',
        icon: 'ph-graduation-cap',
        submit: 'Salvar turma'
    },
    aluno: {
        eyebrow: 'Cadastro individual',
        lead: 'Adicione um aluno com acesso ao portal',
        help: 'Você pode definir identificador, contato e perfil para liberar acesso e acompanhar a participação no portal.',
        icon: 'ph-student',
        submit: 'Salvar aluno'
    },
    evento: {
        eyebrow: 'Agenda',
        lead: 'Crie um compromisso da turma',
        help: 'Registre data, local e informações do compromisso para manter a agenda da formatura sempre clara.',
        icon: 'ph-calendar-check',
        submit: 'Salvar evento'
    },
    lancamento: {
        eyebrow: 'Financeiro',
        lead: 'Registre uma entrada ou saída',
        help: 'Use valores positivos para receita e negativos para despesa e mantenha a previsão atualizada.',
        icon: 'ph-currency-dollar',
        submit: 'Salvar lançamento'
    },
    contribuicao: {
        eyebrow: 'Campanha da meta',
        lead: 'Registre uma contribuição para a turma',
        help: 'Guarde doações e apoios para a meta sem expor alunos ou criar fluxo de cobrança.',
        icon: 'ph-gift',
        submit: 'Salvar contribuição'
    },
    votacao: {
        eyebrow: 'Engajamento',
        lead: 'Abra uma nova votação da turma',
        help: 'Defina o tema e o prazo para coletar decisões da turma no portal do aluno.',
        icon: 'ph-chart-bar',
        submit: 'Salvar votação'
    }
};

function todayValue() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

function alunoTurmaId(aluno = {}) {
    return aluno.turma?.id ?? aluno.turmaId ?? '';
}

function setSelectValue(id, value) {
    const select = document.getElementById(id);
    if (select) select.value = value;
}

export const modal = {
    backdrop: document.getElementById('modalBackdrop'),
    panel: document.getElementById('modalPanel'),
    alunos: [],

    open(kind, turmas, alunos = []) {
        this.resetFields();
        this.alunos = Array.isArray(alunos) ? alunos : [];

        const select = document.getElementById('modalTurmaSelect');
        if (kind !== 'turma' && select) {
            select.innerHTML = '<option value="">Selecione a Turma...</option>';
            turmas.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.innerText = t.nome;
                select.appendChild(opt);
            });
            this.applyPreferredTurma(turmas);
        }
        this.bindDynamicSelects();

        const cat = document.getElementById('modalCategoria');
        if (cat) cat.value = kind;

        this.toggleFields();
        this.applySmartDefaults(kind);
        this.updateTitle(kind);
        this.updateIntro(kind);

        if (this.backdrop) {
            this.backdrop.classList.remove('hidden');
            this.backdrop.classList.add('flex');
        }

        setTimeout(() => {
            if (this.panel) {
                this.panel.classList.remove('scale-95', 'opacity-0');
                this.panel.classList.add('scale-100', 'opacity-100');
            }
            this.focusPrimaryField();
        }, 10);
    },

    close() {
        if (this.panel) {
            this.panel.classList.remove('scale-100', 'opacity-100');
            this.panel.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
            if (this.backdrop) {
                this.backdrop.classList.add('hidden');
                this.backdrop.classList.remove('flex');
            }
        }, 250);
    },

    toggleFields() {
        const kind = document.getElementById('modalCategoria')?.value || '';
        const lblDesc = document.getElementById('lblDescricao');
        const divTurma = document.getElementById('divTurmaSelect');
        const divDataValor = document.getElementById('divDataValor');
        const divDataField = document.getElementById('divModalDataField');
        const divValorField = document.getElementById('divModalValorField');
        const inputValor = document.getElementById('modalValor');
        const lblValor = document.getElementById('modalValorLabel');
        const divPerfil = document.getElementById('divPerfil');
        const divIdentificador = document.getElementById('divIdentificador');
        const divSenha = document.getElementById('divSenhaAluno');
        const divApoiadorNome = document.getElementById('divApoiadorNome');
        const divContribuicaoAnonima = document.getElementById('divContribuicaoAnonima');
        const divAlunoSelect = document.getElementById('divAlunoSelect');
        const divTurmaExtras = document.getElementById('divTurmaExtras');
        const divAlunoExtras = document.getElementById('divAlunoExtras');
        const divEventoExtras = document.getElementById('divEventoExtras');
        const divFinanceiroExtras = document.getElementById('divFinanceiroExtras');
        const divVotacaoExtras = document.getElementById('divVotacaoExtras');
        const detailsTitle = document.getElementById('modalDetailsTitle');
        const inputDescricao = document.getElementById('modalDescricao');

        divTurma?.classList.remove('hidden');
        divDataValor?.classList.remove('hidden');
        divDataField?.classList.remove('hidden');
        divValorField?.classList.remove('hidden');
        divPerfil?.classList.add('hidden');
        divIdentificador?.classList.add('hidden');
        divSenha?.classList.add('hidden');
        divApoiadorNome?.classList.add('hidden');
        divContribuicaoAnonima?.classList.add('hidden');
        divContribuicaoAnonima?.classList.remove('flex');
        divAlunoSelect?.classList.add('hidden');
        divTurmaExtras?.classList.add('hidden');
        divAlunoExtras?.classList.add('hidden');
        divEventoExtras?.classList.add('hidden');
        divFinanceiroExtras?.classList.add('hidden');
        divVotacaoExtras?.classList.add('hidden');

        if (detailsTitle) detailsTitle.innerText = 'Detalhes adicionais';
        if (lblDesc) lblDesc.innerText = 'Descrição / Detalhes';
        if (inputDescricao) inputDescricao.placeholder = 'Detalhes adicionais...';

        if (lblValor) lblValor.innerText = 'Valor (R$)';
        if (inputValor) inputValor.placeholder = '0.00';

        if (kind === 'turma') {
            divTurma?.classList.add('hidden');
            if (lblDesc) lblDesc.innerText = 'Curso';
            divTurmaExtras?.classList.remove('hidden');
            divDataField?.classList.add('hidden');
            if (lblValor) lblValor.innerText = 'Meta da turma (R$)';
            if (inputValor) inputValor.placeholder = 'Ex.: 30000.00';
        } else if (kind === 'aluno') {
            divDataValor?.classList.add('hidden');
            if (lblDesc) lblDesc.innerText = 'ObservaÃ§Ã£o interna';
            if (inputDescricao) inputDescricao.placeholder = 'ObservaÃ§Ã£o visÃ­vel apenas para a comissÃ£o';
            divPerfil?.classList.remove('hidden');
            divIdentificador?.classList.remove('hidden');
            divSenha?.classList.remove('hidden');
            divAlunoExtras?.classList.remove('hidden');
        } else if (['evento', 'tarefa', 'votacao'].includes(kind)) {
            divValorField?.classList.add('hidden');
            if (kind === 'evento') {
                if (lblDesc) lblDesc.innerText = 'DescriÃ§Ã£o do evento';
                divEventoExtras?.classList.remove('hidden');
            }
            if (kind === 'votacao') {
                if (lblDesc) lblDesc.innerText = 'DescriÃ§Ã£o da votaÃ§Ã£o';
                divVotacaoExtras?.classList.remove('hidden');
            }
        } else if (kind === 'contribuicao') {
            if (detailsTitle) detailsTitle.innerText = 'Contribuição';
            if (lblDesc) lblDesc.innerText = 'Mensagem';
            if (inputDescricao) inputDescricao.placeholder = 'Mensagem opcional para identificar a contribuição';
            if (lblValor) lblValor.innerText = 'Valor da contribuição (R$)';
            if (inputValor) inputValor.placeholder = 'Ex.: 150.00';
            divAlunoSelect?.classList.remove('hidden');
            divApoiadorNome?.classList.remove('hidden');
            divContribuicaoAnonima?.classList.remove('hidden');
            divContribuicaoAnonima?.classList.add('flex');
            divFinanceiroExtras?.classList.remove('hidden');
            document.getElementById('modalTipoFinanceiro') && (document.getElementById('modalTipoFinanceiro').value = 'RECEITA');
            document.getElementById('modalCategoriaFinanceira') && (document.getElementById('modalCategoriaFinanceira').value = 'CONTRIBUICAO');
            document.getElementById('modalStatusFinanceiro') && (document.getElementById('modalStatusFinanceiro').value = 'PENDENTE');
            this.populateAlunoSelect();
        } else if (kind === 'lancamento') {
            if (detailsTitle) detailsTitle.innerText = 'Classificação';
            if (lblDesc) lblDesc.innerText = 'Observação';
            if (inputDescricao) inputDescricao.placeholder = 'Observação opcional sobre o lançamento';
            divFinanceiroExtras?.classList.remove('hidden');
        }
    },

    resetFields() {
        const ids = [
            'modalItemId', 'modalNome', 'modalData', 'modalValor', 'modalDescricao', 'modalTurmaSelect',
            'modalIdentificador', 'modalSenha', 'modalApoiadorNome', 'modalAlunoSelect',
            'modalInstituicao', 'modalAnoSemestre', 'modalRepresentante', 'modalEmailAluno', 'modalWhatsappAluno',
            'modalHorarioEvento', 'modalLocalEvento', 'modalResponsavelEvento', 'modalDataVencimento',
            'modalDataInicioVotacao', 'modalQuorumMinimo'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const perfil = document.getElementById('modalPerfil');
        if (perfil) perfil.value = 'ALUNO';
        const anonima = document.getElementById('modalContribuicaoAnonima');
        if (anonima) anonima.checked = false;
        const votacaoAnonima = document.getElementById('modalVotacaoAnonima');
        if (votacaoAnonima) votacaoAnonima.checked = true;
        setSelectValue('modalStatusTurma', 'ATIVA');
        setSelectValue('modalStatusAluno', 'ATIVO');
        setSelectValue('modalTipoEvento', 'REUNIAO_GERAL');
        setSelectValue('modalStatusEvento', 'AGENDADO');
        setSelectValue('modalTipoFinanceiro', 'RECEITA');
        setSelectValue('modalCategoriaFinanceira', 'OUTROS');
        setSelectValue('modalFormaPagamento', 'PIX');
        setSelectValue('modalStatusFinanceiro', 'CONFIRMADO');
        setSelectValue('modalCampanha', 'META_GERAL');
        setSelectValue('modalStatusVotacao', 'ABERTA');
        setSelectValue('modalTipoVotacao', 'ESCOLHA_UNICA');
        setSelectValue('modalVisibilidadeResultado', 'APOS_ENCERRAMENTO');
    },

    applyPreferredTurma(turmas) {
        const select = document.getElementById('modalTurmaSelect');
        if (!select) return;

        const lastTurmaId = localStorage.getItem(LAST_TURMA_KEY);
        const hasPreferred = turmas.some(t => String(t.id) === lastTurmaId);

        if (hasPreferred) {
            select.value = lastTurmaId;
            return;
        }

        if (turmas.length === 1) {
            select.value = String(turmas[0].id);
        }
    },

    bindDynamicSelects() {
        const turmaSelect = document.getElementById('modalTurmaSelect');
        const alunoSelect = document.getElementById('modalAlunoSelect');

        if (turmaSelect && !turmaSelect.dataset.alunoFilterBound) {
            turmaSelect.addEventListener('change', () => this.populateAlunoSelect());
            turmaSelect.dataset.alunoFilterBound = 'true';
        }

        if (alunoSelect && !alunoSelect.dataset.alunoSelectBound) {
            alunoSelect.addEventListener('change', () => this.applyAlunoSelection());
            alunoSelect.dataset.alunoSelectBound = 'true';
        }
    },

    populateAlunoSelect() {
        const select = document.getElementById('modalAlunoSelect');
        if (!select) return;

        const kind = document.getElementById('modalCategoria')?.value || '';
        const turmaId = document.getElementById('modalTurmaSelect')?.value || '';
        const currentValue = select.value;
        select.innerHTML = '<option value="">Sem vínculo com aluno</option>';

        if (kind !== 'contribuicao') return;

        this.alunos
            .filter(aluno => !turmaId || String(alunoTurmaId(aluno)) === String(turmaId))
            .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'))
            .forEach(aluno => {
                const opt = document.createElement('option');
                opt.value = aluno.id;
                const turmaNome = aluno.nomeTurma || aluno.turma?.nome || 'sem turma';
                opt.innerText = `${aluno.nome || 'Aluno sem nome'} - ${turmaNome}`;
                select.appendChild(opt);
            });

        if ([...select.options].some(option => option.value === currentValue)) {
            select.value = currentValue;
        }
    },

    applyAlunoSelection() {
        const select = document.getElementById('modalAlunoSelect');
        const turmaSelect = document.getElementById('modalTurmaSelect');
        const apoiadorInput = document.getElementById('modalApoiadorNome');
        const aluno = this.alunos.find(item => String(item.id) === String(select?.value || ''));

        if (!aluno) return;

        const turmaId = alunoTurmaId(aluno);
        if (turmaId && turmaSelect && turmaSelect.value !== String(turmaId)) {
            turmaSelect.value = String(turmaId);
            this.populateAlunoSelect();
            if (select) select.value = String(aluno.id);
        }

        if (apoiadorInput && !apoiadorInput.value.trim() && aluno.nome) {
            apoiadorInput.value = aluno.nome;
        }
    },

    applySmartDefaults(kind) {
        const modalData = document.getElementById('modalData');
        if (modalData && ['evento', 'lancamento', 'contribuicao', 'votacao'].includes(kind)) {
            modalData.value = todayValue();
        }
        const inicioVotacao = document.getElementById('modalDataInicioVotacao');
        if (inicioVotacao && kind === 'votacao') {
            inicioVotacao.value = todayValue();
        }
    },

    updateTitle(kind) {
        const title = document.querySelector('#modalTitle span');
        if (!title) return;
        title.textContent = MODAL_LABELS[kind] || 'Formulário';
    },

    updateIntro(kind) {
        const meta = MODAL_META[kind] || {
            eyebrow: 'Cadastro',
            lead: 'Preencha os dados principais',
            help: 'Use este formulário para registrar um novo item no sistema.',
            icon: 'ph-pencil-simple'
        };

        const eyebrow = document.getElementById('modalEyebrow');
        const lead = document.getElementById('modalLead');
        const help = document.getElementById('modalHelp');
        const icon = document.getElementById('modalIntroIcon');
        const submit = document.getElementById('modalSubmitButton');

        if (eyebrow) eyebrow.textContent = meta.eyebrow;
        if (lead) lead.textContent = meta.lead;
        if (help) help.textContent = meta.help;
        if (icon) icon.innerHTML = `<i class="ph ${meta.icon}"></i>`;
        if (submit) submit.textContent = meta.submit || 'Salvar';
    },

    focusPrimaryField() {
        const field = document.getElementById('modalNome');
        field?.focus();
    },

    getData() {
        const turmaId = document.getElementById('modalTurmaSelect')?.value || '';
        if (turmaId) localStorage.setItem(LAST_TURMA_KEY, turmaId);

        return {
            id: document.getElementById('modalItemId')?.value || '',
            kind: document.getElementById('modalCategoria')?.value || '',
            nome: document.getElementById('modalNome')?.value?.trim() || '',
            data: document.getElementById('modalData')?.value || '',
            valor: document.getElementById('modalValor')?.value || '',
            desc: document.getElementById('modalDescricao')?.value?.trim() || '',
            turmaId,
            perfil: document.getElementById('modalPerfil')?.value || 'ALUNO',
            identificador: document.getElementById('modalIdentificador')?.value?.trim() || '',
            senha: document.getElementById('modalSenha')?.value || '',
            apoiadorNome: document.getElementById('modalApoiadorNome')?.value?.trim() || '',
            alunoId: document.getElementById('modalAlunoSelect')?.value || '',
            anonima: Boolean(document.getElementById('modalContribuicaoAnonima')?.checked),
            instituicao: document.getElementById('modalInstituicao')?.value?.trim() || '',
            anoSemestre: document.getElementById('modalAnoSemestre')?.value?.trim() || '',
            representante: document.getElementById('modalRepresentante')?.value?.trim() || '',
            statusTurma: document.getElementById('modalStatusTurma')?.value || 'ATIVA',
            email: document.getElementById('modalEmailAluno')?.value?.trim() || '',
            whatsapp: document.getElementById('modalWhatsappAluno')?.value?.trim() || '',
            statusAluno: document.getElementById('modalStatusAluno')?.value || 'ATIVO',
            horario: document.getElementById('modalHorarioEvento')?.value || '',
            localEvento: document.getElementById('modalLocalEvento')?.value?.trim() || '',
            tipoEvento: document.getElementById('modalTipoEvento')?.value || 'REUNIAO_GERAL',
            statusEvento: document.getElementById('modalStatusEvento')?.value || 'AGENDADO',
            responsavelEvento: document.getElementById('modalResponsavelEvento')?.value?.trim() || '',
            tipoFinanceiro: document.getElementById('modalTipoFinanceiro')?.value || 'RECEITA',
            categoriaFinanceira: document.getElementById('modalCategoriaFinanceira')?.value || 'OUTROS',
            formaPagamento: document.getElementById('modalFormaPagamento')?.value || 'PIX',
            statusFinanceiro: document.getElementById('modalStatusFinanceiro')?.value || 'CONFIRMADO',
            dataVencimento: document.getElementById('modalDataVencimento')?.value || '',
            campanha: document.getElementById('modalCampanha')?.value || 'META_GERAL',
            dataInicioVotacao: document.getElementById('modalDataInicioVotacao')?.value || '',
            statusVotacao: document.getElementById('modalStatusVotacao')?.value || 'ABERTA',
            tipoVotacao: document.getElementById('modalTipoVotacao')?.value || 'ESCOLHA_UNICA',
            visibilidadeResultado: document.getElementById('modalVisibilidadeResultado')?.value || 'APOS_ENCERRAMENTO',
            quorumMinimo: document.getElementById('modalQuorumMinimo')?.value || '',
            votacaoAnonima: Boolean(document.getElementById('modalVotacaoAnonima')?.checked)
        };
    }
};

window.toggleModalFields = () => modal.toggleFields();
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.backdrop?.classList.contains('hidden')) {
        modal.close();
    }
});
