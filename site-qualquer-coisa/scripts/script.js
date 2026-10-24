// ==========================================
// COMPORTAMENTO APÓS CARREGAR A PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // --- INTRO DE PRIMEIRA VISITA ---
    setupFirstVisitIntro();

    // --- GERENCIAMENTO DE TEMA (CLARO/ESCURO) ---
    const themeToggle = document.getElementById('themeToggle') || document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const icon = themeToggle ? themeToggle.querySelector('i') : null;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });
    }

    function updateIcon(theme) {
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }

        if (themeToggle) {
            const label = theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro';
            themeToggle.setAttribute('aria-label', label);
            themeToggle.setAttribute('title', label);
            themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
        }
    }

    // --- ACESSIBILIDADE E LINKS ---
    document.querySelectorAll('i[class^="fa"], i[class*=" fa-"]').forEach(iconElement => {
        iconElement.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.setAttribute('rel', 'noopener noreferrer');
    });

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.top-nav a[href]').forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();

        if (linkPage === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    // --- MENU MOBILE E SIDEBAR ---
    const mobileTrigger = document.getElementById('mobile-menu-trigger');
    const topNav = document.getElementById('sidebar');

    if (mobileTrigger && topNav) {
        mobileTrigger.addEventListener('click', () => {
            topNav.classList.toggle('active');
        });
    }

    window.toggleSubmenu = function(button) {
        const submenu = button.nextElementSibling;
        const isAlreadyOpen = submenu.classList.contains("show");

        closeAllSubmenus();

        if (!isAlreadyOpen) {
            if (submenu && submenu.classList.contains("submenu")) {
                submenu.classList.add("show");
            }
            button.classList.add("rotate");
        }
    };

    window.closeAllSubmenus = function() {
        const openMenus = document.querySelectorAll(".submenu.show");
        openMenus.forEach(menu => {
            menu.classList.remove("show");
            const btn = menu.previousElementSibling;
            if (btn) btn.classList.remove("rotate");
        });
    };

    window.toggleSidebar = function() {
        const headerElement = document.getElementById("headerMenu");
        if (headerElement) {
            headerElement.classList.toggle("close");
        }
    };

    function setupFirstVisitIntro() {
        const intro = document.getElementById('siteIntro');
        if (!intro) return;

        let pageLoaded = document.readyState === 'complete';
        let minTimeElapsed = false;
        let finished = false;

        function finishIntro() {
            if (finished) return;
            finished = true;

            intro.classList.add('intro-exit');

            setTimeout(() => {
                intro.setAttribute('hidden', '');
                intro.style.display = 'none';
            }, 550);
        }

        function checkAndFinish() {
            if (pageLoaded && minTimeElapsed) {
                finishIntro();
            }
        }

        if (!pageLoaded) {
            window.addEventListener('load', () => {
                pageLoaded = true;
                checkAndFinish();
            }, { once: true });
        }

        // Aguarda 1.4s exibindo a logo e o spinner antes de transicionar
        setTimeout(() => {
            minTimeElapsed = true;
            checkAndFinish();
        }, 1400);
    }
});

// ==========================================
// COMPORTAMENTO DO CABEÇALHO AO ROLAR
// ==========================================
const header = document.querySelector(".main-header");
let lastScroll = 0;

if (header) {
    window.addEventListener("scroll", () => {
        if (window.innerWidth <= 768) {
            header.classList.remove("scroll-down", "scroll-up");
            return;
        }

        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll <= 0) {
            header.classList.remove("scroll-down", "scroll-up");
            return;
        }

        if (currentScroll > lastScroll && !header.classList.contains("scroll-down")) {
            header.classList.remove("scroll-up");
            header.classList.add("scroll-down");
        } else if (currentScroll < lastScroll && header.classList.contains("scroll-down")) {
            header.classList.remove("scroll-down");
            header.classList.add("scroll-up");
        }

        lastScroll = currentScroll;
    });
}

// ==========================================
// GAMESTORE: DADOS, CARROSSEL 3D, BUSCA E MODAL
// ==========================================
const GAMES_DATA = {
    'unique-soul': {
        id: 'unique-soul',
        title: 'Unique Soul',
        genre: 'RPG / Investigação',
        version: 'Alpha 0.1',
        status: 'Em Desenvolvimento',
        platforms: 'PC (Steam & Epic Games)',
        cover: 'imagens/unique_soul_capa.png',
        banner: 'imagens/unique_soul_cenario.png',
        tagline: 'Toda alma tem uma história. Qual será a sua?',
        description: 'Unique Soul é um mergulho em um universo 2D onde você precisa enfrentar julgamentos e preconceitos. Seus fragmentos de memória são a única bússola, além da curiosidade. Em um mundo onde todos possuem suas próprias cores, você assume o papel de um fragmento que busca entender sua origem.',
        mechanics: [
            { icon: 'fa-ghost', title: 'Troca de Almas', desc: 'Alterne entre diferentes essências e habilidades espectrais para superar obstáculos.' },
            { icon: 'fa-puzzle-piece', title: 'Puzzles Ambientais', desc: 'Desvende enigmas antigos integrados à arquitetura e iluminação da catedral.' },
            { icon: 'fa-eye', title: 'Visão de Memória', desc: 'Revele ecos do passado deixados nos cenários para desbloquear lembranças perdidas.' },
            { icon: 'fa-fist-raised', title: 'Combates Táticos', desc: 'Enfrente guardiões e sombras em batalhas fluidas baseadas em afinidade de cores.' }
        ],
        gallery: [
            { src: 'imagens/unique_soul_capa.png', caption: 'Capa Oficial' },
            { src: 'imagens/unique_soul_personagem.png', caption: 'Design do Protagonista' },
            { src: 'imagens/unique_soul_cenario.png', caption: 'A Catedral dos Vitrais' }
        ]
    },
    'catedral-almas': {
        id: 'catedral-almas',
        title: 'A Catedral das Cores',
        genre: 'Atmosfera & Cenários',
        version: 'Conceito Artístico',
        status: 'Em Produção',
        platforms: 'Cenários do Jogo',
        cover: 'imagens/unique_soul_cenario.png',
        banner: 'imagens/unique_soul_cenario.png',
        tagline: 'O santuário onde as cores e memórias perdidas convergem.',
        description: 'A Catedral dos Vitrais é o principal marco visual de Unique Soul. Cada vitral gótico emana um feixe de luz que reflete o estado das almas no universo, criando atmosferas contrastantes e segredos arquitetônicos exploráveis.',
        mechanics: [
            { icon: 'fa-archway', title: 'Arquitetura Gótica', desc: 'Cenários feitos à mão com estética imersiva e cores místicas.' },
            { icon: 'fa-sun', title: 'Luzes Dinâmicas', desc: 'Os reflexos dos vitrais afetam visibilidade e revelam caminhos ocultos.' }
        ],
        gallery: [
            { src: 'imagens/unique_soul_cenario.png', caption: 'Vitrais Principais' },
            { src: 'imagens/unique_soul_capa.png', caption: 'Capa Completa' }
        ]
    },
    'qualquer-coisa-quest': {
        id: 'qualquer-coisa-quest',
        title: 'Qualquer Coisa Quest',
        genre: 'Ação / Roguelite 2D',
        version: 'Protótipo',
        status: 'Projeto Paralelo',
        platforms: 'Web / PC',
        cover: 'imagens/Qualquer_coisa_corpo_inteiro.png',
        banner: 'imagens/Qualquer_coisa_corpo_inteiro.png',
        tagline: 'O mascote oficial do estúdio em uma missão caótica e divertida!',
        description: 'Um projeto spin-off estrelando o mascote da Qualquer Coisa Rápido! Combates rápidos, esquivas acrobáticas e muito humor com habilidades especiais inspiradas nos fundadores da equipe.',
        mechanics: [
            { icon: 'fa-bolt', title: 'Ritmo Acelerado', desc: 'Desvie de ataques e elimine inimigos com reflexos rápidos.' },
            { icon: 'fa-magic', title: 'Habilidades Especiais', desc: 'Disparos de energia e ataques de adaga com efeitos coloridos.' }
        ],
        gallery: [
            { src: 'imagens/Qualquer_coisa_corpo_inteiro.png', caption: 'Mascote Qualquer Coisa' },
            { src: 'imagens/Qualquer_coisa_tiro.png', caption: 'Ataque de Tiro' },
            { src: 'imagens/Qualquer_coisa_faquinha.png', caption: 'Mascote com Adaga' }
        ]
    },
    'soundtrack': {
        id: 'soundtrack',
        title: 'Unique Soul: Soundtrack',
        genre: 'Sound Design & Músicas',
        version: 'Volume 1',
        status: 'Composição Ativa',
        platforms: 'Spotify / YouTube',
        cover: 'imagens/preview.png',
        banner: 'imagens/unique_soul_cenario.png',
        tagline: 'Melodias etéreas e sintetizadores atmosféricos autorais.',
        description: 'A trilha sonora oficial de Unique Soul combina sintetizadores suaves, piano introspectivo e batidas marcantes de combate para acompanhar cada estágio emocional da narrativa.',
        mechanics: [
            { icon: 'fa-music', title: 'Trilhas Dinâmicas', desc: 'A música se transforma em tempo real com as ações do jogador.' },
            { icon: 'fa-headphones', title: 'Imersão Binaural', desc: 'Sons tridimensionais que enriquecem o suspense e a exploração.' }
        ],
        gallery: [
            { src: 'imagens/preview.png', caption: 'Arte Conceitual da Trilha' },
            { src: 'imagens/unique_soul_cenario.png', caption: 'Inspiração Sonora' }
        ]
    }
};

// --- CARROSSEL 3D FANNED ---
let carouselCurrentIndex = 0;
function initFannedCarousel() {
    const fannedCards = document.querySelectorAll('.fanned-card');
    const dots = document.querySelectorAll('.carousel-dot');
    if (!fannedCards.length) return;

    function updateCarousel() {
        const total = fannedCards.length;
        fannedCards.forEach((card, idx) => {
            card.classList.remove('card-active', 'card-prev', 'card-next', 'card-hidden');

            const diff = (idx - carouselCurrentIndex + total) % total;

            if (diff === 0) {
                card.classList.add('card-active');
            } else if (diff === 1 || (diff === -(total - 1))) {
                card.classList.add('card-next');
            } else if (diff === total - 1 || diff === -1) {
                card.classList.add('card-prev');
            } else {
                card.classList.add('card-hidden');
            }
        });

        dots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === carouselCurrentIndex);
        });
    }

    window.nextCarouselCard = function() {
        carouselCurrentIndex = (carouselCurrentIndex + 1) % fannedCards.length;
        updateCarousel();
    };

    window.prevCarouselCard = function() {
        carouselCurrentIndex = (carouselCurrentIndex - 1 + fannedCards.length) % fannedCards.length;
        updateCarousel();
    };

    window.goToCarouselCard = function(index) {
        carouselCurrentIndex = index;
        updateCarousel();
    };

    fannedCards.forEach((card, idx) => {
        card.addEventListener('click', () => {
            if (idx !== carouselCurrentIndex) {
                goToCarouselCard(idx);
            }
        });
    });

    // Suporte a gestos de deslize por toque (Swipe Mobile)
    const carouselElem = document.querySelector('.fanned-carousel-container') || document.querySelector('.fanned-carousel');
    if (carouselElem) {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        carouselElem.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        carouselElem.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Se o movimento horizontal for maior que o vertical e maior que 40px
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
                if (diffX < 0) {
                    window.nextCarouselCard();
                } else {
                    window.prevCarouselCard();
                }
            }
        }, { passive: true });
    }

    updateCarousel();
}

function escapeCarouselText(value) {
    const element = document.createElement('div');
    element.textContent = value || '';
    return element.innerHTML;
}

window.renderCmsCarousel = function() {
    const carousel = document.getElementById('cmsCarousel');
    const cardsContainer = document.getElementById('cmsCarouselCards');
    const dotsContainer = carousel?.querySelector('.carousel-dots');
    const previousButton = carousel?.querySelector('.carousel-prev-btn');
    const nextButton = carousel?.querySelector('.carousel-next-btn');
    const emptyPostsState = document.getElementById('homePostsEmpty');
    if (!carousel || !cardsContainer || !dotsContainer) return;
    if (!postsLoaded) {
        carousel.hidden = true;
        if (emptyPostsState) emptyPostsState.hidden = true;
        return;
    }

    const posts = getStoredPosts();
    const featuredPosts = posts.filter(post => post.showInCarousel === true);
    if (emptyPostsState) emptyPostsState.hidden = posts.length > 0;
    carousel.hidden = featuredPosts.length === 0;
    if (!featuredPosts.length) return;

    carouselCurrentIndex = 0;
    cardsContainer.innerHTML = featuredPosts.map((post, index) => `
        <article class="fanned-card" data-index="${index}">
            <img src="${escapeCarouselText(post.mediaUrl)}" alt="${escapeCarouselText(post.title)}" class="fanned-card-bg">
            <div class="fanned-card-overlay">
                <div class="spotlight-tags">
                    <span class="spotlight-badge"><i class="fas fa-star" aria-hidden="true"></i> EM DESTAQUE</span>
                    <span class="spotlight-cat">${escapeCarouselText(post.category || 'novidade').toUpperCase()}</span>
                </div>
                <h2 class="spotlight-title">${escapeCarouselText(post.title)}</h2>
                <p class="spotlight-desc">${escapeCarouselText(post.caption)}</p>
            </div>
        </article>
    `).join('');
    dotsContainer.innerHTML = featuredPosts.map((post, index) => `
        <button type="button" class="carousel-dot${index === 0 ? ' active' : ''}" onclick="goToCarouselCard(${index})" aria-label="Slide ${index + 1}"></button>
    `).join('');

    const showNavigation = featuredPosts.length > 1;
    if (previousButton) previousButton.hidden = !showNavigation;
    if (nextButton) nextButton.hidden = !showNavigation;
    dotsContainer.hidden = !showNavigation;
    initFannedCarousel();
};

// --- MODAL DE DETALHES DO JOGO ---
window.openGameModal = function(gameId) {
    const data = GAMES_DATA[gameId] || GAMES_DATA['unique-soul'];
    const modal = document.getElementById('gameModal');
    if (!modal) {
        // Redireciona para jogo.html com parâmetro se estiver em outra página
        window.location.href = `jogo.html?game=${gameId}`;
        return;
    }

    // Preenche dados do modal
    const banner = modal.querySelector('#modalBannerImg');
    const cover = modal.querySelector('#modalCoverImg');
    const title = modal.querySelector('#modalTitle');
    const genre = modal.querySelector('#modalGenre');
    const status = modal.querySelector('#modalStatus');
    const platforms = modal.querySelector('#modalPlatforms');
    const tagline = modal.querySelector('#modalTagline');
    const desc = modal.querySelector('#modalDesc');
    const mechanicsGrid = modal.querySelector('#modalMechanicsGrid');
    const galleryGrid = modal.querySelector('#modalGalleryGrid');
    const actionBtn = modal.querySelector('#modalActionBtn');

    if (banner) banner.src = data.banner;
    if (cover) cover.src = data.cover;
    if (title) title.textContent = data.title;
    if (genre) genre.textContent = data.genre;
    if (status) status.textContent = data.status;
    if (platforms) platforms.textContent = data.platforms;
    if (tagline) tagline.textContent = data.tagline;
    if (desc) desc.textContent = data.description;

    if (actionBtn) {
        actionBtn.href = `jogo.html?game=${data.id}`;
    }

    if (mechanicsGrid) {
        mechanicsGrid.innerHTML = data.mechanics.map(m => `
            <div class="modal-mechanic-card">
                <i class="fas ${m.icon}" aria-hidden="true"></i>
                <h4>${m.title}</h4>
                <p style="font-size: 0.8rem; opacity: 0.8;">${m.desc}</p>
            </div>
        `).join('');
    }

    if (galleryGrid) {
        galleryGrid.innerHTML = data.gallery.map(g => `
            <div class="modal-gallery-item">
                <img src="${g.src}" alt="${g.caption}" loading="lazy">
            </div>
        `).join('');
    }

    // Reseta abas para a primeira
    switchModalTab('tabOverview');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeGameModal = function() {
    const modal = document.getElementById('gameModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
};

window.switchModalTab = function(tabId) {
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.modal-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
};

// --- FILTRO E BUSCA DO CATÁLOGO ---
function initCatalogFilters() {
    const searchInput = document.getElementById('catalogSearch');
    const tabs = document.querySelectorAll('.catalog-tab');
    const cards = document.querySelectorAll('.catalog-game-card');

    let currentCategory = 'all';
    let searchQuery = '';

    function filterCards() {
        cards.forEach(card => {
            const cardCat = card.getAttribute('data-category') || '';
            const cardTitle = (card.querySelector('.card-game-title')?.textContent || '').toLowerCase();
            const cardDesc = (card.querySelector('.card-game-desc')?.textContent || '').toLowerCase();

            const matchesCategory = currentCategory === 'all' || cardCat.includes(currentCategory);
            const matchesSearch = !searchQuery || cardTitle.includes(searchQuery) || cardDesc.includes(searchQuery);

            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterCards();
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.getAttribute('data-filter') || 'all';
            filterCards();
        });
    });
}

// --- SISTEMA DE FAVORITOS / WISHLIST ---
let wishlist = JSON.parse(localStorage.getItem('qc_wishlist') || '[]');

function updateWishlistBadge() {
    const badge = document.getElementById('wishlistCount');
    if (badge) {
        badge.textContent = wishlist.length;
        badge.style.display = wishlist.length > 0 ? 'inline-block' : 'none';
    }
}

window.toggleWishlist = function(gameId, buttonElement) {
    const index = wishlist.indexOf(gameId);
    if (index > -1) {
        wishlist.splice(index, 1);
        if (buttonElement) buttonElement.classList.remove('favorited');
    } else {
        wishlist.push(gameId);
        if (buttonElement) buttonElement.classList.add('favorited');
    }
    localStorage.setItem('qc_wishlist', JSON.stringify(wishlist));
    updateWishlistBadge();
};

// --- TOGGLE SIDEBAR MOBILE (COM BACKDROP E BLOQUEIO DE SCROLL) ---
window.toggleMobileSidebar = function(forceState) {
    const sidebar = document.querySelector('.gamestore-sidebar');
    if (!sidebar) return;

    // Desativa modo bolinha imediatamente no mobile
    sidebar.classList.remove('sidebar-orb-mode');

    let backdrop = document.querySelector('.sidebar-mobile-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-mobile-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        backdrop.addEventListener('click', () => window.toggleMobileSidebar(false));
        // Insere o backdrop antes da sidebar para compartilharem exatamente o mesmo stacking context
        if (sidebar.parentElement) {
            sidebar.parentElement.insertBefore(backdrop, sidebar);
        } else {
            document.body.appendChild(backdrop);
        }
    }

    const isCurrentlyOpen = sidebar.classList.contains('mobile-open');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;

    if (shouldOpen) {
        sidebar.classList.add('mobile-open');
        backdrop.classList.add('active');
        document.body.classList.add('mobile-drawer-open');
    } else {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('active');
        document.body.classList.remove('mobile-drawer-open');
    }
};

// Fecha gaveta ou modal com tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.toggleMobileSidebar(false);
        window.closeGameModal();
    }
});

// --- TROCA DE VISUALIZAÇÃO INTERNA (INÍCIO / CATÁLOGO / SOBRE NÓS) ---
window.switchGameStoreView = function(viewName, event) {
    const views = document.querySelectorAll('.gamestore-view');
    const targetView = document.getElementById(`view-${viewName}`);

    if (targetView && views.length > 0) {
        if (event) event.preventDefault();

        views.forEach(v => {
            v.style.display = 'none';
            v.classList.remove('active-view');
        });

        targetView.style.display = 'flex';
        targetView.classList.add('active-view');

        document.querySelectorAll('.sidebar-link[data-view]').forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-view') === viewName);
        });

        // Fecha sidebar no mobile se estiver aberta
        const sidebar = document.querySelector('.gamestore-sidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
    }
    return true;
};

// --- TRANSIÇÃO MÓRFICA DA SIDEBAR (CARD <-> BOLINHA BRILHANTE AZUL) ---
function initMorphingSidebar() {
    const sidebar = document.querySelector('.gamestore-sidebar');
    if (!sidebar) return;

    // Remove qualquer orb antigo do cursor caso exista
    const oldOrb = document.getElementById('cursorOrb');
    if (oldOrb) oldOrb.remove();

    let scrollTimeout = null;
    let isHovered = false;

    sidebar.addEventListener('mouseenter', () => { isHovered = true; });
    sidebar.addEventListener('mouseleave', () => { isHovered = false; });

    window.addEventListener('scroll', () => {
        // Ignora em tablets e smartphones (<= 860px), onde funciona como gaveta off-canvas
        if (window.innerWidth <= 860) {
            sidebar.classList.remove('sidebar-orb-mode');
            return;
        }

        const currentScrollY = window.scrollY;

        // Se rolou mais de 50px a partir do topo:
        if (currentScrollY > 50) {
            // Se o usuário não estiver com o mouse em cima:
            if (!isHovered && !sidebar.classList.contains('sidebar-orb-mode')) {
                // O card vira suavemente a bolinha brilhante no canto
                sidebar.classList.add('sidebar-orb-mode');
            }

            // Cancela expansão enquanto a rolagem continua
            clearTimeout(scrollTimeout);

            // Quando parar de rolar a página:
            scrollTimeout = setTimeout(() => {
                // A bolinha se transforma de volta no card com a animação elástica!
                sidebar.classList.remove('sidebar-orb-mode');
            }, 380);
        } else {
            // No topo da página: sempre aberto como card completo
            clearTimeout(scrollTimeout);
            sidebar.classList.remove('sidebar-orb-mode');
        }
    }, { passive: true });

    // Clicar na bolinha abre imediatamente o card
    sidebar.addEventListener('click', () => {
        if (sidebar.classList.contains('sidebar-orb-mode')) {
            clearTimeout(scrollTimeout);
            sidebar.classList.remove('sidebar-orb-mode');
        }
    });
}

// Inicia quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    initFannedCarousel();
    initCatalogFilters();
    updateWishlistBadge();
    initMorphingSidebar();

    // Fecha modal clicando fora
    const modal = document.getElementById('gameModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeGameModal();
            }
        });
    }

    // Verifica se há visualização específica na URL (?view=about ou ?view=catalog)
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
        switchGameStoreView(viewParam);
    }

    // Verifica se há jogo específico na URL (?game=unique-soul)
    const targetGame = urlParams.get('game');
    if (targetGame && GAMES_DATA[targetGame]) {
        // Se estiver em jogo.html, seleciona o jogo no inspetor
        if (window.selectGameInInspector) {
            window.selectGameInInspector(targetGame);
        } else {
            // Se estiver na home, abre o modal do jogo
            setTimeout(() => {
                openGameModal(targetGame);
            }, 300);
        }
    }
});

// ============================================================
// SISTEMA DE CMS E FEED DINÂMICO (ESTILO INSTAGRAM CREATOR STUDIO)
// Suporta: Criar, Editar, Excluir, Curtir, Upload e Categorias
// ============================================================

const DEFAULT_POSTS = [];
let postsCache = [];
let postsLoaded = false;
let postsLoadPromise = null;

function getStoredPosts() {
    return postsCache;
}

function saveStoredPosts(posts) {
    postsCache = Array.isArray(posts) ? posts : [];
    postsLoaded = true;
    window.dispatchEvent(new Event('qc_posts_updated'));
}

window.loadPosts = async function(force = false) {
    if (postsLoaded && !force) return postsCache;
    if (!postsLoadPromise) {
        postsLoadPromise = window.loadPostsFromApi()
            .then(posts => {
                saveStoredPosts(posts);
                return postsCache;
            })
            .catch(error => {
                console.error('Erro ao carregar publicações:', error);
                throw error;
            })
            .finally(() => { postsLoadPromise = null; });
    }
    return postsLoadPromise;
};

window.addEventListener('qc_posts_loaded', event => {
    postsCache = event.detail;
    postsLoaded = true;
    const editParam = new URLSearchParams(window.location.search).get('edit');
    if (editParam && window.openEditPostModal) window.openEditPostModal(editParam);
});

// Lista de posts curtidos pelo usuário atual
let userLikedPosts = JSON.parse(localStorage.getItem('qc_liked_posts') || '[]');

function isPostLiked(postId) {
    return userLikedPosts.includes(postId);
}

// Formatação amigável de tempo ("há 2 horas", "ontem", etc.)
function formatTimeAgo(isoDate) {
    try {
        const diffMs = Date.now() - new Date(isoDate).getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 2) return 'Agora mesmo';
        if (diffMinutes < 60) return `há ${diffMinutes} min`;
        if (diffHours < 24) return `há ${diffHours} h`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 30) return `há ${diffDays} dias`;
        return new Date(isoDate).toLocaleDateString('pt-BR');
    } catch {
        return 'Recentemente';
    }
}

// Formatação de hashtags e links na legenda
function formatCaptionText(text) {
    if (!text) return '';
    const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return safeText.replace(/#([\wÀ-ÿ]+)/g, '<span class="post-hashtag">#$1</span>');
}

// --- RENDERIZAÇÃO DO FEED ESTILO INSTAGRAM (home.html) ---
window.renderHomeFeed = function(filterCategory = 'all', searchQuery = '') {
    const feedContainer = document.getElementById('homeFeedPosts');
    const emptyState = document.getElementById('feedEmptyState');
    if (!feedContainer) return;

    if (!postsLoaded) {
        feedContainer.innerHTML = '<div class="cms-empty-state"><p>Carregando publicações…</p></div>';
        return;
    }
    const posts = getStoredPosts();
    let filtered = posts.filter(post => {
        const matchCategory = filterCategory === 'all' || post.category === filterCategory;
        const query = searchQuery.toLowerCase();
        const matchSearch = !query || 
            post.title.toLowerCase().includes(query) || 
            post.caption.toLowerCase().includes(query) || 
            post.author.toLowerCase().includes(query);
        return matchCategory && matchSearch;
    });

    const isCreator = (typeof window.isUserCreator === 'function') && window.isUserCreator();

    if (filtered.length === 0) {
        feedContainer.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.innerHTML = `
                <div class="empty-feed-icon-box">
                    <i class="fas fa-feather-alt"></i>
                </div>
                <h4 class="empty-feed-title">Ainda não há postagens</h4>
                <p class="empty-feed-desc">Fique de olho! Em breve novas artes conceituais, devlogs e novidades da equipe serão postadas aqui.</p>
                ${isCreator ? `
                    <a href="cms.html" class="btn-spotlight-play" style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;">
                        <i class="fas fa-plus"></i> Criar Primeira Publicação no CMS
                    </a>
                ` : ''}
            `;
        }
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    feedContainer.innerHTML = filtered.map(post => {
        const liked = isPostLiked(post.id);
        const categoryLabels = {
            devlog: 'Devlog',
            arte: 'Arte Conceitual',
            jogo: 'Destaque de Jogo',
            musica: 'Trilha Sonora',
            novidade: 'Novidade'
        };
        const catLabel = categoryLabels[post.category] || post.category;

        return `
            <article class="instagram-post-card" id="card-${post.id}">
                <!-- Header do Post com Autor e 3 Pontinhos -->
                <header class="ig-post-header">
                    <div class="ig-author-group">
                        <img src="${post.authorAvatar || 'imagens/Logo_colorida.png'}" alt="Avatar" class="ig-author-avatar">
                        <div class="ig-author-meta">
                            <div class="ig-author-title">
                                <span class="ig-author-name">${post.author || 'Qualquer Coisa Rápido'}</span>
                                <i class="fas fa-check-circle verified-badge" title="Canal Oficial"></i>
                            </div>
                            <div class="ig-post-info-row">
                                <span class="ig-post-category-tag">${catLabel}</span>
                                <span class="ig-bullet">•</span>
                                <span class="ig-post-time">${formatTimeAgo(post.date)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Menu de 3 Pontinhos (Ações Administrativas restritas a Criadores) -->
                    <div class="ig-post-menu-wrap">
                        <button type="button" class="ig-more-options-btn" onclick="togglePostDropdown('${post.id}')" aria-label="Mais opções">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <div class="ig-dropdown-menu" id="dropdown-${post.id}">
                            ${isCreator ? `
                                <a href="cms.html?edit=${post.id}"><i class="fas fa-edit"></i> Editar Publicação</a>
                                <button type="button" class="ig-delete-item" onclick="promptDeletePost('${post.id}')"><i class="fas fa-trash-alt"></i> Excluir</button>
                            ` : ''}
                            <button type="button" onclick="sharePostLink('${post.id}')"><i class="fas fa-link"></i> Copiar Link</button>
                        </div>
                    </div>
                </header>

                <!-- Mídia da Publicação (com duplo-toque para curtir estilo Instagram) -->
                <div class="ig-media-box" ondblclick="handleQuickDoubleTapLike('${post.id}')">
                    <img src="${post.mediaUrl}" alt="${post.title}" class="ig-media-img" loading="lazy">
                    <div class="ig-heart-pop" id="heart-pop-${post.id}">
                        <i class="fas fa-heart"></i>
                    </div>
                </div>

                <!-- Barra de Ações (Curtir, Comentar, Compartilhar) -->
                <div class="ig-actions-row">
                    <div class="ig-actions-left">
                        <button type="button" class="ig-action-btn like-btn ${liked ? 'liked' : ''}" onclick="togglePostLike('${post.id}', this)" aria-label="Curtir">
                            <i class="${liked ? 'fas fa-heart' : 'far fa-heart'}"></i>
                        </button>
                        <button type="button" class="ig-action-btn" onclick="alert('Os comentários ainda não estão disponíveis.')" aria-label="Comentar">
                            <i class="far fa-comment"></i>
                        </button>
                        <button type="button" class="ig-action-btn" onclick="sharePostLink('${post.id}')" aria-label="Compartilhar">
                            <i class="far fa-paper-plane"></i>
                        </button>
                    </div>
                    <button type="button" class="ig-action-btn bookmark-btn" onclick="toggleBookmarkPost('${post.id}', this)" aria-label="Salvar">
                        <i class="far fa-bookmark"></i>
                    </button>
                </div>

                <!-- Contagem de Curtidas -->
                <div class="ig-likes-row">
                    <span id="likes-count-${post.id}">${post.likes || 0}</span> curtidas
                </div>

                <!-- Título e Legenda -->
                <div class="ig-caption-block">
                    <h4 class="ig-post-headline">${post.title}</h4>
                    <p class="ig-caption-text">${formatCaptionText(post.caption)}</p>
                </div>
            </article>
        `;
    }).join('');
};

// --- RENDERIZAÇÃO NO PAINEL CMS STUDIO (cms.html) ---
window.renderCmsDashboard = function(filterCategory = 'all', searchQuery = '') {
    const cmsGrid = document.getElementById('cmsPostsList');
    const emptyState = document.getElementById('cmsEmptyState');
    const totalPostsElem = document.getElementById('totalPostsCount');
    const totalLikesElem = document.getElementById('totalLikesCount');
    const carouselPostsElem = document.getElementById('carouselPostsCount');
    const carouselStatus = document.getElementById('cmsCarouselStatus');
    if (!cmsGrid) return;

    if (!postsLoaded) {
        cmsGrid.innerHTML = '<p>Carregando publicações…</p>';
        return;
    }

    const posts = getStoredPosts();
    const carouselPosts = posts.filter(post => post.showInCarousel === true);
    let totalLikes = 0;
    posts.forEach(p => { totalLikes += (p.likes || 0); });

    if (totalPostsElem) totalPostsElem.textContent = posts.length;
    if (totalLikesElem) totalLikesElem.textContent = totalLikes;
    if (carouselPostsElem) carouselPostsElem.textContent = carouselPosts.length;
    if (carouselStatus) {
        const hasCarouselPosts = carouselPosts.length > 0;
        carouselStatus.classList.toggle('is-empty', !hasCarouselPosts);
        carouselStatus.innerHTML = hasCarouselPosts
            ? `<i class="fas fa-check-circle"></i> ${carouselPosts.length} publicaç${carouselPosts.length === 1 ? 'ão aparece' : 'ões aparecem'} no carrossel da página inicial.`
            : '<i class="fas fa-info-circle"></i> O carrossel está oculto na página inicial. Marque uma publicação para exibi-lo.';
    }

    let filtered = posts.filter(post => {
        const matchCategory = filterCategory === 'all' || post.category === filterCategory;
        const query = searchQuery.toLowerCase();
        const matchSearch = !query || 
            post.title.toLowerCase().includes(query) || 
            post.caption.toLowerCase().includes(query) || 
            post.author.toLowerCase().includes(query);
        return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
        cmsGrid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    cmsGrid.innerHTML = filtered.map(post => {
        return `
            <div class="cms-post-item-card" id="cms-card-${post.id}">
                <div class="cms-card-thumb-wrap">
                    <img src="${post.mediaUrl}" alt="${post.title}" class="cms-card-thumb">
                    <span class="card-tag-badge">${post.category.toUpperCase()}</span>
                    ${post.showInCarousel === true ? '<span class="cms-carousel-badge"><i class="fas fa-star"></i> No carrossel</span>' : ''}
                </div>
                <div class="cms-card-info">
                    <span class="cms-meta-date"><i class="far fa-calendar-alt"></i> ${new Date(post.date).toLocaleDateString('pt-BR')} • ${post.author}</span>
                    <h4 class="cms-card-title">${post.title}</h4>
                    <p class="cms-card-snippet">${post.caption.substring(0, 95)}...</p>
                    <div class="cms-card-stats-row">
                        <span><i class="fas fa-heart" style="color:#ff3366;"></i> ${post.likes || 0} curtidas</span>
                        ${post.githubCommit ? `
                            <a href="https://github.com/qualquercoisaoficial69-creator/meu-site/commit/${post.githubCommit}" target="_blank" rel="noopener noreferrer" class="github-commit-badge" title="Ver commit real no GitHub">
                                <i class="fab fa-github"></i> Commit ${post.githubCommit.substring(0, 7)}
                            </a>
                        ` : ''}
                    </div>
                </div>
                <div class="cms-card-actions">
                    <button type="button" class="btn-cms-edit" onclick="openEditPostModal('${post.id}')" title="Editar postagem">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button type="button" class="btn-cms-delete" onclick="promptDeletePost('${post.id}')" title="Excluir postagem">
                        <i class="fas fa-trash-alt"></i> Excluir
                    </button>
                    <a href="home.html" class="btn-cms-view" title="Ver página inicial">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');
};

// --- CURTIR / LIKES EM TEMPO REAL ---
window.togglePostLike = async function(postId, button) {
    const posts = getStoredPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const likedIndex = userLikedPosts.indexOf(postId);
    const counterElem = document.getElementById(`likes-count-${postId}`);
    if (!window.getCurrentUser?.()) {
        try {
            await window.loginWithGoogle();
        } catch {
            return;
        }
        if (!window.getCurrentUser?.()) return;
    }
    if (button) button.disabled = true;
    try {
        const result = await window.updatePostLikesInFirestore(postId);
        post.likes = Math.max(0, (post.likes || 0) + (result.liked ? 1 : -1));
        if (result.liked && likedIndex < 0) userLikedPosts.push(postId);
        if (!result.liked && likedIndex >= 0) userLikedPosts.splice(likedIndex, 1);
        if (button) {
            button.classList.toggle('liked', result.liked);
            const icon = button.querySelector('i');
            if (icon) icon.className = result.liked ? 'fas fa-heart' : 'far fa-heart';
        }
        if (counterElem) counterElem.textContent = post.likes;
        localStorage.setItem('qc_liked_posts', JSON.stringify(userLikedPosts));
        saveStoredPosts(posts);
    } catch (error) {
        alert(error.message);
    } finally {
        if (button) button.disabled = false;
    }
};

// Duplo clique na imagem (estilo Instagram)
window.handleQuickDoubleTapLike = function(postId) {
    const pop = document.getElementById(`heart-pop-${postId}`);
    if (pop) {
        pop.classList.add('pop');
        setTimeout(() => pop.classList.remove('pop'), 850);
    }

    // Se ainda não tiver curtido, curte
    if (!isPostLiked(postId)) {
        const likeBtn = document.querySelector(`#card-${postId} .like-btn`);
        togglePostLike(postId, likeBtn);
    }
};

window.toggleBookmarkPost = function(postId, btn) {
    if (!btn) return;
    btn.classList.toggle('bookmarked');
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = btn.classList.contains('bookmarked') ? 'fas fa-bookmark' : 'far fa-bookmark';
    }
};

window.sharePostLink = function(postId) {
    const url = `${window.location.origin}${window.location.pathname}#card-${postId}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('Link da publicação copiado para a área de transferência!');
        });
    } else {
        prompt('Copie o link desta publicação:', url);
    }
};

// Menu de 3 pontinhos
window.togglePostDropdown = function(postId) {
    document.querySelectorAll('.ig-dropdown-menu').forEach(menu => {
        if (menu.id !== `dropdown-${postId}`) menu.classList.remove('show');
    });
    const target = document.getElementById(`dropdown-${postId}`);
    if (target) target.classList.toggle('show');
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.ig-post-menu-wrap')) {
        document.querySelectorAll('.ig-dropdown-menu').forEach(menu => menu.classList.remove('show'));
    }
});

// --- OPERAÇÕES DO CMS (CRIAR, EDITAR, EXCLUIR) ---
let postToDeleteId = null;

window.promptDeletePost = function(postId) {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    if (!window.isUserCreator || !window.isUserCreator(user)) {
        alert("Atenção: Apenas administradores e criadores autorizados podem excluir publicações!");
        return;
    }
    postToDeleteId = postId;
    const modal = document.getElementById('cmsDeleteConfirmModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    } else {
        if (confirm('Tem certeza que deseja excluir esta publicação do site?')) {
            executeDeletePost(postId);
        }
    }
};

window.closeDeleteConfirmModal = function() {
    const modal = document.getElementById('cmsDeleteConfirmModal');
    if (modal) {
        if (modal.contains(document.activeElement)) document.activeElement.blur();
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
    postToDeleteId = null;
};

async function executeDeletePost(postId) {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    if (!window.isUserCreator || !window.isUserCreator(user)) {
        alert("Atenção: Apenas administradores e criadores autorizados podem excluir publicações!");
        return;
    }
    try {
        await window.deletePostFromFirestore(postId);
        saveStoredPosts(getStoredPosts().filter(post => post.id !== postId));
    } catch (error) {
        alert(`Não foi possível excluir a publicação: ${error.message}`);
        return;
    }

    closeDeleteConfirmModal();

    if (window.renderCmsDashboard) window.renderCmsDashboard();
    if (window.renderCmsCarousel) window.renderCmsCarousel();
}

const confirmDeleteBtn = document.getElementById('confirmDeleteActionBtn');
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (postToDeleteId) {
            confirmDeleteBtn.disabled = true;
            await executeDeletePost(postToDeleteId);
            confirmDeleteBtn.disabled = false;
        }
    });
}

// Abrir modal de criação (Verifica se é criador autorizado)
window.openNewPostModal = async function() {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;

    if (!user) {
        if (confirm("Você precisa estar conectado com o Google para publicar no site. Deseja fazer login agora?")) {
            await window.loginWithGoogle();
        }
        return;
    }

    if (window.isUserCreator && !window.isUserCreator(user)) {
        alert("Atenção: A sua conta Google (" + user.email + ") é de Membro da Comunidade. Apenas e-mails autorizados da equipe de desenvolvimento podem publicar novidades no site.");
        return;
    }

    const modal = document.getElementById('cmsPostModal');
    const form = document.getElementById('cmsPostForm');
    const titleText = document.getElementById('cmsModalTitleText');
    const submitBtnText = document.getElementById('cmsSubmitBtnText');
    const previewImg = document.getElementById('cmsMediaPreviewImg');
    const editId = document.getElementById('editPostId');

    if (form) form.reset();
    if (editId) editId.value = '';
    if (titleText) titleText.textContent = 'Nova Publicação';
    if (submitBtnText) submitBtnText.textContent = 'Salvar publicação';
    if (previewImg) previewImg.src = 'imagens/unique_soul_cenario.png';
    if (typeof window.updateGitHubStatusUI === 'function') window.updateGitHubStatusUI();
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
};

// Abrir modal de edição com dados pré-carregados (Restrito a criadores)
window.openEditPostModal = function(postId) {
    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    if (!window.isUserCreator || !window.isUserCreator(user)) {
        alert("Atenção: Apenas administradores e criadores autorizados podem editar publicações!");
        return;
    }

    const posts = getStoredPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const modal = document.getElementById('cmsPostModal');
    const titleText = document.getElementById('cmsModalTitleText');
    const submitBtnText = document.getElementById('cmsSubmitBtnText');
    const editId = document.getElementById('editPostId');

    const titleInput = document.getElementById('postTitleInput');
    const catSelect = document.getElementById('postCategorySelect');
    const authorSelect = document.getElementById('postAuthorSelect');
    const captionTextarea = document.getElementById('postCaptionTextarea');
    const showInCarousel = document.getElementById('postShowInCarousel');
    const urlInput = document.getElementById('cmsMediaUrlInput');
    const previewImg = document.getElementById('cmsMediaPreviewImg');

    if (editId) editId.value = post.id;
    if (titleText) titleText.textContent = 'Editar Publicação';
    if (submitBtnText) submitBtnText.textContent = 'Salvar Alterações';

    if (titleInput) titleInput.value = post.title;
    if (catSelect) catSelect.value = post.category || 'devlog';
    if (authorSelect) authorSelect.value = post.author || 'Qualquer Coisa Rápido';
    if (captionTextarea) captionTextarea.value = post.caption;
    if (showInCarousel) showInCarousel.checked = post.showInCarousel === true;
    if (urlInput) urlInput.value = post.mediaUrl;
    if (previewImg) previewImg.src = post.mediaUrl;

    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
};

window.closeCmsPostModal = function() {
    const modal = document.getElementById('cmsPostModal');
    if (modal) {
        if (modal.contains(document.activeElement)) document.activeElement.blur();
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
};

// --- ENVIO PROTEGIDO DE MÍDIA VIA VERCEL ---
let pendingMediaFile = null;

window.updateGitHubStatusUI = function() {
    const btn = document.getElementById('githubStatusBtn');
    const text = document.getElementById('githubStatusText');
    if (!btn || !text) return;

    btn.className = 'btn-github-status connected';
    text.innerHTML = '<i class="fas fa-shield-alt"></i> Envio protegido';
    btn.title = 'As mídias são enviadas pela Vercel sem expor o token do GitHub.';
};

window.openGitHubTokenModal = function() {
    const modal = document.getElementById('githubTokenModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
};

window.closeGitHubTokenModal = function() {
    const modal = document.getElementById('githubTokenModal');
    if (modal) {
        if (modal.contains(document.activeElement)) document.activeElement.blur();
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
};

// Converte arquivo para Base64 puro
function fileToBase64Pure(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            const base64Index = result.indexOf(';base64,');
            if (base64Index > -1) {
                resolve(result.substring(base64Index + 8));
            } else {
                resolve(result);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Envia a mídia à função da Vercel; o token do GitHub nunca chega ao navegador.
async function commitMediaToGitHub(file, postTitle) {
    const firebaseUser = typeof firebase !== 'undefined' ? firebase.auth().currentUser : null;
    if (!firebaseUser) throw new Error('Faça login novamente para enviar uma mídia.');

    const base64Content = await fileToBase64Pure(file);
    const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await firebaseUser.getIdToken()}`
        },
        body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            content: base64Content,
            postTitle
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro no envio da imagem: ${res.status}`);
    }

    return res.json();
}

// Salvar / Atualizar Publicação
window.handleSavePost = async function(e) {
    e.preventDefault();

    const user = window.getCurrentUser ? window.getCurrentUser() : null;
    if (!window.isUserCreator || !window.isUserCreator(user)) {
        alert("Atenção: Apenas administradores e criadores autorizados podem salvar publicações!");
        return;
    }

    const editId = document.getElementById('editPostId')?.value.trim();
    const title = document.getElementById('postTitleInput')?.value.trim();
    const category = document.getElementById('postCategorySelect')?.value;
    const author = document.getElementById('postAuthorSelect')?.value;
    const caption = document.getElementById('postCaptionTextarea')?.value.trim();
    const showInCarousel = document.getElementById('postShowInCarousel')?.checked === true;
    const previewImg = document.getElementById('cmsMediaPreviewImg');
    const submitBtn = document.getElementById('cmsSubmitBtn');

    let mediaUrl = previewImg?.src || 'imagens/unique_soul_cenario.png';
    let commitData = null;

    if (!title || !caption) {
        alert('Por favor, preencha o título e a legenda da publicação.');
        return;
    }

    // Se o criador selecionou uma imagem local do computador, envia o commit real pro GitHub!
    if (pendingMediaFile) {
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando commit para o GitHub...';
            }

            commitData = await commitMediaToGitHub(pendingMediaFile, title);
            mediaUrl = commitData.rawUrl;
            pendingMediaFile = null;
        } catch (err) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
            alert('Aviso sobre o envio para o GitHub:\n' + err.message);
            return;
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        }
    }

    const authorAvatars = {
        'Brenno': 'imagens/brenno-icon.jpeg',
        'Enzo': 'imagens/en.jpg',
        'Iza': 'imagens/iz.jpg',
        'Gustavo': 'imagens/gus.jpg',
        'João': 'imagens/jo.jpg',
        'Maryssa': 'imagens/ma.jpg',
        'Qualquer Coisa Rápido': 'imagens/Logo_colorida.png'
    };

    const posts = getStoredPosts();
    const existingPost = editId ? posts.find(post => post.id === editId) : null;
    const postToSync = {
        ...(existingPost || {}),
        id: editId || `post-${Date.now()}`,
        title,
        category,
        author,
        authorAvatar: authorAvatars[author] || 'imagens/Logo_colorida.png',
        mediaUrl,
        caption,
        showInCarousel,
        likes: existingPost?.likes || 0,
        date: existingPost?.date || new Date().toISOString(),
        lastEdited: editId ? new Date().toISOString() : undefined,
        ...(commitData ? { githubCommit: commitData.commitSha, githubCommitUrl: commitData.commitHtmlUrl } : {})
    };

    try {
        await window.savePostToFirestore(postToSync);
    } catch (error) {
        alert(`Não foi possível salvar a publicação: ${error.message}`);
        return;
    }
    const nextPosts = editId
        ? posts.map(post => post.id === editId ? postToSync : post)
        : [postToSync, ...posts];
    saveStoredPosts(nextPosts);

    closeCmsPostModal();

    if (window.renderCmsDashboard) window.renderCmsDashboard();
    if (window.renderCmsCarousel) window.renderCmsCarousel();

    if (commitData) {
        alert(`🎉 Publicação postada com sucesso!\n\n🚀 COMMIT REALIZADO NO GITHUB:\n• Arquivo: ${commitData.path}\n• Commit SHA: ${commitData.commitSha.substring(0, 7)}\n• Mensagem: cms: upload da mídia via Creator Studio\n\nAcesse o repositório para conferir o novo commit!`);
    } else {
        alert(editId ? 'Publicação atualizada com sucesso!' : 'Publicação criada com sucesso!');
    }
};

// Manipulação de mídia (Arquivo local ou URL)
window.handleMediaFileSelect = function(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 3 * 1024 * 1024) {
            alert('Escolha uma imagem de até 3 MB para publicar.');
            e.target.value = '';
            return;
        }
        pendingMediaFile = file;
        const reader = new FileReader();
        reader.onload = function(evt) {
            const preview = document.getElementById('cmsMediaPreviewImg');
            if (preview) preview.src = evt.target.result;
            const syncIndicator = document.getElementById('githubSyncIndicator');
            if (syncIndicator) syncIndicator.classList.add('active');
        };
        reader.readAsDataURL(file);
    }
};

window.handleMediaUrlInput = function(e) {
    pendingMediaFile = null;
    const url = e.target.value.trim();
    if (url) {
        const preview = document.getElementById('cmsMediaPreviewImg');
        if (preview) preview.src = url;
        const syncIndicator = document.getElementById('githubSyncIndicator');
        if (syncIndicator) syncIndicator.classList.remove('active');
    }
};

window.setPresetMedia = function(path) {
    pendingMediaFile = null;
    const preview = document.getElementById('cmsMediaPreviewImg');
    const input = document.getElementById('cmsMediaUrlInput');
    if (preview) preview.src = path;
    if (input) input.value = path;
    const syncIndicator = document.getElementById('githubSyncIndicator');
    if (syncIndicator) syncIndicator.classList.remove('active');
};

// Clique na caixa de dropzone abre o seletor de arquivos
const dropzone = document.getElementById('cmsMediaDropzone');
if (dropzone) {
    dropzone.addEventListener('click', () => {
        const fileInput = document.getElementById('cmsMediaFileInput');
        if (fileInput) fileInput.click();
    });
}

// Filtros do Feed e do CMS
window.filterFeedCategory = function(cat, tabBtn) {
    document.querySelectorAll('.catalog-filter-tabs .catalog-tab').forEach(t => t.classList.remove('active'));
    if (tabBtn) tabBtn.classList.add('active');
    const searchInput = document.getElementById('catalogSearch');
    window.renderHomeFeed(cat, searchInput ? searchInput.value : '');
};

window.filterCmsPosts = function(cat, tabBtn) {
    document.querySelectorAll('.cms-filter-group .catalog-tab').forEach(t => t.classList.remove('active'));
    if (tabBtn) tabBtn.classList.add('active');
    const searchInput = document.getElementById('cmsSearchInput');
    window.renderCmsDashboard(cat, searchInput ? searchInput.value : '');
};

// Filtro e Busca ao Vivo para Página de Membros
window.filterMembers = function(query) {
    const q = (query || '').toLowerCase().trim();
    const banners = document.querySelectorAll('.gamestore-member-banner');
    banners.forEach(b => {
        const name = (b.getAttribute('data-name') || '').toLowerCase();
        const role = (b.getAttribute('data-role') || '').toLowerCase();
        const text = b.textContent.toLowerCase();
        if (!q || name.includes(q) || role.includes(q) || text.includes(q)) {
            b.style.display = 'flex';
        } else {
            b.style.display = 'none';
        }
    });
};

// --- VERIFICAÇÃO DE SEGURANÇA E ACESSO AO CMS ---
window.verifyCmsAccess = function() {
    const isCmsPage = document.body.classList.contains('cms-studio-body') || window.location.pathname.includes('cms.html');
    if (!isCmsPage) return;

    const u = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    const isCreator = (typeof window.isUserCreator === 'function') && window.isUserCreator(u);

    const lockedView = document.getElementById('cmsAccessDenied');
    const unlockedView = document.getElementById('cmsStudioUnlocked');
    const newPostTopBtn = document.querySelector('.btn-cms-new');

    if (isCreator) {
        if (lockedView) lockedView.style.display = 'none';
        if (unlockedView) unlockedView.style.display = 'block';
        if (newPostTopBtn) newPostTopBtn.style.display = 'inline-flex';
        if (window.renderCmsDashboard) window.renderCmsDashboard();
    } else {
        if (lockedView) lockedView.style.display = 'flex';
        if (unlockedView) unlockedView.style.display = 'none';
        if (newPostTopBtn) newPostTopBtn.style.display = 'none';
    }
};

// Inicialização automática do Feed e do CMS
document.addEventListener('DOMContentLoaded', () => {
    // Atualiza o status do envio protegido de mídias no CMS
    if (typeof window.updateGitHubStatusUI === 'function') {
        window.updateGitHubStatusUI();
    }

    // Validação de acesso restrito caso esteja no CMS
    if (typeof window.verifyCmsAccess === 'function') {
        window.verifyCmsAccess();
    }

    // Renderiza se os containers existirem na página atual
    if (document.getElementById('cmsCarousel')) window.renderCmsCarousel();
    if (document.getElementById('cmsPostsList')) window.renderCmsDashboard();

    window.loadPosts().catch(error => {
        const feedContainer = document.getElementById('homeFeedPosts');
        const cmsGrid = document.getElementById('cmsPostsList');
        const homeEmptyState = document.getElementById('homePostsEmpty');
        if (feedContainer) feedContainer.innerHTML = `<div class="cms-empty-state"><p>Não foi possível carregar as publicações: ${escapeCarouselText(error.message)}</p></div>`;
        if (cmsGrid) cmsGrid.innerHTML = `<p>Não foi possível carregar as publicações: ${escapeCarouselText(error.message)}</p>`;
        if (homeEmptyState) {
            homeEmptyState.hidden = false;
            homeEmptyState.innerHTML = `
                <i class="fas fa-circle-exclamation" aria-hidden="true"></i>
                <h2>Não foi possível carregar as publicações</h2>
                <p>${escapeCarouselText(error.message || 'Verifique sua conexão e tente novamente.')}</p>
            `;
        }
    });

    // Busca ao vivo na Home
    const feedSearch = document.getElementById('catalogSearch');
    if (feedSearch) {
        feedSearch.addEventListener('input', (e) => {
            const activeTab = document.querySelector('.catalog-filter-tabs .catalog-tab.active');
            const cat = activeTab ? activeTab.getAttribute('data-filter') : 'all';
            window.renderHomeFeed(cat, e.target.value);
        });
    }

    // Busca ao vivo no CMS
    const cmsSearch = document.getElementById('cmsSearchInput');
    if (cmsSearch) {
        cmsSearch.addEventListener('input', (e) => {
            const activeTab = document.querySelector('.cms-filter-group .catalog-tab.active');
            const cat = activeTab ? activeTab.getAttribute('data-cms-filter') : 'all';
            window.renderCmsDashboard(cat, e.target.value);
        });
    }

    // Sincronização entre abas
    window.addEventListener('qc_posts_updated', () => {
        if (document.getElementById('cmsCarousel')) window.renderCmsCarousel();
        if (document.getElementById('cmsPostsList')) window.renderCmsDashboard();
        if (document.getElementById('homeFeedPosts')) window.renderHomeFeed();
    });

    // Se vier com ?edit=postId na URL
});

