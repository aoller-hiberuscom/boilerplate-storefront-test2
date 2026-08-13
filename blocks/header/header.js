/**
 * blocks/header/header.js — Punto de entrada del block header.
 *
 * Responsabilidad (orquestación, sin lógica propia):
 *  1. Banner de sesión de compra asistida (renderSellerAssistedBuyingBanner).
 *  2. Carga del fragment de navegación (/nav o metadata `nav`).
 *  3. Composición de los módulos del block: estructura y accesibilidad del
 *     nav (nav.js), paneles de herramientas (panels.js) y las dos interfaces
 *     de autenticación que el cliente decidió conservar (renderAuthCombine.js
 *     y renderAuthDropdown.js).
 */
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

import {
  isDesktop,
  toggleMenu,
  decorateNavStructure,
  attachNavShell,
} from './nav.js';
import decoratePanels from './panels.js';
import renderAuthCombine from './renderAuthCombine.js';
import { renderAuthDropdown } from './renderAuthDropdown.js';
import renderSellerAssistedBuyingBanner from './renderSellerAssistedBuyingBanner.js';

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Render a banner at the top of the page if seller assisted buying session identified
  const sellerAssistedBuyingBanner = await renderSellerAssistedBuyingBanner();
  if (sellerAssistedBuyingBanner && !document.querySelector('.seller-assisted-buying-banner')) {
    document.body.insertAdjacentElement('afterbegin', sellerAssistedBuyingBanner);
  }

  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const { navSections, navTools } = decorateNavStructure(nav);

  // tool panels (wishlist, mini-cart, search)
  decoratePanels(navTools, navSections);

  // nav shell: wrapper, hamburger, resize/media-query listeners
  attachNavShell(block, nav, navSections);

  // both auth UIs are preserved intentionally (client decision)
  renderAuthCombine(
    navSections,
    () => !isDesktop.matches && toggleMenu(nav, navSections, false),
  );
  renderAuthDropdown(navTools);
}
