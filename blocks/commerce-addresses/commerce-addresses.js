import { Addresses } from '@dropins/storefront-account/containers/Addresses.js';
import { render as accountRenderer } from '@dropins/storefront-account/render.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { CUSTOMER_ADDRESS_PATH, rootLink } from '../../scripts/core/routes.js';
import { mountDropinBlock } from '../../scripts/ui/dropin-block.js';

export default async function decorate(block) {
  const {
    'minified-view': minifiedViewConfig = 'false',
  } = readBlockConfig(block);

  await mountDropinBlock(block, {
    capability: 'account',
    guard: 'auth',
    render: () => accountRenderer.render(Addresses, {
      minifiedView: minifiedViewConfig === 'true',
      withActionsInMinifiedView: false,
      withActionsInFullSizeView: true,
      routeAddressesPage: () => rootLink(CUSTOMER_ADDRESS_PATH),
    })(block),
  });
}
