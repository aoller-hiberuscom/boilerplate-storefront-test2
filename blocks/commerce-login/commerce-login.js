import { SignIn } from '@dropins/storefront-auth/containers/SignIn.js';
import { render as authRenderer } from '@dropins/storefront-auth/render.js';
import {
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_FORGOTPASSWORD_PATH,
  rootLink,
} from '../../scripts/core/routes.js';
import { mountDropinBlock } from '../../scripts/ui/dropin-block.js';

export default async function decorate(block) {
  await mountDropinBlock(block, {
    capability: 'auth',
    guard: 'guest',
    render: () => authRenderer.render(SignIn, {
      routeForgotPassword: () => rootLink(CUSTOMER_FORGOTPASSWORD_PATH),
      routeRedirectOnSignIn: () => rootLink(CUSTOMER_ACCOUNT_PATH),
    })(block),
  });
}
