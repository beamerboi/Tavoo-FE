import { routes } from './app.routes';

describe('role-based routes', () => {
  const rolesFor = (path: string): string[] =>
    (routes.find((route) => route.path === path)?.data?.['roles'] as string[]) ?? [];

  it('limits restaurant configuration and service routes to the API role matrix', () => {
    expect(rolesFor('dashboard')).toEqual(['ADMIN', 'WAITER']);
    expect(rolesFor('tables')).toEqual(['ADMIN', 'WAITER']);
    expect(rolesFor('menu')).toEqual(['ADMIN', 'WAITER']);
    expect(rolesFor('new-order')).toEqual(['WAITER']);
    expect(rolesFor('orders')).toEqual(['WAITER']);
  });

  it('limits administration and kitchen routes', () => {
    expect(rolesFor('admin/menu')).toEqual(['ADMIN']);
    expect(rolesFor('admin/users')).toEqual(['ADMIN']);
    expect(rolesFor('kitchen')).toEqual(['ADMIN', 'KITCHEN']);
  });
});
