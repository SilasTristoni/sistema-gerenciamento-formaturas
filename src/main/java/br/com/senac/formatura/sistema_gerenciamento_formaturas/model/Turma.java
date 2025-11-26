package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Data;
import lombok.ToString;

@Data
@Entity
public class Turma {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String curso;

    // A turma "tem" vários alunos.
    // O 'mappedBy' indica que o campo 'turma' na classe Aluno é quem manda na relação.
    @OneToMany(mappedBy = "turma", cascade = CascadeType.ALL)
    @JsonIgnore // Não traz a lista de alunos ao buscar a turma (evita peso desnecessário)
    @ToString.Exclude
    private List<Aluno> alunos;

    private Double totalArrecadado = 0.0;
    private String status = "emdia";

    // Campo calculado para o JSON
    public Integer getQuantidadeAlunos() {
        return alunos != null ? alunos.size() : 0;
    }
}