/**
 * sections/login.js — Formulario de login del checkout (guest → sign in).
 *
 * Coordina tres dropins: checkout (LoginForm), auth (AuthCombine en modal)
 * y la revocación de token al hacer sign out. Comportamiento 1:1 con el
 * antiguo containers.js#renderLoginForm.
 */
import { render as CheckoutProvider } from '@dropins/storefront-checkout/render.js';
import LoginForm from '@dropins/storefront-checkout/containers/LoginForm.js';
import * as authApi from '@dropins/storefront-auth/api.js';
import AuthCombine from '@dropins/storefront-auth/containers/AuthCombine.js';
import { render as AuthProvider } from '@dropins/storefront-auth/render.js';
import { authPrivacyPolicyConsentSlot } from '../../../scripts/ui/slots/privacy-policy-consent.js';
import { showModal } from '../utils.js';
import { LOGIN_FORM_NAME } from '../constants.js';

/**
 * Renders the login form for guest checkout with authentication options.
 * Uses the existing 'authenticated' event system for decoupled communication.
 * @param {HTMLElement} container
 * @returns {Promise<object>} rendered container API
 */
export const renderLoginForm = (container) => CheckoutProvider.render(LoginForm, {
  name: LOGIN_FORM_NAME,
  onSignInClick: async (initialEmailValue) => {
    const signInForm = document.createElement('div');

    AuthProvider.render(AuthCombine, {
      signInFormConfig: {
        renderSignUpLink: true,
        initialEmailValue,
        // No onSuccessCallback needed - the 'authenticated' event fires automatically
      },
      signUpFormConfig: {
        slots: {
          ...authPrivacyPolicyConsentSlot,
        },
      },
      resetPasswordFormConfig: {},
    })(signInForm);

    await showModal(signInForm);
  },
  onSignOutClick: () => {
    authApi.revokeCustomerToken();
  },
})(container);
