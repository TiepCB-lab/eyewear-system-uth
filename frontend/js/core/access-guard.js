import authService from '../services/authService.js';
import { usePermission } from './rbac.js';

export async function protectDashboard() {
    const roles = authService.getUserRoles();
    const { hasPermission } = usePermission({ roles });
    const path = window.location.pathname;

    if (path.includes('/dashboard/')) {
        // 1. Basic staff check
        if (!authService.isStaff()) {
            denyAccess('Staff Portal');
            return;
        }

        // 2. Granular check based on 'view' parameter
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');

        const viewPermissions = {
            'orders': 'manage_orders',
            'inventory': 'manage_inventory',
            'products': 'view_products',
            'analytics': 'view_manager_dashboard',
            'users': 'manage_users',
            'settings': 'manage_system',
            'profile': null // Custom profile for staff
        };

        if (view && viewPermissions[view]) {
            if (!hasPermission(viewPermissions[view])) {
                denyAccess(`${view} module`);
            }
        }
    }
}

async function denyAccess(area) {
    await alert(`Access Denied: You do not have permission to view ${area}.`);
    window.location.href = '/pages/auth/index.html';
}

// Auto-run if imported directly
if (window.location.pathname.includes('/dashboard/')) {
    protectDashboard();
}








