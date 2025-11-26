const express = require('express');
const db = require('../config/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

// Listar alunos
router.get('/', async (req, res) => {
    try {
        const [alunos] = await db.query('SELECT * FROM alunos ORDER BY nome');
        res.json(alunos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar alunos' });
    }
});

// Buscar aluno por ID
router.get('/:id', async (req, res) => {
    try {
        const [alunos] = await db.query('SELECT * FROM alunos WHERE id = ?', [req.params.id]);
        
        if (alunos.length === 0) {
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }
        
        res.json(alunos[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar aluno' });
    }
});

// Criar aluno
router.post('/', requireRole('ADMIN', 'SECRETARIA'), async (req, res) => {
    try {
        const { nome, cpf, data_nascimento, telefone, email, endereco, situacao } = req.body;

        // Verificar CPF duplicado
        const [existente] = await db.query('SELECT id FROM alunos WHERE cpf = ?', [cpf]);
        if (existente.length > 0) {
            return res.status(400).json({ error: 'CPF já cadastrado' });
        }

        const [result] = await db.query(
            'INSERT INTO alunos (nome, cpf, data_nascimento, telefone, email, endereco, situacao) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nome, cpf, data_nascimento, telefone, email, endereco, situacao]
        );

        res.status(201).json({ id: result.insertId, message: 'Aluno criado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar aluno' });
    }
});

// Atualizar aluno
router.put('/:id', requireRole('ADMIN', 'SECRETARIA'), async (req, res) => {
    try {
        const { nome, cpf, data_nascimento, telefone, email, endereco, situacao } = req.body;

        // Verificar CPF duplicado (exceto o próprio aluno)
        const [existente] = await db.query('SELECT id FROM alunos WHERE cpf = ? AND id != ?', [cpf, req.params.id]);
        if (existente.length > 0) {
            return res.status(400).json({ error: 'CPF já cadastrado' });
        }

        await db.query(
            'UPDATE alunos SET nome = ?, cpf = ?, data_nascimento = ?, telefone = ?, email = ?, endereco = ?, situacao = ? WHERE id = ?',
            [nome, cpf, data_nascimento, telefone, email, endereco, situacao, req.params.id]
        );

        res.json({ message: 'Aluno atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar aluno' });
    }
});

// Excluir aluno (apenas ADMIN)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    try {
        await db.query('DELETE FROM alunos WHERE id = ?', [req.params.id]);
        res.json({ message: 'Aluno excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir aluno' });
    }
});

module.exports = router;
