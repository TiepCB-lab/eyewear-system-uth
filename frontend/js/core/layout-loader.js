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
        const isStaffLayout = document.body.classList.contains('layout-staff');
        
        // Logical mapping with Context Override
        if (componentPath === 'layout/Header') {
            mappedPath = isStaffLayout ? 'header-admin' : 'header'; 
        }
        
        if (componentPath === 'layout/Footer') mappedPath = 'footer';
        if (componentPath === 'layout/StaffSidebar') mappedPath = 'sidebar-staff';
        if (componentPath === 'layout/CustomerSidebar') mappedPath = 'sidebar-customer';
        if (componentPath === 'layout/AdminHeader') mappedPath = 'header-admin';

        // Contextual UI Overrides for Profile Page etc.
        if (isStaffLayout) {
            if (componentPath === 'layout/Header') {
                mappedPath = 'header-admin'; 
            }
        }
        
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

            // Dispatch global event for other scripts (like ui-permissions.js)
            window.dispatchEvent(new CustomEvent('content-loaded', { detail: { element: el, path: componentPath } }));
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
        const adminPortal = document.getElementById('admin-user-portal');
        if (!portalArea && !adminPortal) return;

        try {
            const { default: authService } = await import(projectRoot + 'js/services/authService.js');
            const user = await authService.getCurrentUser();
            
            if (user && user.status !== 'error') {
                const displayName = user.full_name || user.name || user.username || 'User';
                const isStaff = authService.isStaff();
                const isCustomer = authService.isCustomer();
                
                // Content for Customer Portal (Header)
                if (portalArea) {
                    portalArea.innerHTML = `
                        <div class="user-info dropdown">
                            <div class="user-trigger">
                                <i class="fi fi-rs-user"></i>
                                <span>Hi, ${displayName}</span>
                                <i class="fi fi-rs-angle-small-down"></i>
                            </div>
                            <div class="user-dropdown">
                                <a href="/frontend/pages/accounts/" class="dropdown__item">
                                    <i class="fi fi-rs-settings-sliders"></i> My Profile
                                </a>
                                ${isStaff ? `
                                <a href="/frontend/pages/dashboard/index.html" class="dropdown__item" style="color: var(--first-color); font-weight: bold;">
                                    <i class="fi fi-rs-apps"></i> Admin Dashboard
                                </a>
                                ` : ''}
                                <div class="dropdown__divider"></div>
                                <a href="#" class="dropdown__item logout-btn">
                                    <i class="fi fi-rs-sign-out-alt"></i> Logout
                                </a>
                            </div>
                        </div>
                    `;
                }

                // Content for Staff Portal (Admin Header)
                if (adminPortal) {
                    adminPortal.innerHTML = `
                        <div class="user-info dropdown">
                            <div class="user-trigger flex" style="gap: 0.5rem;">
                                <img src="/assets/images/avatar-1.jpg" style="width: 32px; border-radius: 50%;" onerror="this.style.display='none'">
                                <span>${displayName}</span>
                                <i class="fi fi-rs-angle-small-down"></i>
                            </div>
                            <div class="user-dropdown" style="right: 0; left: auto;">
                                <a href="/frontend/pages/dashboard/index.html?view=profile" class="dropdown__item">
                                    <i class="fi fi-rs-user"></i> My Profile
                                </a>
                                ${isCustomer ? `
                                <a href="/frontend/index.html" class="dropdown__item" style="color: var(--first-color); font-weight: bold;">
                                    <i class="fi fi-rs-shopping-cart"></i> Switch to Shop
                                </a>
                                ` : ''}
                                <div class="dropdown__divider"></div>
                                <a href="#" class="dropdown__item logout-btn">
                                    <i class="fi fi-rs-sign-out-alt"></i> Logout
                                </a>
                            </div>
                        </div>
                    `;
                }

                document.querySelectorAll('.logout-btn').forEach(btn => {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        authService.logout().then(() => window.location.href = '/frontend/index.html');
                    };
                });
            }
        } catch (e) {
            console.warn("AuthUI Update failed:", e);
        }
    }

    // Global Event Listener for dynamic badge syncing across all pages
    window.addEventListener('content-loaded', async (e) => {
        if (e.detail.path === 'layout/Header' || e.detail.path === 'layout/AdminHeader') {
            const cartCountEl = document.getElementById('cart-count');
            const wishlistCountEl = document.getElementById('wishlist-count');
            
            if (wishlistCountEl) {
                let wl = JSON.parse(localStorage.getItem('eyewear_wishlist') || '[]');
                wishlistCountEl.innerText = wl.length;
            }

            if (cartCountEl) {
                 // 1. Instant Synchronous Update to Prevent UI Flicker (FOUC)
                 const cachedCount = localStorage.getItem('eyewear_cart_count');
                 if (cachedCount !== null) cartCountEl.innerText = cachedCount;

                 // 2. Asynchronous API fetch for ultimate accuracy
                 import(projectRoot + 'js/services/cartService.js').then(module => {
                     module.CartService.getCart().then(res => {
                         let totalItems = 0;
                         if (res.data && res.data.length > 0) {
                            totalItems = res.data.reduce((sum, item) => sum + parseInt(item.quantity), 0);
                         }
                         cartCountEl.innerText = totalItems;
                         localStorage.setItem('eyewear_cart_count', totalItems); // Save for next page load
                     }).catch(err => {
                         cartCountEl.innerText = 0;
                         localStorage.setItem('eyewear_cart_count', 0);
                     });
                 }).catch(err => console.error("LayoutLoader: Could not load cartService for badge update", err));
            }
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-include]').forEach(loadComponent);
        
        // Load role/layout enforcement
        import(`${projectRoot}js/core/layout-guard.js`).then(m => {
            // Guard already initializes on DOMContentLoaded in its own file
        }).catch(err => console.error("Failed to load LayoutGuard:", err));
    });
})();
