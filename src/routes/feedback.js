import { Router } from 'express';
import { query, run } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 1. Enviar feedback / reporte de bug sobre um protótipo (Público)
router.post('/', async (req, res) => {
  try {
    const { game_id, player_name, player_contact, type, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'A mensagem do feedback é obrigatória.' });
    }

    const result = await run(`
      INSERT INTO feedbacks (game_id, player_name, player_contact, type, message)
      VALUES (?, ?, ?, ?, ?)
    `, [
      game_id || null,
      player_name || 'Anônimo',
      player_contact || '',
      type || 'opiniao',
      message
    ]);

    res.status(201).json({
      message: 'Muito obrigado pelo seu feedback! Isso ajuda nosso estúdio a melhorar o jogo.',
      feedbackId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar feedback: ' + error.message });
  }
});

// 2. Listar todos os feedbacks recebidos (CMS - Protegido)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { game_id } = req.query;
    let sql = `
      SELECT f.*, g.title as game_title
      FROM feedbacks f
      LEFT JOIN games g ON f.game_id = g.id
    `;
    const params = [];
    if (game_id) {
      sql += ' WHERE f.game_id = ?';
      params.push(game_id);
    }
    sql += ' ORDER BY f.created_at DESC';

    const feedbacks = await query(sql, params);
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar feedbacks: ' + error.message });
  }
});

// 3. Deletar feedback (CMS - Protegido)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM feedbacks WHERE id = ?', [id]);
    res.json({ message: 'Feedback deletado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar feedback: ' + error.message });
  }
});

export default router;
