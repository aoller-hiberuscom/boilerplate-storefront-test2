import { render as accountRenderer } from '@dropins/storefront-account/render.js';
import { OrdersList } from '@dropins/storefront-account/containers/OrdersList.js';
import { readBlockConfig } from '../../scripts/aem.js';
import {
  CUSTOMER_ORDER_DETAILS_PATH,
  CUSTOMER_ORDERS_PATH,
  CUSTOMER_RETURN_DETAILS_PATH,
  UPS_TRACKING_URL,
  rootLink,
} from '../../scripts/core/routes.js';
import { productLinkFromItem } from '../../scripts/ui/slots/product-link.js';
import { linkedImageSlot } from '../../scripts/ui/slots/image-slot.js';
import { mountDropinBlock } from '../../scripts/ui/dropin-block.js';

export default async function decorate(block) {
  const { 'minified-view': minifiedViewConfig = 'false' } = readBlockConfig(block);

  // If product is null/undefined, it's been deleted from catalog
  const createProductLink = (productData) => (
    productData?.product ? productLinkFromItem(productData) : rootLink('#')
  );

  await mountDropinBlock(block, {
    capability: 'account',
    guard: 'auth',
    render: () => accountRenderer.render(OrdersList, {
      minifiedView: minifiedViewConfig === 'true',
      routeTracking: ({ carrier, number }) => {
        if (carrier === 'ups') {
          return `${UPS_TRACKING_URL}?tracknum=${number}`;
        }
        return '';
      },
      routeOrdersList: () => rootLink(CUSTOMER_ORDERS_PATH),
      routeOrderDetails: (orderNumber) => rootLink(`${CUSTOMER_ORDER_DETAILS_PATH}?orderRef=${orderNumber}`),
      routeReturnDetails: ({ orderNumber, returnNumber }) => rootLink(`${CUSTOMER_RETURN_DETAILS_PATH}?orderRef=${orderNumber}&returnRef=${returnNumber}`),
      routeOrderProduct: createProductLink,
      slots: {
        OrderItemImage: linkedImageSlot((ctx) => createProductLink(ctx.data)),
      },
    })(block),
  });
}
