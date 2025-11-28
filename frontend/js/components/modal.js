export const modal = {
    backdrop: document.getElementById('modalBackdrop'),
    panel: document.getElementById('modalPanel'),
    
    open(kind, turmas) {
        // Popula Select de Turmas
        const select = document.getElementById('modalTurmaSelect');
        if(kind !== 'turma') {
            select.innerHTML = '<option value="">Selecione a Turma...</option>';
            turmas.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.innerText = t.nome;
                select.appendChild(opt);
            });
        }

        document.getElementById('modalCategoria').value = kind;
        this.toggleFields();
        this.resetFields();

        this.backdrop.classList.remove('hidden');
        this.backdrop.classList.add('flex');
        
        setTimeout(() => {
            this.panel.classList.remove('scale-95', 'opacity-0');
            this.panel.classList.add('scale-100', 'opacity-100');
        }, 10);
    },

    close() {
        this.panel.classList.remove('scale-100', 'opacity-100');
        this.panel.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            this.backdrop.classList.add('hidden');
            this.backdrop.classList.remove('flex');
        }, 300);
    },

    toggleFields() {
        const kind = document.getElementById('modalCategoria').value;
        const lblDesc = document.getElementById('lblDescricao');
        const divTurma = document.getElementById('divTurmaSelect');
        const divDataValor = document.getElementById('divDataValor');
        const inputValor = document.getElementById('modalValor');

        // Reset
        divTurma.classList.remove('hidden');
        divDataValor.classList.remove('hidden');
        inputValor.parentElement.classList.remove('hidden');
        lblDesc.innerText = "Descrição / Detalhes";

        // Regras
        if (kind === 'turma') {
            divTurma.classList.add('hidden');
            divDataValor.classList.add('hidden'); 
            lblDesc.innerText = "Nome do Curso";
        } 
        else if (kind === 'aluno') {
            divDataValor.classList.add('hidden');
            lblDesc.innerText = "Email / Contato";
        }
        else if (['evento', 'tarefa', 'votacao'].includes(kind)) {
            inputValor.parentElement.classList.add('hidden');
        }
    },

    resetFields() {
        document.getElementById('modalNome').value = '';
        document.getElementById('modalData').value = '';
        document.getElementById('modalValor').value = '';
        document.getElementById('modalDescricao').value = '';
    },
    
    getData() {
        return {
            kind: document.getElementById('modalCategoria').value,
            nome: document.getElementById('modalNome').value,
            data: document.getElementById('modalData').value,
            valor: document.getElementById('modalValor').value,
            desc: document.getElementById('modalDescricao').value,
            turmaId: document.getElementById('modalTurmaSelect').value
        };
    }
};