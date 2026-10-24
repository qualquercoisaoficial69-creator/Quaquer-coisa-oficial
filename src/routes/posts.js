import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { query, getOne, run } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_indie_studio_key_2024';

// 1. Obter Feed estilo Instagram (com mídias carrossel, likes e total de comentários)
// Suporta filtro por jogo: /api/posts?game_id=1
router.get('/', async (req, res) => {
  try {
    const { game_id } = req.query;
    const authHeader = req.headers['authorization'];
    let currentUserId = null;

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) currentUserId = decoded.id;
      } catch (e) {}
    }

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

    // Busca curtidas do usuário atual nos posts
    let userLikedPostIds = new Set();
    if (currentUserId) {
      const userLikes = await query(
        'SELECT post_id FROM post_likes WHERE user_id = ?',
        [currentUserId]
      );
      userLikedPostIds = new Set(userLikes.map(l => l.post_id));
    }

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
          comments_count: commentCount ? commentCount.count : 0,
          liked_by_me: userLikedPostIds.has(post.id)
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
// Aceita: author_name, game_id, title, caption, type, show_in_carousel, media: [{ media_url, media_type }]
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { author_name, game_id, title, caption, type, show_in_carousel, media } = req.body;

    if (!caption) {
      return res.status(400).json({ error: 'A legenda do post é obrigatória.' });
    }

    const result = await run(`
      INSERT INTO posts (author_name, game_id, title, caption, type, show_in_carousel)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      author_name || req.user.username || 'Dev Team',
      game_id || null,
      title || null,
      caption,
      type || 'devlog',
      show_in_carousel ? 1 : 0
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

// 3.1 Atualizar Post Existente (CMS - Protegido)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { author_name, game_id, title, caption, type, show_in_carousel, media } = req.body;

    if (!caption) {
      return res.status(400).json({ error: 'A legenda do post é obrigatória.' });
    }

    const post = await getOne('SELECT id FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    await run(`
      UPDATE posts
      SET author_name = ?, game_id = ?, title = ?, caption = ?, type = ?, show_in_carousel = ?
      WHERE id = ?
    `, [
      author_name || req.user.username || 'Dev Team',
      game_id || null,
      title || null,
      caption,
      type || 'devlog',
      show_in_carousel ? 1 : 0,
      id
    ]);

    // Atualiza mídias associadas se fornecidas
    if (Array.isArray(media) && media.length > 0) {
      await run('DELETE FROM post_media WHERE post_id = ?', [id]);
      for (let i = 0; i < media.length; i++) {
        const item = media[i];
        await run(`
          INSERT INTO post_media (post_id, media_url, media_type, order_index)
          VALUES (?, ?, ?, ?)
        `, [
          id,
          item.media_url,
          item.media_type || 'image',
          item.order_index ?? i
        ]);
      }
    }

    res.json({
      message: 'Post atualizado com sucesso!',
      postId: Number(id)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar post: ' + error.message });
  }
});

// 4. Curtir / Descurtir Post (Interação estilo Instagram - Apenas usuários cadastrados)
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await getOne('SELECT id, likes_count FROM posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    const existingLike = await getOne(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [id, userId]
    );

    let liked = false;
    if (existingLike) {
      await run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
      await run('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [id]);
      liked = false;
    } else {
      await run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
      await run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [id]);
      liked = true;
    }

    const updated = await getOne('SELECT likes_count FROM posts WHERE id = ?', [id]);

    res.json({
      message: liked ? 'Post curtido!' : 'Curtida removida!',
      liked,
      likes_count: updated.likes_count
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar curtida no post: ' + error.message });
  }
});

// 5. Deletar Post (CMS - Protegido)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Excluir dependências para integridade referencial
    await run('DELETE FROM post_media WHERE post_id = ?', [id]);
    await run('DELETE FROM post_likes WHERE post_id = ?', [id]);
    await run('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)', [id]);
    await run('DELETE FROM comments WHERE post_id = ?', [id]);
    await run('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ message: 'Post excluído com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir post: ' + error.message });
  }
});

export default router;
