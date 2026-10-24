import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { run, query, getOne } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_indie_studio_key_2024';

// 1. Listar comentários e respostas de um post (Com suporte a respostas aninhadas e curtidas estilo Instagram)
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const authHeader = req.headers['authorization'];
    let currentUserId = null;

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) currentUserId = decoded.id;
      } catch (e) {}
    }

    // Busca todos os comentários do post
    const allComments = await query(`
      SELECT c.*, 
             u.display_name as user_display_name,
             u.avatar_url as user_avatar,
             u.role as user_role
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);

    // Busca curtidas do usuário atual nos comentários
    let userLikedCommentIds = new Set();
    if (currentUserId) {
      const userLikes = await query(
        'SELECT comment_id FROM comment_likes WHERE user_id = ?',
        [currentUserId]
      );
      userLikedCommentIds = new Set(userLikes.map(l => l.comment_id));
    }

    // Organiza comentários raiz e respostas aninhadas (threaded)
    const commentMap = new Map();
    const rootComments = [];

    allComments.forEach(c => {
      const formatted = {
        id: c.id,
        post_id: c.post_id,
        parent_id: c.parent_id,
        author_name: c.user_display_name || c.author_name || 'Membro da Comunidade',
        author_avatar: c.user_avatar || c.author_avatar || 'imagens/Logo_colorida.png',
        author_role: c.user_role || 'user',
        content: c.content,
        created_at: c.created_at,
        likes_count: c.likes_count || 0,
        liked_by_me: userLikedCommentIds.has(c.id),
        replies: []
      };
      commentMap.set(c.id, formatted);
    });

    allComments.forEach(c => {
      const item = commentMap.get(c.id);
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id).replies.push(item);
      } else {
        rootComments.push(item);
      }
    });

    res.json(rootComments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar comentários: ' + error.message });
  }
});

// 2. Adicionar comentário ou resposta (Apenas usuários autenticados)
router.post('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'O comentário não pode ser vazio.' });
    }

    const post = await getOne('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    // Busca dados do usuário autenticado para garantir nickname e avatar reais
    const user = await getOne(
      'SELECT id, username, display_name, avatar_url, role FROM users WHERE id = ?',
      [req.user.id]
    );

    const authorName = user ? (user.display_name || user.username) : req.user.username;
    const authorAvatar = user ? (user.avatar_url || 'imagens/Logo_colorida.png') : 'imagens/Logo_colorida.png';

    const result = await run(`
      INSERT INTO comments (post_id, parent_id, user_id, author_name, author_avatar, content, likes_count)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [postId, parent_id || null, req.user.id, authorName, authorAvatar, content.trim()]);

    const created = await getOne('SELECT * FROM comments WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: parent_id ? 'Resposta enviada com sucesso!' : 'Comentário publicado!',
      comment: {
        id: created.id,
        post_id: created.post_id,
        parent_id: created.parent_id,
        author_name: authorName,
        author_avatar: authorAvatar,
        author_role: user ? user.role : 'user',
        content: created.content,
        created_at: created.created_at,
        likes_count: 0,
        liked_by_me: false,
        replies: []
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar comentário: ' + error.message });
  }
});

// 3. Curtir / Descurtir Comentário (Estilo Instagram - Apenas usuários autenticados)
router.post('/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await getOne('SELECT id, likes_count FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    const existingLike = await getOne(
      'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [commentId, userId]
    );

    let liked = false;
    if (existingLike) {
      await run('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [commentId, userId]);
      await run('UPDATE comments SET likes_count = MAX(0, likes_count - 1) WHERE id = ?', [commentId]);
      liked = false;
    } else {
      await run('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [commentId, userId]);
      await run('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?', [commentId]);
      liked = true;
    }

    const updated = await getOne('SELECT likes_count FROM comments WHERE id = ?', [commentId]);

    res.json({
      message: liked ? 'Comentário curtido!' : 'Curtida removida!',
      liked,
      likes_count: updated.likes_count
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar curtida no comentário: ' + error.message });
  }
});

// 4. Excluir Comentário (CMS ou autor do comentário)
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await getOne('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json({ error: 'Comentário não encontrado.' });
    }

    // Permite se for o autor do comentário ou administrador
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para excluir este comentário.' });
    }

    // Exclui respostas e curtidas associadas
    await run('DELETE FROM comment_likes WHERE comment_id = ?', [commentId]);
    await run('DELETE FROM comments WHERE parent_id = ?', [commentId]);
    await run('DELETE FROM comments WHERE id = ?', [commentId]);

    res.json({ message: 'Comentário excluído.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir comentário: ' + error.message });
  }
});

export default router;
