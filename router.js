/**
 * ============================================================
 * MAJESTÉ MARKET — router.js
 * Hash Router SPA — Navigation côté client
 * by MAHOUTO X-PRO | Cotonou, Bénin
 * ============================================================
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.beforeHooks = [];
    this.afterHooks = [];

    // Écoute les changements de hash
    window.addEventListener("hashchange", () => this._handleRoute());
    window.addEventListener("load", () => this._handleRoute());
  }

  /**
   * Enregistre une route
   * @param {string} path - Le hash (ex: "home", "marketplace")
   * @param {Function} handler - Fonction qui retourne le HTML de la page
   */
  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  /**
   * Hook avant navigation (pour auth guard)
   */
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  /**
   * Hook après navigation
   */
  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  /**
   * Navigue vers un hash
   */
  push(path) {
    window.location.hash = path;
  }

  /**
   * Remplace le hash sans ajouter à l'historique
   */
  replace(path) {
    const url = window.location.href.split("#")[0] + "#" + path;
    history.replaceState(null, null, url);
    this._handleRoute();
  }

  /**
   * Retour arrière
   */
  back() {
    history.back();
  }

  /**
   * Route actuelle (sans le #)
   */
  get current() {
    return window.location.hash.slice(1) || "home";
  }

  /**
   * Résolution de la route avec paramètres
   */
  _parseRoute(hash) {
    const parts = hash.split("/");
    const base = parts[0];
    const params = {};

    // Route avec paramètre : ex "profile/userId123"
    if (parts.length > 1) {
      params.id = parts[1];
    }

    return { base, params };
  }

  /**
   * Gestionnaire principal de navigation
   */
  async _handleRoute() {
    const hash = window.location.hash.slice(1) || "home";
    const { base, params } = this._parseRoute(hash);

    // Exécuter les hooks before
    for (const hook of this.beforeHooks) {
      const result = await hook(base, params);
      if (result === false) return;
    }

    // Trouver la route correspondante
    const handler = this.routes[base] || this.routes["404"];

    if (handler) {
      this.currentRoute = { path: base, params };
      const appContainer = document.getElementById("app");
      if (appContainer) {
        appContainer.innerHTML = "";
        const content = await handler(params);
        appContainer.innerHTML = content;

        // Scroll vers le haut
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Exécuter les hooks after
        for (const hook of this.afterHooks) {
          await hook(base, params);
        }
      }
    }
  }

  /**
   * Démarre le router
   */
  start() {
    this._handleRoute();
    return this;
  }
}

// Instance unique du router
export const router = new Router();
export default router;
