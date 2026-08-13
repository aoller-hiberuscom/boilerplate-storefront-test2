/**
 * blocks/header/panels.js — Paneles de herramientas del header:
 * wishlist, mini-cart y búsqueda.
 *
 * Responsabilidad:
 *  - Construir el DOM de los tres paneles (.nav-tools-wrapper / .nav-tools-panel)
 *    con las mismas clases que consume header.css.
 *  - Encapsular el patrón compartido de carga perezosa con estados data-*
 *    (data-loading, data-loaded, data-pending-toggle, data-pending-state) y el
 *    toggle de visibilidad (.nav-tools-panel--show) en utilidades internas
 *    reutilizadas por los paneles con carga diferida (mini-cart y búsqueda).
 *  - Contador del carrito (data-count, consumido por header.css) y cierre de
 *    paneles al hacer click fuera, con el caso especial del "undo" del
 *    mini-cart.
 */
import { getMetadata } from '../../scripts/aem.js';
import { getProductLink, rootLink } from '../../scripts/core/routes.js';
import { EVENTS, on } from '../../scripts/core/events.js';
import { fetchPlaceholders } from '../../scripts/core/i18n.js';
import { ensureCapability } from '../../scripts/dropins/registry.js';
import { linkedImageSlot } from '../../scripts/ui/slots/image-slot.js';
import { loadFragment } from '../fragment/fragment.js';
import { isDesktop, overlay, toggleAllNavSections } from './nav.js';

const labels = await fetchPlaceholders();

/** Lookup de placeholder con fallback idéntico al texto original en inglés. */
const t = (key, fallback) => labels?.Global?.[key] ?? fallback;

/** Rutas en las que el botón del mini-cart no se muestra. */
const excludeMiniCartFromPaths = ['/checkout'];

/**
 * Handles loading states for navigation panels with state management.
 * Conserva EXACTAMENTE los atributos data-loading / data-loaded /
 * data-pending-toggle / data-pending-state del comportamiento original.
 *
 * @param {HTMLElement} panel - The panel element to manage loading state for
 * @param {HTMLElement} button - The button that triggers the panel
 * @param {Function} loader - Async function to execute during loading
 */
async function withLoadingState(panel, button, loader) {
  if (panel.dataset.loaded === 'true' || panel.dataset.loading === 'true') return;

  button.setAttribute('aria-busy', 'true');
  panel.dataset.loading = 'true';

  try {
    await loader();
    panel.dataset.loaded = 'true';
  } finally {
    panel.dataset.loading = 'false';
    button.removeAttribute('aria-busy');

    // Execute pending toggle if exists
    if (panel.dataset.pendingToggle === 'true') {
      // eslint-disable-next-line no-nested-ternary
      const pendingState = panel.dataset.pendingState === 'true' ? true : (panel.dataset.pendingState === 'false' ? false : undefined);

      // Clear pending flags
      panel.removeAttribute('data-pending-toggle');
      panel.removeAttribute('data-pending-state');

      // Execute the pending toggle
      const show = pendingState ?? !panel.classList.contains('nav-tools-panel--show');
      panel.classList.toggle('nav-tools-panel--show', show);
    }
  }
}

/**
 * Muestra u oculta un panel; si hay una carga en curso, encola el toggle
 * (data-pending-toggle / data-pending-state) para ejecutarlo al terminar.
 * @param {HTMLElement} panel Panel a togglear
 * @param {boolean} [state] Estado forzado; si se omite, invierte el actual
 */
function togglePanel(panel, state) {
  // If loading is in progress, queue the toggle action
  if (panel.dataset.loading === 'true') {
    // Store the pending toggle action
    panel.dataset.pendingToggle = 'true';
    panel.dataset.pendingState = state !== undefined ? state.toString() : '';
    return;
  }

  const show = state ?? !panel.classList.contains('nav-tools-panel--show');
  panel.classList.toggle('nav-tools-panel--show', show);
}

/** Panel de wishlist: botón que redirige a la página de wishlist. */
function setupWishlist(navTools) {
  const wishlist = document.createRange().createContextualFragment(`
     <div class="wishlist-wrapper nav-tools-wrapper">
       <button type="button" class="nav-wishlist-button" aria-label="${t('HeaderWishlistLabel', 'Wishlist')}"></button>
       <div class="wishlist-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(wishlist);

  const wishlistButton = navTools.querySelector('.nav-wishlist-button');

  const wishlistMeta = getMetadata('wishlist');
  const wishlistPath = wishlistMeta ? new URL(wishlistMeta, window.location).pathname : '/wishlist';

  wishlistButton.addEventListener('click', () => {
    window.location.href = rootLink(wishlistPath);
  });
}

/** Panel del mini-cart: carga perezosa del fragment y contador data-count. */
function setupMiniCart(navTools) {
  const minicart = document.createRange().createContextualFragment(`
     <div class="minicart-wrapper nav-tools-wrapper">
       <button type="button" class="nav-cart-button" aria-label="${t('HeaderCartLabel', 'Cart')}"></button>
       <div class="minicart-panel nav-tools-panel"></div>
     </div>
   `);

  navTools.append(minicart);

  const minicartPanel = navTools.querySelector('.minicart-panel');
  const cartButton = navTools.querySelector('.nav-cart-button');

  if (excludeMiniCartFromPaths.includes(window.location.pathname)) {
    cartButton.style.display = 'none';
  }

  // Lazy loading for mini cart fragment
  async function loadMiniCartFragment() {
    await withLoadingState(minicartPanel, cartButton, async () => {
      const miniCartMeta = getMetadata('mini-cart');
      const miniCartPath = miniCartMeta
        ? new URL(miniCartMeta, window.location).pathname
        : '/mini-cart';
      const miniCartFragment = await loadFragment(miniCartPath);
      minicartPanel.append(miniCartFragment.firstElementChild);
    });
  }

  async function toggleMiniCart(state) {
    if (state) {
      await loadMiniCartFragment();
      const { publishShoppingCartViewEvent } = await import('@dropins/storefront-cart/api.js');
      publishShoppingCartViewEvent();
    }

    togglePanel(minicartPanel, state);
  }

  cartButton.addEventListener('click', () => toggleMiniCart(!minicartPanel.classList.contains('nav-tools-panel--show')));

  // Cart Item Counter
  on(EVENTS.CART_DATA, (data) => {
    // preload mini cart fragment if user has a cart
    if (data) loadMiniCartFragment();

    if (data?.totalQuantity) {
      cartButton.setAttribute('data-count', data.totalQuantity);
    } else {
      cartButton.removeAttribute('data-count');
    }
  }, { eager: true });

  return { minicartPanel, cartButton, toggleMiniCart };
}

/** Panel de búsqueda: carga perezosa del dropin de product discovery. */
function setupSearch(navTools, navSections) {
  const searchFragment = document.createRange().createContextualFragment(`
  <div class="search-wrapper nav-tools-wrapper">
    <button type="button" class="nav-search-button">${t('HeaderSearchButton', 'Search')}</button>
    <div class="nav-search-input nav-search-panel nav-tools-panel">
      <form id="search-bar-form"></form>
      <div class="search-bar-result" style="display: none;"></div>
    </div>
  </div>
  `);

  navTools.append(searchFragment);

  const searchPanel = navTools.querySelector('.nav-search-panel');
  const searchButton = navTools.querySelector('.nav-search-button');
  const searchForm = searchPanel.querySelector('#search-bar-form');
  const searchResult = searchPanel.querySelector('.search-bar-result');

  async function toggleSearch(state) {
    const pageSize = 4;

    if (state) {
      await withLoadingState(searchPanel, searchButton, async () => {
        await ensureCapability('search');

        // Load search components in parallel
        // (el import de lib.js precarga el chunk compartido, como en el original)
        const [
          { search },
          { render },
          { SearchResults },
          { provider: UI, Input, Button },
        ] = await Promise.all([
          import('@dropins/storefront-product-discovery/api.js'),
          import('@dropins/storefront-product-discovery/render.js'),
          import('@dropins/storefront-product-discovery/containers/SearchResults.js'),
          import('@dropins/tools/components.js'),
          import('@dropins/tools/lib.js'),
        ]);

        render.render(SearchResults, {
          skeletonCount: pageSize,
          scope: 'popover',
          routeProduct: ({ urlKey, sku }) => getProductLink(urlKey, sku),
          onSearchResult: (results) => {
            searchResult.style.display = results.length > 0 ? 'block' : 'none';
          },
          slots: {
            ProductImage: linkedImageSlot(
              ({ product }) => getProductLink(product.urlKey, product.sku),
              { alias: ({ product }) => product.sku },
            ),
            Footer: async (ctx) => {
              // View all results button
              const viewAllResultsWrapper = document.createElement('div');

              const viewAllResultsButton = await UI.render(Button, {
                children: labels.Global?.SearchViewAll,
                variant: 'secondary',
                href: rootLink('/search'),
              })(viewAllResultsWrapper);

              ctx.appendChild(viewAllResultsWrapper);

              ctx.onChange((next) => {
                viewAllResultsButton?.setProps((prev) => ({
                  ...prev,
                  href: `${rootLink('/search')}?q=${encodeURIComponent(next.variables?.phrase || '')}`,
                }));
              });
            },
          },
        })(searchResult);

        searchForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const query = e.target.search.value;
          if (query.length) {
            window.location.href = `${rootLink('/search')}?q=${encodeURIComponent(query)}`;
          }
        });

        UI.render(Input, {
          name: 'search',
          placeholder: labels.Global?.Search,
          onValue: (phrase) => {
            if (!phrase) {
              search(null, { scope: 'popover' });
              return;
            }

            if (phrase.length < 3) {
              return;
            }

            search({
              phrase,
              pageSize,
              filter: [
                { attribute: 'visibility', in: ['Search', 'Catalog, Search'] },
              ],
            }, { scope: 'popover' });
          },
        })(searchForm);
      });
    }

    togglePanel(searchPanel, state);
    if (state) searchForm?.querySelector('input')?.focus();
  }

  searchButton.addEventListener('click', () => toggleSearch(!searchPanel.classList.contains('nav-tools-panel--show')));

  navTools.querySelector('.nav-search-button').addEventListener('click', () => {
    if (isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  return { searchPanel, searchButton, toggleSearch };
}

/** Cierre de paneles al hacer click fuera, con el caso especial del undo. */
function setupClickOutside(miniCart, searchTools) {
  const {
    minicartPanel, cartButton, toggleMiniCart,
  } = miniCart;
  const { searchPanel, searchButton, toggleSearch } = searchTools;

  document.addEventListener('click', (e) => {
    // Check if undo is enabled for mini cart
    // TODO: detección frágil por texto. 'undo-remove-item' es la clave de
    // configuración autorada del block commerce-mini-cart (no una clase del
    // dropin); el DOM del dropin solo expone 'undo-banner' cuando el banner de
    // deshacer está visible, que NO equivale a "undo configurado". No existe
    // un selector estable equivalente, así que se conserva la detección
    // original tal cual para no cambiar el comportamiento.
    const miniCartElement = document.querySelector(
      '[data-block-name="commerce-mini-cart"]',
    );
    const undoEnabled = miniCartElement
      && (miniCartElement.textContent?.includes('undo-remove-item')
        || miniCartElement.innerHTML?.includes('undo-remove-item'));

    // For mini cart: if undo is enabled, be more restrictive about when to close
    const shouldCloseMiniCart = undoEnabled
      ? !minicartPanel.contains(e.target)
      && !cartButton.contains(e.target)
      && !e.target.closest('header')
      : !minicartPanel.contains(e.target) && !cartButton.contains(e.target);

    if (shouldCloseMiniCart) {
      toggleMiniCart(false);
    }

    if (!searchPanel.contains(e.target) && !searchButton.contains(e.target)) {
      toggleSearch(false);
    }
  });
}

/**
 * Monta los tres paneles de herramientas del header en .nav-tools,
 * en el mismo orden que el header original (wishlist → mini-cart → búsqueda →
 * cierre por click fuera).
 * @param {Element} navTools Contenedor .nav-tools del nav
 * @param {Element|null} navSections Sección .nav-sections (para el hover de búsqueda)
 */
export default function decoratePanels(navTools, navSections) {
  setupWishlist(navTools);
  const miniCart = setupMiniCart(navTools);
  const searchTools = setupSearch(navTools, navSections);
  setupClickOutside(miniCart, searchTools);
}
