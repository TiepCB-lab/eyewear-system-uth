import { ROLES, ROLE_PERMISSIONS } from './roles.js';

/**
 * Custom hook/utility for handling RBAC permissions in Vanilla JS
 * Usage: 
 *   const { hasPermission, hasRole } = usePermission(user);
 */
export function usePermission(user) {
    if (!user) {
        return {
            hasPermission: () => false,
            hasRole: () => false,
            permissions: [],
            roles: []
        };
    }

    // Support both single role (string) and multiple roles (array)
    const userRoles = Array.isArray(user.roles) 
        ? user.roles 
        : (user.role ? [user.role] : []);

    // Extract all permissions from user roles
    const userPermissions = new Set();
    userRoles.forEach(role => {
        const permissions = ROLE_PERMISSIONS[role] || [];
        permissions.forEach(p => userPermissions.add(p));
    });

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permissionName) => {
        return userPermissions.has(permissionName);
    };

    /**
     * Check if user has a specific role
     */
    const hasRole = (roleName) => {
        return userRoles.includes(roleName);
    };

    return {
        hasPermission,
        hasRole,
        permissions: Array.from(userPermissions),
        roles: userRoles
    };
}

/**
 * Global helper to get permission for the currently logged in user
 */
export async function getCurrentUserPermissions() {
    try {
        const { default: authService } = await import('../services/authService.js');
        const user = await authService.getCurrentUser();
        // Backend returns user object, we need to ensure it has roles/role
        // authService.getUserRoles() already handles localStorage fallback
        const roles = authService.getUserRoles();
        return usePermission({ roles });
    } catch (error) {
        console.error('Error getting current user permissions:', error);
        return usePermission(null);
    }
}
