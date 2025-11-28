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
    private String instituicao; // NOVO CAMPO

    @OneToMany(mappedBy = "turma", cascade = CascadeType.ALL)
    @JsonIgnore
    @ToString.Exclude
    private List<Aluno> alunos;

    // NOVO: A turma agora sabe quais eventos e contas são dela
    @OneToMany(mappedBy = "turma")
    @JsonIgnore
    private List<Evento> eventos;

    @OneToMany(mappedBy = "turma")
    @JsonIgnore
    private List<LancamentoFinanceiro> lancamentos;

    private Double totalArrecadado = 0.0;
    private String status = "emdia";

    public Integer getQuantidadeAlunos() {
        return alunos != null ? alunos.size() : 0;
    }
}