const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        console.log('[auth] login attempt for:', email);

        const [users] = await db.query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('[auth] user not found for', email);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = users[0];
        console.log('[auth] user found id=', user.id, ' role=', user.role);
        // Log a truncated hash for debugging (don't leave sensitive logs in production)
        console.log('[auth] senha hash startsWith:', user.senha && user.senha.slice(0, 6));
        const senhaValida = await bcrypt.compare(senha, user.senha);
        console.log('[auth] bcrypt.compare result:', senhaValida);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

module.exports = router;
