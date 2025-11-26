package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class Aluno {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    // O aluno pertence a UMA turma.
    // Isso cria a coluna 'turma_id' no banco de dados.
    @ManyToOne
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    private String contato;
    private String status = "pendente";

    // Método auxiliar para o JSON mostrar o nome da turma facilmente
    public String getNomeTurma() {
        return turma != null ? turma.getNome() : "";
    }
}