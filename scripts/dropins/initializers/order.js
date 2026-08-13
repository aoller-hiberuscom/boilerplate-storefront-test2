/**
 * Initializer del dropin de Order.
 * No se auto-ejecuta: lo monta scripts/dropins/registry.js.
 *
 * Incluye el enrutado de páginas de pedido: según autenticación y parámetros
 * (orderRef/returnRef/orderNumber) decide si redirigir a la vista guest o
 * customer, o montar el dropin.
 */
import { initializers } from '@dropins/tools/initializer.js';
import * as api from '@dropins/storefront-order/api.js';
import { createDropinInitializer } from '../create-initializer.js';
import { checkIsAuthenticated } from '../../core/auth.js';
import { EVENTS, on } from '../../core/events.js';
import {
  rootLink,
  ORDER_DETAILS_PATH,
  CUSTOMER_ORDER_DETAILS_PATH,
  RETURN_DETAILS_PATH,
  CUSTOMER_RETURN_DETAILS_PATH,
  CREATE_RETURN_PATH,
  CUSTOMER_CREATE_RETURN_PATH,
  CUSTOMER_ORDERS_PATH,
  ORDER_STATUS_PATH,
  CUSTOMER_PATH,
  SALES_GUEST_VIEW_PATH,
  SALES_ORDER_VIEW_PATH,
} from '../../core/routes.js';

/** Longitud mínima a partir de la cual orderRef se considera un token. */
const ORDER_TOKEN_MIN_LENGTH = 20;

const PATHS_REQUIRING_REDIRECTS = [
  ORDER_DETAILS_PATH,
  CUSTOMER_ORDER_DETAILS_PATH,
  RETURN_DETAILS_PATH,
  CUSTOMER_RETURN_DETAILS_PATH,
  CREATE_RETURN_PATH,
  CUSTOMER_CREATE_RETURN_PATH,
  SALES_GUEST_VIEW_PATH,
  SALES_ORDER_VIEW_PATH,
];

async function handleUserOrdersRedirects({
  isAccountPage, orderRef, returnRef, isTokenProvided, langDefinitions, orderNumber,
}) {
  let targetPath = null;

  on(EVENTS.ORDER_ERROR, () => {
    if (checkIsAuthenticated()) {
      window.location.href = rootLink(CUSTOMER_ORDERS_PATH);
    } else if (isTokenProvided) {
      window.location.href = orderNumber
        ? rootLink(`${ORDER_STATUS_PATH}?orderRef=${orderNumber}`)
        : rootLink(ORDER_STATUS_PATH);
    } else {
      window.location.href = rootLink(`${ORDER_STATUS_PATH}?orderRef=${orderRef}`);
    }
  });

  if (checkIsAuthenticated()) {
    if (!orderRef) {
      targetPath = CUSTOMER_ORDERS_PATH;
    } else if (isAccountPage) {
      targetPath = isTokenProvided
        ? `${ORDER_DETAILS_PATH}?orderRef=${orderRef}`
        : null;
    } else {
      targetPath = isTokenProvided
        ? null
        : `${CUSTOMER_ORDER_DETAILS_PATH}?orderRef=${orderRef}`;
    }
  } else {
    targetPath = !orderRef ? ORDER_STATUS_PATH : null;
  }

  if (targetPath) {
    window.location.href = rootLink(targetPath);
  } else {
    await initializers.mountImmediately(api.initialize, {
      langDefinitions,
      orderRef,
      returnRef,
    });
  }
}

export default createDropinInitializer({
  api,
  endpoint: 'core',
  placeholders: 'placeholders/order.json',
  mount: async ({ langDefinitions }) => {
    const { pathname, searchParams } = new URL(window.location.href);
    if (pathname.includes(CUSTOMER_ORDERS_PATH)) {
      return;
    }
    const isAccountPage = pathname.includes(CUSTOMER_PATH);
    const orderRef = searchParams.get('orderRef');
    const returnRef = searchParams.get('returnRef');
    const orderNumber = searchParams.get('orderNumber');
    const isTokenProvided = !!(orderRef && orderRef.length > ORDER_TOKEN_MIN_LENGTH);

    if (PATHS_REQUIRING_REDIRECTS.includes(pathname)) {
      await handleUserOrdersRedirects({
        isAccountPage, orderRef, returnRef, isTokenProvided, langDefinitions, orderNumber,
      });
      return;
    }

    await initializers.mountImmediately(api.initialize, {
      langDefinitions,
      orderRef,
      returnRef,
    });
  },
});
