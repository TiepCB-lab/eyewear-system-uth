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
     * Check if user has a specific permission (or any of the permissions if array)
     */
    const hasPermission = (permissionName) => {
        if (!permissionName) return true;
        if (Array.isArray(permissionName)) {
            return permissionName.some(p => userPermissions.has(p));
        }
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
        let roles = [];
        if (user?.roles && Array.isArray(user.roles)) {
            roles = user.roles.map(r => String(r).toUpperCase());
        } else {
            roles = authService.getUserRoles();
        }
        
        // Also update local storage if we got fresh roles to keep them in sync
        if (user && user.roles) {
            authService.saveUserInfo(user);
        }

        return usePermission({ roles });
    } catch (error) {
        console.error('Error getting current user permissions:', error);
        return usePermission(null);
    }
}
