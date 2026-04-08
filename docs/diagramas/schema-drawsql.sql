-- Script SQL de referencia para importacao em ferramentas estilo drawSQL.
-- O objetivo e representar o modelo logico do projeto de forma clara.
-- Ajustes finos de naming podem variar conforme a estrategia do Hibernate.

CREATE TABLE turma (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    curso VARCHAR(255),
    instituicao VARCHAR(255),
    total_arrecadado DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'emdia'
);

CREATE TABLE aluno (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turma_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    identificador VARCHAR(255) UNIQUE,
    contato VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pendente',
    CONSTRAINT fk_aluno_turma
        FOREIGN KEY (turma_id) REFERENCES turma(id)
);

CREATE TABLE usuarios (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL,
    aluno_id BIGINT UNIQUE,
    CONSTRAINT fk_usuario_aluno
        FOREIGN KEY (aluno_id) REFERENCES aluno(id)
);

CREATE TABLE evento (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turma_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    data_evento DATE,
    local_evento VARCHAR(255),
    status VARCHAR(50) DEFAULT 'agendado',
    CONSTRAINT fk_evento_turma
        FOREIGN KEY (turma_id) REFERENCES turma(id)
);

CREATE TABLE presencas_evento (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    evento_id BIGINT NOT NULL,
    aluno_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_presenca_evento
        FOREIGN KEY (evento_id) REFERENCES evento(id),
    CONSTRAINT fk_presenca_aluno
        FOREIGN KEY (aluno_id) REFERENCES aluno(id)
);

CREATE TABLE lancamento_financeiro (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turma_id BIGINT NOT NULL,
    aluno_id BIGINT NULL,
    descricao VARCHAR(255),
    tipo VARCHAR(50),
    valor DECIMAL(12,2),
    data_lancamento DATE,
    referencia VARCHAR(255),
    CONSTRAINT fk_lancamento_turma
        FOREIGN KEY (turma_id) REFERENCES turma(id),
    CONSTRAINT fk_lancamento_aluno
        FOREIGN KEY (aluno_id) REFERENCES aluno(id)
);

CREATE TABLE tarefa (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turma_id BIGINT NOT NULL,
    responsavel_id BIGINT NULL,
    titulo VARCHAR(255),
    descricao TEXT,
    status VARCHAR(50) DEFAULT 'a_fazer',
    data_limite DATE,
    CONSTRAINT fk_tarefa_turma
        FOREIGN KEY (turma_id) REFERENCES turma(id),
    CONSTRAINT fk_tarefa_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES aluno(id)
);

CREATE TABLE votacao (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    turma_id BIGINT NOT NULL,
    titulo VARCHAR(255),
    status VARCHAR(50) DEFAULT 'aberta',
    data_fim DATE,
    CONSTRAINT fk_votacao_turma
        FOREIGN KEY (turma_id) REFERENCES turma(id)
);

CREATE TABLE opcao_votacao (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    votacao_id BIGINT NOT NULL,
    nome_fornecedor VARCHAR(255),
    detalhes_proposta TEXT,
    valor_proposta DECIMAL(12,2),
    CONSTRAINT fk_opcao_votacao
        FOREIGN KEY (votacao_id) REFERENCES votacao(id)
);

CREATE TABLE voto (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    votacao_id BIGINT NOT NULL,
    opcao_id BIGINT NOT NULL,
    aluno_id BIGINT NOT NULL,
    data_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_voto_votacao
        FOREIGN KEY (votacao_id) REFERENCES votacao(id),
    CONSTRAINT fk_voto_opcao
        FOREIGN KEY (opcao_id) REFERENCES opcao_votacao(id),
    CONSTRAINT fk_voto_aluno
        FOREIGN KEY (aluno_id) REFERENCES aluno(id),
    CONSTRAINT uk_voto_votacao_aluno
        UNIQUE (votacao_id, aluno_id)
);

CREATE INDEX idx_aluno_turma ON aluno(turma_id);
CREATE INDEX idx_evento_turma ON evento(turma_id);
CREATE INDEX idx_lancamento_turma ON lancamento_financeiro(turma_id);
CREATE INDEX idx_tarefa_turma ON tarefa(turma_id);
CREATE INDEX idx_votacao_turma ON votacao(turma_id);
CREATE INDEX idx_opcao_votacao ON opcao_votacao(votacao_id);
