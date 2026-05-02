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

    const userRoles = Array.isArray(user.roles) 
        ? user.roles 
        : (user.role ? [user.role] : []);

    // SUPPORT BOTH BACKEND PERMISSIONS AND ROLE FALLBACK
    const userPermissions = new Set();
    
    // 1. If backend explicitly provided permissions, use them (STRICT)
    if (user.permissions && Array.isArray(user.permissions)) {
        user.permissions.forEach(p => userPermissions.add(p));
    } 
    // 2. Fallback to deriving from roles if no explicit permissions (Backward compatibility)
    else {
        userRoles.forEach(role => {
            const permissions = ROLE_PERMISSIONS[role] || [];
            permissions.forEach(p => userPermissions.add(p));
        });
    }

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
        let permissions = [];

        if (user) {
            if (user.roles && Array.isArray(user.roles)) {
                roles = user.roles.map(r => String(r).toUpperCase());
            }
            if (user.permissions && Array.isArray(user.permissions)) {
                permissions = user.permissions;
            }
            
            // Also update local storage if we got fresh info to keep them in sync
            authService.saveUserInfo(user);
        } else {
            roles = authService.getUserRoles();
            permissions = authService.getUserPermissions();
        }

        return usePermission({ roles, permissions });
    } catch (error) {
        console.error('Error getting current user permissions:', error);
        return usePermission(null);
    }
}
