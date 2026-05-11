import { hasRequiredRole } from './authorization';

test('allows admin users with ADMIN or ROLE_ADMIN roles', () => {
  expect(hasRequiredRole({ role: 'ADMIN' }, 'admin')).toBe(true);
  expect(hasRequiredRole({ authorities: [{ authority: 'ROLE_ADMIN' }] }, 'admin')).toBe(true);
});

test('rejects non-admin users from admin-only routes', () => {
  expect(hasRequiredRole({ roles: ['USER'] }, 'admin')).toBe(false);
  expect(hasRequiredRole(null, 'admin')).toBe(false);
});
