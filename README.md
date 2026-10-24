# 🎮 Qualquer Coisa Rápido - Game Studio Portal & CMS

Portal completo e backend para o estúdio indie **Qualquer Coisa Rápido**, com sistema de **Feed estilo Instagram (Devlogs)**, **CMS de Páginas Customizáveis por Blocos Modulares** (estilo Notion/Carrd) e **Coleta de Feedbacks de Playtest**.

---

## 🚀 Como Executar Tudo com 1 Comando

### 1. Instalar as dependências
Abra o terminal nesta pasta (`site-qualquer`) e execute:
```bash
npm install
```

### 2. Popular o banco com os dados reais do estúdio (Seed)
Cria o banco SQLite (`database.sqlite`) e popula com os 6 desenvolvedores (Brenno, Enzo, Gustavo, Iza, João, Maryssa), os jogos (*Unique Soul*, *A Catedral*, *Qualquer Coisa Quest*) e postagens com comentários:
```bash
npm run seed
```
> **Credenciais do CMS Admin:**
> - Usuário: `admin`
> - Senha: `admin123`

### 3. Iniciar o Servidor & Site
```bash
npm run dev
# ou: npm start
```

Ao iniciar, você terá acesso imediato a:
- 🌐 **Site Oficial (GameStore):** [`http://localhost:4000/home.html`](http://localhost:4000/home.html)
- 🎮 **Catálogo & Playtest:** [`http://localhost:4000/jogo.html`](http://localhost:4000/jogo.html)
- 👥 **Membros da Equipe:** [`http://localhost:4000/membros.html`](http://localhost:4000/membros.html)
- 🛠️ **Painel CMS Creator Studio:** [`http://localhost:4000/cms.html`](http://localhost:4000/cms.html)
- 📡 **Status da API:** [`http://localhost:4000/api/health`](http://localhost:4000/api/health)

---

## 💡 Como Funciona o CMS e as Páginas Customizáveis ("Estilo Canva")

Em vez de fazer um editor no estilo "drag-and-drop livre pixel a pixel" (que quebra a responsividade no celular e vira uma dor de cabeça sem fim), a melhor solução do mercado (usada por **Notion, Carrd, Wix e a própria Steam**) é o **Sistema de Blocos Modulares**.

No CMS, você e sua equipe podem montar a página de qualquer jogo adicionando, removendo e reordenando blocos como se fossem peças de LEGO:

| Tipo de Bloco (`block_type`) | O que ele exibe na página do jogo |
| :--- | :--- |
| `hero` | Título do jogo, slogan, botão de Call-to-Action ("Jogar Agora", "Wishlist Steam") e imagem/vídeo de fundo |
| `synopsis` | Sinopse da história, ambientação e lore do jogo |
| `gallery` | Carrossel ou grade com screenshots e artes conceituais |
| `playable_demo` | Iframe ou embed com a build WebGL do jogo (ex: build Unity/Godot exportada para Web ou embed do itch.io) |
| `features` | Lista de destaques com ícones (ex: "Co-op local", "Física em tempo real", "Pixel art") |
| `roadmap` | Linha do tempo mostrando o progresso (Protótipo ➔ Alpha ➔ Beta ➔ Lançamento) |
| `download_links` | Botões de download direto, links para itch.io, Steam, GameJolt, etc. |

No endpoint `PUT /api/games/:id/blocks`, o CMS envia o array de blocos ordenados, e o frontend apenas renderiza cada componente correspondente!

---

## 📸 Como Funciona o Feed "Pique Instagram"

- Cada post pode ter um **carrossel de imagens/GIFs/vídeos curtos** (`post_media`).
- Pode ser marcado com uma tag de jogo (`game_id`), para que os fãs vejam os devlogs apenas daquele protótipo específico!
- **Interação social:** Botão de curtir (`POST /api/posts/:id/like`) e área de comentários da comunidade.

---

## 📡 Mapa de Endpoints da API

### 🔐 Autenticação & CMS
- `POST /api/auth/login` ➔ Login no CMS (retorna JWT Token).
- `POST /api/auth/register` ➔ Cadastro de novo usuário admin/equipe.

### 🎮 Jogos & Páginas Customizáveis
- `GET /api/games` ➔ Lista todos os jogos e protótipos do estúdio.
- `GET /api/games/:slug` ➔ Retorna a página completa do jogo (informações + blocos modulares ordenados).
- `POST /api/games` 🔒 ➔ Cria um novo jogo.
- `PUT /api/games/:id` 🔒 ➔ Atualiza informações básicas do jogo.
- `PUT /api/games/:id/blocks` 🔒 ➔ **Salva/reordena os blocos modulares da página do jogo (Page Builder)**.
- `DELETE /api/games/:id` 🔒 ➔ Deleta o jogo e seus blocos.

### 📱 Feed estilo Instagram & Devlog
- `GET /api/posts` ➔ Feed geral (suporta `?game_id=ID` para filtrar por jogo).
- `GET /api/posts/:id` ➔ Detalhes do post com mídias carrossel e comentários.
- `POST /api/posts` 🔒 ➔ Publica um devlog/post com múltiplas fotos/vídeos.
- `POST /api/posts/:id/like` ➔ Dá curtida no post.
- `DELETE /api/posts/:id` 🔒 ➔ Exclui o post.

### 💬 Comentários & Interação
- `POST /api/comments/posts/:postId` ➔ Deixa um comentário em um post.

### 👥 Equipe do Estúdio
- `GET /api/team` ➔ Lista os desenvolvedores/artistas do estúdio.
- `POST /api/team` 🔒 ➔ Adiciona membro à equipe.
- `DELETE /api/team/:id` 🔒 ➔ Remove membro da equipe.

### 🧪 Playtest & Feedbacks
- `POST /api/feedback` ➔ Envio público de relato de bug ou opinião sobre um protótipo.
- `GET /api/feedback` 🔒 ➔ Visualização dos feedbacks recebidos no CMS.

### 🖼️ Upload de Mídias
- `POST /api/upload` 🔒 ➔ Envia uma imagem para a pasta `/uploads`.
- `POST /api/upload/multiple` 🔒 ➔ Envia até 10 imagens de uma vez para o carrossel.
