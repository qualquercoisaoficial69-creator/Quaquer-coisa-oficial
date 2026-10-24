/**
 * cms-manager.js
 * Gerenciador completo para o Painel CMS:
 * 1. Alternância de Seções (Posts Instagram / Blocos de Jogos / Feedbacks)
 * 2. Construtor de Páginas Customizáveis por Blocos
 * 3. Gerenciamento de Feedbacks de Playtest
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

// --- GERENCIADOR DE JOGOS & BLOCOS MODULARES ---

async function loadCmsGames() {
    const selector = document.getElementById('cmsGameSelector');
    if (!selector || !window.ApiClient) return;

    try {
        const games = await window.ApiClient.getGames();
        selector.innerHTML = '<option value="">-- Selecione um Jogo --</option>' + 
            games.map(g => `<option value="${g.slug}">${g.title} (${g.status.toUpperCase()})</option>`).join('');

        if (games.length > 0 && !selector.value) {
            selector.value = games[0].slug;
            loadGameBlocksForEditor(games[0].slug);
        }
    } catch (err) {
        console.error('Erro ao carregar jogos:', err);
    }
}

window.loadGameBlocksForEditor = async function(gameSlug) {
    const container = document.getElementById('cmsGameBlocksEditorContainer');
    if (!gameSlug || !container || !window.ApiClient) {
        if (container) container.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.6);">Selecione um jogo para editar seus blocos.</div>';
        return;
    }

    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--cyan);"><i class="fas fa-spinner fa-spin"></i> Carregando blocos da página...</div>';

    try {
        const game = await window.ApiClient.getGameBySlug(gameSlug);
        activeEditorGame = game;
        activeEditorBlocks = game.blocks || [];
        renderBlocksEditorUI();
    } catch (err) {
        container.innerHTML = `<div style="color:#f87171;padding:20px;">Erro ao carregar blocos: ${err.message}</div>`;
    }
};

function renderBlocksEditorUI() {
    const container = document.getElementById('cmsGameBlocksEditorContainer');
    if (!container || !activeEditorGame) return;

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
            <div>
                <h4 style="font-family:'Orbitron',sans-serif;color:#a855f7;margin:0 0 4px 0;">Editando: ${activeEditorGame.title}</h4>
                <span style="font-size:0.85rem;color:rgba(255,255,255,0.6);">Slug: <code>/jogos/${activeEditorGame.slug}</code> • Status: <strong>${activeEditorGame.status}</strong></span>
            </div>
            <div style="display:flex;gap:10px;">
                <button type="button" class="btn-spotlight-details" onclick="addNewBlockPrompt()" style="display:inline-flex;align-items:center;gap:6px;">
                    <i class="fas fa-plus"></i> Adicionar Bloco
                </button>
                <button type="button" class="btn-spotlight-play" onclick="saveGameBlocksEditor()" style="display:inline-flex;align-items:center;gap:6px;">
                    <i class="fas fa-save"></i> Salvar Página
                </button>
            </div>
        </div>

        <div id="blocksList" style="display:flex;flex-direction:column;gap:14px;">
            ${activeEditorBlocks.map((b, idx) => `
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:16px;position:relative;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <span style="font-weight:700;color:#06b6d4;font-size:0.9rem;text-transform:uppercase;">
                            <i class="fas fa-cube"></i> Bloco #${idx + 1}: ${b.block_type}
                        </span>
                        <div style="display:flex;gap:8px;">
                            ${idx > 0 ? `<button type="button" onclick="moveBlock(${idx}, -1)" style="background:none;border:none;color:#aaa;cursor:pointer;"><i class="fas fa-arrow-up"></i></button>` : ''}
                            ${idx < activeEditorBlocks.length - 1 ? `<button type="button" onclick="moveBlock(${idx}, 1)" style="background:none;border:none;color:#aaa;cursor:pointer;"><i class="fas fa-arrow-down"></i></button>` : ''}
                            <button type="button" onclick="removeBlock(${idx})" style="background:none;border:none;color:#f87171;cursor:pointer;"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div>
                        <label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:4px;">Conteúdo JSON do Bloco:</label>
                        <textarea onchange="updateBlockContent(${idx}, this.value)" rows="4" style="width:100%;box-sizing:border-box;background:#090212;border:1px solid rgba(255,255,255,0.15);padding:10px;border-radius:6px;color:#a5f3fc;font-family:monospace;font-size:0.85rem;resize:vertical;">${JSON.stringify(b.content, null, 2)}</textarea>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.moveBlock = function(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= activeEditorBlocks.length) return;
    const temp = activeEditorBlocks[index];
    activeEditorBlocks[index] = activeEditorBlocks[target];
    activeEditorBlocks[target] = temp;
    renderBlocksEditorUI();
};

window.removeBlock = function(index) {
    if (confirm('Deseja remover este bloco?')) {
        activeEditorBlocks.splice(index, 1);
        renderBlocksEditorUI();
    }
};

window.updateBlockContent = function(index, text) {
    try {
        activeEditorBlocks[index].content = JSON.parse(text);
    } catch (e) {
        alert('Atenção: O formato digitado não é um JSON válido.');
    }
};

window.addNewBlockPrompt = function() {
    const type = prompt('Escolha o tipo de bloco para adicionar:\n1 - hero\n2 - synopsis\n3 - gallery\n4 - features\n5 - roadmap\n6 - playable_demo', 'features');
    if (!type) return;

    const blockType = type.trim().toLowerCase();
    let defaultContent = {};

    if (blockType === 'features') {
        defaultContent = { heading: 'Destaques', items: [{ title: 'Nova Mecânica', desc: 'Descrição da mecânica' }] };
    } else if (blockType === 'roadmap') {
        defaultContent = { heading: 'Progresso', steps: [{ phase: 'Fase Inicial', status: 'concluido' }] };
    } else if (blockType === 'playable_demo') {
        defaultContent = { heading: 'Jogue a Demo', embed_url: 'https://itch.io/embed-upload/placeholder' };
    } else if (blockType === 'gallery') {
        defaultContent = { heading: 'Galeria', images: [{ url: 'imagens/unique_soul_cenario.png', caption: 'Arte Conceitual' }] };
    } else {
        defaultContent = { heading: 'Novo Bloco', text: 'Insira o texto deste bloco aqui.' };
    }

    activeEditorBlocks.push({
        block_type: blockType,
        content: defaultContent,
        order_index: activeEditorBlocks.length + 1
    });

    renderBlocksEditorUI();
};

window.saveGameBlocksEditor = async function() {
    if (!activeEditorGame || !window.ApiClient) return;
    try {
        await window.ApiClient.saveGameBlocks(activeEditorGame.id, activeEditorBlocks);
        alert('🎉 Página customizada do jogo salva com sucesso no banco de dados!');
    } catch (err) {
        alert('Erro ao salvar página: ' + err.message);
    }
};

// --- GERENCIADOR DE FEEDBACKS & BUGS ---

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
