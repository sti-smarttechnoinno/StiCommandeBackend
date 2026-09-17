'use client';

import { useAuthStore } from '@/store';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'administrator';
  const isCommercial = role === 'commercial' || role === 'delegate';
  const isChargeCompte = role === 'charge_compte';
  const isWarehouse = role === 'warehouse';
  const isViewer = role === 'viewer' || role === 'user' || role === '';

  const userPermissions: string[] = Array.isArray(user?.permissions) ? user.permissions : [];

  /**
   * Check if user has specific permission.
   * Admin always has total access.
   */
  const can = (permission?: string): boolean => {
    if (!permission) return true;
    if (isAdmin) return true;

    if (userPermissions.includes('*')) return true;
    if (userPermissions.includes(permission)) return true;

    // Fallback checks for standard legacy roles if permissions array is empty or not yet loaded
    if (userPermissions.length === 0) {
      if (isCommercial) {
        return [
          'orders.view', 'orders.create', 'orders.update',
          'clients.view', 'clients.create', 'clients.update',
          'products.view'
        ].includes(permission);
      }
      if (isChargeCompte) {
        return [
          'orders.view', 'orders.update',
          'clients.view',
          'products.view'
        ].includes(permission);
      }
      if (isWarehouse) {
        return [
          'orders.view', 'orders.update',
          'products.view'
        ].includes(permission);
      }
      return ['orders.view', 'clients.view', 'products.view'].includes(permission);
    }

    return false;
  };

  /**
   * Check if user has at least one of the provided permissions.
   */
  const canAny = (permissions: string[]): boolean => {
    if (isAdmin) return true;
    return permissions.some((p) => can(p));
  };

  /**
   * Check if user has all provided permissions.
   */
  const canAll = (permissions: string[]): boolean => {
    if (isAdmin) return true;
    return permissions.every((p) => can(p));
  };

  /**
   * Check if current user is restricted to a geographic region.
   */
  const isRestrictedByRegion = Boolean(
    isCommercial || user?.has_region_restriction
  );

  return {
    user,
    role,
    roleName: user?.role_name || (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Collaborateur'),
    can,
    canAny,
    canAll,
    isAdmin,
    isCommercial,
    isChargeCompte,
    isWarehouse,
    isViewer,
    isRestrictedByRegion,
    region: user?.region,
    wilaya: user?.wilaya,
  };
}
