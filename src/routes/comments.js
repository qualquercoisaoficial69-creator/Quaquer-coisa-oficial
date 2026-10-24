import { Router } from 'express';
import { run, getOne } from '../database/db.js';

const router = Router();

// Adicionar comentário a um post (Público)
router.post('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { author_name, content } = req.body;

    if (!author_name || !content) {
      return res.status(400).json({ error: 'Nome e comentário são obrigatórios.' });
    }

    const post = await getOne('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    const result = await run(`
      INSERT INTO comments (post_id, author_name, content)
      VALUES (?, ?, ?)
    `, [postId, author_name.trim(), content.trim()]);

    res.status(201).json({
      message: 'Comentário enviado!',
      commentId: result.lastID
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar comentário: ' + error.message });
  }
});

export default router;
