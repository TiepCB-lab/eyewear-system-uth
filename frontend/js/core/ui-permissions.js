import { getCurrentUserPermissions } from './rbac.js';

/**
 * Automatically handle UI visibility based on data-permission attributes
 */
export async function applyPermissions() {
    const { hasPermission } = await getCurrentUserPermissions();
    
    // Find all elements with data-permission
    const elements = document.querySelectorAll('[data-permission]');
    
    elements.forEach(el => {
        const requiredPermissions = el.getAttribute('data-permission').split(',').map(p => p.trim());
        
        // Check if user has ANY of the required permissions (OR logic)
        // If you need AND logic, you could support a different attribute like data-permission-all
        const granted = requiredPermissions.some(p => hasPermission(p));
        
        if (granted) {
            el.classList.add('permission-granted');
            el.removeAttribute('hidden');
            // If it's a template or hidden by default, ensure it's visible
            if (el.style.display === 'none') {
                el.style.display = '';
            }
        } else {
            el.classList.add('permission-denied');
            el.style.display = 'none';
            el.setAttribute('hidden', 'true');
        }
    });
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    applyPermissions();
});

// Re-run when content is dynamically loaded (e.g. by layout-loader)
window.addEventListener('content-loaded', () => {
    applyPermissions();
});
