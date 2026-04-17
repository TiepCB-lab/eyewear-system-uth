import authService from '../services/authService.js';

/**
 * Layout and Route Guard for strict role separation (Option A)
 * Enforces STAFF vs CUSTOMER context boundaries
 */
class LayoutGuard {
    constructor() {
        this.ctx = authService.getPrimaryContext();
        this.path = window.location.pathname;
        this.isDashboard = this.path.includes('/dashboard/');
        this.isAuthPage = this.path.includes('/auth/');
    }

    async init() {
        console.log(`LayoutGuard: Initializing in context "${this.ctx}"`);
        
        // 1. Enforce Routing Rules
        this.enforceRouting();

        // 2. Apply Layout Body Classes
        this.applyLayoutClasses();

        // 3. Handle Profile Consistency
        this.syncProfileView();
    }

    enforceRouting() {
        if (this.isAuthPage) return; // Allow auth pages

        // Case 1: Non-staff trying to access dashboard
        if (this.isDashboard && !authService.isStaff()) {
            console.warn('LayoutGuard: Unauthorized dashboard access. Redirecting...');
            window.location.href = '/pages/auth/index.html';
            return;
        }

        // Case 2: Strict Staff separation (Option A)
        // If staff hits a customer-only route (like shop) but DOES NOT have CUSTOMER role
        const isShopRoute = (this.path === '/' || this.path.includes('/shop/') || this.path === '/index.html');
        if (isShopRoute && authService.isStaff() && !authService.isCustomer()) {
             console.warn('LayoutGuard: Staff user on shop route without Customer role. Redirecting to dashboard...');
             window.location.href = '/pages/dashboard/index.html';
             return;
        }
    }

    applyLayoutClasses() {
        const body = document.body;
        
        // Clear existing layout classes
        body.classList.remove('layout-staff', 'layout-customer', 'is-dashboard-view');

        if (this.isDashboard) {
            body.classList.add('layout-staff', 'is-dashboard-view');
        } else {
            // Even if staff is allowed here (has Customer role), the UI is Customer-centric
            body.classList.add('layout-customer');
        }
    }

    syncProfileView() {
        const isProfilePage = this.path.includes('/accounts/');
        if (!isProfilePage) return;

        // If a staff user is viewing their profile, should they see the dashboard layout?
        // Requirement: "Profile must render based on current role context"
        // Requirement: "STAFF roles share the same dashboard layout"
        if (authService.isStaff()) {
            // Treat profile as part of Staff environment if they are primarily staff
            // This ensures they see the Sidebar instead of the Customer Header
            document.body.classList.add('layout-staff');
            document.body.classList.remove('layout-customer');
        }
    }
}

const guard = new LayoutGuard();
document.addEventListener('DOMContentLoaded', () => guard.init());

export default guard;
