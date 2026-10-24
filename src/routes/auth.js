import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOne, run, query } from '../database/db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_indie_studio_key_2024';

// Login do Painel CMS
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    let user = await getOne('SELECT * FROM users WHERE LOWER(username) = ?', [cleanUsername]);

    // Auto-criação/sincronização do admin inicial caso o banco tenha sido recém-criado na nuvem
    if (!user && cleanUsername === 'admin' && password === 'admin123') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      const insertResult = await run(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        ['admin', passwordHash, 'admin']
      );
      user = { id: insertResult.lastID, username: 'admin', role: 'admin' };
    } else if (user) {
      let passwordMatch = await bcrypt.compare(password, user.password_hash);

      // Se for admin com a senha padrão admin123 e o hash antigo não bater, atualiza
      if (!passwordMatch && cleanUsername === 'admin' && password === 'admin123') {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);
        await run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);
        passwordMatch = true;
      }

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }
    } else {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar login: ' + error.message });
  }
});

// Registrar primeiro administrador ou membros do time
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    }

    const existingUser = await getOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role || 'admin']
    );

    res.status(201).json({
      message: 'Usuário administrador cadastrado com sucesso!',
      userId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário: ' + error.message });
  }
});

export default router;
