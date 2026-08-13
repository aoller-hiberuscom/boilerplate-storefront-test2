/**
 * blocks/header/renderAuthDropdown.js — Interfaz de auth "dropdown" del header.
 *
 * Responsabilidad:
 *  - Panel desplegable de login (.nav-auth-menu-panel) en .nav-tools con el
 *    formulario SignIn del dropin de auth y el menú de usuario autenticado.
 *  - Logout con redirecciones por sección y actualización del botón (icono
 *    de cuenta ↔ saludo "Hi, {name}").
 *
 * Se conserva junto a renderAuthCombine.js por decisión del cliente: ambas
 * interfaces de autenticación conviven en el header.
 */
import * as authApi from '@dropins/storefront-auth/api.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import {
  CUSTOMER_PATH,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_FORGOTPASSWORD_PATH,
  ORDER_DETAILS_PATH,
  rootLink,
} from '../../scripts/core/routes.js';
import { getUserTokenCookie } from '../../scripts/core/auth.js';
import { COOKIES, getCookie } from '../../scripts/core/storage.js';
import { fetchPlaceholders } from '../../scripts/core/i18n.js';

const labels = await fetchPlaceholders();

/** Lookup de placeholder con fallback idéntico al texto original en inglés. */
const t = (key, fallback) => labels?.Global?.[key] ?? fallback;

/**
 * Redirige tras el logout según la sección actual, o recarga la página si
 * ninguna ruta coincide.
 * @param {Record<string, string>} redirections Mapa "path actual" → destino
 */
function handleLogout(redirections) {
  const shouldRedirect = Object.entries(redirections).some(([currentPath, redirectPath]) => {
    if (window.location.pathname.includes(currentPath)) {
      window.location.href = redirectPath;
      return true;
    }
    return false;
  });

  if (!shouldRedirect) {
    // reload the page if no redirect occurred
    window.location.reload();
  }
}

/** Renderiza el formulario SignIn del dropin dentro del panel. */
function renderSignIn(element) {
  authRenderer.render(SignIn, {
    onSuccessCallback: () => {
      // reload the page
      window.location.reload();
    },
    formSize: 'small',
    routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
  })(element);
}

/**
 * Monta la interfaz auth "dropdown" en las herramientas del nav.
 * @param {Element} navTools Contenedor .nav-tools del nav
 */
export function renderAuthDropdown(navTools) {
  const dropdownElement = document.createRange().createContextualFragment(`
 <div class="dropdown-wrapper nav-tools-wrapper">
    <button type="button" class="nav-dropdown-button" aria-haspopup="dialog" aria-expanded="false" aria-controls="login-modal"></button>
    <div class="nav-auth-menu-panel nav-tools-panel">
      <div id="auth-dropin-container"></div>
      <ul class="authenticated-user-menu">
         <li><a href="${rootLink(CUSTOMER_ACCOUNT_PATH)}">${t('AuthMyAccount', 'My Account')}</a></li>
          <li><button>${t('AuthLogout', 'Logout')}</button></li>
      </ul>
    </div>
 </div>`);

  navTools.append(dropdownElement);

  const authDropDownPanel = navTools.querySelector('.nav-auth-menu-panel');
  const authDropDownMenuList = navTools.querySelector(
    '.authenticated-user-menu',
  );
  const authDropinContainer = navTools.querySelector('#auth-dropin-container');
  const loginButton = navTools.querySelector('.nav-dropdown-button');
  const logoutButtonElement = navTools.querySelector(
    '.authenticated-user-menu > li > button',
  );

  authDropDownPanel.addEventListener('click', (e) => e.stopPropagation());

  async function toggleDropDownAuthMenu(state) {
    const show = state ?? !authDropDownPanel.classList.contains('nav-tools-panel--show');

    authDropDownPanel.classList.toggle('nav-tools-panel--show', show);
    authDropDownPanel.setAttribute('role', 'dialog');
    authDropDownPanel.setAttribute('aria-hidden', 'false');
    authDropDownPanel.setAttribute('aria-labelledby', 'modal-title');
    authDropDownPanel.setAttribute('aria-describedby', 'modal-description');
    authDropDownPanel.focus();
  }

  loginButton.addEventListener('click', () => toggleDropDownAuthMenu());
  document.addEventListener('click', async (e) => {
    const clickOnDropDownPanel = authDropDownPanel.contains(e.target);
    const clickOnLoginButton = loginButton.contains(e.target);

    if (!clickOnDropDownPanel && !clickOnLoginButton) {
      await toggleDropDownAuthMenu(false);
    }
  });

  logoutButtonElement.addEventListener('click', async () => {
    await authApi.revokeCustomerToken();
    handleLogout({
      '/checkout': rootLink('/cart'),
      [CUSTOMER_PATH]: rootLink(CUSTOMER_LOGIN_PATH),
      [ORDER_DETAILS_PATH]: rootLink('/'),
    });
  });

  renderSignIn(authDropinContainer);

  const updateDropDownUI = (isAuthenticated) => {
    const userTokenCookie = getUserTokenCookie();
    const userNameCookie = getCookie(COOKIES.AUTH_FIRSTNAME);

    if (isAuthenticated || userTokenCookie) {
      // Estilos inline de estado (mostrar/ocultar): el CSS del header no los
      // cubre, se conservan tal cual para mantener el comportamiento 1:1.
      authDropDownMenuList.style.display = 'block';
      authDropinContainer.style.display = 'none';
      loginButton.textContent = t('AuthGreeting', 'Hi, {name}').replace('{name}', userNameCookie);
    } else {
      authDropDownMenuList.style.display = 'none';
      authDropinContainer.style.display = 'block';
      loginButton.innerHTML = `
      <svg
          width="25"
          height="25"
          viewBox="0 0 24 24"
          aria-label="${t('AuthMyAccount', 'My Account')}"
          >
          <g fill="none" stroke="#000000" stroke-width="1.5">
          <circle cx="12" cy="6" r="4"></circle>
          <path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"></path></g></svg>
        `;
    }
  };

  updateDropDownUI();
}
