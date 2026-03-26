export const modal = {
    backdrop: document.getElementById('modalBackdrop'),
    panel: document.getElementById('modalPanel'),

    open(kind, turmas) {
        const select = document.getElementById('modalTurmaSelect');
        if (kind !== 'turma' && select) {
            select.innerHTML = '<option value="">Selecione a Turma...</option>';
            turmas.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.innerText = t.nome;
                select.appendChild(opt);
            });
        }

        const cat = document.getElementById('modalCategoria');
        if (cat) cat.value = kind;

        this.toggleFields();
        this.resetFields();

        if (this.backdrop) {
            this.backdrop.classList.remove('hidden');
            this.backdrop.classList.add('flex');
        }

        setTimeout(() => {
            if (this.panel) {
                this.panel.classList.remove('scale-95', 'opacity-0');
                this.panel.classList.add('scale-100', 'opacity-100');
            }
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
            if (lblDesc) lblDesc.innerText = 'Nome do Curso';
        } else if (kind === 'aluno') {
            divDataValor?.classList.add('hidden');
            if (lblDesc) lblDesc.innerText = 'Email / Contato';
            divPerfil?.classList.remove('hidden');
            divIdentificador?.classList.remove('hidden');
        } else if (['evento', 'tarefa', 'votacao'].includes(kind)) {
            inputValor?.parentElement?.classList.add('hidden');
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

    getData() {
        return {
            id: document.getElementById('modalItemId')?.value || '',
            kind: document.getElementById('modalCategoria')?.value || '',
            nome: document.getElementById('modalNome')?.value || '',
            data: document.getElementById('modalData')?.value || '',
            valor: document.getElementById('modalValor')?.value || '',
            desc: document.getElementById('modalDescricao')?.value || '',
            turmaId: document.getElementById('modalTurmaSelect')?.value || '',
            perfil: document.getElementById('modalPerfil')?.value || 'ALUNO',
            identificador: document.getElementById('modalIdentificador')?.value || ''
        };
    }
};

window.toggleModalFields = () => modal.toggleFields();
