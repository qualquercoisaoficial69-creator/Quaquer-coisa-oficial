import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOne, run, query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

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

// Lista de e-mails autorizados para acesso de Administrador/Criador via Google
const AUTHORIZED_GOOGLE_EMAILS = [
  'qualquercoisaoficial69@gmail.com',
  'brennofirminodejesus@gmail.com',
  'izam20027@gmail.com',
  'gtofrazatto@gmail.com'
];

// Login via Google Authentication
router.post('/google', async (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'E-mail não informado.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Valida se o e-mail está na lista de criadores autorizados
    if (!AUTHORIZED_GOOGLE_EMAILS.includes(cleanEmail)) {
      return res.status(403).json({
        error: `Acesso Negado: O e-mail "${cleanEmail}" não possui permissão de desenvolvedor.`
      });
    }

    // Busca ou cria o usuário correspondente no banco
    let user = await getOne('SELECT * FROM users WHERE LOWER(username) = ?', [cleanEmail]);
    if (!user) {
      const initialDisplayName = name || cleanEmail.split('@')[0];
      const initialAvatar = avatar || 'imagens/Logo_colorida.png';
      const insert = await run(
        'INSERT INTO users (username, password_hash, role, display_name, avatar_url, bio) VALUES (?, ?, ?, ?, ?, ?)',
        [cleanEmail, 'google_authenticated', 'admin', initialDisplayName, initialAvatar, '']
      );
      user = {
        id: insert.lastID,
        username: cleanEmail,
        role: 'admin',
        display_name: initialDisplayName,
        avatar_url: initialAvatar,
        bio: ''
      };
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role || 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso via Google!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: cleanEmail,
        displayName: user.display_name || name || user.username.split('@')[0],
        avatar: user.avatar_url || avatar || 'imagens/Logo_colorida.png',
        bio: user.bio || '',
        role: user.role || 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar login via Google: ' + error.message });
  }
});

// Obter dados do perfil atual (Autenticado)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getOne(
      'SELECT id, username, role, display_name, avatar_url, bio, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.username.split('@')[0],
      avatar: user.avatar_url || 'imagens/Logo_colorida.png',
      bio: user.bio || '',
      role: user.role,
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar perfil: ' + error.message });
  }
});

// Atualizar Perfil próprio (Nickname, Foto, Bio)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, avatarUrl, bio } = req.body;

    if (displayName && displayName.trim().length > 40) {
      return res.status(400).json({ error: 'O apelido deve ter no máximo 40 caracteres.' });
    }

    await run(`
      UPDATE users 
      SET display_name = COALESCE(?, display_name),
          avatar_url = COALESCE(?, avatar_url),
          bio = COALESCE(?, bio)
      WHERE id = ?
    `, [
      displayName !== undefined ? displayName.trim() : null,
      avatarUrl !== undefined ? avatarUrl.trim() : null,
      bio !== undefined ? bio.trim() : null,
      req.user.id
    ]);

    const updated = await getOne(
      'SELECT id, username, role, display_name, avatar_url, bio FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Perfil atualizado com sucesso!',
      user: {
        id: updated.id,
        username: updated.username,
        displayName: updated.display_name || updated.username.split('@')[0],
        avatar: updated.avatar_url || 'imagens/Logo_colorida.png',
        bio: updated.bio || '',
        role: updated.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar perfil: ' + error.message });
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
