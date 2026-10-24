import bcrypt from 'bcryptjs';
import db, { run, initDatabase } from './db.js';

const seed = async () => {
  console.log('🌱 Inicializando seed com dados reais da Qualquer Coisa Rápido...');
  await initDatabase();

  await new Promise((r) => setTimeout(r, 600));

  // 1. Criar usuário admin para o CMS
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  try {
    await run(`
      INSERT OR REPLACE INTO users (id, username, password_hash, role)
      VALUES (1, 'admin', ?, 'admin')
    `, [passwordHash]);
    console.log('👤 Usuário admin configurado: "admin" / "admin123"');
  } catch (e) {
    console.log('Admin já configurado.');
  }

  // 2. Integrantes reais da Qualquer Coisa Rápido com fotos oficiais
  await run(`DELETE FROM team_members`);
  const members = [
    { name: 'Brenno', role: 'Desenvolvedor Full Stack & Game Design', bio: 'Programação de sistemas, integrações interativas, arquitetura de software e desenvolvimento geral.', avatar: 'imagens/brenno-icon.jpeg', order: 1 },
    { name: 'Gaby', role: 'Game Design, Personagens & Arte', bio: 'Criação visual de personagens, auxílio na produção de arte, game design e suporte nas mais diversas frentes do estúdio.', avatar: 'imagens/en.jpg', order: 2 },
    { name: 'Gustavo', role: 'Mecânicas & Programação', bio: 'Implementação de combate, inteligência artificial e refinamento de controles do jogador.', avatar: 'imagens/gus.jpg', order: 3 },
    { name: 'Iza', role: 'Diretora de Arte & Ilustradora', bio: 'Criação dos cenários imersivos da Catedral, iluminação dramática e conceito visual.', avatar: 'imagens/iz.jpg', order: 4 },
    { name: 'Maryssa', role: 'UI/UX & Roteirista', bio: 'Estruturação da experiência de usuário, design de interfaces e narrativa profunda do mundo.', avatar: 'imagens/ma.jpg', order: 5 },
  ];

  for (const m of members) {
    await run(`
      INSERT INTO team_members (name, role, bio, avatar_url, order_index)
      VALUES (?, ?, ?, ?, ?)
    `, [m.name, m.role, m.bio, m.avatar, m.order]);
  }
  console.log('👥 6 Membros da equipe cadastrados com sucesso!');

  // 3. Cadastrar Jogos e Protótipos reais do estúdio
  await run(`DELETE FROM games`);
  const g1 = await run(`
    INSERT INTO games (title, slug, tagline, status, genre, cover_image, banner_image, accent_color)
    VALUES (
      'Unique Soul',
      'unique-soul',
      'Uma jornada narrativa através de dimensões espirituais e mistérios ancestrais.',
      'alpha',
      'Ação & Aventura 2D / RPG',
      'imagens/unique_soul_capa.png',
      'imagens/unique_soul_cenario.png',
      '#a855f7'
    )
  `);
  const uniqueSoulId = g1.lastID;

  const g2 = await run(`
    INSERT INTO games (title, slug, tagline, status, genre, cover_image, banner_image, accent_color)
    VALUES (
      'A Catedral das Almas',
      'catedral-almas',
      'Exploração de atmosfera gótica e mistérios arcanos.',
      'prototipo',
      'Exploração / Terror Psicológico',
      'imagens/unique_soul_cenario.png',
      'imagens/unique_soul_cenario.png',
      '#06b6d4'
    )
  `);

  const g3 = await run(`
    INSERT INTO games (title, slug, tagline, status, genre, cover_image, banner_image, accent_color)
    VALUES (
      'Qualquer Coisa Quest',
      'qualquer-coisa-quest',
      'Um jogo de plataforma retrô com o mascote oficial do estúdio.',
      'ideia',
      'Plataforma 2D / Retrô',
      'imagens/Qualquer_coisa_corpo_inteiro.png',
      'imagens/preview.png',
      '#10b981'
    )
  `);
  console.log('🎮 Jogos cadastrados!');

  // 4. Cadastrar Blocos Modulares do Unique Soul
  await run(`DELETE FROM game_blocks`);
  const uniqueSoulBlocks = [
    {
      type: 'hero',
      content: {
        title: 'Unique Soul',
        tagline: 'Onde cada alma carrega um propósito e cada escolha molda a escuridão.',
        badge: 'Em Produção • Alpha 0.1',
        primary_button: { text: 'Ver Galeria', link: '#galeria' },
        secondary_button: { text: 'Conhecer a História', link: '#sinopse' }
      },
      order: 1
    },
    {
      type: 'synopsis',
      content: {
        heading: 'A Jornada de Unique Soul',
        text: 'Nascido da vontade de seis amigos em criar um universo vivo a partir do zero, Unique Soul coloca o jogador no controle de uma alma despertada em um plano espiritual fraturado. Enfrente manifestações do esquecimento, desvende os mistérios da Catedral e reconstrua as memórias perdidas daquele mundo.',
        quote: '"Entre a névoa e a luz que se esvai, sua essência é a única arma."'
      },
      order: 2
    },
    {
      type: 'gallery',
      content: {
        heading: 'Artes e Cenários Conceituais',
        images: [
          { url: 'imagens/unique_soul_capa.png', caption: 'Arte Oficial de Capa' },
          { url: 'imagens/unique_soul_cenario.png', caption: 'Interior da Catedral das Almas' },
          { url: 'imagens/preview.png', caption: 'Estudo de iluminação e atmosfera' }
        ]
      },
      order: 3
    },
    {
      type: 'features',
      content: {
        heading: 'Pilares do Desenvolvimento',
        items: [
          { title: 'Narrativa Autoral Profunda', desc: 'História construída em colaboração, com finais múltiplos e escolhas de impacto.' },
          { title: 'Arte Atmosférica Feita à Mão', desc: 'Cenários pintados individualmente para criar uma sensação de imersão densa.' },
          { title: 'Trilha Sonora Original', desc: 'Composições exclusivas criadas para ditar o ritmo de cada momento de tensão e contemplação.' },
          { title: 'Combate Dinâmico 2D', desc: 'Sistemas de esquiva, absorção de essência e poderes baseados na alma.' }
        ]
      },
      order: 4
    },
    {
      type: 'roadmap',
      content: {
        heading: 'Linha do Tempo de Produção',
        steps: [
          { phase: 'Concepção & TCC Inicial', status: 'concluido' },
          { phase: 'Roteiro & Bíblia de Lore', status: 'concluido' },
          { phase: 'Alpha 0.1 - Mecânicas Centrais', status: 'em_progresso' },
          { phase: 'Composição de Trilha Sonora', status: 'em_progresso' },
          { phase: 'Demo Pública no Itch.io', status: 'pendente' },
          { phase: 'Lançamento Comercial', status: 'futuro' }
        ]
      },
      order: 5
    }
  ];

  for (const b of uniqueSoulBlocks) {
    await run(`
      INSERT INTO game_blocks (game_id, block_type, content_json, order_index)
      VALUES (?, ?, ?, ?)
    `, [uniqueSoulId, b.type, JSON.stringify(b.content), b.order]);
  }

  // 5. Cadastrar Posts do Feed "Pique Instagram" (Devlog)
  await run(`DELETE FROM posts`);
  await run(`DELETE FROM post_media`);
  await run(`DELETE FROM comments`);

  const p1 = await run(`
    INSERT INTO posts (author_name, game_id, title, caption, type, likes_count)
    VALUES (
      'Equipe Qualquer Coisa',
      ?,
      'Primeiro vislumbre da Catedral das Almas!',
      'Hoje estamos revelando a primeira concept art finalizada da Catedral! Foram semanas ajustando a iluminação e as texturas para passar o clima de desolação e mistério que Unique Soul merece. O que vocês acharam da paleta de cores? 💜✨ #UniqueSoul #gamedev #indiegame #arteconceitual',
      'devlog',
      58
    )
  `, [uniqueSoulId]);

  await run(`
    INSERT INTO post_media (post_id, media_url, media_type, order_index)
    VALUES 
    (?, 'imagens/unique_soul_cenario.png', 'image', 1),
    (?, 'imagens/unique_soul_capa.png', 'image', 2)
  `, [p1.lastID, p1.lastID]);

  await run(`
    INSERT INTO comments (post_id, author_name, content)
    VALUES 
    (?, 'Seguidor Indie', 'Essa atmosfera tá espetacular! Ansioso demais pra testar.'),
    (?, 'GameDev Brasil', 'Parabéns pelo trabalho na iluminação! Lembra os melhores momentos de jogos atmosféricos.')
  `, [p1.lastID, p1.lastID]);

  const p2 = await run(`
    INSERT INTO posts (author_name, game_id, title, caption, type, likes_count)
    VALUES (
      'Brenno',
      ?,
      'Nosso Mascote Oficial Ganhou Vida!',
      'Apresentando nosso mascote em versão final! Ele será a cara dos nossos tutoriais e talvez até estrele seu próprio jogo em breve no Qualquer Coisa Quest! 🚀👾 #estudioindie #mascote #pixelart',
      'novidade',
      73
    )
  `, [g3.lastID]);

  await run(`
    INSERT INTO post_media (post_id, media_url, media_type, order_index)
    VALUES (?, 'imagens/Qualquer_coisa_corpo_inteiro.png', 'image', 1)
  `, [p2.lastID]);

  console.log('🎉 Seed finalizado!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
