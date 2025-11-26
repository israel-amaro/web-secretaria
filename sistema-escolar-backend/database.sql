-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS sistema_escolar;
USE sistema_escolar;

-- Tabela de usuários
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'SECRETARIA') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de alunos
CREATE TABLE alunos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    situacao ENUM('ATIVO', 'INATIVO') DEFAULT 'ATIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de turmas
CREATE TABLE turmas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    identificacao VARCHAR(50) NOT NULL,
    curso VARCHAR(200) NOT NULL,
    turno ENUM('MATUTINO', 'VESPERTINO', 'NOTURNO') NOT NULL,
    ano_semestre VARCHAR(10) NOT NULL,
    max_vagas INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de matrículas
CREATE TABLE matriculas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aluno_id INT NOT NULL,
    turma_id INT NOT NULL,
    data_matricula DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_matricula (aluno_id, turma_id)
);

-- Tabela de notas
CREATE TABLE notas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    matricula_id INT NOT NULL,
    nota DECIMAL(4,2) NOT NULL CHECK (nota BETWEEN 0 AND 10),
    frequencia INT NOT NULL CHECK (frequencia BETWEEN 0 AND 100),
    situacao ENUM('CURSANDO', 'APROVADO', 'REPROVADO') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (matricula_id) REFERENCES matriculas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_nota_matricula (matricula_id)
);

-- Tabela de atendimentos
CREATE TABLE atendimentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aluno_id INT NOT NULL,
    tipo ENUM('DECLARACAO', 'HISTORICO', 'SEGUNDA_VIA', 'OUTROS') NOT NULL,
    data DATE NOT NULL,
    status ENUM('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO') NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
);

-- Inserir usuários padrão (senha: admin123 e sec123 criptografadas com bcrypt)
INSERT INTO usuarios (nome, email, senha, role) VALUES
('Administrador', 'admin@escola.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'ADMIN'),
('Secretaria', 'secretaria@escola.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'SECRETARIA');

-- Inserir dados de exemplo
INSERT INTO alunos (nome, cpf, data_nascimento, telefone, email, endereco, situacao) VALUES
('João Silva', '123.456.789-00', '2005-03-15', '(11) 98765-4321', 'joao@email.com', 'Rua A, 123', 'ATIVO'),
('Maria Santos', '987.654.321-00', '2006-07-20', '(11) 91234-5678', 'maria@email.com', 'Av. B, 456', 'ATIVO'),
('Pedro Oliveira', '456.789.123-00', '2005-11-10', '(11) 99876-5432', 'pedro@email.com', 'Rua C, 789', 'INATIVO');

INSERT INTO turmas (identificacao, curso, turno, ano_semestre, max_vagas) VALUES
('DDS-7', 'Desenvolvimento de Sistemas', 'MATUTINO', '2025/1', 30),
('INET-01', 'Redes de Computadores', 'NOTURNO', '2025/1', 25);

INSERT INTO matriculas (aluno_id, turma_id, data_matricula) VALUES
(1, 1, '2025-01-15'),
(2, 1, '2025-01-16');

INSERT INTO notas (matricula_id, nota, frequencia, situacao) VALUES
(1, 8.5, 90, 'CURSANDO'),
(2, 9.0, 95, 'CURSANDO');

INSERT INTO atendimentos (aluno_id, tipo, data, status, observacoes) VALUES
(1, 'DECLARACAO', '2025-11-20', 'CONCLUIDO', 'Declaração de matrícula emitida'),
(2, 'HISTORICO', '2025-11-24', 'ABERTO', 'Solicitação de histórico completo');
