import { getCurrentUserPermissions } from './rbac.js';

async function applySidebarPermissions() {
    const { hasPermission } = await getCurrentUserPermissions();

    document.querySelectorAll('[data-permission]').forEach((element) => {
        const permission = element.getAttribute('data-permission');
        if (hasPermission(permission)) {
            element.classList.add('permission-granted');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySidebarPermissions);
} else {
    applySidebarPermissions();
}
