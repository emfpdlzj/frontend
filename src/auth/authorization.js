import { ADMIN_ROLE_VALUES } from '../config/securityPolicy';

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const collectRoles = (user) => {
  if (!user || typeof user !== 'object') {
    return [];
  }

  const roleSources = [
    user.role,
    user.userRole,
    user.authority,
    user.authorities,
    user.roles,
    user.permissions
  ];

  return roleSources
    .flatMap((source) => (Array.isArray(source) ? source : [source]))
    .filter(Boolean)
    .map((role) => (typeof role === 'object' ? role.role || role.name || role.authority : role))
    .map(normalizeRole);
};

export const hasRequiredRole = (user, requiredRole) => {
  if (!requiredRole) {
    return true;
  }

  const roles = collectRoles(user);

  if (requiredRole === 'admin') {
    return ADMIN_ROLE_VALUES.some((role) => roles.includes(normalizeRole(role)));
  }

  return roles.includes(normalizeRole(requiredRole));
};
