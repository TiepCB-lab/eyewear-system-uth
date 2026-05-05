import { getCurrentUserPermissions } from '../core/rbac.js';

/**
 * Main Dashboard Controller
 * Handles dynamic module loading and view switching
 */
class DashboardController {
    constructor() {
        this.modulesContainer = document.getElementById('dashboard-modules');
        this.currentView = null;
    }

    async init() {
        this.setupNavigation();
        this.handleInitialLoad();
    }

    setupNavigation() {
        // Sidebar Toggle for Mobile
        document.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('#sidebar-toggle');
            const closeBtn = e.target.closest('#sidebar-close');
            const overlay = e.target.closest('.sidebar-overlay');
            const sidebar = document.querySelector('.sidebar');
            
            if (toggleBtn) {
                sidebar.classList.add('show');
                this.toggleOverlay(true);
            }
            
            if (closeBtn || overlay) {
                sidebar.classList.remove('show');
                this.toggleOverlay(false);
            }
        });

        // Listen for sidebar link clicks if they are within the same page
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.sidebar-link');
            if (link && link.dataset.view) {
                e.preventDefault();
                const view = link.dataset.view;
                this.switchView(view);
                
                // Update URL without reload
                const url = new URL(window.location);
                url.searchParams.set('view', view);
                window.history.pushState({}, '', url);

                // Close sidebar on mobile after clicking
                if (window.innerWidth <= 1200) {
                    document.querySelector('.sidebar').classList.remove('show');
                    this.toggleOverlay(false);
                }
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleInitialLoad();
        });

        // Logout handling is now centralized in layout-loader.js via .logout-btn class
    }

    toggleOverlay(show) {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
        }
        
        if (show) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.classList.add('show'), 10);
        } else {
            overlay.classList.remove('show');
            setTimeout(() => overlay.style.display = 'none', 300);
        }
    }

    async handleInitialLoad() {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view') || 'overview';
        await this.switchView(view);
    }

    async switchView(viewName) {
        if (this.currentView === viewName) return;

        this.currentView = viewName;

        // Show loading state
        this.modulesContainer.innerHTML = '<div class="loading-spinner">Loading module...</div>';

        try {
            const { hasPermission } = await getCurrentUserPermissions();
            
            // Map view names to permissions. We use arrays so multiple roles can access common modules.
            const viewPermissions = {
                'overview':  null, // Public staff overview
                'orders':    ['view_orders', 'confirm_order', 'update_order_status'], 
                'support':   ['contact_customer', 'handle_returns'], 
                'inventory': ['process_preorder_inventory', 'manage_products'], 
                'products':  ['manage_products'], 
                'analytics': ['view_reports'], 
                'users':     ['manage_users', 'manage_all_users'], 
                'settings':  ['manage_system_config'], 
                'profile':   null, 
                'ops':       ['pack_order', 'create_shipment'], 
            };

            const requiredPermission = viewPermissions[viewName];
            if (requiredPermission && !hasPermission(requiredPermission)) {
                this.modulesContainer.innerHTML = '<div class="error-msg">Access Denied: You do not have permission to view this module.</div>';
                return;
            }

            // Load module HTML
            const moduleUrl = new URL(`../../pages/portal/modules/${viewName}.html?t=${Date.now()}`, import.meta.url);
            const response = await fetch(moduleUrl);
            if (!response.ok) throw new Error(`Module ${viewName} not found`);
            
            const html = await response.text();
            this.modulesContainer.innerHTML = this.normalizeModulePaths(html);

            // Update sidebar active state
            this.updateSidebarActive(viewName);

            // Re-run scripts in the module
            this.executeModuleScripts(this.modulesContainer);

            // Trigger global permission check for the new content
            window.dispatchEvent(new CustomEvent('content-loaded', { 
                detail: { path: `dashboard/modules/${viewName}` } 
            }));

        } catch (error) {
            console.error('Module load error:', error);
            this.modulesContainer.innerHTML = `<div class="error-msg">Error loading module: ${error.message}</div>`;
        }
    }

    updateSidebarActive(viewName) {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    executeModuleScripts(container) {
        container.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            
            if (oldScript.src) {
                // Add cache-busting query parameter for module scripts to force re-execution
                // ES6 modules are cached by browser, so we need to bypass the cache
                const url = new URL(oldScript.src, window.location.href);
                url.searchParams.set('t', Date.now());
                newScript.src = url.toString();
            } else {
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            }
            
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    normalizeModulePaths(html) {
        return html
            .replace(/(src|href)="\/(?!\/)/g, '$1="/')
            .replace(/url\(\/(?!\/)/g, 'url(/');
    }
}

const dashboard = new DashboardController();
document.addEventListener('DOMContentLoaded', () => dashboard.init());

export default dashboard;

