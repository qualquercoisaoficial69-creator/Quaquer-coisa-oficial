import { Router } from 'express';
import { query, getOne, run } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 1. Listar todos os jogos / protótipos (Público)
router.get('/', async (req, res) => {
  try {
    const games = await query(`
      SELECT id, title, slug, tagline, status, genre, cover_image, banner_image, accent_color, created_at 
      FROM games 
      ORDER BY created_at DESC
    `);
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar jogos: ' + error.message });
  }
});

// 2. Obter página completa de um jogo pelo SLUG (com todos os blocos modulares do CMS)
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const game = await getOne('SELECT * FROM games WHERE slug = ?', [slug]);

    if (!game) {
      return res.status(404).json({ error: 'Jogo não encontrado.' });
    }

    // Busca todos os blocos configurados no CMS para este jogo
    const rawBlocks = await query(
      'SELECT * FROM game_blocks WHERE game_id = ? ORDER BY order_index ASC',
      [game.id]
    );

    // Converte o content_json de string para objeto JavaScript
    const blocks = rawBlocks.map(block => {
      let content = {};
      try {
        content = JSON.parse(block.content_json);
      } catch (e) {
        content = { raw: block.content_json };
      }
      return {
        id: block.id,
        block_type: block.block_type,
        order_index: block.order_index,
        content
      };
    });

    res.json({
      ...game,
      blocks
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar página do jogo: ' + error.message });
  }
});

// 3. Criar novo jogo (CMS - Protegido)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, slug, tagline, status, genre, cover_image, banner_image, accent_color } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Título e slug são obrigatórios.' });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    const existing = await getOne('SELECT id FROM games WHERE slug = ?', [cleanSlug]);
    if (existing) {
      return res.status(400).json({ error: 'Já existe um jogo com este slug.' });
    }

    const result = await run(`
      INSERT INTO games (title, slug, tagline, status, genre, cover_image, banner_image, accent_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      cleanSlug,
      tagline || '',
      status || 'prototipo',
      genre || 'Indie',
      cover_image || null,
      banner_image || null,
      accent_color || '#6366f1'
    ]);

    res.status(201).json({
      message: 'Jogo criado com sucesso!',
      gameId: result.lastID,
      slug: cleanSlug
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar jogo: ' + error.message });
  }
});

// 4. Atualizar informações básicas do jogo (CMS - Protegido)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, tagline, status, genre, cover_image, banner_image, accent_color } = req.body;

    await run(`
      UPDATE games 
      SET title = COALESCE(?, title),
          tagline = COALESCE(?, tagline),
          status = COALESCE(?, status),
          genre = COALESCE(?, genre),
          cover_image = COALESCE(?, cover_image),
          banner_image = COALESCE(?, banner_image),
          accent_color = COALESCE(?, accent_color),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, tagline, status, genre, cover_image, banner_image, accent_color, id]);

    res.json({ message: 'Jogo atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar jogo: ' + error.message });
  }
});

// 5. Salvar/Substituir todos os Blocos de uma Página (O "Page Builder" do CMS - Protegido)
// Recebe uma lista de blocos ordenados e salva em lote
router.put('/:id/blocks', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { blocks } = req.body; // Array de { block_type, content, order_index }

    if (!Array.isArray(blocks)) {
      return res.status(400).json({ error: 'O campo blocks deve ser um array.' });
    }

    // Remove blocos antigos e recria na ordem nova
    await run('DELETE FROM game_blocks WHERE game_id = ?', [id]);

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const contentJson = typeof b.content === 'string' ? b.content : JSON.stringify(b.content || {});
      await run(`
        INSERT INTO game_blocks (game_id, block_type, content_json, order_index)
        VALUES (?, ?, ?, ?)
      `, [id, b.block_type, contentJson, b.order_index ?? i]);
    }

    res.json({ message: 'Página customizada salva com sucesso!', totalBlocks: blocks.length });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar blocos da página: ' + error.message });
  }
});

// 6. Deletar jogo
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await run('DELETE FROM games WHERE id = ?', [id]);
    res.json({ message: 'Jogo removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir jogo: ' + error.message });
  }
});

export default router;
