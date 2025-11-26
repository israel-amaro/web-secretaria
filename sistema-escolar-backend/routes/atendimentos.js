const express = require('express');
const db = require('../config/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);
router.use(requireRole('ADMIN', 'SECRETARIA'));

// Listar atendimentos
router.get('/', async (req, res) => {
    try {
        const [atendimentos] = await db.query(`
            SELECT at.*, a.nome as aluno_nome
            FROM atendimentos at
            INNER JOIN alunos a ON at.aluno_id = a.id
            ORDER BY at.data DESC
        `);
        res.json(atendimentos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar atendimentos' });
    }
});

// Criar atendimento
router.post('/', async (req, res) => {
    try {
        const { aluno_id, tipo, data, status, observacoes } = req.body;

        const [result] = await db.query(
            'INSERT INTO atendimentos (aluno_id, tipo, data, status, observacoes) VALUES (?, ?, ?, ?, ?)',
            [aluno_id, tipo, data, status, observacoes]
        );

        res.status(201).json({ id: result.insertId, message: 'Atendimento criado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar atendimento' });
    }
});

// Atualizar atendimento
router.put('/:id', async (req, res) => {
    try {
        const { aluno_id, tipo, data, status, observacoes } = req.body;

        await db.query(
            'UPDATE atendimentos SET aluno_id = ?, tipo = ?, data = ?, status = ?, observacoes = ? WHERE id = ?',
            [aluno_id, tipo, data, status, observacoes, req.params.id]
        );

        res.json({ message: 'Atendimento atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar atendimento' });
    }
});

// Excluir atendimento (apenas ADMIN)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    try {
        await db.query('DELETE FROM atendimentos WHERE id = ?', [req.params.id]);
        res.json({ message: 'Atendimento excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir atendimento' });
    }
});

module.exports = router;
