/**
 * api-client.js
 * Cliente HTTP unificado para conectar o frontend da Qualquer Coisa Rápido ao backend próprio.
 */

// Detecta automaticamente se está rodando local ou na Vercel
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:4000/api'
  : '/api';

const ApiClient = {
  // --- GERENCIAMENTO DE AUTENTICAÇÃO (CMS) ---
  getToken() {
    return localStorage.getItem('qcr_auth_token');
  },

  getUser() {
    const raw = localStorage.getItem('qcr_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao realizar login.');

    localStorage.setItem('qcr_auth_token', data.token);
    localStorage.setItem('qcr_user', JSON.stringify(data.user));
    return data;
  },

  async loginWithGoogle(email, name, avatar) {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, avatar })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao autenticar com Google.');

    localStorage.setItem('qcr_auth_token', data.token);
    localStorage.setItem('qcr_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('qcr_auth_token');
    localStorage.removeItem('qcr_user');
    window.location.reload();
  },

  // --- GERENCIAMENTO DE PERFIL DO USUÁRIO ---
  async getProfile() {
    return await this._authFetch(`${API_BASE}/auth/me`);
  },

  async updateProfile(profileData) {
    const data = await this._authFetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (data.user) {
      localStorage.setItem('qcr_user', JSON.stringify(data.user));
    }
    return data;
  },

  // Helper interno para requisições autenticadas
  async _authFetch(url, options = {}) {
    const token = this.getToken();
    const headers = { ...(options.headers || {}) };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisição.');
    return data;
  },

  // --- JOGOS & PÁGINAS CUSTOMIZÁVEIS (CMS) ---
  async getGames() {
    const res = await fetch(`${API_BASE}/games`);
    return await res.json();
  },

  async getGameBySlug(slug) {
    const res = await fetch(`${API_BASE}/games/${slug}`);
    if (!res.ok) throw new Error('Jogo não encontrado.');
    return await res.json();
  },

  async createGame(gameData) {
    return await this._authFetch(`${API_BASE}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
  },

  async updateGame(id, gameData) {
    return await this._authFetch(`${API_BASE}/games/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
  },

  // Salvar blocos da página customizável do jogo
  async saveGameBlocks(gameId, blocks) {
    return await this._authFetch(`${API_BASE}/games/${gameId}/blocks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks })
    });
  },

  async deleteGame(id) {
    return await this._authFetch(`${API_BASE}/games/${id}`, {
      method: 'DELETE'
    });
  },

  // --- FEED SOCIAL / DEVLOG (ESTILO INSTAGRAM) ---
  async getPosts(gameId = null) {
    const url = gameId ? `${API_BASE}/posts?game_id=${gameId}` : `${API_BASE}/posts`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Erro ao carregar posts:', e);
      return [];
    }
  },

  async getPostById(id) {
    const res = await fetch(`${API_BASE}/posts/${id}`);
    return await res.json();
  },

  async createPost(postData) {
    return await this._authFetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
  },

  async updatePost(postId, postData) {
    return await this._authFetch(`${API_BASE}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
  },

  async likePost(postId) {
    return await this._authFetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST'
    });
  },

  async deletePost(postId) {
    return await this._authFetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  // --- COMENTÁRIOS & RESPOSTAS (ESTILO INSTAGRAM) ---
  async getComments(postId) {
    return await this._authFetch(`${API_BASE}/comments/posts/${postId}`);
  },

  async addComment(postId, content, parentId = null) {
    return await this._authFetch(`${API_BASE}/comments/posts/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parent_id: parentId })
    });
  },

  async likeComment(commentId) {
    return await this._authFetch(`${API_BASE}/comments/${commentId}/like`, {
      method: 'POST'
    });
  },

  async deleteComment(commentId) {
    return await this._authFetch(`${API_BASE}/comments/${commentId}`, {
      method: 'DELETE'
    });
  },

  // --- EQUIPE DO ESTÚDIO ---
  async getTeam() {
    const res = await fetch(`${API_BASE}/team`);
    return await res.json();
  },

  async addTeamMember(memberData) {
    return await this._authFetch(`${API_BASE}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberData)
    });
  },

  async deleteTeamMember(id) {
    return await this._authFetch(`${API_BASE}/team/${id}`, {
      method: 'DELETE'
    });
  },

  // --- FEEDBACKS DE PLAYTEST / BUGS ---
  async sendFeedback(feedbackData) {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    return await res.json();
  },

  async getFeedbacks(gameId = null) {
    const url = gameId ? `${API_BASE}/feedback?game_id=${gameId}` : `${API_BASE}/feedback`;
    return await this._authFetch(url);
  },

  async deleteFeedback(id) {
    return await this._authFetch(`${API_BASE}/feedback/${id}`, {
      method: 'DELETE'
    });
  },

  // --- UPLOAD DE MÍDIAS & COMPRESSÃO INTELIGENTE ---
  compressImageFile(file, maxWidth = 1000, quality = 0.82) {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        return resolve(file);
      }
      if (file.type === 'image/gif') {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name ? file.name.replace(/\.[^/.]+$/, '.jpg') : 'upload.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer upload.');
    return data;
  },

  async uploadImage(file, maxWidth = 1000) {
    const compressed = await this.compressImageFile(file, maxWidth);
    const res = await this.uploadFile(compressed);
    return res.url;
  }
};

window.ApiClient = ApiClient;
