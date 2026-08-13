/**
 * blocks/header/nav.js — Navegación del header: estructura y accesibilidad.
 *
 * Responsabilidad:
 *  - Decoración del DOM del nav (brand / sections / tools) y de los submenús
 *    (.nav-drop, .submenu-wrapper, .submenu-header) que consume header.css.
 *  - TODA la accesibilidad de teclado del menú: cierre con Escape, cierre al
 *    perder el foco, apertura con Enter/Space y gestión de tabindex/focus.
 *  - Overlay compartido (.overlay/.show) y estado del menú móvil (hamburger,
 *    aria-expanded, resize y cambio de media query).
 *
 * No conoce los paneles de herramientas (ver panels.js) ni el auth
 * (ver renderAuthCombine.js / renderAuthDropdown.js).
 */
import { fetchPlaceholders } from '../../scripts/core/i18n.js';

const labels = await fetchPlaceholders();

/** Lookup de placeholder con fallback idéntico al texto original en inglés. */
const t = (key, fallback) => labels?.Global?.[key] ?? fallback;

/** Media query que indica anchura de escritorio (móvil/tablet por debajo). */
export const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Overlay compartido del header (fondo oscurecido bajo menús y paneles).
 * Se crea una única vez al cargar el módulo, como hacía el header original.
 * @type {HTMLDivElement}
 */
export const overlay = document.createElement('div');
overlay.classList.add('overlay');
document.querySelector('header').insertAdjacentElement('afterbegin', overlay);

/** Cierra el menú/submenús al pulsar Escape (mismo comportamiento original). */
function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections);
      overlay.classList.remove('show');
      nav.querySelector('button').focus();
      const navWrapper = document.querySelector('.nav-wrapper');
      navWrapper.classList.remove('active');
    }
  }
}

/** Cierra el menú/submenús cuando el foco sale del nav. */
function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
      overlay.classList.remove('show');
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections, true);
    }
  }
}

/** Abre/cierra un .nav-drop con Enter o Space cuando tiene el foco. */
function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

/** Habilita la apertura por teclado del .nav-drop que recibe el foco. */
function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Expande o colapsa todas las secciones del nav.
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
export function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections
    .querySelectorAll('.nav-sections .default-content-wrapper > ul > li')
    .forEach((section) => {
      section.setAttribute('aria-expanded', expanded);
    });
}

/**
 * Abre o cierra el nav completo (menú móvil), gestionando aria-expanded,
 * scroll del body, tabindex de los .nav-drop y los listeners de teclado.
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
export function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute(
    'aria-label',
    expanded
      ? t('HeaderOpenNavigation', 'Open navigation')
      : t('HeaderCloseNavigation', 'Close navigation'),
  );
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.classList.remove('active');
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/** Cabecera clonable de los submenús móviles (enlace "volver" + separador). */
const subMenuHeader = document.createElement('div');
subMenuHeader.classList.add('submenu-header');
subMenuHeader.innerHTML = `<h5 class="back-link">${t('HeaderAllCategories', 'All Categories')}</h5><hr />`;

/**
 * Monta el submenú (.submenu-wrapper) de una sección del nav.
 * @param {Element} navSection The nav section element
 */
function setupSubmenu(navSection) {
  if (navSection.querySelector('ul')) {
    let label;
    if (navSection.childNodes.length) {
      [label] = navSection.childNodes;
    }

    const submenu = navSection.querySelector('ul');
    const wrapper = document.createElement('div');
    const header = subMenuHeader.cloneNode(true);
    const title = document.createElement('h6');
    title.classList.add('submenu-title');
    title.textContent = label.textContent;

    wrapper.classList.add('submenu-wrapper');
    wrapper.appendChild(header);
    wrapper.appendChild(title);
    wrapper.appendChild(submenu.cloneNode(true));

    navSection.appendChild(wrapper);
    navSection.removeChild(submenu);
  }
}

/**
 * Decora la estructura del nav: clases nav-brand/nav-sections/nav-tools,
 * limpieza del enlace de marca y comportamiento de las secciones
 * (nav-drop, submenús, click en móvil y hover en escritorio).
 * @param {HTMLElement} nav Elemento <nav> ya poblado con el fragment
 * @returns {{ navSections: Element|null, navTools: Element|null }}
 */
export function decorateNavStructure(nav) {
  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections
      .querySelectorAll(':scope .default-content-wrapper > ul > li')
      .forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        setupSubmenu(navSection);
        navSection.addEventListener('click', (event) => {
          if (event.target.tagName === 'A') return;
          if (!isDesktop.matches) {
            navSection.classList.toggle('active');
          }
        });
        navSection.addEventListener('mouseenter', () => {
          toggleAllNavSections(navSections);
          if (isDesktop.matches) {
            if (!navSection.classList.contains('nav-drop')) {
              overlay.classList.remove('show');
              return;
            }
            navSection.setAttribute('aria-expanded', 'true');
            overlay.classList.add('show');
          }
        });
      });
  }

  return { navSections, navTools: nav.querySelector('.nav-tools') };
}

/**
 * Monta el armazón del nav en el block: .nav-wrapper, hamburger móvil,
 * listeners de resize/mouseout y estado inicial según la media query.
 * @param {HTMLElement} block Block del header
 * @param {HTMLElement} nav Elemento <nav> ya decorado
 * @param {Element|null} navSections Sección .nav-sections del nav
 */
export function attachNavShell(block, nav, navSections) {
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  navWrapper.addEventListener('mouseout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) {
      toggleAllNavSections(navSections);
      overlay.classList.remove('show');
    }
  });

  window.addEventListener('resize', () => {
    navWrapper.classList.remove('active');
    overlay.classList.remove('show');
    toggleMenu(nav, navSections, false);
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="${t('HeaderOpenNavigation', 'Open navigation')}">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    navWrapper.classList.toggle('active');
    overlay.classList.toggle('show');
    toggleMenu(nav, navSections);
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));
}
