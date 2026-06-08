/**
 * ============================================================
 * MAJESTÉ MARKET — app.js
 * Application principale SPA
 * by MAHOUTO X-PRO | +229 96 09 76 44 | mahoutoxpro@gmail.com
 * Cotonou, Bénin
 * ============================================================
 */

import { router } from "./router.js";
import {
  auth,
  db,
  storage,
  googleProvider,
} from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── État global de l'application ──
const AppState = {
  currentUser: null,
  userProfile: null,
  isLoading: false,
  chatListeners: [],
  notifListener: null,
};

// ── Métiers mis en avant ──
const CATEGORIES = [
  { id: "imprimerie", name: "Imprimerie", icon: "🖨️", color: "#c9a84c" },
  { id: "serigraphie", name: "Sérigraphie", icon: "🎨", color: "#00d4ff" },
  { id: "developpement-web", name: "Dev Web", icon: "💻", color: "#8b5cf6" },
  { id: "graphisme", name: "Graphisme", icon: "✏️", color: "#f59e0b" },
  { id: "mode-couture", name: "Mode & Couture", icon: "👗", color: "#ec4899" },
  { id: "electronicien", name: "Électronicien", icon: "⚡", color: "#22c55e" },
  { id: "photographie", name: "Photographie", icon: "📸", color: "#06b6d4" },
  { id: "menuiserie", name: "Menuiserie", icon: "🪚", color: "#d97706" },
  { id: "plomberie", name: "Plomberie", icon: "🔧", color: "#3b82f6" },
  { id: "maçonnerie", name: "Maçonnerie", icon: "🏗️", color: "#6b7280" },
  { id: "coiffure", name: "Coiffure", icon: "✂️", color: "#a855f7" },
  { id: "restauration", name: "Restauration", icon: "🍽️", color: "#ef4444" },
];

// ── Demo data pour le rendu hors ligne ──
const DEMO_SERVICES = [
  {
    id: "demo1",
    title: "Création Logo Professionnel",
    category: "graphisme",
    price: 15000,
    currency: "FCFA",
    rating: 4.8,
    reviews: 47,
    providerName: "Studio Koffi Design",
    providerAvatar: "SK",
    verified: true,
    icon: "✏️",
    description: "Logo vectoriel + charte graphique complète",
    tags: ["logo", "identité visuelle", "branding"],
  },
  {
    id: "demo2",
    title: "Site Web Vitrine 5 pages",
    category: "developpement-web",
    price: 75000,
    currency: "FCFA",
    rating: 4.9,
    reviews: 32,
    providerName: "TechBénin Solutions",
    providerAvatar: "TB",
    verified: true,
    icon: "💻",
    description: "Site responsive, rapide, SEO optimisé",
    tags: ["site web", "responsive", "SEO"],
  },
  {
    id: "demo3",
    title: "Impression Flyers 1000 exemplaires",
    category: "imprimerie",
    price: 25000,
    currency: "FCFA",
    rating: 4.7,
    reviews: 89,
    providerName: "Print Express Cotonou",
    providerAvatar: "PE",
    verified: true,
    icon: "🖨️",
    description: "Format A5, papier couché 130g, livraison incluse",
    tags: ["impression", "flyers", "pub"],
  },
  {
    id: "demo4",
    title: "T-shirts personnalisés sérigraphiés",
    category: "serigraphie",
    price: 8000,
    currency: "FCFA",
    rating: 4.6,
    reviews: 124,
    providerName: "Séri-Art Bénin",
    providerAvatar: "SA",
    verified: false,
    icon: "🎨",
    description: "Par unité, minimum 10 pièces. Couleurs illimitées.",
    tags: ["t-shirt", "sérigraphie", "vêtements"],
  },
  {
    id: "demo5",
    title: "Robe de soirée sur mesure",
    category: "mode-couture",
    price: 45000,
    currency: "FCFA",
    rating: 5.0,
    reviews: 28,
    providerName: "Maison Adjovi Couture",
    providerAvatar: "MA",
    verified: true,
    icon: "👗",
    description: "Tissu wax ou bazin, style africain contemporain",
    tags: ["couture", "wax", "sur mesure"],
  },
  {
    id: "demo6",
    title: "Installation & Dépannage Électrique",
    category: "electronicien",
    price: 20000,
    currency: "FCFA",
    rating: 4.8,
    reviews: 63,
    providerName: "Elec Pro Services",
    providerAvatar: "EP",
    verified: true,
    icon: "⚡",
    description: "Résidentiel et commercial, devis gratuit",
    tags: ["électricité", "installation", "dépannage"],
  },
];

// ════════════════════════════════════════════════════════════
// 🔧 UTILITAIRES
// ════════════════════════════════════════════════════════════

/**
 * Affiche un toast de notification
 */
function showToast(message, type = "info", duration = 3500) {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("exit");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Affiche/cache le loader global
 */
function setLoading(show, message = "Chargement...") {
  const existing = document.getElementById("global-loader");
  if (show) {
    if (!existing) {
      const loader = document.createElement("div");
      loader.id = "global-loader";
      loader.className = "loader-overlay";
      loader.innerHTML = `
        <div class="font-display text-gold" style="font-size:1.2rem;margin-bottom:1rem;">MAJESTÉ MARKET</div>
        <div class="loader-ring"></div>
        <p class="font-ui text-muted" style="letter-spacing:0.15em;font-size:0.8rem;text-transform:uppercase;">${message}</p>
      `;
      document.body.appendChild(loader);
    }
  } else {
    if (existing) existing.remove();
  }
}

/**
 * Formate un prix en FCFA
 */
function formatPrice(amount) {
  return new Intl.NumberFormat("fr-BJ", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Génère les étoiles de notation
 */
function renderStars(rating) {
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= Math.round(rating) ? "filled" : ""}">★</span>`;
  }
  html += "</span>";
  return html;
}

/**
 * Formate une date Firebase
 */
function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("fr-BJ", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/**
 * Formate une heure relative
 */
function timeAgo(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  return formatDate(timestamp);
}

/**
 * Génère les initiales d'un nom
 */
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ════════════════════════════════════════════════════════════
// 🏠 COMPOSANTS RÉUTILISABLES
// ════════════════════════════════════════════════════════════

/**
 * Composant Navbar
 */
function NavbarHTML() {
  const user = AppState.currentUser;
  const profile = AppState.userProfile;

  return `
  <nav class="navbar">
    <a class="navbar-brand" onclick="router.push('home')" style="cursor:pointer;padding-left:16px;min-width:0;flex-shrink:1;overflow:hidden;">
      <span style="font-family:'Cinzel Decorative',serif;font-weight:400;color:#c9a84c;font-size:clamp(0.75rem,3.5vw,1rem);letter-spacing:0.12em;text-shadow:0 0 16px rgba(201,168,76,0.5);white-space:nowrap;display:block;">ProMétiers</span>
    </a>

    <ul class="nav-links" id="nav-links">
      <li><button class="nav-link" onclick="router.push('home')" aria-label="Accueil">Accueil</button></li>
      <li><button class="nav-link" onclick="router.push('marketplace')" aria-label="Marketplace des services">Marketplace</button></li>
      ${user ? `
        <li><button class="nav-link" onclick="router.push('dashboard')">Dashboard</button></li>
        <li><button class="nav-link" onclick="router.push('chat')">Messages</button></li>
      ` : ""}
    </ul>

    <div class="flex items-center gap-1">
      ${user ? `
        <div style="position:relative">
          <button class="avatar avatar-sm" id="user-menu-btn" onclick="toggleUserMenu()" title="${profile?.displayName || user.email}">
            ${profile?.photoURL
              ? `<img src="${profile.photoURL}" alt="Photo de profil" loading="lazy" decoding="async" width="52" height="52" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/>`
              : getInitials(profile?.displayName || user.email)}
          </button>
          <div id="user-dropdown" class="glass" style="display:none;position:absolute;top:calc(100% + 8px);right:0;min-width:200px;padding:0.5rem;z-index:2000">
            <div style="padding:0.75rem 1rem;border-bottom:1px solid rgba(201,168,76,0.2);margin-bottom:0.25rem">
              <div class="font-ui font-bold" style="font-size:0.9rem">${profile?.displayName || "Professionnel"}</div>
              <div class="text-muted text-xs">${user.email}</div>
              ${profile?.role === "pro" ? '<div class="badge badge-gold mt-1">Professionnel</div>' : ""}
              ${profile?.role === "admin" ? '<div class="badge badge-neon mt-1">Admin</div>' : ""}
            </div>
            <button class="sidebar-link" onclick="router.push('dashboard');toggleUserMenu()">📊 Dashboard</button>
            <button class="sidebar-link" onclick="router.push('profile/'+AppState.currentUser.uid);toggleUserMenu()">👤 Mon profil</button>
            <button class="sidebar-link" onclick="router.push('settings');toggleUserMenu()">⚙️ Paramètres</button>
            ${profile?.role === "admin" ? `<button class="sidebar-link" onclick="router.push('admin');toggleUserMenu()">🛡️ Admin</button>` : ""}
            <div class="divider-gold"></div>
            <button class="sidebar-link" style="color:var(--danger)" onclick="handleLogout()">🚪 Déconnexion</button>
          </div>
        </div>
      ` : `
        <button class="btn btn-outline btn-sm" onclick="router.push('login')">Connexion</button>
        <button class="btn btn-gold btn-sm" onclick="router.push('register')">S'inscrire</button>
      `}
    </div>
  </nav>

  <!-- Mobile Bottom Navigation -->
  <nav class="bottom-nav" id="bottom-nav">
    <button class="bottom-nav-item" onclick="router.push('home')">
      <span class="bottom-nav-icon">🏠</span>
      <span>Accueil</span>
    </button>
    <button class="bottom-nav-item" onclick="router.push('marketplace')">
      <span class="bottom-nav-icon">🛒</span>
      <span>Services</span>
    </button>
    ${user ? `
      <button class="bottom-nav-item" onclick="router.push('dashboard')">
        <span class="bottom-nav-icon">📊</span>
        <span>Dashboard</span>
      </button>
      <button class="bottom-nav-item" onclick="router.push('chat')">
        <span class="bottom-nav-icon">💬</span>
        <span>Messages</span>
      </button>
    ` : `
      <button class="bottom-nav-item" onclick="router.push('login')">
        <span class="bottom-nav-icon">🔐</span>
        <span>Connexion</span>
      </button>
    `}
    <button class="bottom-nav-item" onclick="router.push('profile-public')">
      <span class="bottom-nav-icon">👤</span>
      <span>Profil</span>
    </button>
  </nav>`;
}

/**
 * Composant Footer
 */
function FooterHTML() {
  return `
  <footer style="background:rgba(0,0,0,0.5);border-top:1px solid rgba(201,168,76,0.15);padding:3rem 0;margin-top:4rem">
    <div class="container">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem;margin-bottom:2rem">
        <div>
          <div class="font-display text-gold" style="font-size:1.1rem;margin-bottom:0.75rem">MAJESTÉ MARKET</div>
          <p class="text-muted text-sm" style="line-height:1.7">La marketplace professionnelle africaine. Connectez-vous avec les meilleurs talents du Bénin.</p>
        </div>
        <div>
          <div class="font-ui font-bold" style="font-size:0.8rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--gold);margin-bottom:0.75rem">Navigation</div>
          <div class="flex flex-col gap-1">
            <button class="sidebar-link" style="padding:0.3rem 0" onclick="router.push('home')">Accueil</button>
            <button class="sidebar-link" style="padding:0.3rem 0" onclick="router.push('marketplace')">Marketplace</button>
            <button class="sidebar-link" style="padding:0.3rem 0" onclick="router.push('register')">Devenir Pro</button>
          </div>
        </div>
        <div>
          <div class="font-ui font-bold" style="font-size:0.8rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--gold);margin-bottom:0.75rem">Contact</div>
          <div class="flex flex-col gap-1 text-sm text-muted">
            <a href="https://wa.me/22996097644" target="_blank" style="color:var(--success);text-decoration:none">📱 WhatsApp : +229 96 09 76 44</a>
            <a href="mailto:mahoutoxpro@gmail.com" style="color:var(--neon-blue);text-decoration:none">✉️ mahoutoxpro@gmail.com</a>
            <span>📍 Cotonou, Bénin</span>
          </div>
        </div>
      </div>
      <div class="divider-gold"></div>
      <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:1rem">
        <p class="text-muted text-xs"><span style="font-family:Montserrat,Rajdhani,sans-serif;font-weight:600;color:#00FFFF;font-size:10px;word-break:break-word;">© ${new Date().getFullYear()} MAJESTÉ MARKET — MAHOUTO X-PRO by MAJESTÉ PRESSE. Tous droits réservés.</span></p>
        <div class="flex gap-1">
          <span class="badge badge-gold">🇧🇯 Made in Bénin</span>
          <span class="badge badge-neon">PWA Ready</span>
        </div>
      </div>
    </div>
  </footer>`;
}

// ════════════════════════════════════════════════════════════
// 📄 PAGES
// ════════════════════════════════════════════════════════════

/**
 * PAGE : Accueil
 */
function PageHome() {
  return `
  ${NavbarHTML()}
  <div class="page" style="overflow-x:hidden;">

    <!-- Hero -->
    <section class="hero">
      <div class="hero-grid"></div>
      <div style="position:relative;z-index:1;max-width:800px;width:100%;padding:0 20px;box-sizing:border-box;">
        <div class="badge badge-neon mb-4 float" style="font-size:0.75rem">
          🌍 Plateforme N°1 au Bénin
        </div>
        <h1 class="hero-title" style="content-visibility:auto">MAJESTÉ MARKET</h1>
        <p class="hero-subtitle" style="font-family:Montserrat,Rajdhani,sans-serif;font-weight:600;color:#00FFFF;text-shadow:0 0 16px rgba(0,255,255,0.5);font-size:11px;letter-spacing:0.12em;text-align:center;width:100%;padding:0 20px;box-sizing:border-box;word-break:break-word;white-space:normal;text-transform:uppercase;line-height:1.6;">MAHOUTO X-PRO by MAJESTÉ PRESSE<br/>Cotonou, Bénin</p>
        <p class="hero-desc">
          Découvrez les meilleurs professionnels et entreprises du Bénin.
          Imprimerie, graphisme, développement web, couture, électronique et plus encore.
        </p>
        <div class="flex items-center justify-center gap-2" style="flex-wrap:wrap">
          <button class="btn btn-gold btn-lg" onclick="router.push('marketplace')">
            🛒 Explorer les services
          </button>
          <button class="btn btn-neon btn-lg" onclick="router.push('register')">
            ✨ Devenir professionnel
          </button>
        </div>

        <!-- Stats rapides -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;max-width:480px;margin:3rem auto 0">
          ${[
            { n: "500+", l: "Professionnels" },
            { n: "2K+", l: "Services" },
            { n: "98%", l: "Satisfaction" },
          ].map(s => `
            <div class="glass" style="padding:1rem;text-align:center">
              <div class="font-display text-gold" style="font-size:1.5rem">${s.n}</div>
              <div class="text-muted text-xs font-ui" style="letter-spacing:0.08em;text-transform:uppercase">${s.l}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    <!-- Catégories — chargement différé -->
    <section class="section">
      <div class="container">
        <div class="text-center mb-4">
          <h2 class="font-ui" style="font-size:1.8rem;color:var(--gold)">Nos Métiers</h2>
          <p class="text-muted mt-1">Des professionnels qualifiés dans tous les secteurs</p>
        </div>
        <div class="category-grid">
          ${CATEGORIES.map(cat => `
            <div class="glass glass-hover category-card p-4" onclick="filterCategory('${cat.id}')">
              <div class="category-icon">${cat.icon}</div>
              <div class="category-name">${cat.name}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    <!-- Services en vedette -->
    <section class="section" style="background:rgba(255,255,255,0.01)">
      <div class="container">
        <div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:1rem">
          <div>
            <h2 class="font-ui" style="font-size:1.8rem;color:var(--gold)">Services en Vedette</h2>
            <p class="text-muted mt-1">Les offres les mieux notées cette semaine</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="router.push('marketplace')">Voir tout →</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem" id="featured-services">
          ${DEMO_SERVICES.slice(0, 3).map(s => ServiceCardHTML(s)).join("")}
        </div>
      </div>
    </section>

    <!-- CTA Professionnel -->
    <section class="section">
      <div class="container-sm text-center">
        <div class="glass" style="padding:3rem 2rem;position:relative;overflow:hidden">
          <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 60% at 50% 50%,rgba(201,168,76,0.06) 0%,transparent 70%);pointer-events:none"></div>
          <div style="position:relative">
            <div class="badge badge-gold mb-4" style="font-size:0.8rem">✅ Vérification professionnelle</div>
            <h2 class="font-ui" style="font-size:2rem;color:var(--gold);margin-bottom:1rem">Rejoignez MAJESTÉ MARKET</h2>
            <p class="text-muted" style="margin-bottom:2rem;line-height:1.7">
              Créez votre profil professionnel, proposez vos services et développez votre clientèle à travers tout le Bénin.
            </p>
            <div class="flex items-center justify-center gap-2" style="flex-wrap:wrap">
              <button class="btn btn-gold btn-lg" onclick="router.push('register')">Créer mon profil Pro</button>
              <a href="https://wa.me/22996097644" target="_blank" class="btn btn-ghost btn-lg">💬 Contactez-nous</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${FooterHTML()}
  </div>`;
}

/**
 * Composant carte service
 */
function ServiceCardHTML(service) {
  const cat = CATEGORIES.find(c => c.id === service.category);
  return `
  <div class="glass glass-hover service-card p-6" onclick="router.push('service/${service.id}')">
    <div class="service-card-img">${service.icon || cat?.icon || "🔧"}</div>
    <div class="flex items-center justify-between mb-1">
      <span class="badge badge-gold" style="font-size:0.65rem">${cat?.name || service.category}</span>
      ${service.verified ? '<span class="verified-badge">✔ Vérifié</span>' : ""}
    </div>
    <h3 class="font-ui" style="font-size:1rem;margin:0.5rem 0;line-height:1.3">${service.title}</h3>
    <p class="text-muted text-sm" style="margin-bottom:1rem;line-height:1.5">${service.description}</p>
    <div class="flex items-center gap-1 mb-2">
      ${renderStars(service.rating)}
      <span class="text-gold font-ui font-bold text-sm">${service.rating}</span>
      <span class="text-muted text-xs">(${service.reviews} avis)</span>
    </div>
    <div class="flex items-center gap-1 mb-3">
      <div class="avatar avatar-sm">${service.providerAvatar}</div>
      <span class="text-sm font-ui">${service.providerName}</span>
    </div>
    <div class="flex items-center justify-between">
      <div>
        <span class="text-muted text-xs font-ui">À partir de</span>
        <div class="text-gold font-ui font-bold" style="font-size:1.1rem">${formatPrice(service.price)}</div>
      </div>
      <button class="btn btn-gold btn-sm" onclick="event.stopPropagation();openContact('${service.id}')">Commander</button>
    </div>
  </div>`;
}

/**
 * PAGE : Marketplace
 */
async function PageMarketplace() {
  return `
  ${NavbarHTML()}
  <div class="page" style="overflow-x:hidden;">
    <div class="container" style="padding-top:2rem">

      <!-- Header -->
      <div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:1rem">
        <div>
          <h1 class="font-ui text-gold" style="font-size:2rem">Marketplace</h1>
          <p class="text-muted">Trouvez le professionnel qu'il vous faut</p>
        </div>
        ${AppState.userProfile?.role === "pro" ? `
          <button class="btn btn-gold" onclick="router.push('new-service')">+ Publier un service</button>
        ` : `
          <button class="btn btn-outline" onclick="router.push('register')">Devenir Pro</button>
        `}
      </div>

      <!-- Barre de recherche -->
      <div class="search-bar mb-4">
        <input class="search-input" id="search-input" type="text" placeholder="Rechercher un service, un professionnel..." oninput="debounceFilter()" />
        <button class="search-btn" aria-label="Rechercher des services">🔍</button>
      </div>

      <!-- Filtres catégories -->
      <div style="display:flex;gap:0.5rem;overflow-x:auto;padding-bottom:0.5rem;margin-bottom:2rem;scrollbar-width:none">
        <button class="btn btn-gold btn-sm" id="filter-all" onclick="filterCategory(null)">Tous</button>
        ${CATEGORIES.slice(0, 6).map(c => `
          <button class="btn btn-ghost btn-sm" id="filter-${c.id}" onclick="filterCategory('${c.id}')" style="white-space:nowrap">
            ${c.icon} ${c.name}
          </button>
        `).join("")}
      </div>

      <!-- Grille de services -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem" id="services-grid">
        ${DEMO_SERVICES.map(s => ServiceCardHTML(s)).join("")}
      </div>

      <!-- Message aucun résultat -->
      <div id="no-results" class="hidden text-center" style="padding:4rem 0">
        <div style="font-size:4rem;margin-bottom:1rem">🔍</div>
        <h3 class="font-ui text-gold">Aucun service trouvé</h3>
        <p class="text-muted mt-1">Essayez d'autres mots-clés ou catégories</p>
      </div>

    </div>
    ${FooterHTML()}
  </div>`;
}

/**
 * PAGE : Connexion
 */
function PageLogin() {
  return `
  ${NavbarHTML()}
  <div class="page" style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem">
    <div class="glass" style="width:100%;max-width:420px;padding:2.5rem">

      <!-- En-tête -->
      <div class="text-center mb-4">
        <div class="font-display text-gold" style="font-size:1.4rem;margin-bottom:0.25rem">Bienvenue</div>
        <p class="text-muted text-sm">Connectez-vous à votre compte</p>
      </div>

      <div class="divider-gold"></div>

      <!-- Formulaire -->
      <form id="login-form" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label class="form-label">Adresse Email</label>
          <input type="email" id="login-email" class="form-control" placeholder="votre@email.com" required autocomplete="email"/>
        </div>
        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <input type="password" id="login-password" class="form-control" placeholder="••••••••" required autocomplete="current-password"/>
        </div>

        <button type="submit" id="login-btn" class="btn btn-gold btn-full btn-lg">
          🔐 Se connecter
        </button>
      </form>

      <div style="text-align:center;margin:1.25rem 0;color:var(--text-muted);font-size:0.8rem">ou continuer avec</div>

      <button class="btn btn-ghost btn-full" onclick="handleGoogleLogin()" style="gap:0.75rem">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuer avec Google
      </button>

      <div class="divider-gold"></div>

      <p class="text-center text-sm text-muted">
        Pas encore de compte ?
        <button class="btn btn-ghost btn-sm" onclick="router.push('register')" style="display:inline">S'inscrire</button>
      </p>
    </div>
  </div>`;
}

/**
 * PAGE : Inscription
 */
function PageRegister() {
  return `
  ${NavbarHTML()}
  <div class="page" style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem">
    <div class="glass" style="width:100%;max-width:480px;padding:2.5rem">

      <div class="text-center mb-4">
        <div class="font-display text-gold" style="font-size:1.4rem;margin-bottom:0.25rem">Rejoindre</div>
        <p class="text-muted text-sm">Créez votre compte MAJESTÉ MARKET</p>
      </div>

      <div class="divider-gold"></div>

      <form id="register-form" onsubmit="handleRegister(event)">
        <div class="form-group">
          <label class="form-label">Nom complet</label>
          <input type="text" id="reg-name" class="form-control" placeholder="Jean Dupont" required/>
        </div>
        <div class="form-group">
          <label class="form-label">Adresse Email</label>
          <input type="email" id="reg-email" class="form-control" placeholder="votre@email.com" required autocomplete="email"/>
        </div>
        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <input type="password" id="reg-password" class="form-control" placeholder="Minimum 8 caractères" required minlength="8"/>
        </div>
        <div class="form-group">
          <label class="form-label">Type de compte</label>
          <select id="reg-role" class="form-control">
            <option value="visitor">Visiteur / Client</option>
            <option value="pro">Professionnel / Entreprise</option>
          </select>
        </div>
        <div id="pro-fields" class="hidden">
          <div class="form-group">
            <label class="form-label">Métier / Spécialité</label>
            <select id="reg-category" class="form-control">
              ${CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Téléphone / WhatsApp</label>
            <input type="tel" id="reg-phone" class="form-control" placeholder="+229 96 00 00 00"/>
          </div>
          <div class="form-group">
            <label class="form-label">Ville</label>
            <input type="text" id="reg-city" class="form-control" placeholder="Cotonou"/>
          </div>
        </div>

        <button type="submit" id="register-btn" class="btn btn-gold btn-full btn-lg">
          ✨ Créer mon compte
        </button>
      </form>

      <div class="divider-gold"></div>

      <p class="text-center text-sm text-muted">
        Déjà inscrit ?
        <button class="btn btn-ghost btn-sm" onclick="router.push('login')" style="display:inline">Se connecter</button>
      </p>
    </div>
  </div>`;
}

/**
 * PAGE : Dashboard Professionnel
 */
async function PageDashboard() {
  if (!AppState.currentUser) {
    router.push("login");
    return "";
  }

  const profile = AppState.userProfile || {};
  const isAdmin = profile.role === "admin";
  const isPro = profile.role === "pro";

  // Charger les stats depuis Firestore (avec fallback demo)
  let stats = { services: 0, views: 0, orders: 0, rating: 0, earnings: 0 };
  try {
    const statsDoc = await getDoc(doc(db, "users", AppState.currentUser.uid, "private", "stats"));
    if (statsDoc.exists()) stats = { ...stats, ...statsDoc.data() };
    else stats = { services: 3, views: 127, orders: 12, rating: 4.7, earnings: 185000 };
  } catch {
    stats = { services: 3, views: 127, orders: 12, rating: 4.7, earnings: 185000 };
  }

  return `
  ${NavbarHTML()}
  <div class="page" style="overflow-x:hidden;">
    <div class="flex" style="min-height:calc(100vh - 64px)">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-section">Menu</div>
        <button class="sidebar-link active" onclick="router.push('dashboard')">📊 Vue d'ensemble</button>
        <button class="sidebar-link" onclick="router.push('my-services')">🛒 Mes services</button>
        <button class="sidebar-link" onclick="router.push('orders')">📋 Commandes</button>
        <button class="sidebar-link" onclick="router.push('chat')">💬 Messages</button>
        <button class="sidebar-link" onclick="router.push('profile/'+AppState.currentUser.uid)">👤 Mon profil</button>
        <div class="sidebar-section">Finances</div>
        <button class="sidebar-link" onclick="router.push('earnings')">💰 Revenus</button>
        <button class="sidebar-link" onclick="router.push('payment')">📱 Mobile Money</button>
        ${isAdmin ? `
          <div class="sidebar-section">Administration</div>
          <button class="sidebar-link" onclick="router.push('admin')">🛡️ Admin Panel</button>
        ` : ""}
        <div class="sidebar-section">Compte</div>
        <button class="sidebar-link" onclick="router.push('settings')">⚙️ Paramètres</button>
        <button class="sidebar-link" style="color:var(--danger)" onclick="handleLogout()">🚪 Déconnexion</button>
      </aside>

      <!-- Contenu principal -->
      <main style="flex:1;padding:2rem;overflow-x:hidden">

        <!-- En-tête dashboard -->
        <div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:1rem">
          <div>
            <h1 class="font-ui text-gold" style="font-size:1.8rem">
              Bonjour, ${profile.displayName || "Professionnel"} 👋
            </h1>
            <p class="text-muted text-sm">
              ${new Date().toLocaleDateString("fr-BJ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div class="flex gap-1" style="flex-wrap:wrap">
            ${profile.verified ? '<span class="badge badge-neon">✔ Vérifié</span>' : '<span class="badge badge-gold pulse">⏳ Vérification en attente</span>'}
            <span class="badge badge-purple">${profile.role === "pro" ? "Professionnel" : profile.role === "admin" ? "Administrateur" : "Visiteur"}</span>
          </div>
        </div>

        <!-- Cartes stats -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-bottom:2rem">
          <div class="glass stat-card">
            <div class="stat-number">${stats.services}</div>
            <div class="stat-label">Services actifs</div>
          </div>
          <div class="glass stat-card">
            <div class="stat-number">${stats.views}</div>
            <div class="stat-label">Vues profil</div>
          </div>
          <div class="glass stat-card">
            <div class="stat-number">${stats.orders}</div>
            <div class="stat-label">Commandes</div>
          </div>
          <div class="glass stat-card">
            <div class="stat-number">${stats.rating > 0 ? stats.rating.toFixed(1) : "—"}</div>
            <div class="stat-label">Note moyenne</div>
          </div>
          <div class="glass stat-card" style="grid-column:span 1">
            <div class="stat-number" style="font-size:1.4rem">${formatPrice(stats.earnings)}</div>
            <div class="stat-label">Revenus (mois)</div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="glass p-6 mb-4">
          <h2 class="font-ui text-gold mb-2" style="font-size:1.1rem;letter-spacing:0.05em">Actions rapides</h2>
          <div class="flex gap-1" style="flex-wrap:wrap">
            <button class="btn btn-gold btn-sm" onclick="router.push('new-service')">+ Nouveau service</button>
            <button class="btn btn-neon btn-sm" onclick="router.push('chat')">💬 Messages</button>
            <button class="btn btn-outline btn-sm" onclick="router.push('profile/'+AppState.currentUser.uid)">👤 Voir mon profil</button>
            <button class="btn btn-ghost btn-sm" onclick="router.push('payment')">💳 Retrait Mobile Money</button>
          </div>
        </div>

        <!-- Dernières commandes -->
        <div class="glass p-6 mb-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-ui text-gold" style="font-size:1.1rem">Dernières commandes</h2>
            <button class="btn btn-ghost btn-sm" onclick="router.push('orders')">Voir tout</button>
          </div>
          <div id="recent-orders">
            ${[
              { client: "Amavi Koffi", service: "Logo professionnel", amount: 15000, status: "completed", date: "12 juin 2024" },
              { client: "Brice Hounsou", service: "Site web vitrine", amount: 75000, status: "in_progress", date: "10 juin 2024" },
              { client: "Céleste Dossou", service: "Flyers 1000ex", amount: 25000, status: "pending", date: "8 juin 2024" },
            ].map(order => `
              <div class="flex items-center justify-between" style="padding:0.85rem 0;border-bottom:1px solid rgba(255,255,255,0.05);flex-wrap:wrap;gap:0.5rem">
                <div class="flex items-center gap-2">
                  <div class="avatar avatar-sm">${getInitials(order.client)}</div>
                  <div>
                    <div class="font-ui font-bold text-sm">${order.client}</div>
                    <div class="text-muted text-xs">${order.service}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="text-gold font-ui font-bold">${formatPrice(order.amount)}</div>
                  <span class="badge ${order.status === 'completed' ? 'badge-success' : order.status === 'in_progress' ? 'badge-neon' : 'badge-gold'}">
                    ${order.status === 'completed' ? '✅ Terminé' : order.status === 'in_progress' ? '🔄 En cours' : '⏳ Attente'}
                  </span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

      </main>
    </div>
  </div>`;
}

/**
 * PAGE : Profil public professionnel
 */
async function PageProfile(params) {
  const uid = params?.id || (AppState.currentUser?.uid);
  if (!uid) { router.push("marketplace"); return ""; }

  // Charger le profil depuis Firestore
  let profile = null;
  try {
    const profileDoc = await getDoc(doc(db, "users", uid));
    if (profileDoc.exists()) profile = { id: uid, ...profileDoc.data() };
  } catch {}

  // Fallback demo
  if (!profile) {
    profile = {
      id: uid,
      displayName: "Studio Koffi Design",
      category: "graphisme",
      city: "Cotonou",
      phone: "+229 96 00 00 00",
      bio: "Graphiste professionnel avec 8 ans d'expérience. Spécialisé en identité visuelle, branding et supports de communication pour entreprises béninoises et africaines.",
      verified: true,
      rating: 4.8,
      reviews: 47,
      skills: ["Adobe Illustrator", "Photoshop", "InDesign", "Canva Pro", "Branding"],
      role: "pro",
      createdAt: null,
    };
  }

  const cat = CATEGORIES.find(c => c.id === profile.category);
  const initials = getInitials(profile.displayName);

  return `
  ${NavbarHTML()}
  <div class="page" style="overflow-x:hidden;">
    <div class="container" style="padding-top:2rem">

      <!-- En-tête profil -->
      <div class="glass p-6 mb-4" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:120px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(0,212,255,0.05));"></div>
        <div style="position:relative;display:flex;gap:1.5rem;flex-wrap:wrap">
          <div class="avatar avatar-xl">${initials}</div>
          <div style="flex:1;min-width:200px">
            <div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:0.5rem">
              <h1 class="font-ui text-gold" style="font-size:1.8rem">${profile.displayName}</h1>
              ${profile.verified ? '<span class="verified-badge">✔ Professionnel Vérifié</span>' : ""}
            </div>
            ${cat ? `<span class="badge badge-gold mb-2">${cat.icon} ${cat.name}</span>` : ""}
            <p style="color:var(--text-secondary);line-height:1.7;margin:0.5rem 0">${profile.bio || ""}</p>
            <div class="flex items-center gap-2 mt-2" style="flex-wrap:wrap">
              ${profile.city ? `<span class="text-muted text-sm">📍 ${profile.city}, Bénin</span>` : ""}
              <div class="flex items-center gap-1">
                ${renderStars(profile.rating || 0)}
                <span class="text-gold font-ui font-bold">${profile.rating || "—"}</span>
                <span class="text-muted text-xs">(${profile.reviews || 0} avis)</span>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <button class="btn btn-gold" onclick="startChat('${uid}')">💬 Contacter</button>
            ${profile.phone ? `
              <a href="https://wa.me/${profile.phone.replace(/\D/g,'')}" target="_blank" class="btn btn-ghost" style="text-decoration:none">
                📱 WhatsApp
              </a>
            ` : ""}
          </div>
        </div>
      </div>

      <!-- Compétences -->
      ${profile.skills?.length ? `
        <div class="glass p-6 mb-4">
          <h2 class="font-ui text-gold mb-2" style="font-size:1rem;letter-spacing:0.1em;text-transform:uppercase">Compétences</h2>
          <div class="flex" style="gap:0.5rem;flex-wrap:wrap">
            ${profile.skills.map(s => `<span class="badge badge-neon">${s}</span>`).join("")}
          </div>
        </div>
      ` : ""}

      <!-- Services -->
      <div class="mb-4">
        <h2 class="font-ui text-gold mb-2" style="font-size:1rem;letter-spacing:0.1em;text-transform:uppercase">Services proposés</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem">
          ${DEMO_SERVICES.filter(s => s.category === profile.category).slice(0,3).map(s => ServiceCardHTML(s)).join("") || '<p class="text-muted">Aucun service publié pour l\'instant.</p>'}
        </div>
      </div>

    </div>
    ${FooterHTML()}
  </div>`;
}

/**
 * PAGE : Chat temps réel
 */
async function PageChat() {
  if (!AppState.currentUser) { router.push("login"); return ""; }

  return `
  ${NavbarHTML()}
  <div class="page" style="overflow-x:hidden;">
    <div class="flex" style="min-height:calc(100vh - 64px);max-width:1000px;margin:0 auto;padding:1rem;gap:1rem">

      <!-- Liste des conversations -->
      <div class="glass" style="width:280px;min-width:260px;display:flex;flex-direction:column;overflow:hidden" id="chat-list-panel">
        <div style="padding:1rem;border-bottom:1px solid var(--border-gold)">
          <h2 class="font-ui text-gold" style="font-size:1rem;letter-spacing:0.05em">Messages</h2>
        </div>
        <div style="flex:1;overflow-y:auto;padding:0.5rem" id="conversation-list">
          ${[
            { id: "conv1", name: "Amavi Koffi", last: "Bonjour, j'ai vu votre profil...", time: "14:30", unread: 2 },
            { id: "conv2", name: "Brice Hounsou", last: "Le logo est parfait !", time: "Hier", unread: 0 },
            { id: "conv3", name: "Céleste Dossou", last: "Quand sera livré ?", time: "Lun", unread: 1 },
          ].map(conv => `
            <div class="glass-hover" style="padding:0.85rem;border-radius:8px;cursor:pointer;margin-bottom:0.25rem"
                 onclick="openConversation('${conv.id}','${conv.name}')">
              <div class="flex items-center gap-2">
                <div class="avatar avatar-sm" style="position:relative">
                  ${getInitials(conv.name)}
                  ${conv.unread > 0 ? `<span style="position:absolute;top:-4px;right:-4px;background:var(--gold);color:#000;width:16px;height:16px;border-radius:50%;font-size:0.6rem;font-weight:700;display:flex;align-items:center;justify-content:center">${conv.unread}</span>` : ""}
                </div>
                <div style="flex:1;min-width:0">
                  <div class="font-ui font-bold text-sm">${conv.name}</div>
                  <div class="text-muted text-xs" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${conv.last}</div>
                </div>
                <div class="text-muted" style="font-size:0.65rem">${conv.time}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Fenêtre de conversation -->
      <div class="glass flex-1" style="display:flex;flex-direction:column;overflow:hidden" id="chat-window">
        <div style="padding:1rem;border-bottom:1px solid var(--border-gold);display:flex;align-items:center;gap:0.75rem" id="chat-header">
          <div class="avatar avatar-sm" id="chat-avatar">?</div>
          <div>
            <div class="font-ui font-bold" id="chat-name">Sélectionnez une conversation</div>
            <div class="text-muted text-xs" id="chat-status">En ligne</div>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages">
          <div class="text-center text-muted" style="padding:2rem;font-size:0.9rem">
            💬 Sélectionnez une conversation pour commencer
          </div>
        </div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" class="form-control" placeholder="Écrivez un message..." style="border-radius:50px"
                 onkeypress="if(event.key==='Enter') sendMessage()" disabled/>
          <button class="btn btn-gold" onclick="sendMessage()" id="send-btn" disabled aria-label="Envoyer le message">➤</button>
        </div>
      </div>

    </div>
  </div>`;
}

/**
 * PAGE : Paiement Mobile Money
 */
function PagePayment() {
  if (!AppState.currentUser) { router.push("login"); return ""; }

  return `
  ${NavbarHTML()}
  <div class="page" style="overflow-x:hidden;">
    <div class="container-sm" style="padding-top:2rem">
      <h1 class="font-ui text-gold mb-1" style="font-size:2rem">Mobile Money</h1>
      <p class="text-muted mb-4">Retrait de vos revenus sécurisé</p>

      <!-- Solde -->
      <div class="payment-card mb-4">
        <div class="text-muted text-xs font-ui" style="letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.5rem">Solde disponible</div>
        <div class="font-display text-gold" style="font-size:2.5rem">${formatPrice(185000)}</div>
        <div class="text-muted text-sm mt-1">Mis à jour il y a 5 minutes</div>
      </div>

      <!-- Formulaire de retrait -->
      <div class="glass p-6 mb-4">
        <h2 class="font-ui text-gold mb-3" style="font-size:1.1rem">Effectuer un retrait</h2>
        <form onsubmit="handlePayment(event)">
          <div class="form-group">
            <label class="form-label">Opérateur</label>
            <select class="form-control" id="pay-operator">
              <option value="mtn">📱 MTN Mobile Money</option>
              <option value="moov">📱 Moov Money (Flooz)</option>
              <option value="celtiis">📱 Celtiis Cash</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Numéro de téléphone</label>
            <input type="tel" id="pay-phone" class="form-control" placeholder="+229 96 00 00 00" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Montant (FCFA)</label>
            <input type="number" id="pay-amount" class="form-control" placeholder="Ex: 50000" min="1000" max="185000" required/>
          </div>
          <div class="form-group">
            <label class="form-label">Code PIN (simulé)</label>
            <input type="password" id="pay-pin" class="form-control" placeholder="••••" maxlength="4" required/>
          </div>
          <button type="submit" class="btn btn-gold btn-full btn-lg">
            💸 Confirmer le retrait
          </button>
        </form>
      </div>

      <!-- Historique -->
      <div class="glass p-6">
        <h2 class="font-ui text-gold mb-3" style="font-size:1rem;letter-spacing:0.05em">Historique des transactions</h2>
        ${[
          { type: "retrait", amount: -50000, date: "12 juin 2024", status: "completed", op: "MTN MoMo" },
          { type: "paiement", amount: +75000, date: "10 juin 2024", status: "completed", op: "Client Brice" },
          { type: "paiement", amount: +25000, date: "8 juin 2024", status: "completed", op: "Client Céleste" },
          { type: "retrait", amount: -30000, date: "5 juin 2024", status: "completed", op: "Moov Flooz" },
        ].map(t => `
          <div class="flex items-center justify-between" style="padding:0.85rem 0;border-bottom:1px solid rgba(255,255,255,0.05)">
            <div class="flex items-center gap-2">
              <div style="font-size:1.5rem">${t.type === 'retrait' ? '📤' : '📥'}</div>
              <div>
                <div class="font-ui font-bold text-sm">${t.op}</div>
                <div class="text-muted text-xs">${t.date}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div class="font-ui font-bold ${t.amount > 0 ? 'text-green-400' : ''}" style="${t.amount < 0 ? 'color:var(--danger)' : 'color:var(--success)'}">
                ${t.amount > 0 ? '+' : ''}${formatPrice(t.amount)}
              </div>
              <span class="badge badge-success" style="font-size:0.6rem">✅ Effectué</span>
            </div>
          </div>
        `).join("")}
      </div>

    </div>
    ${FooterHTML()}
  </div>`;
}

/**
 * PAGE : Admin Dashboard
 */
async function PageAdmin() {
  if (!AppState.currentUser || AppState.userProfile?.role !== "admin") {
    router.push("home");
    showToast("Accès refusé — Zone administrateurs", "error");
    return "";
  }

  // Compter les utilisateurs (avec fallback demo)
  let userCount = 0, proCount = 0, serviceCount = 0, pendingVerif = 0;
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    usersSnap.forEach(d => {
      userCount++;
      if (d.data().role === "pro") proCount++;
      if (d.data().role === "pro" && !d.data().verified) pendingVerif++;
    });
    const servicesSnap = await getDocs(collection(db, "services"));
    serviceCount = servicesSnap.size;
  } catch {
    userCount = 127; proCount = 48; serviceCount = 203; pendingVerif = 5;
  }

  return `
  ${NavbarHTML()}
  <div class="page" style="overflow-x:hidden;">
    <div class="flex" style="min-height:calc(100vh - 64px)">

      <aside class="sidebar">
        <div class="sidebar-section">Administration</div>
        <button class="sidebar-link active" onclick="router.push('admin')">🛡️ Vue d'ensemble</button>
        <button class="sidebar-link" onclick="adminSection('users')">👥 Utilisateurs</button>
        <button class="sidebar-link" onclick="adminSection('verif')">✔ Vérifications</button>
        <button class="sidebar-link" onclick="adminSection('services')">🛒 Services</button>
        <button class="sidebar-link" onclick="adminSection('reports')">⚠️ Signalements</button>
        <div class="sidebar-section">Retour</div>
        <button class="sidebar-link" onclick="router.push('dashboard')">← Dashboard</button>
      </aside>

      <main style="flex:1;padding:2rem;overflow-x:hidden">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="font-ui text-gold" style="font-size:1.8rem">🛡️ Admin Panel</h1>
            <p class="text-muted text-sm">Gestion de MAJESTÉ MARKET</p>
          </div>
          <span class="badge badge-danger">Accès Restreint</span>
        </div>

        <!-- Stats admin -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-bottom:2rem">
          <div class="glass stat-card">
            <div class="stat-number">${userCount}</div>
            <div class="stat-label">Utilisateurs</div>
          </div>
          <div class="glass stat-card">
            <div class="stat-number">${proCount}</div>
            <div class="stat-label">Professionnels</div>
          </div>
          <div class="glass stat-card">
            <div class="stat-number">${serviceCount}</div>
            <div class="stat-label">Services</div>
          </div>
          <div class="glass stat-card">
            <div class="stat-number pulse" style="color:var(--warning)">${pendingVerif}</div>
            <div class="stat-label">Vérif. en attente</div>
          </div>
        </div>

        <!-- Section contenu admin dynamique -->
        <div id="admin-content">

          <!-- Vérifications en attente -->
          <div class="glass p-6 mb-4">
            <h2 class="font-ui text-gold mb-3" style="font-size:1.1rem">Vérifications professionnelles en attente</h2>
            ${[
              { name: "Koffi Amédé", category: "graphisme", city: "Cotonou", date: "13 juin" },
              { name: "Adjovi Marie", category: "mode-couture", city: "Porto-Novo", date: "12 juin" },
              { name: "Hounsou Tech", category: "developpement-web", city: "Abomey-Calavi", date: "11 juin" },
            ].map(pro => {
              const cat = CATEGORIES.find(c => c.id === pro.category);
              return `
              <div class="flex items-center justify-between" style="padding:1rem 0;border-bottom:1px solid rgba(255,255,255,0.05);flex-wrap:wrap;gap:0.75rem">
                <div class="flex items-center gap-2">
                  <div class="avatar avatar-sm">${getInitials(pro.name)}</div>
                  <div>
                    <div class="font-ui font-bold">${pro.name}</div>
                    <div class="text-muted text-xs">${cat?.icon || ""} ${cat?.name || pro.category} — ${pro.city}</div>
                  </div>
                </div>
                <div class="flex gap-1">
                  <button class="btn btn-success btn-sm" style="background:rgba(34,197,94,0.15);color:var(--success);border:1px solid rgba(34,197,94,0.3)" onclick="verifyPro('${pro.name}')">✔ Approuver</button>
                  <button class="btn btn-danger btn-sm" onclick="rejectPro('${pro.name}')">✖ Refuser</button>
                </div>
              </div>`;
            }).join("")}
          </div>

          <!-- Utilisateurs récents -->
          <div class="glass p-6">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-ui text-gold" style="font-size:1.1rem">Derniers inscrits</h2>
            </div>
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse;font-family:var(--font-ui);font-size:0.85rem">
                <thead>
                  <tr style="border-bottom:1px solid var(--border-gold);color:var(--text-secondary)">
                    <th style="text-align:left;padding:0.75rem 0.5rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-size:0.72rem">Nom</th>
                    <th style="text-align:left;padding:0.75rem 0.5rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-size:0.72rem">Rôle</th>
                    <th style="text-align:left;padding:0.75rem 0.5rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-size:0.72rem">Statut</th>
                    <th style="text-align:left;padding:0.75rem 0.5rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;font-size:0.72rem">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${[
                    { name: "Amavi Koffi", email: "amavi@email.com", role: "pro", verified: true },
                    { name: "Brice Hounsou", email: "brice@email.com", role: "visitor", verified: false },
                    { name: "Céleste Dossou", email: "celeste@email.com", role: "pro", verified: false },
                  ].map(u => `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
                      <td style="padding:0.75rem 0.5rem">
                        <div class="flex items-center gap-2">
                          <div class="avatar avatar-sm">${getInitials(u.name)}</div>
                          <div>
                            <div style="font-weight:600">${u.name}</div>
                            <div style="color:var(--text-muted);font-size:0.75rem">${u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style="padding:0.75rem 0.5rem">
                        <span class="badge ${u.role === 'pro' ? 'badge-gold' : 'badge-purple'}">${u.role}</span>
                      </td>
                      <td style="padding:0.75rem 0.5rem">
                        <span class="badge ${u.verified ? 'badge-success' : 'badge-danger'}">${u.verified ? '✔ Vérifié' : '✖ Non vérifié'}</span>
                      </td>
                      <td style="padding:0.75rem 0.5rem">
                        <button class="btn btn-ghost btn-sm" onclick="adminViewUser('${u.email}')">👁 Voir</button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  </div>`;
}

/**
 * PAGE : 404
 */
function Page404() {
  return `
  ${NavbarHTML()}
  <div class="page" style="display:flex;align-items:center;justify-content:center;text-align:center;padding:4rem 1rem">
    <div>
      <div class="font-display text-gold float" style="font-size:6rem">404</div>
      <h1 class="font-ui" style="font-size:1.5rem;margin-bottom:1rem">Page introuvable</h1>
      <p class="text-muted mb-4">Cette page n'existe pas ou a été déplacée.</p>
      <button class="btn btn-gold" onclick="router.push('home')">← Retour à l'accueil</button>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════
// 🔐 AUTHENTIFICATION
// ════════════════════════════════════════════════════════════

/**
 * Inscription avec email/password
 */
window.handleRegister = async function (e) {
  e.preventDefault();
  const btn = document.getElementById("register-btn");
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;

  if (!name || !email || !password) return;

  btn.disabled = true;
  btn.textContent = "Création en cours...";

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    // Profil Firestore
    const profileData = {
      uid: credential.user.uid,
      displayName: name,
      email,
      role,
      verified: false,
      createdAt: serverTimestamp(),
    };

    if (role === "pro") {
      profileData.category = document.getElementById("reg-category")?.value || "graphisme";
      profileData.phone = document.getElementById("reg-phone")?.value || "";
      profileData.city = document.getElementById("reg-city")?.value || "Cotonou";
      profileData.bio = "";
      profileData.skills = [];
      profileData.rating = 0;
      profileData.reviews = 0;
    }

    await setDoc(doc(db, "users", credential.user.uid), profileData);
    showToast("Compte créé avec succès ! Bienvenue 🎉", "success");
    router.push("dashboard");
  } catch (error) {
    console.error(error);
    const messages = {
      "auth/email-already-in-use": "Cet email est déjà utilisé.",
      "auth/weak-password": "Mot de passe trop faible (min. 8 caractères).",
      "auth/invalid-email": "Adresse email invalide.",
    };
    showToast(messages[error.code] || "Erreur lors de l'inscription.", "error");
    btn.disabled = false;
    btn.textContent = "✨ Créer mon compte";
  }
};

/**
 * Connexion avec email/password
 */
window.handleLogin = async function (e) {
  e.preventDefault();
  const btn = document.getElementById("login-btn");
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  btn.disabled = true;
  btn.textContent = "Connexion...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast("Connexion réussie ! Bienvenue 👑", "success");
    router.push("dashboard");
  } catch (error) {
    const messages = {
      "auth/user-not-found": "Aucun compte avec cet email.",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
      "auth/invalid-email": "Adresse email invalide.",
      "auth/invalid-credential": "Email ou mot de passe incorrect.",
    };
    showToast(messages[error.code] || "Erreur de connexion.", "error");
    btn.disabled = false;
    btn.textContent = "🔐 Se connecter";
  }
};

/**
 * Connexion Google
 */
window.handleGoogleLogin = async function () {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Vérifier si le profil existe déjà
    const profileRef = doc(db, "users", user.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: "visitor",
        verified: false,
        createdAt: serverTimestamp(),
      });
    }

    showToast("Connexion Google réussie ! 🎉", "success");
    router.push("dashboard");
  } catch (error) {
    if (error.code !== "auth/popup-closed-by-user") {
      showToast("Erreur Google Sign-In.", "error");
    }
  }
};

/**
 * Déconnexion
 */
window.handleLogout = async function () {
  try {
    await signOut(auth);
    AppState.currentUser = null;
    AppState.userProfile = null;
    showToast("Déconnecté avec succès. À bientôt ! 👋", "info");
    router.push("home");
  } catch {
    showToast("Erreur lors de la déconnexion.", "error");
  }
};

// ════════════════════════════════════════════════════════════
// 💬 CHAT
// ════════════════════════════════════════════════════════════

let currentConvId = null;
let chatListener = null;

window.openConversation = function (convId, name) {
  currentConvId = convId;
  const header = document.getElementById("chat-name");
  const avatar = document.getElementById("chat-avatar");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  if (header) header.textContent = name;
  if (avatar) avatar.textContent = getInitials(name);
  if (input) input.disabled = false;
  if (sendBtn) sendBtn.disabled = false;

  // Demo messages
  const msgs = document.getElementById("chat-messages");
  if (msgs) {
    msgs.innerHTML = `
      <div class="chat-bubble received">Bonjour ! J'ai vu votre profil sur MAJESTÉ MARKET.</div>
      <div class="chat-bubble sent">Merci ! Je suis disponible, comment puis-je vous aider ?</div>
      <div class="chat-bubble received">Je cherche quelqu'un pour créer mon logo d'entreprise.</div>
      <div class="chat-bubble sent">Avec plaisir ! Mon tarif de base est de 15 000 FCFA pour un logo + charte. Quel est votre secteur ?</div>
    `;
    msgs.scrollTop = msgs.scrollHeight;
  }

  // En réel : écouter les messages Firestore
  if (AppState.currentUser && convId.startsWith("real_")) {
    if (chatListener) chatListener();
    chatListener = onSnapshot(
      query(collection(db, "conversations", convId, "messages"), orderBy("createdAt", "asc")),
      (snap) => {
        if (!msgs) return;
        msgs.innerHTML = "";
        snap.forEach((d) => {
          const m = d.data();
          const isSent = m.senderId === AppState.currentUser.uid;
          msgs.innerHTML += `
            <div class="chat-bubble ${isSent ? "sent" : "received"}">
              ${m.text}
              <div style="font-size:0.65rem;color:rgba(255,255,255,0.4);margin-top:4px;text-align:right">${timeAgo(m.createdAt)}</div>
            </div>`;
        });
        msgs.scrollTop = msgs.scrollHeight;
      }
    );
  }
};

window.sendMessage = async function () {
  const input = document.getElementById("chat-input");
  if (!input || !input.value.trim()) return;

  const text = input.value.trim();
  input.value = "";

  const msgs = document.getElementById("chat-messages");

  // Affichage immédiat (optimistic UI)
  if (msgs) {
    msgs.innerHTML += `
      <div class="chat-bubble sent">
        ${text}
        <div style="font-size:0.65rem;color:rgba(255,255,255,0.4);margin-top:4px;text-align:right">à l'instant</div>
      </div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }

  // En réel : envoyer à Firestore
  if (AppState.currentUser && currentConvId && currentConvId.startsWith("real_")) {
    try {
      await addDoc(collection(db, "conversations", currentConvId, "messages"), {
        text,
        senderId: AppState.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  }
};

window.startChat = function (userId) {
  if (!AppState.currentUser) {
    router.push("login");
    return;
  }
  router.push("chat");
  showToast("Conversation ouverte !", "info");
};

// ════════════════════════════════════════════════════════════
// 🛒 MARKETPLACE ACTIONS
// ════════════════════════════════════════════════════════════

window.filterCategory = function (categoryId) {
  const grid = document.getElementById("services-grid");
  if (!grid) {
    router.push("marketplace");
    return;
  }

  // Mettre à jour les boutons de filtre
  document.querySelectorAll("[id^='filter-']").forEach(btn => {
    btn.className = "btn btn-ghost btn-sm";
    btn.style = "white-space:nowrap";
  });
  const activeBtn = document.getElementById(categoryId ? `filter-${categoryId}` : "filter-all");
  if (activeBtn) activeBtn.className = "btn btn-gold btn-sm";

  // Filtrer les services
  const filtered = categoryId ? DEMO_SERVICES.filter(s => s.category === categoryId) : DEMO_SERVICES;
  const noResults = document.getElementById("no-results");

  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (noResults) noResults.classList.remove("hidden");
  } else {
    grid.innerHTML = filtered.map(s => ServiceCardHTML(s)).join("");
    if (noResults) noResults.classList.add("hidden");
  }
};


// ── Debounce pour optimiser l'INP (Input Perf) ──
let _filterTimer = null;
window.debounceFilter = function() {
  clearTimeout(_filterTimer);
  _filterTimer = setTimeout(() => window.filterServices(), 180);
};

window.filterServices = function () {
  const query = document.getElementById("search-input")?.value.toLowerCase() || "";
  const grid = document.getElementById("services-grid");
  const noResults = document.getElementById("no-results");
  if (!grid) return;

  const filtered = DEMO_SERVICES.filter(s =>
    s.title.toLowerCase().includes(query) ||
    s.description.toLowerCase().includes(query) ||
    s.providerName.toLowerCase().includes(query) ||
    s.tags.some(t => t.includes(query))
  );

  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (noResults) noResults.classList.remove("hidden");
  } else {
    grid.innerHTML = filtered.map(s => ServiceCardHTML(s)).join("");
    if (noResults) noResults.classList.add("hidden");
  }
};

window.openContact = function (serviceId) {
  if (!AppState.currentUser) {
    showToast("Connectez-vous pour contacter ce professionnel", "info");
    router.push("login");
    return;
  }
  router.push("chat");
  showToast("Ouverture du chat avec le professionnel...", "info");
};

// ════════════════════════════════════════════════════════════
// 💳 PAIEMENT
// ════════════════════════════════════════════════════════════

window.handlePayment = async function (e) {
  e.preventDefault();
  const operator = document.getElementById("pay-operator").value;
  const phone = document.getElementById("pay-phone").value;
  const amount = parseInt(document.getElementById("pay-amount").value);
  const pin = document.getElementById("pay-pin").value;

  if (!phone || !amount || !pin || amount < 1000) {
    showToast("Veuillez remplir tous les champs correctement.", "error");
    return;
  }

  setLoading(true, "Traitement du paiement...");

  // Simulation du paiement Mobile Money
  await new Promise(r => setTimeout(r, 2500));

  try {
    await addDoc(collection(db, "transactions"), {
      uid: AppState.currentUser.uid,
      operator,
      phone,
      amount: -amount,
      type: "retrait",
      status: "completed",
      createdAt: serverTimestamp(),
    });
  } catch {}

  setLoading(false);
  showToast(`Retrait de ${formatPrice(amount)} vers ${phone} effectué avec succès ! 💸`, "success");
};

// ════════════════════════════════════════════════════════════
// 🛡️ ADMIN ACTIONS
// ════════════════════════════════════════════════════════════

window.verifyPro = async function (name) {
  showToast(`✔ ${name} a été vérifié et approuvé.`, "success");
};

window.rejectPro = function (name) {
  showToast(`✖ Demande de ${name} refusée.`, "error");
};

window.adminViewUser = function (email) {
  showToast(`Profil de ${email} — Fonctionnalité en cours de développement`, "info");
};

window.adminSection = function (section) {
  showToast(`Section "${section}" — En cours de développement`, "info");
};

// ════════════════════════════════════════════════════════════
// 🎛️ UI HELPERS
// ════════════════════════════════════════════════════════════

window.toggleUserMenu = function () {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
  }
};

// Fermer le dropdown en cliquant ailleurs
document.addEventListener("click", (e) => {
  const btn = document.getElementById("user-menu-btn");
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

// Afficher les champs pro si rôle pro sélectionné
document.addEventListener("change", (e) => {
  if (e.target.id === "reg-role") {
    const proFields = document.getElementById("pro-fields");
    if (proFields) {
      proFields.classList.toggle("hidden", e.target.value !== "pro");
    }
  }
});

// ════════════════════════════════════════════════════════════
// 📲 PWA INSTALL
// ════════════════════════════════════════════════════════════

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;

  setTimeout(() => {
    const banner = document.getElementById("pwa-install-banner");
    if (banner) banner.classList.remove("hidden");
  }, 3000);
});

window.installPWA = async function () {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === "accepted") {
    showToast("MAJESTÉ MARKET installé sur votre appareil ! 🎉", "success");
  }
  deferredInstallPrompt = null;
  const banner = document.getElementById("pwa-install-banner");
  if (banner) banner.classList.add("hidden");
};

window.dismissInstall = function () {
  const banner = document.getElementById("pwa-install-banner");
  if (banner) banner.classList.add("hidden");
};

// ════════════════════════════════════════════════════════════
// 🚀 INITIALISATION
// ════════════════════════════════════════════════════════════

/**
 * Charge le profil Firestore de l'utilisateur connecté
 */
async function loadUserProfile(uid) {
  try {
    const profileDoc = await getDoc(doc(db, "users", uid));
    if (profileDoc.exists()) {
      AppState.userProfile = profileDoc.data();
    }
  } catch (err) {
    console.error("Erreur chargement profil:", err);
  }
}

/**
 * Enregistrement du Service Worker
 */
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("[SW] Enregistré:", reg.scope);
    } catch (err) {
      console.warn("[SW] Échec d'enregistrement:", err);
    }
  }
}

/**
 * Configuration du Router SPA
 */
function setupRouter() {
  // Guard d'authentification
  router.beforeEach(async (route, params) => {
    const protectedRoutes = ["dashboard", "chat", "my-services", "orders", "earnings", "payment", "new-service", "settings", "admin"];
    if (protectedRoutes.includes(route) && !AppState.currentUser) {
      router.replace("login");
      showToast("Connectez-vous pour accéder à cette page.", "info");
      return false;
    }
    if (route === "admin" && AppState.userProfile?.role !== "admin") {
      router.replace("home");
      showToast("Accès réservé aux administrateurs.", "error");
      return false;
    }
    return true;
  });

  // After hook : mettre à jour la nav active
  router.afterEach((route) => {
    document.querySelectorAll(".nav-link, .bottom-nav-item, .sidebar-link").forEach(el => {
      el.classList.remove("active");
    });
    updateActiveNav(route);
  });

  // Définition des routes
  router
    .on("home", () => PageHome())
    .on("marketplace", () => PageMarketplace())
    .on("login", () => {
      if (AppState.currentUser) { router.replace("dashboard"); return ""; }
      return PageLogin();
    })
    .on("register", () => {
      if (AppState.currentUser) { router.replace("dashboard"); return ""; }
      return PageRegister();
    })
    .on("dashboard", () => PageDashboard())
    .on("profile", (params) => PageProfile(params))
    .on("chat", () => PageChat())
    .on("payment", () => PagePayment())
    .on("admin", () => PageAdmin())
    .on("my-services", () => PageMarketplace())
    .on("orders", () => PageDashboard())
    .on("earnings", () => PagePayment())
    .on("settings", () => PageDashboard())
    .on("new-service", () => PageDashboard())
    .on("service", (params) => PageMarketplace())
    .on("404", () => Page404())
    .start();
}

/**
 * Met à jour les liens de navigation actifs
 */
function updateActiveNav(route) {
  const navMap = {
    home: "home",
    marketplace: "marketplace",
    dashboard: "dashboard",
    chat: "chat",
  };
}

/**
 * Point d'entrée principal
 */
async function init() {
  // Injecter le conteneur toast
  if (!document.getElementById("toast-container")) {
    const toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Bannière PWA
  const pwaHTML = `
    <div id="pwa-install-banner" class="glass hidden" style="padding:1rem 1.5rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
      <span style="font-size:1.5rem">📱</span>
      <div style="flex:1;min-width:0">
        <div class="font-ui font-bold text-gold text-sm">Installer MAJESTÉ MARKET</div>
        <div class="text-muted text-xs">Accès rapide depuis votre écran d'accueil</div>
      </div>
      <button class="btn btn-gold btn-sm" onclick="installPWA()">Installer</button>
      <button class="btn btn-ghost btn-sm" onclick="dismissInstall()">✕</button>
    </div>`;
  document.body.insertAdjacentHTML("beforeend", pwaHTML);

  // Écouter les changements d'authentification
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      AppState.currentUser = user;
      await loadUserProfile(user.uid);
    } else {
      AppState.currentUser = null;
      AppState.userProfile = null;
    }

    // Démarrer le router après auth check
    if (!router._started) {
      router._started = true;
      setupRouter();
    } else {
      // Re-render la page courante si l'état auth a changé
      router._handleRoute();
    }
  });

  // Enregistrer le Service Worker
  await registerServiceWorker();

  console.log("🚀 MAJESTÉ MARKET by MAHOUTO X-PRO — Initialisé");
  console.log("📍 Cotonou, Bénin | 📱 +229 96 09 76 44 | ✉️ mahoutoxpro@gmail.com");
}

// ── Démarrer l'application de façon optimisée ──
// Utiliser requestIdleCallback si disponible pour réduire le TTI
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => init(), { timeout: 2000 });
} else {
  // Fallback pour navigateurs sans requestIdleCallback
  setTimeout(() => init(), 0);
}

// Exposer les fonctions nécessaires globalement
window.AppState = AppState;
window.router = router;
window.formatPrice = formatPrice;
window.renderStars = renderStars;
window.getInitials = getInitials;
window.showToast = showToast;
window.setLoading = setLoading;
