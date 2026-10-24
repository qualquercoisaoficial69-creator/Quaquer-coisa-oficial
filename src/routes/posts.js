import { Router } from 'express';
import { query, getOne, run } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 1. Obter Feed estilo Instagram (com mídias carrossel, likes e total de comentários)
// Suporta filtro por jogo: /api/posts?game_id=1
router.get('/', async (req, res) => {
  try {
    const { game_id } = req.query;

    let sql = `
      SELECT p.*, g.title as game_title, g.slug as game_slug
      FROM posts p
      LEFT JOIN games g ON p.game_id = g.id
    `;
    const params = [];

    if (game_id) {
      sql += ' WHERE p.game_id = ?';
      params.push(game_id);
    }

    sql += ' ORDER BY p.created_at DESC';

    const posts = await query(sql, params);

    // Para cada post, buscar o carrossel de mídias e quantidade de comentários
    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        const media = await query(
          'SELECT media_url, media_type, order_index FROM post_media WHERE post_id = ? ORDER BY order_index ASC',
          [post.id]
        );
        const commentCount = await getOne(
          'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
          [post.id]
        );
        return {
          ...post,
          media,
          comments_count: commentCount ? commentCount.count : 0
        };
      })
    );

    res.json(postsWithDetails);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar feed: ' + error.message });
  }
});

// 2. Obter um Post específico com todos os comentários
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await getOne(`
      SELECT p.*, g.title as game_title, g.slug as game_slug
      FROM posts p
      LEFT JOIN games g ON p.game_id = g.id
      WHERE p.id = ?
    `, [id]);

    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    const media = await query(
      'SELECT media_url, media_type, order_index FROM post_media WHERE post_id = ? ORDER BY order_index ASC',
      [id]
    );

    const comments = await query(
      'SELECT id, author_name, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC',
      [id]
    );

    res.json({
      ...post,
      media,
      comments
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter post: ' + error.message });
  }
});

// 3. Criar Novo Post no Feed (CMS - Protegido)
// Aceita: author_name, game_id, title, caption, type, media: [{ media_url, media_type }]
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { author_name, game_id, title, caption, type, media } = req.body;

    if (!caption) {
      return res.status(400).json({ error: 'A legenda do post é obrigatória.' });
    }

    const result = await run(`
      INSERT INTO posts (author_name, game_id, title, caption, type)
      VALUES (?, ?, ?, ?, ?)
    `, [
      author_name || req.user.username || 'Dev Team',
      game_id || null,
      title || null,
      caption,
      type || 'devlog'
    ]);

    const postId = result.lastID;

    // Se tiver fotos/vídeos/GIFs para o carrossel do Instagram
    if (Array.isArray(media) && media.length > 0) {
      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        await run(`
          INSERT INTO post_media (post_id, media_url, media_type, order_index)
          VALUES (?, ?, ?, ?)
        `, [
          postId,
          item.media_url,
          item.media_type || 'image',
          item.order_index ?? i
        ]);
      }
    }

    res.status(201).json({
      message: 'Post publicado com sucesso!',
      postId
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar post: ' + error.message });
  }
});

// 4. Curtir Post (Interação estilo Instagram - Público)
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    await run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [id]);
    const updated = await getOne('SELECT likes_count FROM posts WHERE id = ?', [id]);

    res.json({
      message: 'Post curtido!',
      likes_count: updated.likes_count
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao curtir post: ' + error.message });
  }
});

// 5. Deletar Post (CMS - Protegido)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ message: 'Post excluído com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir post: ' + error.message });
  }
});

export default router;
