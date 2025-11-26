const express = require('express');
const db = require('../config/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);
router.use(requireRole('ADMIN', 'SECRETARIA'));

// Listar matrículas
router.get('/', async (req, res) => {
    try {
        const [matriculas] = await db.query(`
            SELECT m.*, 
                   a.nome as aluno_nome, a.cpf as aluno_cpf, a.situacao as aluno_situacao,
                   t.identificacao as turma_identificacao, t.curso as turma_curso
            FROM matriculas m
            INNER JOIN alunos a ON m.aluno_id = a.id
            INNER JOIN turmas t ON m.turma_id = t.id
            ORDER BY m.data_matricula DESC
        `);
        res.json(matriculas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar matrículas' });
    }
});

// Criar matrícula
router.post('/', async (req, res) => {
    try {
        const { aluno_id, turma_id, data_matricula } = req.body;

        // Verificar se aluno está ativo
        const [aluno] = await db.query('SELECT situacao FROM alunos WHERE id = ?', [aluno_id]);
        if (aluno.length === 0 || aluno[0].situacao !== 'ATIVO') {
            return res.status(400).json({ error: 'Aluno inativo ou inexistente' });
        }

        // Verificar matrícula duplicada
        const [duplicada] = await db.query(
            'SELECT id FROM matriculas WHERE aluno_id = ? AND turma_id = ?',
            [aluno_id, turma_id]
        );
        if (duplicada.length > 0) {
            return res.status(400).json({ error: 'Matrícula duplicada' });
        }

        // Verificar vagas disponíveis
        const [turma] = await db.query(`
            SELECT t.max_vagas, COUNT(m.id) as total_matriculados
            FROM turmas t
            LEFT JOIN matriculas m ON t.id = m.turma_id
            WHERE t.id = ?
            GROUP BY t.id
        `, [turma_id]);

        if (turma.length === 0) {
            return res.status(400).json({ error: 'Turma inexistente' });
        }

        if (turma[0].total_matriculados >= turma[0].max_vagas) {
            return res.status(400).json({ error: 'Turma cheia' });
        }

        const [result] = await db.query(
            'INSERT INTO matriculas (aluno_id, turma_id, data_matricula) VALUES (?, ?, ?)',
            [aluno_id, turma_id, data_matricula]
        );

        res.status(201).json({ id: result.insertId, message: 'Matrícula criada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar matrícula' });
    }
});

// Excluir matrícula (apenas ADMIN)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
    try {
        await db.query('DELETE FROM matriculas WHERE id = ?', [req.params.id]);
        res.json({ message: 'Matrícula cancelada com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cancelar matrícula' });
    }
});

module.exports = router;
