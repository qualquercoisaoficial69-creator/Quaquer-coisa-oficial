/**
 * cms-manager.js
 * Construtor Visual de Páginas de Jogos estilo Canva com Componentes Pré-Moldados & Drag-and-Drop.
 */

let activeEditorGame = null;
let activeEditorBlocks = [];
let draggedComponentType = null;
let draggedExistingBlockIndex = null;

window.switchCmsSection = function(section) {
    const sections = {
        posts: document.getElementById('cmsSectionPosts'),
        games: document.getElementById('cmsSectionGames'),
        feedback: document.getElementById('cmsSectionFeedback')
    };

    const tabs = {
        posts: document.getElementById('tabBtnCmsPosts'),
        games: document.getElementById('tabBtnCmsGames'),
        feedback: document.getElementById('tabBtnCmsFeedback')
    };

    Object.keys(sections).forEach(key => {
        if (sections[key]) sections[key].style.display = (key === section) ? 'block' : 'none';
        if (tabs[key]) tabs[key].classList.toggle('active', key === section);
    });

    if (section === 'games') {
        loadCmsGames();
    } else if (section === 'feedback') {
        loadCmsFeedbacks();
    }
};

// ============================================================
// CATÁLOGO DE COMPONENTES PRÉ-MOLDADOS (TEMPLATES)
// ============================================================

const PREBUILT_TEMPLATES = {
    hero: {
        name: 'Capa Hero Neon',
        icon: 'fa-heading',
        color: '#7c3aed',
        desc: 'Banner de abertura com logo, slogan, tag de versão e botões de ação.',
        create: (game) => ({
            title: game.title || 'Título do Jogo',
            tagline: game.tagline || 'Uma jornada imersiva através das dimensões espirituais.',
            badge: 'ALPHA 0.1 • EM DESENVOLVIMENTO',
            bg_image: game.banner_image || 'imagens/unique_soul_cenario.png',
            btn_primary: 'Jogar Demo Web',
            btn_secondary: 'Lista de Desejos'
        })
    },
    synopsis: {
        name: 'História & Lore',
        icon: 'fa-book-open',
        color: '#c084fc',
        desc: 'Card narrativo com título, parágrafo de ambientação e citação épica.',
        create: () => ({
            heading: 'A Jornada das Almas',
            text: 'Desperte em um plano espiritual fraturado. Descubra os mistérios ancestrais da Catedral e enfrente criaturas das sombras enquanto reconstrói a sua essência.',
            quote: '"Entre a névoa e a luz que se esvai, sua alma é a única arma."'
        })
    },
    features: {
        name: 'Grid de Mecânicas',
        icon: 'fa-th-large',
        color: '#06b6d4',
        desc: '3 cartões visuais para destacar poderes, combate, arte e sistemas.',
        create: () => ({
            heading: 'Pilares de Gameplay',
            items: [
                { title: 'Combate Fluido 2D', desc: 'Esquivas precisas, absorção de energia e combos dinâmicos.' },
                { title: 'Pixel Art Feita à Mão', desc: 'Mais de 500 frames de animação detalhados para cada personagem.' },
                { title: 'Trilha Sonora Original', desc: 'Composições que reagem à tensão e aos momentos épicos de batalha.' }
            ]
        })
    },
    playable_demo: {
        name: 'Demo Jogável (WebGL)',
        icon: 'fa-gamepad',
        color: '#10b981',
        desc: 'Player interativo para rodar a build WebGL do Unity/Godot ou embed do itch.io.',
        create: () => ({
            heading: 'Jogue o Protótipo no Navegador',
            instructions: 'Controles: Teclas WASD para andar, Espaço para pular, Mouse para atacar.',
            embed_url: 'https://itch.io/embed-upload/placeholder'
        })
    },
    gallery: {
        name: 'Galeria de Screenshots',
        icon: 'fa-images',
        color: '#f43f5e',
        desc: 'Carrossel e grade com capturas de tela e artes conceituais do estúdio.',
        create: () => ({
            heading: 'Artes e Cenários Oficiais',
            images: [
                { url: 'imagens/unique_soul_capa.png', caption: 'Arte Conceitual de Capa' },
                { url: 'imagens/unique_soul_cenario.png', caption: 'Interior da Catedral das Almas' },
                { url: 'imagens/preview.png', caption: 'Estudo de iluminação volumétrica' }
            ]
        })
    },
    roadmap: {
        name: 'Linha do Tempo (Roadmap)',
        icon: 'fa-stream',
        color: '#f59e0b',
        desc: 'Pipeline de produção com status dinâmico (Concluído, Em Progresso, Futuro).',
        create: () => ({
            heading: 'Status do Desenvolvimento',
            steps: [
                { phase: 'Bíblia de Lore & Roteiro', status: 'concluido' },
                { phase: 'Protótipo Alpha 0.1', status: 'concluido' },
                { phase: 'Trilha Sonora & Efeitos Sonoros', status: 'em_progresso' },
                { phase: 'Demo Pública no Itch.io', status: 'pendente' },
                { phase: 'Lançamento Comercial', status: 'futuro' }
            ]
        })
    },
    downloads: {
        name: 'Links de Download & Lojas',
        icon: 'fa-download',
        color: '#3b82f6',
        desc: 'Botões oficiais para Steam, Itch.io, Epic Games e Discord da comunidade.',
        create: () => ({
            heading: 'Onde Encontrar o Jogo',
            steam_url: 'https://store.steampowered.com',
            itch_url: 'https://itch.io',
            discord_url: 'https://discord.gg/qrk3CjQ5HF'
        })
    }
};

// ============================================================
// CARREGAMENTO DOS JOGOS
// ============================================================

async function loadCmsGames() {
    const selector = document.getElementById('cmsGameSelector');
    if (!selector || !window.ApiClient) return;

    try {
        const games = await window.ApiClient.getGames();
        if (!Array.isArray(games) || games.length === 0) {
            selector.innerHTML = '<option value="">Nenhum jogo cadastrado. Clique em "+ Novo Jogo"!</option>';
            return;
        }

        selector.innerHTML = '<option value="">-- Selecione um Jogo para Editar --</option>' + 
            games.map(g => `<option value="${g.slug}">${g.title} (${(g.status || 'PROTÓTIPO').toUpperCase()})</option>`).join('');

        if (games.length > 0) {
            const currentSlug = selector.value || games[0].slug;
            selector.value = currentSlug;
            loadGameBlocksForEditor(currentSlug);
        }
    } catch (err) {
        console.error('Erro ao carregar jogos:', err);
    }
}

window.loadGameBlocksForEditor = async function(gameSlug) {
    const container = document.getElementById('cmsGameBlocksEditorContainer');
    if (!gameSlug || !container || !window.ApiClient) {
        if (container) container.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.6);">Selecione um jogo para abrir o editor visual estilo Canva.</div>';
        return;
    }

    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--cyan);"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;">Carregando o estúdio Canva...</p></div>';

    try {
        const game = await window.ApiClient.getGameBySlug(gameSlug);
        activeEditorGame = game;
        activeEditorBlocks = (game.blocks && game.blocks.length > 0) ? game.blocks : [
            { block_type: 'hero', content: PREBUILT_TEMPLATES.hero.create(game) },
            { block_type: 'synopsis', content: PREBUILT_TEMPLATES.synopsis.create() },
            { block_type: 'features', content: PREBUILT_TEMPLATES.features.create() },
            { block_type: 'roadmap', content: PREBUILT_TEMPLATES.roadmap.create() }
        ];
        renderCanvaStudio();
    } catch (err) {
        container.innerHTML = `<div style="color:#f87171;padding:20px;text-align:center;">Erro ao carregar: ${err.message}</div>`;
    }
};

// ============================================================
// RENDERIZAÇÃO DO CANVA STUDIO (COM GAVETA DE COMPONENTES)
// ============================================================

function renderCanvaStudio() {
    const container = document.getElementById('cmsGameBlocksEditorContainer');
    if (!container || !activeEditorGame) return;

    container.innerHTML = `
        <!-- BARRA DE AÇÕES TOPO DO CANVA -->
        <div style="background:#16092b;border:1px solid #7c3aed;border-radius:12px;padding:14px 20px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 0 25px rgba(124,58,237,0.2);">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:38px;height:38px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;">
                    <i class="fas fa-magic"></i>
                </div>
                <div>
                    <h4 style="font-family:'Orbitron',sans-serif;color:#fff;margin:0;font-size:1.1rem;">
                        Canva Builder: <span style="color:#06b6d4;">${activeEditorGame.title}</span>
                    </h4>
                    <span style="font-size:0.8rem;color:rgba(255,255,255,0.6);">
                        Arraste os componentes da gaveta lateral ou clique neles para montar a página!
                    </span>
                </div>
            </div>

            <div style="display:flex;gap:10px;align-items:center;">
                <a href="jogo.html?game=${activeEditorGame.slug}" target="_blank" class="btn-spotlight-details" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;">
                    <i class="fas fa-external-link-alt"></i> Ver Página no Site
                </a>
                <button type="button" class="btn-spotlight-play" onclick="saveGameBlocksVisual()" style="display:inline-flex;align-items:center;gap:8px;box-shadow:0 0 15px rgba(6,182,212,0.4);">
                    <i class="fas fa-save"></i> SALVAR PÁGINA
                </button>
            </div>
        </div>

        <!-- LAYOUT 2 COLUNAS: GAVETA DE COMPONENTES + CANVAS CENTRAL -->
        <div class="canva-studio-workspace" style="display:grid;grid-template-columns:310px 1fr;gap:20px;align-items:start;">
            
            <!-- GAVETA LATERAL: COMPONENTES PRÉ-MOLDADOS ARRASTÁVEIS -->
            <div class="canva-components-drawer" style="background:#130624;border:1px solid rgba(168,85,247,0.3);border-radius:14px;padding:18px;position:sticky;top:20px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;">
                    <i class="fas fa-cubes" style="color:#06b6d4;font-size:1.2rem;"></i>
                    <h4 style="font-family:'Orbitron',sans-serif;color:#fff;margin:0;font-size:0.95rem;">COMPONENTES</h4>
                </div>
                <p style="font-size:0.78rem;color:rgba(255,255,255,0.6);margin:0 0 14px 0;line-height:1.4;">
                    Arraste o componente para o local desejado ou clique nele para adicionar no fim:
                </p>

                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${Object.keys(PREBUILT_TEMPLATES).map(typeKey => {
                        const t = PREBUILT_TEMPLATES[typeKey];
                        return `
                            <div class="canva-draggable-card" 
                                 draggable="true" 
                                 ondragstart="handleComponentDragStart(event, '${typeKey}')"
                                 onclick="addPrebuiltBlock('${typeKey}')"
                                 style="--card-color:${t.color};">
                                <div class="canva-card-header">
                                    <div class="canva-card-icon"><i class="fas ${t.icon}"></i></div>
                                    <strong class="canva-card-title">${t.name}</strong>
                                    <span class="canva-drag-hint"><i class="fas fa-grip-lines"></i></span>
                                </div>
                                <p class="canva-card-desc">${t.desc}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- CANVAS CENTRAL: ONDE OS BLOCOS VIVOS SÃO RENDERIZADOS -->
            <div class="canva-live-canvas" style="display:flex;flex-direction:column;gap:14px;">
                <!-- Dropzone inicial no topo -->
                ${renderDropzone(0)}

                ${activeEditorBlocks.map((block, index) => `
                    ${renderVisualBlockWithWrapper(block, index)}
                    ${renderDropzone(index + 1)}
                `).join('')}

                ${activeEditorBlocks.length === 0 ? `
                    <div style="text-align:center;padding:60px 20px;background:rgba(255,255,255,0.02);border:2px dashed rgba(168,85,247,0.3);border-radius:14px;">
                        <i class="fas fa-puzzle-piece" style="font-size:3rem;color:#7c3aed;margin-bottom:14px;display:block;"></i>
                        <h4 style="font-family:'Orbitron',sans-serif;color:#fff;margin:0 0 8px 0;">Sua página está vazia</h4>
                        <p style="font-size:0.88rem;color:rgba(255,255,255,0.6);margin:0;">Arraste qualquer componente da gaveta ao lado para começar!</p>
                    </div>
                ` : ''}
            </div>

        </div>
    `;

    injectCanvaStudioStyles();
}

// Injeta os estilos do Canva Drag & Drop
function injectCanvaStudioStyles() {
    if (document.getElementById('canvaStudioGlobalStyles')) return;
    const style = document.createElement('style');
    style.id = 'canvaStudioGlobalStyles';
    style.textContent = `
        @media (max-width: 960px) {
            .canva-studio-workspace { grid-template-columns: 1fr !important; }
            .canva-components-drawer { position: static !important; }
        }
        .canva-draggable-card {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid var(--card-color, #7c3aed);
            border-radius: 8px;
            padding: 10px 12px;
            cursor: grab;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
        }
        .canva-draggable-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--card-color);
            transform: translateX(4px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .canva-draggable-card:active {
            cursor: grabbing;
            opacity: 0.7;
        }
        .canva-card-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
        }
        .canva-card-icon {
            color: var(--card-color);
            font-size: 0.95rem;
        }
        .canva-card-title {
            color: #fff;
            font-size: 0.85rem;
            flex: 1;
        }
        .canva-drag-hint {
            color: rgba(255,255,255,0.3);
            font-size: 0.8rem;
        }
        .canva-card-desc {
            margin: 0;
            font-size: 0.74rem;
            color: rgba(255,255,255,0.6);
            line-height: 1.3;
        }
        .canva-dropzone {
            height: 14px;
            border-radius: 8px;
            transition: all 0.2s ease;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .canva-dropzone.drag-active {
            height: 48px;
            background: rgba(6, 182, 212, 0.15);
            border: 2px dashed #06b6d4;
            box-shadow: 0 0 20px rgba(6,182,212,0.3);
        }
        .canva-dropzone-label {
            display: none;
            color: #06b6d4;
            font-family: 'Orbitron', sans-serif;
            font-size: 0.8rem;
            font-weight: 700;
            pointer-events: none;
        }
        .canva-dropzone.drag-active .canva-dropzone-label {
            display: inline-block;
        }
        .canva-block-wrapper {
            position: relative;
            border: 1px solid transparent;
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        .canva-block-wrapper:hover {
            border-color: rgba(6,182,212,0.6);
            box-shadow: 0 0 20px rgba(6,182,212,0.15);
        }
        .canva-floating-bar {
            position: absolute;
            top: -14px;
            right: 14px;
            background: #16092b;
            border: 1px solid #06b6d4;
            border-radius: 20px;
            padding: 4px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 10;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
        }
        .canva-bar-btn {
            background: none;
            border: none;
            color: #aaa;
            cursor: pointer;
            font-size: 0.85rem;
            padding: 2px 4px;
        }
        .canva-bar-btn:hover { color: #06b6d4; }
        .canva-bar-btn.delete:hover { color: #f87171; }
        .editable-canva-text {
            outline: none;
            border-radius: 4px;
            padding: 2px 4px;
            transition: background 0.2s;
        }
        .editable-canva-text:hover { background: rgba(255,255,255,0.06); }
        .editable-canva-text:focus {
            background: rgba(6,182,212,0.15);
            box-shadow: 0 0 0 1px #06b6d4;
        }
    `;
    document.head.appendChild(style);
}

// ============================================================
// DRAG AND DROP HANDLERS
// ============================================================

window.handleComponentDragStart = function(e, componentType) {
    draggedComponentType = componentType;
    draggedExistingBlockIndex = null;
    e.dataTransfer.setData('text/plain', componentType);
    e.dataTransfer.effectAllowed = 'copy';
};

window.handleExistingBlockDragStart = function(e, index) {
    draggedExistingBlockIndex = index;
    draggedComponentType = null;
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
};

window.handleDragOver = function(e, dropIndex) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = draggedComponentType ? 'copy' : 'move';
    const dz = document.getElementById(`dropzone-${dropIndex}`);
    if (dz) dz.classList.add('drag-active');
};

window.handleDragLeave = function(e, dropIndex) {
    e.preventDefault();
    e.stopPropagation();
    const dz = document.getElementById(`dropzone-${dropIndex}`);
    if (dz) dz.classList.remove('drag-active');
};

window.handleDrop = function(e, dropIndex) {
    e.preventDefault();
    e.stopPropagation();
    
    document.querySelectorAll('.canva-dropzone').forEach(el => el.classList.remove('drag-active'));

    // Caso 1: Soltou um novo componente da gaveta lateral
    if (draggedComponentType && PREBUILT_TEMPLATES[draggedComponentType]) {
        const template = PREBUILT_TEMPLATES[draggedComponentType];
        const newBlock = {
            block_type: draggedComponentType,
            content: template.create(activeEditorGame)
        };
        activeEditorBlocks.splice(dropIndex, 0, newBlock);
        draggedComponentType = null;
        renderCanvaStudio();
        return;
    }

    // Caso 2: Reordenou um bloco existente arrastando-o
    if (draggedExistingBlockIndex !== null) {
        const fromIdx = draggedExistingBlockIndex;
        let toIdx = dropIndex;
        if (fromIdx === toIdx || fromIdx === toIdx - 1) return;

        const movedItem = activeEditorBlocks.splice(fromIdx, 1)[0];
        if (fromIdx < toIdx) toIdx--;
        activeEditorBlocks.splice(toIdx, 0, movedItem);
        draggedExistingBlockIndex = null;
        renderCanvaStudio();
    }
};

function renderDropzone(index) {
    return `
        <div class="canva-dropzone" 
             id="dropzone-${index}"
             ondragover="handleDragOver(event, ${index})" 
             ondragleave="handleDragLeave(event, ${index})" 
             ondrop="handleDrop(event, ${index})">
            <span class="canva-dropzone-label">
                <i class="fas fa-plus"></i> Solte o componente aqui!
            </span>
        </div>
    `;
}

// Clicar no componente da gaveta também adiciona ao final
window.addPrebuiltBlock = function(typeKey) {
    if (!PREBUILT_TEMPLATES[typeKey]) return;
    const template = PREBUILT_TEMPLATES[typeKey];
    activeEditorBlocks.push({
        block_type: typeKey,
        content: template.create(activeEditorGame)
    });
    renderCanvaStudio();
};

// ============================================================
// RENDERIZAÇÃO DOS BLOCOS VISUAIS
// ============================================================

function renderVisualBlockWithWrapper(block, index) {
    const c = block.content || {};
    const type = block.block_type;
    const templateInfo = PREBUILT_TEMPLATES[type] || { name: type, color: '#06b6d4' };

    let contentHtml = '';

    if (type === 'hero') {
        const bg = c.bg_image || 'imagens/unique_soul_cenario.png';
        contentHtml = `
            <div style="background: linear-gradient(rgba(9,2,18,0.7), rgba(9,2,18,0.9)), url('${bg}') center/cover; padding: 45px 30px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                <span class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'badge', this.innerText)" style="display:inline-block;padding:3px 14px;background:#7c3aed;color:#fff;border-radius:20px;font-size:0.75rem;font-weight:700;margin-bottom:12px;">
                    ${c.badge || 'ALPHA 0.1 • EM PRODUÇÃO'}
                </span>
                <h1 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'title', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#fff;font-size:2.5rem;margin:8px 0;letter-spacing:2px;">
                    ${c.title || activeEditorGame.title}
                </h1>
                <p class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'tagline', this.innerText)" style="font-size:1.1rem;color:#cbd5e1;max-width:650px;margin:0 auto 20px auto;line-height:1.6;">
                    ${c.tagline || activeEditorGame.tagline || 'Digite o slogan marcante do seu jogo...'}
                </p>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <span class="btn-spotlight-play" style="pointer-events:none;">${c.btn_primary || 'Jogar Demo Web'}</span>
                    <button type="button" onclick="promptChangeBgImage(${index})" class="btn-canva-tool" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);">
                        <i class="fas fa-image"></i> Trocar Imagem de Fundo
                    </button>
                </div>
            </div>
        `;
    } else if (type === 'synopsis') {
        contentHtml = `
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:26px;">
                <h3 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'heading', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#c084fc;margin:0 0 12px 0;">
                    ${c.heading || 'A História do Jogo'}
                </h3>
                <p class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'text', this.innerText)" style="font-size:0.95rem;color:#e2e8f0;line-height:1.7;margin-bottom:14px;">
                    ${c.text || 'Clique aqui para escrever a narrativa e os desafios do mundo.'}
                </p>
                ${c.quote ? `
                    <blockquote class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'quote', this.innerText)" style="margin:0;padding-left:14px;border-left:3px solid #06b6d4;font-style:italic;color:#a5f3fc;">
                        ${c.quote}
                    </blockquote>
                ` : ''}
            </div>
        `;
    } else if (type === 'features') {
        const items = Array.isArray(c.items) ? c.items : [];
        contentHtml = `
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'heading', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#06b6d4;margin:0;">
                        ${c.heading || 'Destaques e Mecânicas'}
                    </h3>
                    <button type="button" onclick="addFeatureCard(${index})" class="btn-canva-tool">
                        <i class="fas fa-plus"></i> Adicionar Cartão
                    </button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;">
                    ${items.map((it, itIdx) => `
                        <div style="background:#130624;border:1px solid rgba(168,85,247,0.3);border-radius:8px;padding:14px;position:relative;">
                            <button type="button" onclick="removeFeatureCard(${index}, ${itIdx})" style="position:absolute;top:8px;right:8px;background:none;border:none;color:#f87171;cursor:pointer;" title="Remover"><i class="fas fa-times"></i></button>
                            <h4 class="editable-canva-text" contenteditable="true" onblur="updateFeatureCard(${index}, ${itIdx}, 'title', this.innerText)" style="color:#06b6d4;margin:0 0 6px 0;font-size:0.95rem;">
                                ${it.title || 'Título do Recurso'}
                            </h4>
                            <p class="editable-canva-text" contenteditable="true" onblur="updateFeatureCard(${index}, ${itIdx}, 'desc', this.innerText)" style="font-size:0.85rem;color:#cbd5e1;margin:0;line-height:1.5;">
                                ${it.desc || 'Descreva este recurso...'}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (type === 'playable_demo') {
        contentHtml = `
            <div style="background:#0d041c;border:1px solid #10b981;border-radius:12px;padding:24px;text-align:center;">
                <h3 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'heading', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#10b981;margin:0 0 10px 0;">
                    ${c.heading || 'Jogue o Protótipo no Navegador'}
                </h3>
                <p class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'instructions', this.innerText)" style="font-size:0.85rem;color:#cbd5e1;margin-bottom:16px;">
                    ${c.instructions || 'Controles: WASD para andar, Espaço para pular.'}
                </p>
                <div style="background:#000;border:1px dashed #10b981;padding:24px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
                    <i class="fas fa-gamepad" style="font-size:3rem;color:#10b981;"></i>
                    <span style="font-size:0.85rem;color:#aaa;">Link do Iframe (WebGL / Itch.io):</span>
                    <input type="text" value="${c.embed_url || ''}" placeholder="https://itch.io/embed-upload/..." onchange="updateCanvaContent(${index}, 'embed_url', this.value)" style="width:100%;max-width:480px;background:#16092b;border:1px solid rgba(255,255,255,0.2);padding:8px 12px;border-radius:6px;color:#fff;text-align:center;">
                </div>
            </div>
        `;
    } else if (type === 'roadmap') {
        const steps = Array.isArray(c.steps) ? c.steps : [];
        contentHtml = `
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'heading', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#f59e0b;margin:0;">
                        ${c.heading || 'Status do Desenvolvimento'}
                    </h3>
                    <button type="button" onclick="addRoadmapStep(${index})" class="btn-canva-tool">
                        <i class="fas fa-plus"></i> Adicionar Etapa
                    </button>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                    ${steps.map((st, stIdx) => `
                        <div style="display:flex;justify-content:space-between;align-items:center;background:#140826;padding:10px 14px;border-radius:8px;border-left:4px solid ${st.status === 'concluido' ? '#10b981' : (st.status === 'em_progresso' ? '#f59e0b' : '#6b7280')};">
                            <span class="editable-canva-text" contenteditable="true" onblur="updateRoadmapStepText(${index}, ${stIdx}, this.innerText)" style="color:#fff;font-size:0.9rem;">
                                ${st.phase}
                            </span>
                            <div style="display:flex;gap:10px;align-items:center;">
                                <button type="button" onclick="toggleRoadmapStatus(${index}, ${stIdx})" style="background:${st.status === 'concluido' ? '#10b981' : (st.status === 'em_progresso' ? '#f59e0b' : '#374151')};border:none;color:#fff;padding:4px 10px;border-radius:4px;font-size:0.75rem;cursor:pointer;font-weight:700;text-transform:uppercase;" title="Clique para alternar status">
                                    ${st.status.replace('_', ' ')}
                                </button>
                                <button type="button" onclick="removeRoadmapStep(${index}, ${stIdx})" style="background:none;border:none;color:#f87171;cursor:pointer;" title="Remover"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (type === 'gallery') {
        const images = Array.isArray(c.images) ? c.images : [];
        contentHtml = `
            <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <h3 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'heading', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#a855f7;margin:0;">
                        ${c.heading || 'Galeria de Artes e Screenshots'}
                    </h3>
                    <button type="button" onclick="addImageToGallery(${index})" class="btn-canva-tool">
                        <i class="fas fa-plus"></i> Adicionar Foto
                    </button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:14px;">
                    ${images.map((img, imgIdx) => `
                        <div style="position:relative;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.15);">
                            <img src="${img.url}" style="width:100%;height:140px;object-fit:cover;display:block;">
                            <button type="button" onclick="removeGalleryImage(${index}, ${imgIdx})" style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.7);border:none;color:#f87171;border-radius:50%;width:26px;height:26px;cursor:pointer;"><i class="fas fa-trash"></i></button>
                            <div class="editable-canva-text" contenteditable="true" onblur="updateGalleryCaption(${index}, ${imgIdx}, this.innerText)" style="padding:6px;font-size:0.75rem;background:#16092b;color:#cbd5e1;text-align:center;">
                                ${img.caption || 'Sem legenda'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (type === 'downloads') {
        contentHtml = `
            <div style="background:#0b1329;border:1px solid #3b82f6;border-radius:12px;padding:24px;text-align:center;">
                <h3 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'heading', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#3b82f6;margin:0 0 16px 0;">
                    ${c.heading || 'Onde Encontrar e Jogar'}
                </h3>
                <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
                    <a href="${c.steam_url || '#'}" target="_blank" class="btn-spotlight-play" style="text-decoration:none;"><i class="fab fa-steam"></i> Steam Wishlist</a>
                    <a href="${c.itch_url || '#'}" target="_blank" class="btn-spotlight-details" style="text-decoration:none;"><i class="fab fa-itch-io"></i> Itch.io</a>
                    <a href="${c.discord_url || '#'}" target="_blank" class="btn-canva-tool" style="background:#5865f2;color:#fff;padding:10px 18px;text-decoration:none;"><i class="fab fa-discord"></i> Discord</a>
                </div>
            </div>
        `;
    }

    return `
        <div class="canva-block-wrapper" id="canva-block-${index}">
            <div class="canva-floating-bar">
                <span draggable="true" ondragstart="handleExistingBlockDragStart(event, ${index})" style="cursor:grab;font-size:0.8rem;color:#fff;margin-right:4px;" title="Arraste para mover de posição">
                    <i class="fas fa-grip-vertical"></i>
                </span>
                <span style="font-size:0.75rem;color:${templateInfo.color};font-weight:700;text-transform:uppercase;">${templateInfo.name || type}</span>
                ${index > 0 ? `<button type="button" class="canva-bar-btn" onclick="moveVisualBlock(${index}, -1)" title="Subir"><i class="fas fa-chevron-up"></i></button>` : ''}
                ${index < activeEditorBlocks.length - 1 ? `<button type="button" class="canva-bar-btn" onclick="moveVisualBlock(${index}, 1)" title="Descer"><i class="fas fa-chevron-down"></i></button>` : ''}
                <button type="button" class="canva-bar-btn delete" onclick="removeVisualBlock(${index})" title="Excluir"><i class="fas fa-trash"></i></button>
            </div>
            ${contentHtml}
        </div>
    `;
}

// ============================================================
// ATUALIZAÇÃO VISUAL EM TEMPO REAL
// ============================================================

window.updateCanvaContent = function(blockIndex, field, value) {
    if (!activeEditorBlocks[blockIndex]) return;
    activeEditorBlocks[blockIndex].content = activeEditorBlocks[blockIndex].content || {};
    activeEditorBlocks[blockIndex].content[field] = value.trim();
};

window.promptChangeBgImage = function(index) {
    const current = activeEditorBlocks[index].content.bg_image || '';
    const newUrl = prompt('Insira o link da imagem de fundo (ou use imagens/unique_soul_cenario.png):', current);
    if (newUrl !== null) {
        activeEditorBlocks[index].content.bg_image = newUrl.trim();
        renderCanvaStudio();
    }
};

window.moveVisualBlock = function(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= activeEditorBlocks.length) return;
    const temp = activeEditorBlocks[index];
    activeEditorBlocks[index] = activeEditorBlocks[target];
    activeEditorBlocks[target] = temp;
    renderCanvaStudio();
};

window.removeVisualBlock = function(index) {
    if (confirm('Deseja excluir este elemento da página?')) {
        activeEditorBlocks.splice(index, 1);
        renderCanvaStudio();
    }
};

window.addFeatureCard = function(index) {
    const items = activeEditorBlocks[index].content.items || [];
    items.push({ title: 'Novo Destaque', desc: 'Explique a mecânica ou diferencial do jogo.' });
    activeEditorBlocks[index].content.items = items;
    renderCanvaStudio();
};

window.updateFeatureCard = function(blockIndex, cardIndex, field, value) {
    activeEditorBlocks[blockIndex].content.items[cardIndex][field] = value.trim();
};

window.removeFeatureCard = function(blockIndex, cardIndex) {
    activeEditorBlocks[blockIndex].content.items.splice(cardIndex, 1);
    renderCanvaStudio();
};

window.addRoadmapStep = function(index) {
    const steps = activeEditorBlocks[index].content.steps || [];
    steps.push({ phase: 'Nova Fase de Produção', status: 'pendente' });
    activeEditorBlocks[index].content.steps = steps;
    renderCanvaStudio();
};

window.updateRoadmapStepText = function(blockIndex, stepIndex, value) {
    activeEditorBlocks[blockIndex].content.steps[stepIndex].phase = value.trim();
};

window.toggleRoadmapStatus = function(blockIndex, stepIndex) {
    const current = activeEditorBlocks[blockIndex].content.steps[stepIndex].status;
    const nextStatus = current === 'concluido' ? 'em_progresso' : (current === 'em_progresso' ? 'pendente' : 'concluido');
    activeEditorBlocks[blockIndex].content.steps[stepIndex].status = nextStatus;
    renderCanvaStudio();
};

window.removeRoadmapStep = function(blockIndex, stepIndex) {
    activeEditorBlocks[blockIndex].content.steps.splice(stepIndex, 1);
    renderCanvaStudio();
};

window.addImageToGallery = function(index) {
    const url = prompt('Insira o link da imagem:', 'imagens/unique_soul_capa.png');
    if (!url) return;
    const images = activeEditorBlocks[index].content.images || [];
    images.push({ url: url.trim(), caption: 'Nova Arte' });
    activeEditorBlocks[index].content.images = images;
    renderCanvaStudio();
};

window.updateGalleryCaption = function(blockIndex, imgIndex, value) {
    activeEditorBlocks[blockIndex].content.images[imgIndex].caption = value.trim();
};

window.removeGalleryImage = function(blockIndex, imgIndex) {
    activeEditorBlocks[blockIndex].content.images.splice(imgIndex, 1);
    renderCanvaStudio();
};

// Salvar no Banco Turso
window.saveGameBlocksVisual = async function() {
    if (!activeEditorGame || !window.ApiClient) return;
    try {
        await window.ApiClient.saveGameBlocks(activeEditorGame.id, activeEditorBlocks);
        alert(`🎉 Página de "${activeEditorGame.title}" salva com sucesso no Turso! Já está disponível ao vivo.`);
    } catch (err) {
        alert('Erro ao salvar página: ' + err.message);
    }
};

// ============================================================
// CADASTRO DE NOVO JOGO (MODAL)
// ============================================================

window.openNewGameModal = function() {
    const modal = document.getElementById('cmsNewGameModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }
};

window.closeNewGameModal = function() {
    const modal = document.getElementById('cmsNewGameModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
};

window.generateSlug = function(title) {
    const slugInput = document.getElementById('newGameSlug');
    if (slugInput) {
        slugInput.value = title.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
};

window.submitNewGame = async function(e) {
    e.preventDefault();
    const title = document.getElementById('newGameTitle').value.trim();
    const slug = document.getElementById('newGameSlug').value.trim();
    const genre = document.getElementById('newGameGenre').value.trim();
    const status = document.getElementById('newGameStatus').value;
    const tagline = document.getElementById('newGameTagline').value.trim();
    const submitBtn = document.getElementById('newGameSubmitBtn');

    if (!title || !slug) {
        alert('Título e Slug são obrigatórios!');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'CRIANDO...';

    try {
        if (!window.ApiClient) throw new Error('Servidor indisponível.');
        await window.ApiClient.createGame({
            title,
            slug,
            genre: genre || 'Indie Game',
            status,
            tagline,
            cover_image: 'imagens/unique_soul_capa.png',
            banner_image: 'imagens/unique_soul_cenario.png'
        });

        alert(`🎮 Jogo "${title}" criado com sucesso!`);
        closeNewGameModal();
        document.getElementById('newGameForm').reset();
        await loadCmsGames();
        loadGameBlocksForEditor(slug);
    } catch (err) {
        alert('Erro ao criar jogo: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Criar Jogo';
    }
};

// ============================================================
// FEEDBACKS & RELATÓRIOS DE PLAYTEST
// ============================================================

window.loadCmsFeedbacks = async function() {
    const container = document.getElementById('cmsFeedbacksListContainer');
    if (!container || !window.ApiClient) return;

    container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--cyan);"><i class="fas fa-spinner fa-spin"></i> Carregando feedbacks...</div>';

    try {
        const feedbacks = await window.ApiClient.getFeedbacks();
        if (!feedbacks || feedbacks.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);">
                    <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:10px;display:block;"></i>
                    Nenhum feedback recebido ainda. Quando os jogadores testarem os protótipos e enviarem mensagens pelo site, elas aparecerão aqui!
                </div>
            `;
            return;
        }

        container.innerHTML = feedbacks.map(f => `
            <div style="background:rgba(255,255,255,0.03);border:1px solid ${f.type === 'bug' ? '#ef4444' : '#7c3aed'};border-radius:10px;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div>
                        <strong style="color:#fff;font-size:0.95rem;">${f.player_name || 'Anônimo'}</strong>
                        <span style="font-size:0.75rem;padding:2px 8px;border-radius:4px;margin-left:8px;background:${f.type === 'bug' ? '#ef4444' : '#06b6d4'};color:#fff;">
                            ${(f.type || 'opiniao').toUpperCase()}
                        </span>
                        ${f.game_title ? `<span style="font-size:0.8rem;color:#c084fc;margin-left:8px;">Jogo: ${f.game_title}</span>` : ''}
                    </div>
                    <div style="display:flex;gap:10px;align-items:center;">
                        <span style="font-size:0.75rem;color:rgba(255,255,255,0.4);">${new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                        <button type="button" onclick="deleteFeedbackItem(${f.id})" style="background:none;border:none;color:#f87171;cursor:pointer;" title="Excluir"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <p style="margin:0;font-size:0.9rem;color:#cbd5e1;line-height:1.5;">${f.message}</p>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div style="color:#f87171;padding:16px;">Erro ao buscar feedbacks: ${err.message}</div>`;
    }
};

window.deleteFeedbackItem = async function(id) {
    if (!confirm('Deseja excluir este feedback?')) return;
    try {
        await window.ApiClient.deleteFeedback(id);
        loadCmsFeedbacks();
    } catch (err) {
        alert('Erro ao excluir feedback: ' + err.message);
    }
};
