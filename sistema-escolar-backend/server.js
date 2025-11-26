const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const alunosRoutes = require('./routes/alunos');
const turmasRoutes = require('./routes/turmas');
const matriculasRoutes = require('./routes/matriculas');
const notasRoutes = require('./routes/notas');
const atendimentosRoutes = require('./routes/atendimentos');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunosRoutes);
app.use('/api/turmas', turmasRoutes);
app.use('/api/matriculas', matriculasRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/atendimentos', atendimentosRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: 'API Sistema Escolar rodando!' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
