import { getCurrentUserPermissions } from './rbac.js';

async function applySidebarPermissions() {
    const { hasPermission } = await getCurrentUserPermissions();

    document.querySelectorAll('[data-permission]').forEach((element) => {
        const permissionStr = element.getAttribute('data-permission');
        const perms = permissionStr ? permissionStr.split(',').map(p => p.trim()) : [];
        if (hasPermission(perms)) {
            element.classList.add('permission-granted');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySidebarPermissions);
} else {
    applySidebarPermissions();
}
