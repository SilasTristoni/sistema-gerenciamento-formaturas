export const modal = {
    backdrop: document.getElementById('modalBackdrop'),
    panel: document.getElementById('modalPanel'),
    
    open(kind, turmas) {
        const select = document.getElementById('modalTurmaSelect');
        if(kind !== 'turma' && select) {
            select.innerHTML = '<option value="">Selecione a Turma...</option>';
            turmas.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.innerText = t.nome;
                select.appendChild(opt);
            });
        }

        const cat = document.getElementById('modalCategoria');
        if(cat) cat.value = kind;
        
        this.toggleFields();
        this.resetFields();

        if(this.backdrop) {
            this.backdrop.classList.remove('hidden');
            this.backdrop.classList.add('flex');
        }
        
        setTimeout(() => {
            if(this.panel) {
                this.panel.classList.remove('scale-95', 'opacity-0');
                this.panel.classList.add('scale-100', 'opacity-100');
            }
        }, 10);
    },

    close() {
        if(this.panel) {
            this.panel.classList.remove('scale-100', 'opacity-100');
            this.panel.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
            if(this.backdrop) {
                this.backdrop.classList.add('hidden');
                this.backdrop.classList.remove('flex');
            }
        }, 250);
    },

    toggleFields() {
        const cat = document.getElementById('modalCategoria');
        const kind = cat ? cat.value : '';
        const lblDesc = document.getElementById('lblDescricao');
        const divTurma = document.getElementById('divTurmaSelect');
        const divDataValor = document.getElementById('divDataValor');
        const inputValor = document.getElementById('modalValor');
        const divPerfil = document.getElementById('divPerfil');

        if(divTurma) divTurma.classList.remove('hidden');
        if(divDataValor) divDataValor.classList.remove('hidden');
        if(inputValor) inputValor.parentElement.classList.remove('hidden');
        if(divPerfil) divPerfil.classList.add('hidden');
        
        if(lblDesc) lblDesc.innerText = "Descrição / Detalhes";

        if (kind === 'turma') {
            if(divTurma) divTurma.classList.add('hidden');
            if(divDataValor) divDataValor.classList.add('hidden'); 
            if(lblDesc) lblDesc.innerText = "Nome do Curso";
        } 
        else if (kind === 'aluno') {
            if(divDataValor) divDataValor.classList.add('hidden');
            if(lblDesc) lblDesc.innerText = "Email / Contato";
            if(divPerfil) divPerfil.classList.remove('hidden'); 
        }
        else if (['evento', 'tarefa', 'votacao'].includes(kind)) {
            if(inputValor) inputValor.parentElement.classList.add('hidden'); 
        }
    },

    resetFields() {
        const idItem = document.getElementById('modalItemId');
        const nome = document.getElementById('modalNome');
        const data = document.getElementById('modalData');
        const valor = document.getElementById('modalValor');
        const desc = document.getElementById('modalDescricao');
        const turma = document.getElementById('modalTurmaSelect');
        const perfil = document.getElementById('modalPerfil');

        if(idItem) idItem.value = ''; 
        if(nome) nome.value = '';
        if(data) data.value = '';
        if(valor) valor.value = '';
        if(desc) desc.value = '';
        if(turma) turma.value = '';
        if(perfil) perfil.value = 'ALUNO';
    },

    getData() {
        const idItem = document.getElementById('modalItemId');
        const cat = document.getElementById('modalCategoria');
        const nome = document.getElementById('modalNome');
        const data = document.getElementById('modalData');
        const valor = document.getElementById('modalValor');
        const desc = document.getElementById('modalDescricao');
        const turma = document.getElementById('modalTurmaSelect');
        const perfil = document.getElementById('modalPerfil');

        return {
            id: idItem ? idItem.value : '',
            kind: cat ? cat.value : '',
            nome: nome ? nome.value : '',
            data: data ? data.value : '',
            valor: valor ? valor.value : '',
            desc: desc ? desc.value : '',
            turmaId: turma ? turma.value : '',
            perfil: perfil ? perfil.value : 'ALUNO'
        };
    }
};

window.toggleModalFields = () => modal.toggleFields();