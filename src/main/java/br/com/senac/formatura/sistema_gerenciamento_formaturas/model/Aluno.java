package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = "turma")
@Entity
public class Aluno {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Column(unique = true)
    private String identificador;

    private String email;
    private String whatsapp;

    @ManyToOne
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    private String contato;
    private String status = "ATIVO";
    private String observacaoInterna;
    private Boolean precisaTrocarSenha = false;

    public String getNomeTurma() {
        return turma != null ? turma.getNome() : "";
    }

    public String getEmailExibicao() {
        return email != null && !email.isBlank() ? email : contato;
    }

    public String getWhatsappExibicao() {
        return whatsapp != null && !whatsapp.isBlank() ? whatsapp : contato;
    }
}
