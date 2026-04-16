/**
 * Highly Robust Layout Loader for EYEWEAR.UTH
 * Handles component injection from layouts/ folder and fixes global paths.
 */

(function() {
    // 1. Detect project root from script source
    const scriptTag = document.currentScript;
    const scriptSrc = scriptTag ? scriptTag.src : '';
    // js/core/layout-loader.js -> everything before js/
    const projectRoot = scriptSrc.substring(0, scriptSrc.indexOf('js/core/layout-loader.js'));

    async function loadComponent(el) {
        const componentPath = el.getAttribute('data-include');
        let mappedPath = componentPath;
        
        // Logical mapping
        if (componentPath === 'layout/Header') mappedPath = 'header';
        if (componentPath === 'layout/Footer') mappedPath = 'footer';
        if (componentPath === 'layout/StaffSidebar') mappedPath = 'sidebar-staff';
        if (componentPath === 'layout/CustomerSidebar') mappedPath = 'sidebar-customer';
        if (componentPath === 'layout/AdminHeader') mappedPath = 'header'; // Fallback if admin-profile removed
        
        let url;
        if (componentPath.startsWith('layout/')) {
            url = `${projectRoot}layouts/${mappedPath}.html`;
        } else {
            // General support for any component/ paths
            url = `${projectRoot}${componentPath}.html`;
        }

        // Add a class to indicate loading
        el.classList.add('component-loading');

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            
            // Inject content
            el.innerHTML = html;
            
            // Fix absolute paths if project is in a subdirectory
            if (projectRoot !== '/' && projectRoot !== '') {
                fixInternalPaths(el, projectRoot);
            }

            // Execute logic
            rehydrateScripts(el);
            if (mappedPath.includes('header')) {
                initMenu();
                // Ensure auth UI and highlighting run safely
                updateAuthUI().catch(err => console.warn("LayoutLoader AuthUI Error:", err));
                highlightActiveElements(el);
            }
            
            el.classList.remove('component-loading');
            el.classList.add('component-loaded');
        } catch (err) {
            console.error(`LayoutLoader Error [${componentPath}]:`, err);
            el.innerHTML = `<div style="color:#d9534f; padding:10px; border:1px solid #d9534f;">Failed to load ${componentPath}</div>`;
        }
    }

    function fixInternalPaths(container, root) {
        const attrs = ['src', 'href'];
        attrs.forEach(attr => {
            container.querySelectorAll(`[${attr}^="/"]`).forEach(el => {
                const val = el.getAttribute(attr);
                if (val.startsWith('/') && !val.startsWith('//')) {
                    el.setAttribute(attr, root + val.substring(1));
                }
            });
        });
    }

    function rehydrateScripts(container) {
        container.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    function initMenu() {
        const navMenu = document.getElementById("nav-menu"),
              navToggle = document.getElementById("nav-toggle"),
              navClose = document.getElementById("nav-close");
        if (navToggle && navMenu) navToggle.onclick = () => navMenu.classList.add("show-menu");
        if (navClose && navMenu) navClose.onclick = () => navMenu.classList.remove("show-menu");
    }

    function highlightActiveElements(container) {
        const currentPath = window.location.pathname.toLowerCase().replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
        
        // 1. Highlight Text Links
        const navLinks = container.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.classList.remove('active-link');
            const href = link.getAttribute('href');
            if (!href) return;

            // Normalize link path (handle absolute URLs)
            let linkPath;
            try {
                linkPath = new URL(href, window.location.origin).pathname.toLowerCase();
            } catch (e) {
                linkPath = href.toLowerCase();
            }
            
            const cleanHref = linkPath.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';

            // Match logic
            const isMatch = (cleanHref === '/' && currentPath === '/') || 
                           (cleanHref !== '/' && (currentPath === cleanHref || currentPath.startsWith(cleanHref + '/')));

            if (isMatch) {
                link.classList.add('active-link');
            }
        });

        // 2. Highlight Icons (Wishlist, Cart)
        const actionBtns = container.querySelectorAll('.header__action-btn');
        actionBtns.forEach(btn => {
            btn.classList.remove('active-icon');
            const href = btn.getAttribute('href');
            if (href) {
                let btnPath;
                try {
                    btnPath = new URL(href, window.location.origin).pathname.toLowerCase();
                } catch (e) {
                    btnPath = href.replace(/\.\.\//g, '').toLowerCase();
                }
                const cleanBtnPath = btnPath.replace(/\/$/, '');
                if (currentPath.includes(cleanBtnPath) && cleanBtnPath !== '/') {
                    btn.classList.add('active-icon');
                }
            }
        });
    }

    async function updateAuthUI() {
        const portalArea = document.getElementById('header-user-portal');
        if (!portalArea) return;

        try {
            const { default: authService } = await import(projectRoot + 'js/services/authService.js');
            const user = await authService.getCurrentUser();
            
            if (user && user.status !== 'error') {
                const displayName = user.full_name || user.name || user.username || 'User';
                const isStaff = ['admin', 'manager', 'staff'].includes(user.role) || authService.isStaff();
                
                portalArea.innerHTML = `
                    <div class="user-info dropdown">
                        <div class="user-trigger">
                            <i class="fi fi-rs-user"></i>
                            <span>Hi, ${displayName}</span>
                            <i class="fi fi-rs-angle-small-down"></i>
                        </div>
                        <div class="user-dropdown">
                            <a href="/pages/accounts/" class="dropdown__item">
                                <i class="fi fi-rs-settings-sliders"></i> My Profile
                            </a>
                            ${isStaff ? `
                            <a href="/pages/dashboard/portal.html" class="dropdown__item" style="color: var(--first-color); font-weight: bold;">
                                <i class="fi fi-rs-apps"></i> Admin Dashboard
                            </a>
                            ` : ''}
                            <div class="dropdown__divider"></div>
                            <a href="#" id="logout-btn" class="dropdown__item">
                                <i class="fi fi-rs-sign-out-alt"></i> Logout
                            </a>
                        </div>
                    </div>
                `;
                document.getElementById('logout-btn').onclick = (e) => {
                    e.preventDefault();
                    authService.logout().then(() => window.location.href = '/');
                };
            }
        } catch (e) {
            console.warn("AuthUI Update failed:", e);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-include]').forEach(loadComponent);
    });
})();
