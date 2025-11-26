const express = require('express');
const db = require('../config/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

// Listar turmas
router.get('/', async (req, res) => {
    try {
        const [turmas] = await db.query(`
            SELECT t.*, 
                   COUNT(m.id) as total_matriculados
            FROM turmas t
            LEFT JOIN matriculas m ON t.id = m.turma_id
            GROUP BY t.id
            ORDER BY t.identificacao
        `);
        res.json(turmas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar turmas' });
    }
});

// Criar turma
router.post('/', requireRole('ADMIN', 'SECRETARIA'), async (req, res) => {
    try {
        const { identificacao, curso, turno, ano_semestre, max_vagas } = req.body;

        const [result] = await db.query(
            'INSERT INTO turmas (identificacao, curso, turno, ano_semestre, max_vagas) VALUES (?, ?, ?, ?, ?)',
            [identificacao, curso, turno, ano_semestre, max_vagas]
        );

        res.status(201).json({ id: result.insertId, message: 'Turma criada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar turma' });
    }
});

// Atualizar turma
router.put('/:id', requireRole('ADMIN', 'SECRETARIA'), async (req, res) => {
    try {
        const { identificacao, curso, turno, ano_semestre, max_vagas } = req.body;

        await db.query(
            'UPDATE turmas SET identificacao = ?, curso = ?, turno = ?, ano_semestre = ?, max_vagas = ? WHERE id = ?',
            [identificacao, curso, turno, ano_semestre, max_vagas, req.params.id]
        );

        res.json({ message: 'Turma atualizada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar turma' });
    }
});

// Excluir turma (apenas ADMIN)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    try {
        await db.query('DELETE FROM turmas WHERE id = ?', [req.params.id]);
        res.json({ message: 'Turma excluída com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir turma' });
    }
});

module.exports = router;
