const express = require('express');
const db = require('../config/database');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired);

router.get('/', async (req, res) => {
    try {
        const [alunosAtivos] = await db.query('SELECT COUNT(*) as total FROM alunos WHERE situacao = "ATIVO"');
        const [turmasAbertas] = await db.query('SELECT COUNT(*) as total FROM turmas');
        const [matriculas] = await db.query('SELECT COUNT(*) as total FROM matriculas');
        const [solicitacoesAbertas] = await db.query('SELECT COUNT(*) as total FROM atendimentos WHERE status = "ABERTO"');

        res.json({
            totalAlunosAtivos: alunosAtivos[0].total,
            totalTurmasAbertas: turmasAbertas[0].total,
            totalMatriculasSemestre: matriculas[0].total,
            solicitacoesAbertas: solicitacoesAbertas[0].total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
});

module.exports = router;
