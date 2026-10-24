// ============================================================
// CONECTOR CLIENTE & AUTENTICAÇÃO LOCAL (SUBSTITUTO DO FIREBASE)
// Conecta o frontend ao backend próprio em http://localhost:4000/api
// ============================================================

// E-mails e usuários com privilégios de criador/administrador
const AUTHORIZED_CREATOR_EMAILS = [
    'admin',
    'qualquercoisaoficial69@gmail.com',
    'brennofirminodejesus@gmail.com',
    'izam20027@gmail.com',
    'gtofrazatto@gmail.com'
];

// Modal customizado e elegante para Login Administrativo
function renderLoginModal() {
    if (document.getElementById('indieLoginModal')) return;

    const modal = document.createElement('div');
    modal.id = 'indieLoginModal';
    modal.className = 'cms-post-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(8,1,18,0.85);backdrop-filter:blur(10px);z-index:99999;display:none;align-items:center;justify-content:center;padding:1rem;';
    
    modal.innerHTML = `
        <div style="background:#16092b;border:1px solid #7c3aed;box-shadow:0 0 35px rgba(124,58,237,0.3);border-radius:14px;max-width:420px;width:100%;padding:2rem;color:#fff;font-family:'Open Sans',sans-serif;position:relative;">
            <button type="button" onclick="closeAdminLoginModal()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer;">&times;</button>
            <div style="text-align:center;margin-bottom:1.5rem;">
                <img src="imagens/Logo_colorida.png" alt="Logo" style="width:55px;margin-bottom:0.75rem;">
                <h3 style="font-family:'Orbitron',sans-serif;color:#a855f7;margin:0 0 0.25rem 0;">Acesso à Equipe</h3>
                <p style="font-size:0.85rem;color:#cbd5e1;margin:0;">Entre com suas credenciais para gerenciar o CMS e jogos.</p>
            </div>
            <form id="adminLoginForm" onsubmit="handleAdminLoginSubmit(event)">
                <div style="margin-bottom:1rem;">
                    <label style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:#c084fc;margin-bottom:0.35rem;">Usuário</label>
                    <input type="text" id="loginUsernameInput" value="admin" required style="width:100%;box-sizing:border-box;background:#0d0519;border:1px solid rgba(255,255,255,0.15);padding:0.75rem 1rem;border-radius:8px;color:#fff;font-size:0.95rem;outline:none;">
                </div>
                <div style="margin-bottom:1.5rem;">
                    <label style="display:block;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:#c084fc;margin-bottom:0.35rem;">Senha</label>
                    <input type="password" id="loginPasswordInput" value="admin123" required style="width:100%;box-sizing:border-box;background:#0d0519;border:1px solid rgba(255,255,255,0.15);padding:0.75rem 1rem;border-radius:8px;color:#fff;font-size:0.95rem;outline:none;">
                </div>
                <div id="loginErrorMessage" style="display:none;color:#f87171;font-size:0.85rem;margin-bottom:1rem;text-align:center;"></div>
                <button type="submit" id="loginSubmitBtn" style="width:100%;background:linear-gradient(135deg,#7c3aed,#06b6d4);border:none;padding:0.85rem;border-radius:8px;color:#fff;font-family:'Orbitron',sans-serif;font-weight:700;font-size:0.9rem;cursor:pointer;letter-spacing:1px;transition:0.2s;">
                    ENTRAR NO CMS
                </button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
}

window.openAdminLoginModal = function() {
    renderLoginModal();
    const modal = document.getElementById('indieLoginModal');
    if (modal) modal.style.display = 'flex';
};

window.closeAdminLoginModal = function() {
    const modal = document.getElementById('indieLoginModal');
    if (modal) modal.style.display = 'none';
};

window.handleAdminLoginSubmit = async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsernameInput').value.trim();
    const password = document.getElementById('loginPasswordInput').value.trim();
    const errBox = document.getElementById('loginErrorMessage');
    const btn = document.getElementById('loginSubmitBtn');

    errBox.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'AUTENTICANDO...';

    try {
        if (!window.ApiClient) {
            throw new Error('Cliente API não carregado.');
        }
        await window.ApiClient.login(username, password);
        closeAdminLoginModal();
        window.updateAuthUI();
        window.location.reload();
    } catch (err) {
        errBox.textContent = err.message || 'Falha ao conectar ao servidor.';
        errBox.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'ENTRAR NO CMS';
    }
};

// Aliases para compatibilidade total com o layout antigo
window.loginWithGoogle = function() {
    window.openAdminLoginModal();
    return Promise.resolve(null);
};

window.logoutUser = function() {
    if (window.ApiClient) {
        window.ApiClient.logout();
    } else {
        localStorage.removeItem('qcr_auth_token');
        localStorage.removeItem('qcr_user');
        window.location.reload();
    }
};

window.getCurrentUser = function() {
    if (!window.ApiClient) return null;
    const user = window.ApiClient.getUser();
    if (!user) return null;
    return {
        uid: user.id,
        name: user.username,
        displayName: user.username,
        email: user.username + '@qualquercoisa.com',
        role: user.role,
        photoURL: 'imagens/Logo_colorida.png'
    };
};

window.isUserCreator = function(user) {
    if (!window.ApiClient) return false;
    return window.ApiClient.isAuthenticated();
};

// Atualiza a barra de navegação com perfil ou botão de login
window.updateAuthUI = function(customUser) {
    const profileContainers = document.querySelectorAll('.topbar-profile-container');
    const u = customUser || window.getCurrentUser();

    profileContainers.forEach(container => {
        if (!u) {
            container.innerHTML = `
                <button type="button" class="btn-google-login" onclick="openAdminLoginModal()" aria-label="Entrar no CMS" style="background:linear-gradient(135deg,rgba(124,58,237,0.4),rgba(6,182,212,0.3));border:1px solid #a855f7;">
                    <i class="fas fa-lock" style="margin-right:6px;color:#06b6d4;"></i>
                    <span>Acesso Equipe</span>
                </button>
            `;
        } else {
            const firstName = u.name.split(' ')[0];
            const photo = u.photoURL || 'imagens/Logo_colorida.png';

            container.innerHTML = `
                <div class="user-profile-badge" onclick="toggleUserProfileDropdown(event)" style="cursor:pointer;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.08);padding:6px 14px;border-radius:20px;border:1px solid rgba(168,85,247,0.4);">
                    <img src="${photo}" alt="Foto" class="profile-avatar" style="width:26px;height:26px;border-radius:50%;">
                    <span class="profile-name" style="font-weight:600;font-size:0.9rem;color:#fff;">${firstName}</span>
                    <i class="fas fa-chevron-down profile-dropdown-arrow" style="font-size:0.75rem;color:#c084fc;"></i>
                </div>

                <div class="user-profile-dropdown" id="userProfileDropdown">
                    <div class="profile-dropdown-header">
                        <img src="${photo}" alt="Avatar" class="profile-dropdown-avatar">
                        <div class="profile-dropdown-user-info">
                            <strong>${u.name}</strong>
                            <small>${u.email}</small>
                            <span class="user-role-badge creator" style="background:#7c3aed;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.7rem;">
                                👑 Equipe do Estúdio
                            </span>
                        </div>
                    </div>
                    
                    <div class="profile-dropdown-menu">
                        <a href="cms.html" class="profile-dropdown-item creator-link">
                            <i class="fas fa-feather-alt"></i> Painel CMS
                        </a>
                        <button type="button" class="profile-dropdown-item logout-btn" onclick="logoutUser()">
                            <i class="fas fa-sign-out-alt"></i> Sair da Conta
                        </button>
                    </div>
                </div>
            `;
        }
    });

    // Controla visibilidade de botões exclusivos de criador
    const isCreator = window.isUserCreator(u);
    document.querySelectorAll('.creator-only, .creator-only-nav').forEach(el => {
        el.style.display = isCreator ? '' : 'none';
    });

    if (typeof window.verifyCmsAccess === 'function') {
        window.verifyCmsAccess();
    }

    if (typeof window.renderCmsCarousel === 'function') window.renderCmsCarousel();
};

window.toggleUserProfileDropdown = function(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('userProfileDropdown');
    if (dropdown) dropdown.classList.toggle('active');
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.topbar-profile-container')) {
        const dropdown = document.getElementById('userProfileDropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});

// ============================================================
// ADAPTADORES DA API DE PUBLICAÇÕES (SUBSTITUINDO FIRESTORE)
// ============================================================
window.savePostToFirestore = async function(post) {
    if (!window.ApiClient) throw new Error('ApiClient não disponível');
    
    // Mapear campos para o backend
    const mediaUrl = post.mediaUrl || 'imagens/unique_soul_cenario.png';
    const payload = {
        title: post.title,
        caption: post.caption,
        author_name: post.author || 'Equipe Qualquer Coisa',
        type: post.category || 'devlog',
        media: [{ media_url: mediaUrl, media_type: 'image', order_index: 0 }]
    };

    return await window.ApiClient.createPost(payload);
};

window.deletePostFromFirestore = async function(postId) {
    if (!window.ApiClient) return;
    return await window.ApiClient.deletePost(postId);
};

window.updatePostLikesInFirestore = async function(postId) {
    if (!window.ApiClient) return { liked: true };
    const res = await window.ApiClient.likePost(postId);
    return { ok: true, liked: true, likes: res.likes_count };
};

window.loadPostsFromApi = async function() {
    if (!window.ApiClient) return [];
    try {
        const rawPosts = await window.ApiClient.getPosts();
        // Converte o formato do backend para o formato esperado pelo script.js
        const adapted = rawPosts.map(p => ({
            id: p.id,
            title: p.title || 'Devlog do Jogo',
            category: p.type || 'devlog',
            author: p.author_name || 'Qualquer Coisa Rápido',
            caption: p.caption || '',
            mediaUrl: (p.media && p.media.length > 0) ? p.media[0].media_url : 'imagens/unique_soul_cenario.png',
            mediaList: p.media || [],
            likes: p.likes_count || 0,
            commentsCount: p.comments_count || 0,
            date: p.created_at || new Date().toISOString(),
            showInCarousel: true
        }));

        window.dispatchEvent(new CustomEvent('qc_posts_loaded', { detail: adapted }));
        return adapted;
    } catch (err) {
        console.warn('Backend offline ou erro ao buscar posts:', err.message);
        return [];
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.updateAuthUI();
});
