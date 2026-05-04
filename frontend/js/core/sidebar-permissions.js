import { getCurrentUserPermissions } from './rbac.js';

async function applySidebarPermissions() {
    const { hasPermission, hasRole } = await getCurrentUserPermissions();

    document.querySelectorAll('[data-permission]').forEach((element) => {
        const permissionStr = element.getAttribute('data-permission');
        const view = element.getAttribute('data-view');
        const perms = permissionStr ? permissionStr.split(',').map(p => p.trim()) : [];
        
        // Logic: Grant if has specific permission OR if is SALES_STAFF for specific views
        let granted = perms.length === 0 || perms.some(p => hasPermission(p));

        // Role-based fallback for Sales Staff to ensure they see important things
        if (hasRole('SALES_STAFF')) {
            if (view === 'inventory' || view === 'users') {
                granted = true;
            }
        }
        
        if (granted) {
            element.classList.add('permission-granted');
            element.style.display = ''; // Show if granted
        } else {
            element.classList.remove('permission-granted');
            element.style.display = 'none'; // Hide if not granted
        }
    });
}

// Initial run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySidebarPermissions);
} else {
    applySidebarPermissions();
}

// CRITICAL: Re-run when layout-loader finishes injecting components (like the Sidebar)
window.addEventListener('content-loaded', (e) => {
    // Only run if the sidebar was loaded or if it's a general content load
    if (!e.detail || e.detail.path === 'layout/StaffSidebar' || e.detail.path === 'layout/Header') {
        applySidebarPermissions();
    }
});
