/**
 * Tests de ui/guards.js — guards de autenticación de blocks.
 * window.location se sustituye por un doble para observar redirecciones.
 */
vi.mock('../../../scripts/core/auth.js', () => ({
  checkIsAuthenticated: vi.fn(),
}));

vi.mock('../../../scripts/core/routes.js', () => ({
  rootLink: vi.fn((link) => `/es${link}`),
  CUSTOMER_LOGIN_PATH: '/customer/login',
  CUSTOMER_ACCOUNT_PATH: '/customer/account',
}));

const { checkIsAuthenticated } = await import('../../../scripts/core/auth.js');
const { requireAuth, requireGuest } = await import('../../../scripts/ui/guards.js');

/** Sustituye window.location por un objeto plano observable. */
function stubLocation() {
  const fake = { href: 'http://localhost/' };
  Object.defineProperty(window, 'location', {
    value: fake,
    writable: true,
    configurable: true,
  });
  return fake;
}

describe('ui/guards', () => {
  it('requireAuth ejecuta el render si el usuario está autenticado', async () => {
    checkIsAuthenticated.mockReturnValue(true);
    const render = vi.fn(() => 'rendered');

    await expect(requireAuth(render)).resolves.toBe('rendered');
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('requireAuth redirige a login si no está autenticado', async () => {
    checkIsAuthenticated.mockReturnValue(false);
    const loc = stubLocation();
    const render = vi.fn();

    await expect(requireAuth(render)).resolves.toBeUndefined();
    expect(render).not.toHaveBeenCalled();
    expect(loc.href).toBe('/es/customer/login');
  });

  it('requireAuth acepta una redirección alternativa', async () => {
    checkIsAuthenticated.mockReturnValue(false);
    const loc = stubLocation();

    await requireAuth(vi.fn(), { redirectTo: '/customer/orders' });
    expect(loc.href).toBe('/es/customer/orders');
  });

  it('requireGuest ejecuta el render si NO está autenticado', async () => {
    checkIsAuthenticated.mockReturnValue(false);
    const render = vi.fn(() => 'guest-ok');

    await expect(requireGuest(render)).resolves.toBe('guest-ok');
  });

  it('requireGuest redirige a account si está autenticado', async () => {
    checkIsAuthenticated.mockReturnValue(true);
    const loc = stubLocation();
    const render = vi.fn();

    await requireGuest(render);
    expect(render).not.toHaveBeenCalled();
    expect(loc.href).toBe('/es/customer/account');
  });
});
