/**
 * cms-manager.js
 * Construtor Visual de Páginas de Jogos estilo Canva + Gerenciamento de Feed e Feedbacks.
 */

let activeEditorGame = null;
let activeEditorBlocks = [];

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
// CONSTRUTOR VISUAL DE PÁGINAS DE JOGOS (ESTILO CANVA)
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

        // Se ainda não tiver nenhum selecionado, seleciona o primeiro por padrão
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
        if (container) container.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.6);">Selecione um jogo para abrir o editor visual.</div>';
        return;
    }

    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--cyan);"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;">Abrindo tela de design...</p></div>';

    try {
        const game = await window.ApiClient.getGameBySlug(gameSlug);
        activeEditorGame = game;
        activeEditorBlocks = (game.blocks && game.blocks.length > 0) ? game.blocks : getDefaultBlocksForGame(game);
        renderVisualCanvaUI();
    } catch (err) {
        container.innerHTML = `<div style="color:#f87171;padding:20px;text-align:center;">Erro ao carregar: ${err.message}</div>`;
    }
};

// Gera blocos iniciais padrão caso o jogo ainda não tenha nenhum
function getDefaultBlocksForGame(game) {
    return [
        {
            block_type: 'hero',
            content: {
                title: game.title || 'Novo Jogo',
                tagline: game.tagline || 'Uma nova experiência indie em desenvolvimento.',
                badge: 'Fase: ' + (game.status || 'Protótipo').toUpperCase(),
                bg_image: game.banner_image || 'imagens/unique_soul_cenario.png',
                btn_primary: 'Jogar Demo',
                btn_secondary: 'Ver Detalhes'
            }
        },
        {
            block_type: 'synopsis',
            content: {
                heading: 'Sobre o Universo do Jogo',
                text: 'Descreva aqui a história, o objetivo do jogador e o clima do jogo. Clique diretamente no texto para editar.',
                quote: '"Cada detalhe foi criado com paixão pela nossa equipe."'
            }
        },
        {
            block_type: 'features',
            content: {
                heading: 'Destaques e Mecânicas',
                items: [
                    { title: 'Gameplay Autoral', desc: 'Mecânicas dinâmicas com feedback visual e sonoro marcante.' },
                    { title: 'Arte Feita à Mão', desc: 'Identidade visual única com cenários atmosféricos.' },
                    { title: 'Trilha Sonora Original', desc: 'Músicas imersivas criadas exclusivamente para o projeto.' }
                ]
            }
        },
        {
            block_type: 'roadmap',
            content: {
                heading: 'Linha do Tempo de Produção',
                steps: [
                    { phase: 'Conceito & Mecânicas', status: 'concluido' },
                    { phase: 'Alpha 0.1 Jogável', status: 'em_progresso' },
                    { phase: 'Demo Pública no Itch.io', status: 'pendente' },
                    { phase: 'Lançamento Final', status: 'futuro' }
                ]
            }
        }
    ];
}

// Renderiza a interface VISUAL estilo Canva (WYSIWYG)
function renderVisualCanvaUI() {
    const container = document.getElementById('cmsGameBlocksEditorContainer');
    if (!container || !activeEditorGame) return;

    container.innerHTML = `
        <!-- BARRA SUPERIOR CANVA: PALETA DE BLOCOS E AÇÕES -->
        <div class="canva-editor-topbar" style="background:#16092b;border:1px solid #7c3aed;border-radius:12px;padding:16px 20px;margin-bottom:20px;box-shadow:0 0 25px rgba(124,58,237,0.25);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:14px;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;">
                        <i class="fas fa-paint-brush"></i>
                    </div>
                    <div>
                        <h4 style="font-family:'Orbitron',sans-serif;color:#fff;margin:0;font-size:1.15rem;">
                            Designer Visual: <span style="color:#06b6d4;">${activeEditorGame.title}</span>
                        </h4>
                        <span style="font-size:0.8rem;color:rgba(255,255,255,0.6);">Clique diretamente nos textos para editar como no Canva!</span>
                    </div>
                </div>

                <div style="display:flex;gap:10px;align-items:center;">
                    <a href="jogo.html?game=${activeEditorGame.slug}" target="_blank" class="btn-spotlight-details" style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;" title="Ver como o público vê">
                        <i class="fas fa-eye"></i> Ver no Site
                    </a>
                    <button type="button" class="btn-spotlight-play" onclick="saveGameBlocksVisual()" style="display:inline-flex;align-items:center;gap:8px;box-shadow:0 0 15px rgba(6,182,212,0.4);">
                        <i class="fas fa-save"></i> SALVAR PÁGINA
                    </button>
                </div>
            </div>

            <!-- PALETA DE ADICIONAR ELEMENTOS (ESTILO FERRAMENTAS DO CANVA) -->
            <div>
                <span style="display:block;font-size:0.75rem;color:#c084fc;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                    <i class="fas fa-plus-circle"></i> Adicionar Novos Elementos à Página:
                </span>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" onclick="addVisualBlock('hero')" class="btn-canva-tool">
                        <i class="fas fa-heading"></i> + Capa Hero
                    </button>
                    <button type="button" onclick="addVisualBlock('synopsis')" class="btn-canva-tool">
                        <i class="fas fa-align-left"></i> + História / Sinopse
                    </button>
                    <button type="button" onclick="addVisualBlock('features')" class="btn-canva-tool">
                        <i class="fas fa-th-large"></i> + Cartões de Destaque
                    </button>
                    <button type="button" onclick="addVisualBlock('playable_demo')" class="btn-canva-tool">
                        <i class="fas fa-play-circle"></i> + Demo Jogável (Iframe)
                    </button>
                    <button type="button" onclick="addVisualBlock('gallery')" class="btn-canva-tool">
                        <i class="fas fa-images"></i> + Galeria de Fotos
                    </button>
                    <button type="button" onclick="addVisualBlock('roadmap')" class="btn-canva-tool">
                        <i class="fas fa-stream"></i> + Linha do Tempo (Roadmap)
                    </button>
                </div>
            </div>
        </div>

        <!-- ÁREA CENTRAL DO CANVA (O PALCO VISUAL ONDE O JOGO APARECE) -->
        <div class="canva-visual-stage" style="background:#090212;border:2px dashed rgba(168,85,247,0.3);border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:20px;min-height:500px;">
            ${activeEditorBlocks.map((block, index) => renderSingleVisualBlock(block, index)).join('')}
        </div>
    `;

    // Estilos dinâmicos do Canva
    if (!document.getElementById('canvaToolStyles')) {
        const style = document.createElement('style');
        style.id = 'canvaToolStyles';
        style.textContent = `
            .btn-canva-tool {
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.15);
                color: #e2e8f0;
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 0.82rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            .btn-canva-tool:hover {
                background: #7c3aed;
                border-color: #a855f7;
                color: #fff;
                transform: translateY(-1px);
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
                padding: 4px 10px;
                display: flex;
                gap: 8px;
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
            .canva-bar-btn {
                background: none;
                border: none;
                color: #aaa;
                cursor: pointer;
                font-size: 0.85rem;
                padding: 2px 4px;
            }
            .canva-bar-btn:hover {
                color: #06b6d4;
            }
            .canva-bar-btn.delete:hover {
                color: #f87171;
            }
            .editable-canva-text {
                outline: none;
                border-radius: 4px;
                padding: 2px 4px;
                transition: background 0.2s;
            }
            .editable-canva-text:hover {
                background: rgba(255,255,255,0.06);
            }
            .editable-canva-text:focus {
                background: rgba(6,182,212,0.15);
                box-shadow: 0 0 0 1px #06b6d4;
            }
        `;
        document.head.appendChild(style);
    }
}

// Renderiza cada tipo de bloco com o visual real
function renderSingleVisualBlock(block, index) {
    const c = block.content || {};
    const type = block.block_type;

    let contentHtml = '';

    if (type === 'hero') {
        const bg = c.bg_image || 'imagens/unique_soul_cenario.png';
        contentHtml = `
            <div style="background: linear-gradient(rgba(9,2,18,0.7), rgba(9,2,18,0.9)), url('${bg}') center/cover; padding: 40px 30px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                <span class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'badge', this.innerText)" style="display:inline-block;padding:3px 12px;background:#7c3aed;color:#fff;border-radius:20px;font-size:0.75rem;font-weight:700;margin-bottom:12px;">
                    ${c.badge || 'PROTÓTIPO JOGÁVEL'}
                </span>
                <h1 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'title', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#fff;font-size:2.4rem;margin:8px 0;letter-spacing:2px;">
                    ${c.title || activeEditorGame.title}
                </h1>
                <p class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'tagline', this.innerText)" style="font-size:1.1rem;color:#cbd5e1;max-width:650px;margin:0 auto 20px auto;line-height:1.6;">
                    ${c.tagline || activeEditorGame.tagline || 'Digite o slogan marcante do seu jogo aqui...'}
                </p>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
                    <span class="btn-spotlight-play" style="pointer-events:none;">${c.btn_primary || 'Jogar Agora'}</span>
                    <button type="button" onclick="promptChangeBgImage(${index})" class="btn-canva-tool" style="background:rgba(0,0,0,0.6);">
                        <i class="fas fa-image"></i> Trocar Imagem de Fundo
                    </button>
                </div>
            </div>
        `;
    } else if (type === 'synopsis') {
        contentHtml = `
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:24px;">
                <h3 class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'heading', this.innerText)" style="font-family:'Orbitron',sans-serif;color:#c084fc;margin:0 0 12px 0;">
                    ${c.heading || 'Sobre a História'}
                </h3>
                <p class="editable-canva-text" contenteditable="true" onblur="updateCanvaContent(${index}, 'text', this.innerText)" style="font-size:0.95rem;color:#e2e8f0;line-height:1.7;margin-bottom:14px;">
                    ${c.text || 'Clique aqui para escrever a sinopse do jogo, a ambientação e os desafios que o jogador enfrentará.'}
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
                    ${c.instructions || 'Controles: Teclas WASD para andar, Espaço para pular.'}
                </p>
                <div style="background:#000;border:1px dashed #10b981;height:240px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;">
                    <i class="fas fa-gamepad" style="font-size:3rem;color:#10b981;"></i>
                    <span style="font-size:0.85rem;color:#aaa;">Link do Iframe / Jogo WebGL:</span>
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
    }

    return `
        <div class="canva-block-wrapper" id="canva-block-${index}">
            <div class="canva-floating-bar">
                <span style="font-size:0.75rem;color:#06b6d4;font-weight:700;text-transform:uppercase;">${type}</span>
                ${index > 0 ? `<button type="button" class="canva-bar-btn" onclick="moveVisualBlock(${index}, -1)" title="Subir"><i class="fas fa-chevron-up"></i></button>` : ''}
                ${index < activeEditorBlocks.length - 1 ? `<button type="button" class="canva-bar-btn" onclick="moveVisualBlock(${index}, 1)" title="Descer"><i class="fas fa-chevron-down"></i></button>` : ''}
                <button type="button" class="canva-bar-btn delete" onclick="removeVisualBlock(${index})" title="Excluir"><i class="fas fa-trash"></i></button>
            </div>
            ${contentHtml}
        </div>
    `;
}

// Manipulação do Canva em Tempo Real
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
        renderVisualCanvaUI();
    }
};

window.moveVisualBlock = function(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= activeEditorBlocks.length) return;
    const temp = activeEditorBlocks[index];
    activeEditorBlocks[index] = activeEditorBlocks[target];
    activeEditorBlocks[target] = temp;
    renderVisualCanvaUI();
};

window.removeVisualBlock = function(index) {
    if (confirm('Deseja excluir este elemento da página?')) {
        activeEditorBlocks.splice(index, 1);
        renderVisualCanvaUI();
    }
};

window.addVisualBlock = function(type) {
    let newContent = {};
    if (type === 'hero') {
        newContent = { title: activeEditorGame.title, tagline: 'Nova frase de efeito', badge: 'DESTAQUE', btn_primary: 'Jogar Demo' };
    } else if (type === 'synopsis') {
        newContent = { heading: 'Sinopse', text: 'Escreva a descrição...', quote: 'Citação em destaque' };
    } else if (type === 'features') {
        newContent = { heading: 'Destaques', items: [{ title: 'Novo Recurso', desc: 'Detalhes da mecânica' }] };
    } else if (type === 'playable_demo') {
        newContent = { heading: 'Demo Jogável', embed_url: '', instructions: 'Controles: WASD' };
    } else if (type === 'roadmap') {
        newContent = { heading: 'Roadmap', steps: [{ phase: 'Nova Etapa', status: 'em_progresso' }] };
    } else if (type === 'gallery') {
        newContent = { heading: 'Galeria', images: [{ url: 'imagens/unique_soul_cenario.png', caption: 'Arte Conceitual' }] };
    }

    activeEditorBlocks.push({
        block_type: type,
        content: newContent,
        order_index: activeEditorBlocks.length + 1
    });

    renderVisualCanvaUI();
};

window.addFeatureCard = function(index) {
    const items = activeEditorBlocks[index].content.items || [];
    items.push({ title: 'Novo Destaque', desc: 'Explique a mecânica ou diferencial do jogo.' });
    activeEditorBlocks[index].content.items = items;
    renderVisualCanvaUI();
};

window.updateFeatureCard = function(blockIndex, cardIndex, field, value) {
    activeEditorBlocks[blockIndex].content.items[cardIndex][field] = value.trim();
};

window.removeFeatureCard = function(blockIndex, cardIndex) {
    activeEditorBlocks[blockIndex].content.items.splice(cardIndex, 1);
    renderVisualCanvaUI();
};

window.addRoadmapStep = function(index) {
    const steps = activeEditorBlocks[index].content.steps || [];
    steps.push({ phase: 'Nova Fase de Produção', status: 'pendente' });
    activeEditorBlocks[index].content.steps = steps;
    renderVisualCanvaUI();
};

window.updateRoadmapStepText = function(blockIndex, stepIndex, value) {
    activeEditorBlocks[blockIndex].content.steps[stepIndex].phase = value.trim();
};

window.toggleRoadmapStatus = function(blockIndex, stepIndex) {
    const current = activeEditorBlocks[blockIndex].content.steps[stepIndex].status;
    const nextStatus = current === 'concluido' ? 'em_progresso' : (current === 'em_progresso' ? 'pendente' : 'concluido');
    activeEditorBlocks[blockIndex].content.steps[stepIndex].status = nextStatus;
    renderVisualCanvaUI();
};

window.removeRoadmapStep = function(blockIndex, stepIndex) {
    activeEditorBlocks[blockIndex].content.steps.splice(stepIndex, 1);
    renderVisualCanvaUI();
};

window.addImageToGallery = function(index) {
    const url = prompt('Insira o link da imagem:', 'imagens/unique_soul_capa.png');
    if (!url) return;
    const images = activeEditorBlocks[index].content.images || [];
    images.push({ url: url.trim(), caption: 'Nova Arte' });
    activeEditorBlocks[index].content.images = images;
    renderVisualCanvaUI();
};

window.updateGalleryCaption = function(blockIndex, imgIndex, value) {
    activeEditorBlocks[blockIndex].content.images[imgIndex].caption = value.trim();
};

window.removeGalleryImage = function(blockIndex, imgIndex) {
    activeEditorBlocks[blockIndex].content.images.splice(imgIndex, 1);
    renderVisualCanvaUI();
};

// Salvar no Banco Turso
window.saveGameBlocksVisual = async function() {
    if (!activeEditorGame || !window.ApiClient) return;
    try {
        await window.ApiClient.saveGameBlocks(activeEditorGame.id, activeEditorBlocks);
        alert(`🎉 Página de "${activeEditorGame.title}" salva com sucesso! As alterações já estão ao vivo no site.`);
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
