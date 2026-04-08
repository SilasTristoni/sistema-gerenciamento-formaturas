const LAST_TURMA_KEY = 'gestaoform.lastTurmaId';
const MODAL_LABELS = {
    turma: 'Nova turma',
    aluno: 'Novo aluno',
    evento: 'Novo evento',
    lancamento: 'Novo lancamento',
    votacao: 'Nova votacao'
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
        const inputValor = document.getElementById('modalValor');
        const divPerfil = document.getElementById('divPerfil');
        const divIdentificador = document.getElementById('divIdentificador');

        divTurma?.classList.remove('hidden');
        divDataValor?.classList.remove('hidden');
        inputValor?.parentElement?.classList.remove('hidden');
        divPerfil?.classList.add('hidden');
        divIdentificador?.classList.add('hidden');

        if (lblDesc) lblDesc.innerText = 'Descrição / Detalhes';

        if (kind === 'turma') {
            divTurma?.classList.add('hidden');
            divDataValor?.classList.add('hidden');
            if (lblDesc) lblDesc.innerText = 'Curso';
        } else if (kind === 'aluno') {
            divDataValor?.classList.add('hidden');
            if (lblDesc) lblDesc.innerText = 'Contato';
            divPerfil?.classList.remove('hidden');
            divIdentificador?.classList.remove('hidden');
        } else if (['evento', 'tarefa', 'votacao'].includes(kind)) {
            inputValor?.parentElement?.classList.add('hidden');
            if (kind === 'evento' && lblDesc) lblDesc.innerText = 'Local';
            if (kind === 'votacao' && lblDesc) lblDesc.innerText = 'Detalhes / Tema';
        } else if (kind === 'lancamento') {
            if (lblDesc) lblDesc.innerText = 'Referencia';
        }
    },

    resetFields() {
        const ids = ['modalItemId', 'modalNome', 'modalData', 'modalValor', 'modalDescricao', 'modalTurmaSelect', 'modalIdentificador'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const perfil = document.getElementById('modalPerfil');
        if (perfil) perfil.value = 'ALUNO';
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
        if (modalData && ['evento', 'lancamento', 'votacao'].includes(kind)) {
            modalData.value = todayValue();
        }
    },

    updateTitle(kind) {
        const title = document.querySelector('#modalTitle span');
        if (!title) return;
        title.textContent = MODAL_LABELS[kind] || 'Formulario';
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
            identificador: document.getElementById('modalIdentificador')?.value?.trim() || ''
        };
    }
};

window.toggleModalFields = () => modal.toggleFields();
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.backdrop?.classList.contains('hidden')) {
        modal.close();
    }
});
