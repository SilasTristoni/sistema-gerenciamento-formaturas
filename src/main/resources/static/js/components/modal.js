const LAST_TURMA_KEY = 'gestaoform.lastTurmaId';
const MODAL_LABELS = {
    turma: 'Nova turma',
    aluno: 'Novo aluno',
    evento: 'Novo evento',
    lancamento: 'Novo lancamento',
    contribuicao: 'Nova contribuicao',
    votacao: 'Nova votacao'
};
const MODAL_META = {
    turma: {
        eyebrow: 'Planejamento',
        lead: 'Configure a turma e sua meta financeira',
        help: 'Defina nome, curso e objetivo de arrecadacao para acompanhar o progresso desde o inicio.',
        icon: 'ph-graduation-cap',
        submit: 'Salvar turma'
    },
    aluno: {
        eyebrow: 'Cadastro individual',
        lead: 'Adicione um aluno com acesso ao portal',
        help: 'Voce pode definir identificador, contato e perfil para liberar acesso e acompanhar a participacao no portal.',
        icon: 'ph-student',
        submit: 'Salvar aluno'
    },
    evento: {
        eyebrow: 'Agenda',
        lead: 'Crie um compromisso da turma',
        help: 'Registre data, local e contexto para manter a agenda da formatura sempre clara.',
        icon: 'ph-calendar-check',
        submit: 'Salvar evento'
    },
    lancamento: {
        eyebrow: 'Financeiro',
        lead: 'Registre uma entrada ou saida',
        help: 'Use valores positivos para receita e negativos para despesa e mantenha a previsao atualizada.',
        icon: 'ph-currency-dollar',
        submit: 'Salvar lancamento'
    },
    contribuicao: {
        eyebrow: 'Campanha da meta',
        lead: 'Registre uma contribuicao para a turma',
        help: 'Guarde doacoes e apoios para a meta sem expor alunos ou criar fluxo de cobranca.',
        icon: 'ph-gift',
        submit: 'Salvar contribuicao'
    },
    votacao: {
        eyebrow: 'Engajamento',
        lead: 'Abra uma nova votacao da turma',
        help: 'Defina o tema e o prazo para coletar decisoes da turma no portal do aluno.',
        icon: 'ph-chart-bar',
        submit: 'Salvar votacao'
    }
};

function todayValue() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

export const modal = {
    backdrop: document.getElementById('modalBackdrop'),
    panel: document.getElementById('modalPanel'),

    open(kind, turmas) {
        this.resetFields();

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

        if (lblDesc) lblDesc.innerText = 'Descrição / Detalhes';

        if (lblValor) lblValor.innerText = 'Valor (R$)';
        if (inputValor) inputValor.placeholder = '0.00';

        if (kind === 'turma') {
            divTurma?.classList.add('hidden');
            if (lblDesc) lblDesc.innerText = 'Curso';
            divDataField?.classList.add('hidden');
            if (lblValor) lblValor.innerText = 'Meta da turma (R$)';
            if (inputValor) inputValor.placeholder = 'Ex.: 30000.00';
        } else if (kind === 'aluno') {
            divDataValor?.classList.add('hidden');
            if (lblDesc) lblDesc.innerText = 'Contato';
            divPerfil?.classList.remove('hidden');
            divIdentificador?.classList.remove('hidden');
            divSenha?.classList.remove('hidden');
        } else if (['evento', 'tarefa', 'votacao'].includes(kind)) {
            divValorField?.classList.add('hidden');
            if (kind === 'evento' && lblDesc) lblDesc.innerText = 'Local';
            if (kind === 'votacao' && lblDesc) lblDesc.innerText = 'Detalhes / Tema';
        } else if (kind === 'contribuicao') {
            if (lblDesc) lblDesc.innerText = 'Mensagem / Contexto';
            if (lblValor) lblValor.innerText = 'Valor da contribuicao (R$)';
            if (inputValor) inputValor.placeholder = 'Ex.: 150.00';
            divApoiadorNome?.classList.remove('hidden');
            divContribuicaoAnonima?.classList.remove('hidden');
            divContribuicaoAnonima?.classList.add('flex');
        } else if (kind === 'lancamento') {
            if (lblDesc) lblDesc.innerText = 'Referencia';
        }
    },

    resetFields() {
        const ids = ['modalItemId', 'modalNome', 'modalData', 'modalValor', 'modalDescricao', 'modalTurmaSelect', 'modalIdentificador', 'modalSenha', 'modalApoiadorNome'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const perfil = document.getElementById('modalPerfil');
        if (perfil) perfil.value = 'ALUNO';
        const anonima = document.getElementById('modalContribuicaoAnonima');
        if (anonima) anonima.checked = false;
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

    applySmartDefaults(kind) {
        const modalData = document.getElementById('modalData');
        if (modalData && ['evento', 'lancamento', 'contribuicao', 'votacao'].includes(kind)) {
            modalData.value = todayValue();
        }
    },

    updateTitle(kind) {
        const title = document.querySelector('#modalTitle span');
        if (!title) return;
        title.textContent = MODAL_LABELS[kind] || 'Formulario';
    },

    updateIntro(kind) {
        const meta = MODAL_META[kind] || {
            eyebrow: 'Cadastro',
            lead: 'Preencha os dados principais',
            help: 'Use este formulario para registrar um novo item no sistema.',
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
            anonima: Boolean(document.getElementById('modalContribuicaoAnonima')?.checked)
        };
    }
};

window.toggleModalFields = () => modal.toggleFields();
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.backdrop?.classList.contains('hidden')) {
        modal.close();
    }
});
