/**
 * ui/slots/privacy-policy-consent.js — Slot de consentimiento en formularios auth.
 *
 * Capa: ui (puede importar de domain, dropins, core y vendor).
 *
 * Los textos se resuelven desde placeholders (claves auth.privacyConsent*)
 * con fallback en inglés mientras el contenido no los defina.
 */
import { fetchPlaceholders } from '../../core/i18n.js';
import { rootLink, PRIVACY_POLICY_PATH } from '../../core/routes.js';

const FALLBACK = {
  prefix: 'By creating an account, you acknowledge that you have read and agree to our ',
  linkText: 'Privacy Policy',
  suffix: ', which outlines how we collect, use, and protect your personal data.',
};

/**
 * Slot PrivacyPolicyConsent para los formularios de los dropins de auth.
 * @type {{ PrivacyPolicyConsent: (ctx: { appendChild: Function }) => Promise<void> }}
 */
export const authPrivacyPolicyConsentSlot = {
  PrivacyPolicyConsent: async (ctx) => {
    const labels = await fetchPlaceholders();
    const texts = {
      prefix: labels?.auth?.privacyConsentPrefix || FALLBACK.prefix,
      linkText: labels?.auth?.privacyConsentLinkText || FALLBACK.linkText,
      suffix: labels?.auth?.privacyConsentSuffix || FALLBACK.suffix,
    };

    const wrapper = document.createElement('span');
    Object.assign(wrapper.style, {
      color: 'var(--color-neutral-700)',
      font: 'var(--type-details-caption-2-font)',
      display: 'block',
      marginBottom: 'var(--spacing-medium)',
    });

    const link = document.createElement('a');
    link.href = rootLink(PRIVACY_POLICY_PATH);
    link.target = '_blank';
    link.textContent = texts.linkText;

    wrapper.append(texts.prefix, link, texts.suffix);

    ctx.appendChild(wrapper);
  },
};
