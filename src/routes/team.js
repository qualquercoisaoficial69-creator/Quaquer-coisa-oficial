import { Router } from 'express';
import { query, run } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 1. Listar membros da equipe do estúdio (Público)
router.get('/', async (req, res) => {
  try {
    const members = await query('SELECT * FROM team_members ORDER BY order_index ASC');
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar membros da equipe: ' + error.message });
  }
});

// 2. Adicionar membro da equipe (CMS - Protegido)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, role, bio, avatar_url, twitter_url, github_url, portfolio_url, order_index } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Nome e cargo/papel são obrigatórios.' });
    }

    const result = await run(`
      INSERT INTO team_members (name, role, bio, avatar_url, twitter_url, github_url, portfolio_url, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, role, bio || '', avatar_url || null, twitter_url || null, github_url || null, portfolio_url || null, order_index || 0]);

    res.status(201).json({
      message: 'Membro adicionado à equipe com sucesso!',
      memberId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar membro: ' + error.message });
  }
});

// 3. Atualizar membro da equipe (CMS - Protegido)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, bio, avatar_url, order_index } = req.body;

    await run(`
      UPDATE team_members 
      SET name = COALESCE(?, name),
          role = COALESCE(?, role),
          bio = COALESCE(?, bio),
          avatar_url = COALESCE(?, avatar_url),
          order_index = COALESCE(?, order_index)
      WHERE id = ?
    `, [name, role, bio, avatar_url, order_index, id]);

    res.json({ message: 'Membro atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar membro: ' + error.message });
  }
});

// 4. Deletar membro da equipe (CMS - Protegido)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM team_members WHERE id = ?', [id]);
    res.json({ message: 'Membro removido da equipe.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover membro: ' + error.message });
  }
});

export default router;
