// ============================================================
// FIREBASE AUTHENTICATION & CONECTOR CLIENTE
// Login oficial com Google para a equipe do estúdio
// ============================================================

// Configuração oficial do Firebase fornecida pela equipe
const firebaseConfig = {
  apiKey: "AIzaSyDKaYMOU6LEdXPQeCqZ3c0BHMI7B9Oswmo",
  authDomain: "qualquer-coisa-oficial-site.firebaseapp.com",
  projectId: "qualquer-coisa-oficial-site",
  storageBucket: "qualquer-coisa-oficial-site.firebasestorage.app",
  messagingSenderId: "483216570246",
  appId: "1:483216570246:web:5a42fb03ddcb3f4fb81e07",
  measurementId: "G-GT67M339X4"
};

// E-mails autorizados com privilégios de criador/administrador
const AUTHORIZED_CREATOR_EMAILS = [
  'admin',
  'qualquercoisaoficial69@gmail.com',
  'brennofirminodejesus@gmail.com',
  'izam20027@gmail.com',
  'gtofrazatto@gmail.com'
];

// Carregador assíncrono dos SDKs do Firebase Compat caso ainda não estejam na página
function ensureFirebaseLoaded() {
  return new Promise((resolve, reject) => {
    if (window.firebase && window.firebase.auth) {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      return resolve(window.firebase);
    }

    const appScript = document.createElement('script');
    appScript.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js';
    appScript.onload = () => {
      const authScript = document.createElement('script');
      authScript.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js';
      authScript.onload = () => {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        resolve(window.firebase);
      };
      authScript.onerror = () => reject(new Error('Falha ao carregar Firebase Auth.'));
      document.head.appendChild(authScript);
    };
    appScript.onerror = () => reject(new Error('Falha ao carregar Firebase App.'));
    document.head.appendChild(appScript);
  });
}

// Inicializa Firebase em segundo plano logo na abertura da página
ensureFirebaseLoaded().catch(e => console.warn('Pré-carregamento do Firebase:', e.message));

// Modal customizado e elegante para Login Administrativo
function renderLoginModal() {
  if (document.getElementById('indieLoginModal')) return;

  const modal = document.createElement('div');
  modal.id = 'indieLoginModal';
  modal.className = 'cms-post-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(8,1,18,0.85);backdrop-filter:blur(10px);z-index:99999;display:none;align-items:center;justify-content:center;padding:1rem;';

  modal.innerHTML = `
    <div style="background:#16092b;border:1px solid #7c3aed;box-shadow:0 0 40px rgba(124,58,237,0.35);border-radius:16px;max-width:420px;width:100%;padding:2.2rem 2rem;color:#fff;font-family:'Open Sans',sans-serif;position:relative;text-align:center;">
        <button type="button" onclick="closeAdminLoginModal()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer;">&times;</button>
        
        <div style="margin-bottom:1.5rem;">
            <img src="imagens/Logo_colorida.png" alt="Logo Qualquer Coisa Rápido" style="width:60px;margin-bottom:0.75rem;filter:drop-shadow(0 0 10px rgba(168,85,247,0.5));">
            <h3 style="font-family:'Orbitron',sans-serif;color:#a855f7;margin:0 0 0.35rem 0;font-size:1.3rem;">Acesso à Equipe</h3>
            <p style="font-size:0.85rem;color:#cbd5e1;margin:0;">Entre com seu e-mail do Google para gerenciar o estúdio e o CMS.</p>
        </div>

        <!-- BOTÃO PRINCIPAL: LOGIN COM O GOOGLE -->
        <button type="button" id="googleLoginBtn" onclick="loginWithGoogle()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:12px;background:#ffffff;color:#1e293b;border:none;padding:12px 18px;border-radius:10px;font-family:'Orbitron',sans-serif;font-weight:700;font-size:0.9rem;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.15s,box-shadow 0.15s;">
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            ENTRAR COM GOOGLE
        </button>

        <div id="loginErrorMessage" style="display:none;color:#f87171;font-size:0.85rem;margin-top:1rem;text-align:center;background:rgba(239,68,68,0.1);padding:8px 12px;border-radius:6px;border:1px solid rgba(239,68,68,0.3);"></div>

        <!-- ACESSO SECUNDÁRIO VIA SENHA (FALLBACK) -->
        <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.1);">
            <button type="button" onclick="togglePasswordLoginForm()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:0.78rem;cursor:pointer;text-decoration:underline;">
                Ou entrar com usuário e senha
            </button>
            
            <form id="adminPasswordForm" onsubmit="handleAdminLoginSubmit(event)" style="display:none;margin-top:1rem;text-align:left;">
                <div style="margin-bottom:0.75rem;">
                    <label style="display:block;font-size:0.75rem;text-transform:uppercase;color:#c084fc;margin-bottom:0.25rem;">Usuário</label>
                    <input type="text" id="loginUsernameInput" value="admin" required style="width:100%;box-sizing:border-box;background:#0d0519;border:1px solid rgba(255,255,255,0.15);padding:0.6rem 0.8rem;border-radius:6px;color:#fff;font-size:0.9rem;outline:none;">
                </div>
                <div style="margin-bottom:0.85rem;">
                    <label style="display:block;font-size:0.75rem;text-transform:uppercase;color:#c084fc;margin-bottom:0.25rem;">Senha</label>
                    <input type="password" id="loginPasswordInput" value="admin123" required style="width:100%;box-sizing:border-box;background:#0d0519;border:1px solid rgba(255,255,255,0.15);padding:0.6rem 0.8rem;border-radius:6px;color:#fff;font-size:0.9rem;outline:none;">
                </div>
                <button type="submit" id="loginSubmitBtn" style="width:100%;background:linear-gradient(135deg,#7c3aed,#06b6d4);border:none;padding:0.75rem;border-radius:6px;color:#fff;font-family:'Orbitron',sans-serif;font-weight:700;font-size:0.85rem;cursor:pointer;">
                    ENTRAR COM SENHA
                </button>
            </form>
        </div>

        <div style="margin-top:1rem;">
            <small style="color:rgba(255,255,255,0.45);font-size:0.72rem;">E-mails autorizados: Brenno, Iza, Gustavo e estúdio oficial.</small>
        </div>
    </div>
  `;

  document.body.appendChild(modal);
}

window.togglePasswordLoginForm = function() {
  const form = document.getElementById('adminPasswordForm');
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
};

window.openAdminLoginModal = function() {
  renderLoginModal();
  const modal = document.getElementById('indieLoginModal');
  if (modal) modal.style.display = 'flex';
};

window.closeAdminLoginModal = function() {
  const modal = document.getElementById('indieLoginModal');
  if (modal) modal.style.display = 'none';
};

// Autenticação oficial com o Google via Firebase
window.loginWithGoogle = async function() {
  const errBox = document.getElementById('loginErrorMessage');
  const googleBtn = document.getElementById('googleLoginBtn');
  if (errBox) errBox.style.display = 'none';
  if (googleBtn) {
    googleBtn.disabled = true;
    googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Conectando ao Google...';
  }

  try {
    await ensureFirebaseLoaded();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await firebase.auth().signInWithPopup(provider);
    const googleUser = result.user;
    const email = (googleUser.email || '').toLowerCase().trim();

    if (!AUTHORIZED_CREATOR_EMAILS.includes(email)) {
      await firebase.auth().signOut();
      throw new Error(`Acesso Negado: O e-mail (${email}) não está na lista de desenvolvedores autorizados.`);
    }

    // Comunica com o backend para registrar a sessão e obter o token JWT
    if (window.ApiClient) {
      await window.ApiClient.loginWithGoogle(
        email,
        googleUser.displayName || email.split('@')[0],
        googleUser.photoURL || 'imagens/Logo_colorida.png'
      );
    }

    closeAdminLoginModal();
    window.updateAuthUI();
    window.location.reload();
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      console.error('Erro no login com Google:', err);
      if (errBox) {
        errBox.textContent = err.message || 'Erro ao conectar com o Google.';
        errBox.style.display = 'block';
      } else {
        alert(err.message || 'Erro ao conectar com o Google.');
      }
    }
  } finally {
    if (googleBtn) {
      googleBtn.disabled = false;
      googleBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        ENTRAR COM GOOGLE
      `;
    }
  }
};

window.handleAdminLoginSubmit = async function(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsernameInput').value.trim();
  const password = document.getElementById('loginPasswordInput').value.trim();
  const errBox = document.getElementById('loginErrorMessage');
  const btn = document.getElementById('loginSubmitBtn');

  if (errBox) errBox.style.display = 'none';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'AUTENTICANDO...';
  }

  try {
    if (!window.ApiClient) {
      throw new Error('Cliente API não carregado.');
    }
    await window.ApiClient.login(username, password);
    closeAdminLoginModal();
    window.updateAuthUI();
    window.location.reload();
  } catch (err) {
    if (errBox) {
      errBox.textContent = err.message || 'Falha ao conectar ao servidor.';
      errBox.style.display = 'block';
    } else {
      alert(err.message || 'Falha ao autenticar.');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'ENTRAR COM SENHA';
    }
  }
};

window.logoutUser = function() {
  if (window.firebase && window.firebase.auth) {
    try { firebase.auth().signOut(); } catch (e) {}
  }
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
    name: user.displayName || user.username,
    displayName: user.displayName || user.username,
    email: user.email || (user.username + '@qualquercoisa.com'),
    role: user.role,
    photoURL: user.avatar || user.photoURL || 'imagens/Logo_colorida.png'
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
        <button type="button" class="btn-google-login" onclick="openAdminLoginModal()" aria-label="Entrar com Google" style="background:linear-gradient(135deg,rgba(124,58,237,0.4),rgba(6,182,212,0.3));border:1px solid #a855f7;cursor:pointer;display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:20px;color:#fff;">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span style="font-weight:600;font-size:0.85rem;">Acesso Equipe</span>
        </button>
      `;
    } else {
      const firstName = (u.displayName || u.name).split(' ')[0];
      const photo = u.photoURL || 'imagens/Logo_colorida.png';

      container.innerHTML = `
        <div class="user-profile-badge" onclick="toggleUserProfileDropdown(event)" style="cursor:pointer;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.08);padding:6px 14px;border-radius:20px;border:1px solid rgba(168,85,247,0.4);">
          <img src="${photo}" alt="Foto" class="profile-avatar" style="width:26px;height:26px;border-radius:50%;object-fit:cover;">
          <span class="profile-name" style="font-weight:600;font-size:0.9rem;color:#fff;">${firstName}</span>
          <i class="fas fa-chevron-down profile-dropdown-arrow" style="font-size:0.75rem;color:#c084fc;"></i>
        </div>

        <div class="user-profile-dropdown" id="userProfileDropdown">
          <div class="profile-dropdown-header">
            <img src="${photo}" alt="Avatar" class="profile-dropdown-avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
            <div class="profile-dropdown-user-info">
              <strong>${u.displayName || u.name}</strong>
              <small>${u.email}</small>
              <span class="user-role-badge creator" style="background:#7c3aed;color:#fff;padding:2px 8px;border-radius:4px;font-size:0.7rem;display:inline-block;margin-top:4px;">
                👑 Equipe do Estúdio
              </span>
            </div>
          </div>
          
          <div class="profile-dropdown-menu">
            <button type="button" class="profile-dropdown-item" onclick="openProfileEditModal()" style="background:none;border:none;color:#fff;display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;cursor:pointer;font-size:0.85rem;text-align:left;">
              <i class="fas fa-user-edit" style="color:var(--cyan);"></i> Editar Meu Perfil
            </button>
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
// MODAL DE EDIÇÃO DE PERFIL DO USUÁRIO
// ============================================================
function renderProfileModal() {
  if (document.getElementById('indieProfileModal')) return;

  const modal = document.createElement('div');
  modal.id = 'indieProfileModal';
  modal.className = 'indie-profile-modal-overlay';

  modal.innerHTML = `
    <div class="indie-profile-dialog">
      <button type="button" onclick="closeProfileEditModal()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer;">&times;</button>
      
      <div style="text-align:center;margin-bottom:1.4rem;">
        <h3 style="font-family:'Orbitron',sans-serif;color:#06b6d4;margin:0 0 0.35rem 0;font-size:1.25rem;">
          <i class="fas fa-id-badge"></i> Editar Meu Perfil
        </h3>
        <p style="font-size:0.83rem;color:#cbd5e1;margin:0;">Personalize seu nickname, avatar e bio no estúdio.</p>
      </div>

      <form id="editProfileForm" onsubmit="saveUserProfile(event)">
        <div class="indie-profile-avatar-preview-wrap">
          <img id="profilePreviewAvatar" src="imagens/Logo_colorida.png" alt="Avatar" class="indie-profile-avatar-img">
          
          <!-- BOTÃO PARA ESCOLHER FOTO DO DISPOSITIVO OU CÂMERA -->
          <label for="profileDeviceFileInput" class="btn-profile-upload" style="background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;padding:8px 16px;border-radius:20px;font-size:0.8rem;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:8px;box-shadow:0 0 15px rgba(6,182,212,0.3);transition:transform 0.15s;">
            <i class="fas fa-camera"></i>
            <span>Escolher Foto do Dispositivo / Câmera</span>
            <input type="file" id="profileDeviceFileInput" accept="image/*" style="display:none;" onchange="handleProfilePhotoUpload(event)">
          </label>
          <div id="profileUploadProgress" style="display:none;font-size:0.78rem;color:#06b6d4;align-items:center;gap:6px;">
            <i class="fas fa-spinner fa-spin"></i> Enviando foto para o banco de dados...
          </div>

          <span style="font-size:0.75rem;color:rgba(255,255,255,0.6);margin-top:4px;">Ou escolha um avatar rápido dos integrantes:</span>
          <div class="indie-profile-presets-row">
            <img src="imagens/brenno-icon.jpeg" class="indie-profile-preset-thumb" onclick="selectProfileAvatarPreset('imagens/brenno-icon.jpeg')" title="Brenno">
            <img src="imagens/en.jpg" class="indie-profile-preset-thumb" onclick="selectProfileAvatarPreset('imagens/en.jpg')" title="Gaby">
            <img src="imagens/gus.jpg" class="indie-profile-preset-thumb" onclick="selectProfileAvatarPreset('imagens/gus.jpg')" title="Gustavo">
            <img src="imagens/iz.jpg" class="indie-profile-preset-thumb" onclick="selectProfileAvatarPreset('imagens/iz.jpg')" title="Iza">
            <img src="imagens/ma.jpg" class="indie-profile-preset-thumb" onclick="selectProfileAvatarPreset('imagens/ma.jpg')" title="Maryssa">
            <img src="imagens/Logo_colorida.png" class="indie-profile-preset-thumb" onclick="selectProfileAvatarPreset('imagens/Logo_colorida.png')" title="Qualquer Coisa">
            <img src="imagens/Qualquer_coisa_corpo_inteiro.png" class="indie-profile-preset-thumb" onclick="selectProfileAvatarPreset('imagens/Qualquer_coisa_corpo_inteiro.png')" title="Mascote">
          </div>
        </div>

        <div style="margin-bottom:0.9rem;">
          <label style="display:block;font-size:0.78rem;text-transform:uppercase;color:#c084fc;margin-bottom:0.3rem;">Foto de Perfil (URL ou Imagem)</label>
          <input type="text" id="profileAvatarUrlInput" placeholder="Ex: https://... ou imagens/en.jpg" style="width:100%;box-sizing:border-box;background:#0d0519;border:1px solid rgba(255,255,255,0.15);padding:0.7rem 1rem;border-radius:8px;color:#fff;font-size:0.88rem;outline:none;" oninput="document.getElementById('profilePreviewAvatar').src = this.value.trim() || 'imagens/Logo_colorida.png'">
        </div>

        <div style="margin-bottom:0.9rem;">
          <label style="display:block;font-size:0.78rem;text-transform:uppercase;color:#c084fc;margin-bottom:0.3rem;">Nickname / Nome de Exibição *</label>
          <input type="text" id="profileNicknameInput" required maxlength="40" placeholder="Ex: Brenno F. ou DevGaby" style="width:100%;box-sizing:border-box;background:#0d0519;border:1px solid rgba(255,255,255,0.15);padding:0.7rem 1rem;border-radius:8px;color:#fff;font-size:0.92rem;outline:none;">
        </div>

        <div style="margin-bottom:1.3rem;">
          <label style="display:block;font-size:0.78rem;text-transform:uppercase;color:#c084fc;margin-bottom:0.3rem;">Bio / Descrição Pessoal</label>
          <textarea id="profileBioInput" rows="3" placeholder="Fale um pouco sobre você, seu papel no estúdio ou o que gosta de jogar..." style="width:100%;box-sizing:border-box;background:#0d0519;border:1px solid rgba(255,255,255,0.15);padding:0.7rem 1rem;border-radius:8px;color:#fff;font-size:0.88rem;outline:none;resize:vertical;"></textarea>
        </div>

        <div id="profileErrorMessage" style="display:none;color:#f87171;font-size:0.85rem;margin-bottom:1rem;text-align:center;"></div>
        <div id="profileSuccessMessage" style="display:none;color:#34d399;font-size:0.85rem;margin-bottom:1rem;text-align:center;"></div>

        <button type="submit" id="profileSaveBtn" style="width:100%;background:linear-gradient(135deg,#7c3aed,#06b6d4);border:none;padding:0.85rem;border-radius:8px;color:#fff;font-family:'Orbitron',sans-serif;font-weight:700;font-size:0.9rem;cursor:pointer;letter-spacing:1px;">
          SALVAR PERFIL
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
}

window.selectProfileAvatarPreset = function(url) {
  const input = document.getElementById('profileAvatarUrlInput');
  const preview = document.getElementById('profilePreviewAvatar');
  if (input) input.value = url;
  if (preview) preview.src = url;
};

window.handleProfilePhotoUpload = async function(e) {
  const file = e.target.files ? e.target.files[0] : null;
  if (!file) return;

  const progress = document.getElementById('profileUploadProgress');
  const preview = document.getElementById('profilePreviewAvatar');
  const input = document.getElementById('profileAvatarUrlInput');
  const errBox = document.getElementById('profileErrorMessage');

  if (errBox) errBox.style.display = 'none';
  if (progress) progress.style.display = 'flex';

  try {
    if (!window.ApiClient) throw new Error('ApiClient não disponível');
    const uploadedUrl = await window.ApiClient.uploadImage(file, 600);
    if (input) input.value = uploadedUrl;
    if (preview) preview.src = uploadedUrl;
    if (progress) {
      progress.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981;"></i> Foto carregada com sucesso!';
      setTimeout(() => {
        progress.style.display = 'none';
        progress.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando foto para o banco de dados...';
      }, 2500);
    }
  } catch (err) {
    if (errBox) {
      errBox.textContent = 'Erro ao enviar foto: ' + err.message;
      errBox.style.display = 'block';
    }
    if (progress) progress.style.display = 'none';
  }
};

window.openProfileEditModal = function() {
  renderProfileModal();
  const u = window.getCurrentUser();
  if (!u) {
    window.openAdminLoginModal();
    return;
  }

  const modal = document.getElementById('indieProfileModal');
  const inputName = document.getElementById('profileNicknameInput');
  const inputAvatar = document.getElementById('profileAvatarUrlInput');
  const inputBio = document.getElementById('profileBioInput');
  const preview = document.getElementById('profilePreviewAvatar');
  const errBox = document.getElementById('profileErrorMessage');
  const succBox = document.getElementById('profileSuccessMessage');

  if (errBox) errBox.style.display = 'none';
  if (succBox) succBox.style.display = 'none';

  const rawUser = window.ApiClient ? window.ApiClient.getUser() : null;

  if (inputName) inputName.value = u.displayName || u.name || '';
  if (inputAvatar) inputAvatar.value = u.photoURL || '';
  if (inputBio) inputBio.value = rawUser?.bio || '';
  if (preview) preview.src = u.photoURL || 'imagens/Logo_colorida.png';

  if (modal) modal.style.display = 'flex';
};

window.closeProfileEditModal = function() {
  const modal = document.getElementById('indieProfileModal');
  if (modal) modal.style.display = 'none';
};

window.saveUserProfile = async function(e) {
  e.preventDefault();
  const inputName = document.getElementById('profileNicknameInput');
  const inputAvatar = document.getElementById('profileAvatarUrlInput');
  const inputBio = document.getElementById('profileBioInput');
  const errBox = document.getElementById('profileErrorMessage');
  const succBox = document.getElementById('profileSuccessMessage');
  const btn = document.getElementById('profileSaveBtn');

  if (errBox) errBox.style.display = 'none';
  if (succBox) succBox.style.display = 'none';

  const displayName = inputName ? inputName.value.trim() : '';
  const avatarUrl = inputAvatar ? inputAvatar.value.trim() : '';
  const bio = inputBio ? inputBio.value.trim() : '';

  if (!displayName) {
    if (errBox) {
      errBox.textContent = 'Informe um apelido ou nome de exibição.';
      errBox.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'SALVANDO...';
  }

  try {
    if (!window.ApiClient) throw new Error('ApiClient não disponível');
    const result = await window.ApiClient.updateProfile({
      displayName,
      avatarUrl: avatarUrl || 'imagens/Logo_colorida.png',
      bio
    });

    if (succBox) {
      succBox.textContent = '🎉 Perfil salvo com sucesso!';
      succBox.style.display = 'block';
    }

    window.updateAuthUI();
    setTimeout(() => {
      closeProfileEditModal();
      window.location.reload();
    }, 900);
  } catch (err) {
    if (errBox) {
      errBox.textContent = err.message || 'Erro ao atualizar perfil.';
      errBox.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'SALVAR PERFIL';
    }
  }
};

// ============================================================
// ADAPTADORES DA API DE PUBLICAÇÕES (SUBSTITUINDO FIRESTORE)
// ============================================================
window.savePostToFirestore = async function(post) {
  if (!window.ApiClient) throw new Error('ApiClient não disponível');
  
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
    if (!Array.isArray(rawPosts)) {
      console.warn('Aviso: A resposta da API de publicações não é uma lista:', rawPosts);
      return [];
    }

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
