import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Se TURSO_DATABASE_URL estiver definido, conecta na nuvem do Turso.
// Caso contrário, usa o arquivo local file:database.sqlite
const dbUrl = process.env.TURSO_DATABASE_URL || 'file:database.sqlite';
const dbAuthToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const client = createClient({
  url: dbUrl,
  authToken: dbAuthToken
});

console.log(`🔌 Conectado ao banco: ${dbUrl.startsWith('file:') ? 'SQLite Local (' + dbUrl + ')' : 'Turso Cloud'}`);

// Helper unificado para buscar várias linhas
export const query = async (sql, params = []) => {
  try {
    const rs = await client.execute({ sql, args: params });
    return rs.rows;
  } catch (err) {
    console.error(`Erro na query [${sql}]:`, err.message);
    throw err;
  }
};

// Helper unificado para buscar uma linha
export const getOne = async (sql, params = []) => {
  try {
    const rs = await client.execute({ sql, args: params });
    return rs.rows[0] || null;
  } catch (err) {
    console.error(`Erro no getOne [${sql}]:`, err.message);
    throw err;
  }
};

// Helper unificado para executar INSERT / UPDATE / DELETE
export const run = async (sql, params = []) => {
  try {
    const rs = await client.execute({ sql, args: params });
    return {
      lastID: rs.lastInsertRowid !== undefined ? Number(rs.lastInsertRowid) : 0,
      changes: rs.rowsAffected || 0
    };
  } catch (err) {
    console.error(`Erro no run [${sql}]:`, err.message);
    throw err;
  }
};

// Criação automática de todas as tabelas
export const initDatabase = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT,
      avatar_url TEXT,
      twitter_url TEXT,
      github_url TEXT,
      portfolio_url TEXT,
      order_index INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      tagline TEXT,
      status TEXT DEFAULT 'prototipo',
      genre TEXT,
      cover_image TEXT,
      banner_image TEXT,
      accent_color TEXT DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS game_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      block_type TEXT NOT NULL,
      content_json TEXT NOT NULL,
      order_index INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_name TEXT NOT NULL,
      game_id INTEGER,
      title TEXT,
      caption TEXT NOT NULL,
      type TEXT DEFAULT 'devlog',
      likes_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS post_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      media_url TEXT NOT NULL,
      media_type TEXT DEFAULT 'image',
      order_index INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER,
      player_name TEXT,
      player_contact TEXT,
      type TEXT DEFAULT 'opiniao',
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const statement of tables) {
    try {
      await client.execute(statement);
    } catch (err) {
      console.warn('Aviso ao inicializar tabela:', err.message);
    }
  }

  // Auto-seed: Se o banco estiver vazio (ex: primeiro deploy na nuvem / Vercel)
  try {
    const userCheck = await client.execute('SELECT COUNT(*) as count FROM users');
    const userCount = Number(userCheck.rows[0]?.count || 0);

    if (userCount === 0) {
      console.log('🌱 Banco vazio detectado na nuvem. Executando auto-seed inicial...');
      // Senha hash pré-calculada para "admin123"
      const defaultHash = '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lR0.eXy7WqgQvC4zU9N8mZz7R5hGe';
      
      await client.execute({
        sql: `INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES (1, 'admin', ?, 'admin')`,
        args: [defaultHash]
      });

      const members = [
        { name: 'Brenno', role: 'Desenvolvedor Full Stack & Game Design', bio: 'Programação de sistemas, arquitetura de software e desenvolvimento geral.', avatar: 'imagens/brenno-icon.jpeg', order: 1 },
        { name: 'Enzo', role: 'Programador & Game Design', bio: 'Construção da lógica de jogo, balanceamento e gameplay.', avatar: 'imagens/en.jpg', order: 2 },
        { name: 'Gustavo', role: 'Mecânicas & Programação', bio: 'Implementação de combate, IA e controles.', avatar: 'imagens/gus.jpg', order: 3 },
        { name: 'Iza', role: 'Diretora de Arte & Ilustradora', bio: 'Criação dos cenários imersivos da Catedral e conceito visual.', avatar: 'imagens/iz.jpg', order: 4 },
        { name: 'João', role: 'Sound Designer & Áudio', bio: 'Composição de atmosferas sonoras e efeitos imersivos.', avatar: 'imagens/jo.jpg', order: 5 },
        { name: 'Maryssa', role: 'UI/UX & Roteirista', bio: 'Design de interfaces e narrativa profunda do mundo.', avatar: 'imagens/ma.jpg', order: 6 }
      ];

      for (const m of members) {
        await client.execute({
          sql: `INSERT INTO team_members (name, role, bio, avatar_url, order_index) VALUES (?, ?, ?, ?, ?)`,
          args: [m.name, m.role, m.bio, m.avatar, m.order]
        });
      }

      const g1 = await client.execute({
        sql: `INSERT INTO games (title, slug, tagline, status, genre, cover_image, banner_image, accent_color)
              VALUES ('Unique Soul', 'unique-soul', 'Uma jornada narrativa através de dimensões espirituais e mistérios ancestrais.', 'alpha', 'Ação & Aventura 2D / RPG', 'imagens/unique_soul_capa.png', 'imagens/unique_soul_cenario.png', '#a855f7')`,
        args: []
      });

      const uniqueSoulId = Number(g1.lastInsertRowid);

      await client.execute({
        sql: `INSERT INTO games (title, slug, tagline, status, genre, cover_image, banner_image, accent_color)
              VALUES ('A Catedral das Almas', 'catedral-almas', 'Exploração de atmosfera gótica e mistérios arcanos.', 'prototipo', 'Exploração / Terror Psicológico', 'imagens/unique_soul_cenario.png', 'imagens/unique_soul_cenario.png', '#06b6d4')`,
        args: []
      });

      await client.execute({
        sql: `INSERT INTO games (title, slug, tagline, status, genre, cover_image, banner_image, accent_color)
              VALUES ('Qualquer Coisa Quest', 'qualquer-coisa-quest', 'Um jogo de plataforma retrô com o mascote oficial do estúdio.', 'ideia', 'Plataforma 2D / Retrô', 'imagens/Qualquer_coisa_corpo_inteiro.png', 'imagens/preview.png', '#10b981')`,
        args: []
      });

      // Post inicial
      const p1 = await client.execute({
        sql: `INSERT INTO posts (author_name, game_id, title, caption, type, likes_count)
              VALUES ('Equipe Qualquer Coisa', ?, 'Primeiro vislumbre da Catedral das Almas!', 'Hoje estamos revelando a primeira concept art finalizada da Catedral! Foram semanas ajustando a iluminação e texturas. O que acharam da paleta? 💜✨ #UniqueSoul #gamedev #indiegame', 'devlog', 58)`,
        args: [uniqueSoulId]
      });

      const postId = Number(p1.lastInsertRowid);

      await client.execute({
        sql: `INSERT INTO post_media (post_id, media_url, media_type, order_index) VALUES (?, 'imagens/unique_soul_cenario.png', 'image', 1)`,
        args: [postId]
      });

      await client.execute({
        sql: `INSERT INTO comments (post_id, author_name, content) VALUES (?, 'Seguidor Indie', 'Essa atmosfera tá espetacular! Ansioso demais pra testar.')`,
        args: [postId]
      });

      console.log('✅ Auto-seed concluído com sucesso!');
    }
  } catch (seedErr) {
    console.warn('Auto-seed ignorado ou já executado:', seedErr.message);
  }
};

export default { query, getOne, run, initDatabase };
