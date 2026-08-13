/**
 * blocks/header/renderAuthCombine.js — Interfaz de auth "combine" del header.
 *
 * Responsabilidad:
 *  - Modal de login/registro/reset (#auth-combine-modal) enlazado desde el
 *    item "Account" del nav, con trap de foco y restauración del viewport.
 *  - Notificaciones de éxito de sign-in y sign-up (factory compartida).
 *
 * Se conserva junto a renderAuthDropdown.js por decisión del cliente: ambas
 * interfaces de autenticación conviven en el header.
 */
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import { AuthCombine } from '@dropins/storefront-auth/containers/AuthCombine.js';
import { SuccessNotification } from '@dropins/storefront-auth/containers/SuccessNotification.js';
import * as authApi from '@dropins/storefront-auth/api.js';
import { Button, provider as UI } from '@dropins/tools/components.js';
import {
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_FORGOTPASSWORD_PATH,
  rootLink,
} from '../../scripts/core/routes.js';
import { EVENTS, on } from '../../scripts/core/events.js';
import { COOKIES, getCookie } from '../../scripts/core/storage.js';
import { fetchPlaceholders } from '../../scripts/core/i18n.js';

const labels = await fetchPlaceholders();

/** Lookup de placeholder con fallback idéntico al texto original en inglés. */
const t = (key, fallback) => labels?.Global?.[key] ?? fallback;

/**
 * Estilos inline del botón secundario de las notificaciones de éxito.
 * Se conservan (header.css no cubre este layout interno del dropin) pero
 * centralizados en un único punto.
 * @param {HTMLElement} element
 */
function applySecondaryActionStyles(element) {
  element.style.display = 'flex';
  element.style.justifyContent = 'center';
  element.style.marginTop = 'var(--spacing-xsmall)';
}

/**
 * Factory compartida del slot SuccessNotification (sign-in y sign-up
 * duplicaban esta estructura: notificación + acción primaria + secundaria).
 * @param {object} options
 * @param {(ctx: object) => { headingText: string, messageText: string }} options.getLabels
 * @param {{ label: string, onClick: Function }} options.primaryAction
 * @param {{ label: string, onClick: Function }} options.secondaryAction
 * @returns {(ctx: object) => void} Función de slot para el dropin de auth
 */
function createSuccessNotificationSlot({ getLabels, primaryAction, secondaryAction }) {
  return (ctx) => {
    const elem = document.createElement('div');

    authRenderer.render(SuccessNotification, {
      labels: getLabels(ctx),
      slots: {
        SuccessNotificationActions: (innerCtx) => {
          const primaryBtn = document.createElement('div');

          UI.render(Button, {
            children: primaryAction.label,
            onClick: primaryAction.onClick,
          })(primaryBtn);

          innerCtx.appendChild(primaryBtn);

          const secondaryButton = document.createElement('div');
          applySecondaryActionStyles(secondaryButton);

          UI.render(Button, {
            children: secondaryAction.label,
            variant: 'tertiary',
            onClick: secondaryAction.onClick,
          })(secondaryButton);

          innerCtx.appendChild(secondaryButton);
        },
      },
    })(elem);

    ctx.appendChild(elem);
  };
}

const signInFormConfig = {
  renderSignUpLink: true,
  routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
  slots: {
    SuccessNotification: createSuccessNotificationSlot({
      getLabels: (ctx) => {
        const userName = ctx?.isSuccessful?.userName || '';
        return {
          headingText: t('AuthSignInWelcome', 'Welcome {name}!').replace('{name}', userName),
          messageText: t('AuthSignInSuccess', 'You have successfully logged in.'),
        };
      },
      primaryAction: {
        label: t('AuthMyAccount', 'My Account'),
        onClick: () => {
          window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
        },
      },
      secondaryAction: {
        label: t('AuthLogout', 'Logout'),
        onClick: async () => {
          await authApi.revokeCustomerToken();
          window.location.href = rootLink('/');
        },
      },
    }),
  },
};

const signUpFormConfig = {
  routeSignIn: () => rootLink(CUSTOMER_LOGIN_PATH),
  routeRedirectOnSignIn: () => rootLink(CUSTOMER_ACCOUNT_PATH),
  isAutoSignInEnabled: false,
  slots: {
    SuccessNotification: createSuccessNotificationSlot({
      getLabels: () => ({
        headingText: t('AuthSignUpSuccess', 'Your account has been successfully created!'),
        messageText: t('AuthSignUpSuccessMessage', 'You can login using sign-in page now.'),
      }),
      primaryAction: {
        label: t('AuthSignIn', 'Sign in'),
        onClick: () => {
          window.location.href = rootLink(CUSTOMER_LOGIN_PATH);
        },
      },
      secondaryAction: {
        label: t('AuthHome', 'Home'),
        onClick: () => {
          window.location.href = rootLink('/');
        },
      },
    }),
  },
};

const resetPasswordFormConfig = {
  routeSignIn: () => rootLink(CUSTOMER_LOGIN_PATH),
};

const onHeaderLinkClick = (element) => {
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const originalViewportContent = viewportMeta.getAttribute('content');

  if (getCookie(COOKIES.AUTH_FIRSTNAME)) {
    window.location.href = rootLink(CUSTOMER_ACCOUNT_PATH);
    return;
  }
  const signInModal = document.createElement('div');
  document.body.style.overflow = 'hidden';
  viewportMeta.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0',
  );

  signInModal.setAttribute('id', 'auth-combine-modal');
  signInModal.classList.add('auth-combine-modal-overlay');

  const trapFocus = (event) => {
    if (!signInModal) return;

    const key = event.key.toLowerCase();

    if (key === 'escape') {
      event.preventDefault();
      signInModal.click();
      element?.focus();
      window.removeEventListener('keydown', trapFocus);
      return;
    }

    const focusableElements = signInModal.querySelectorAll(
      'input[name="email"], input, button, textarea, select, a[href], [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!signInModal.dataset.focusInitialized) {
      signInModal.dataset.focusInitialized = 'true';
      requestAnimationFrame(() => firstElement.focus(), 10);
    }

    if (key === 'tab' && event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else if (key === 'tab') {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (document.activeElement === signInModal) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  window.addEventListener('keydown', trapFocus);

  signInModal.onclick = () => {
    signInModal.remove();
    document.body.style.overflow = 'auto';
    viewportMeta.setAttribute('content', originalViewportContent);
    window.removeEventListener('keydown', trapFocus);
    window.location.reload();
  };

  const signInForm = document.createElement('div');
  signInForm.setAttribute('id', 'auth-combine-wrapper');
  signInForm.onclick = (event) => {
    event.stopPropagation();
  };

  signInModal.appendChild(signInForm);
  document.body.appendChild(signInModal);

  authRenderer.render(AuthCombine, {
    signInFormConfig,
    signUpFormConfig,
    resetPasswordFormConfig,
  })(signInForm);
};

/**
 * Engancha la interfaz auth "combine" al item "Account" del nav.
 * @param {Element} navSections Sección .nav-sections del nav
 * @param {Function} [closeMobileMenu] Callback para cerrar el menú móvil
 */
const renderAuthCombine = (navSections, closeMobileMenu) => {
  if (getCookie(COOKIES.AUTH_FIRSTNAME)) return;

  const navListEl = navSections.querySelector('.default-content-wrapper > ul');

  const listItems = navListEl.querySelectorAll(
    '.default-content-wrapper > ul > li',
  );

  // TODO: DOM-scraping frágil. El item se localiza por el texto 'Account'
  // porque el nav es contenido autorado (/nav) sin clases ni data-* estables
  // para identificarlo; si el autor renombra o traduce el item, este enganche
  // deja de funcionar. Se mantiene tal cual hasta que el fragment de nav
  // exponga un selector estable.
  const accountLi = Array.from(listItems).find((li) => li.textContent.includes('Account'));

  if (accountLi) {
    const accountLiItems = accountLi.querySelectorAll('ul > li');
    const authCombineLink = accountLiItems[accountLiItems.length - 1];

    authCombineLink.classList.add('authCombineNavElement');
    const text = authCombineLink.textContent || '';
    authCombineLink.innerHTML = `<a href="#">${text}</a>`;
    authCombineLink.addEventListener('click', (event) => {
      event.preventDefault();
      onHeaderLinkClick(accountLi);

      function getPopupElements() {
        const headerBlock = document.querySelector('.header.block');
        const headerLoginButton = document.querySelector('#header-login-button');
        const popupElement = document.querySelector('#popup-menu');
        const popupMenuContainer = document.querySelector('.popupMenuContainer');

        return {
          headerBlock,
          headerLoginButton,
          popupElement,
          popupMenuContainer,
        };
      }

      on(EVENTS.AUTHENTICATED, (isAuthenticated) => {
        const authCombineNavElement = document.querySelector(
          '.authCombineNavElement',
        );
        if (isAuthenticated) {
          const { headerLoginButton, popupElement, popupMenuContainer } = getPopupElements();

          if (
            !authCombineNavElement
          || !headerLoginButton
          || !popupElement
          || !popupMenuContainer
          ) {
            return;
          }

          authCombineNavElement.style.display = 'none';
          popupMenuContainer.innerHTML = '';
          popupElement.style.minWidth = '250px';
          if (headerLoginButton) {
            const spanElementText = headerLoginButton.querySelector('span');
            spanElementText.textContent = t('AuthGreeting', 'Hi, {name}')
              .replace('{name}', getCookie(COOKIES.AUTH_FIRSTNAME));
          }
          popupMenuContainer.insertAdjacentHTML(
            'afterend',
            `<ul class="popupMenuUrlList">
              <li><a href="${rootLink(CUSTOMER_ACCOUNT_PATH)}">${t('AuthMyAccount', 'My Account')}</a></li>
              <li><button class="logoutButton">${t('AuthLogout', 'Logout')}</button></li>
            </ul>`,
          );
        }
      });
      closeMobileMenu?.();
    });
  }
};

export default renderAuthCombine;
