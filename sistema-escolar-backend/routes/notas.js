const express = require('express');
const db = require('../config/database');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);
router.use(requireRole('ADMIN', 'SECRETARIA'));

// Listar histórico
router.get('/', async (req, res) => {
    try {
        const [notas] = await db.query(`
            SELECT n.*, 
                   m.id as matricula_id,
                   a.nome as aluno_nome, a.cpf as aluno_cpf,
                   t.identificacao as turma_identificacao, t.curso as turma_curso
            FROM notas n
            INNER JOIN matriculas m ON n.matricula_id = m.id
            INNER JOIN alunos a ON m.aluno_id = a.id
            INNER JOIN turmas t ON m.turma_id = t.id
            ORDER BY a.nome
        `);
        res.json(notas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// Criar ou atualizar nota
router.post('/', async (req, res) => {
    try {
        const { matricula_id, nota, frequencia, situacao } = req.body;

        // Verificar se já existe nota para esta matrícula
        const [existente] = await db.query('SELECT id FROM notas WHERE matricula_id = ?', [matricula_id]);

        if (existente.length > 0) {
            // Atualizar
            await db.query(
                'UPDATE notas SET nota = ?, frequencia = ?, situacao = ? WHERE matricula_id = ?',
                [nota, frequencia, situacao, matricula_id]
            );
            res.json({ message: 'Nota atualizada com sucesso' });
        } else {
            // Criar
            const [result] = await db.query(
                'INSERT INTO notas (matricula_id, nota, frequencia, situacao) VALUES (?, ?, ?, ?)',
                [matricula_id, nota, frequencia, situacao]
            );
            res.status(201).json({ id: result.insertId, message: 'Nota criada com sucesso' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar nota' });
    }
});

module.exports = router;
