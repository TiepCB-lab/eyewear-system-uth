/**
 * Highly Robust Layout Loader for EVELENS
 * Handles component injection from layouts/ folder and fixes global paths.
 */

(function() {
    // 1. Detect project root from script source
    const scriptTag = document.currentScript || document.querySelector('script[src*="layout-loader.js"]');
    const scriptSrc = scriptTag ? scriptTag.src : window.location.origin + '/';
    // js/core/layout-loader.js -> everything before js/
    let projectRoot = scriptSrc.substring(0, scriptSrc.indexOf('js/core/layout-loader.js')) || '/';
    if (!projectRoot.endsWith('/')) projectRoot += '/';

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
            el.innerHTML = `<div class="component-error">Failed to load ${componentPath}</div>`;
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
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => navMenu.classList.add("show-menu"));
        }
        if (navClose && navMenu) {
            navClose.addEventListener('click', () => navMenu.classList.remove("show-menu"));
        }
    }

    function highlightActiveElements(container) {
        const currentPath = window.location.pathname.toLowerCase().replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
        const isHomePath = currentPath === '/' || /\/(index|home)$/.test(currentPath) || /\/frontend$/.test(currentPath);

        function isPathMatch(pathname, targetPath) {
            if (targetPath === '/') return isHomePath;
            return pathname === targetPath ||
                pathname.startsWith(targetPath + '/') ||
                pathname.endsWith(targetPath);
        }
        
        // 1. Highlight Text Links
        const navLinks = container.querySelectorAll('.nav__link');
        const navCandidates = [];
        navLinks.forEach(link => {
            link.classList.remove('active-link');
            const href = link.getAttribute('href');
            if (!href) return;

            let linkPath;
            try {
                linkPath = new URL(href, window.location.origin).pathname.toLowerCase();
            } catch (e) {
                linkPath = href.toLowerCase();
            }

            const cleanHref = linkPath.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
            // Handle cross-page absolute matches (like / vs /index.html)
            const absoluteCleanHref = new URL(cleanHref, window.location.origin).pathname.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
            navCandidates.push({ link, cleanHref: absoluteCleanHref });
        });

        const matches = navCandidates.filter(item => isPathMatch(currentPath, item.cleanHref));
        if (matches.length > 0) {
            // Prefer the most specific path, so /pages/accounts wins over /
            matches.sort((a, b) => b.cleanHref.length - a.cleanHref.length);
            matches[0].link.classList.add('active-link');
        }

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

    function resolveAvatarUrl(avatar) {
        if (!avatar) return `${projectRoot}assets/images/avatar-1.jpg`;
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
        if (avatar.startsWith('/')) return `http://localhost:8000${avatar}`;
        return `http://localhost:8000/${avatar.replace(/^\/+/, '')}`;
    }

    async function updateAuthUI() {
        const portalArea = document.getElementById('header-user-portal');
        const adminPortal = document.getElementById('admin-user-portal');
        if (!portalArea && !adminPortal) return;

        // --- IMMEDIATE FALLBACK (UX improvement) ---
        // If we have local info, show it immediately while the API validates
        const localUserJson = localStorage.getItem('user_info');
        if (localUserJson && portalArea) {
            try {
                const localUser = JSON.parse(localUserJson);
                if (localUser && (localUser.full_name || localUser.name)) {
                    renderUserPortal(portalArea, localUser.full_name || localUser.name, false);
                }
            } catch (e) {}
        }

        try {
            const { default: authService } = await import(projectRoot + 'js/services/authService.js');
            if (!authService.getToken()) return;

            const response = await authService.getCurrentUser();
            let user = response.data || response;

            if (user && (user.id || user.email)) {
                const displayName = user.full_name || user.name || user.username || 'User';
                const avatarSrc = resolveAvatarUrl(user.avatar);
                
                // Determine roles directly from user object if available, fallback to service
                const roles = user.roles || authService.getUserRoles();
                const staffRoles = authService.getStaffRoles();
                const isStaff = roles.some(r => staffRoles.includes(r));
                const isCustomer = roles.includes('customer');
                
                if (portalArea) renderUserPortal(portalArea, displayName, isStaff);
                if (adminPortal) renderAdminPortal(adminPortal, displayName, avatarSrc, isCustomer);
            }
        } catch (e) {
            console.warn("AuthUI Update failed:", e);
        }
    }

    function renderUserPortal(container, displayName, isStaff) {
        container.innerHTML = `
            <div class="user-info dropdown">
                <div class="user-trigger">
                    <i class="fi fi-rs-user"></i>
                    <span class="user-name-text">Hi, ${displayName}</span>
                    <i class="fi fi-rs-angle-small-down"></i>
                </div>
                <div class="user-dropdown">
                    <a href="${projectRoot}pages/accounts/index.html" class="dropdown__item">
                        <i class="fi fi-rs-settings-sliders"></i> My Profile
                    </a>
                    ${isStaff ? `
                    <a href="${projectRoot}pages/dashboard/index.html" class="dropdown__item dropdown__item--accent">
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

    function renderAdminPortal(container, displayName, avatarSrc, isCustomer) {
        container.innerHTML = `
            <div class="user-info dropdown">
                <div class="user-trigger flex user-trigger--admin">
                    <img src="${avatarSrc}" class="admin-user-avatar" alt="${displayName}">
                    <span>${displayName}</span>
                    <i class="fi fi-rs-angle-small-down"></i>
                </div>
                <div class="user-dropdown user-dropdown--align-right">
                    <a href="${projectRoot}pages/dashboard/index.html?view=profile" class="dropdown__item">
                        <i class="fi fi-rs-user"></i> My Profile
                    </a>
                    ${isCustomer ? `
                    <a href="${projectRoot}index.html" class="dropdown__item dropdown__item--accent">
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

    // Global Event Listener for dynamic badge syncing across all pages
    window.addEventListener('content-loaded', async (e) => {
        if (e.detail.path === 'layout/Header' || e.detail.path === 'layout/AdminHeader') {
            const cartCountEl = document.getElementById('cart-count');
            const wishlistCountEl = document.getElementById('wishlist-count');
            
            if (wishlistCountEl) {
                // 1. Synchronous Update from Cache
                const cachedWlCount = localStorage.getItem('eyewear_wishlist_count');
                if (cachedWlCount !== null) {
                    wishlistCountEl.innerText = cachedWlCount;
                }

                // 2. Asynchronous API fetch
                import(projectRoot + 'js/services/wishlistService.js').then(module => {
                    module.default.getWishlist().then(res => {
                        const items = res.data || (Array.isArray(res) ? res : []);
                        const count = items.length;
                        wishlistCountEl.innerText = count;
                        localStorage.setItem('eyewear_wishlist_count', count);
                    }).catch(err => {
                        console.warn("Wishlist count update failed", err);
                    });
                }).catch(err => console.error("LayoutLoader: Could not load wishlistService", err));
            }

            if (cartCountEl) {
                 // 1. Instant Synchronous Update to Prevent UI Flicker (FOUC)
                 const cachedCount = localStorage.getItem('eyewear_cart_count');
                 if (cachedCount !== null) {
                     cartCountEl.innerText = cachedCount;
                 } else {
                     cartCountEl.innerText = '0';
                 }

                 // 2. Asynchronous API fetch
                 import(projectRoot + 'js/services/cartService.js').then(module => {
                     module.default.getCart().then(res => {
                         // Robust check for cart structure (could be {items: [], totals: {}} or just an array)
                         const data = res.data || res;
                         const items = Array.isArray(data) ? data : (data.items || []);
                         
                         let totalItems = 0;
                         if (items.length > 0) {
                            totalItems = items.reduce((sum, item) => sum + parseInt(item.quantity || 1), 0);
                         }
                         cartCountEl.innerText = totalItems;
                         localStorage.setItem('eyewear_cart_count', totalItems); 
                     }).catch(err => {
                         console.warn("Cart count update failed", err);
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

    // 10. Load Custom UI Assets & Global Dependencies
    const dependencies = [
        { id: 'google-fonts', type: 'link', rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Montserrat:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap' },
        { id: 'flaticon', type: 'link', rel: 'stylesheet', href: 'https://cdn-uicons.flaticon.com/2.0.0/uicons-regular-straight/css/uicons-regular-straight.css' },
        { id: 'modal-style', type: 'link', rel: 'stylesheet', href: projectRoot + 'assets/css/components/modals.css' },
        { id: 'refactor-style', type: 'link', rel: 'stylesheet', href: projectRoot + 'assets/css/refactor-utils.css' },
        { id: 'notify-style', type: 'link', rel: 'stylesheet', href: projectRoot + 'assets/css/components/notification.css' },
        { id: 'ui-style', type: 'link', rel: 'stylesheet', href: projectRoot + 'assets/css/custom-ui.css' }
    ];

    dependencies.forEach(dep => {
        if (!document.getElementById(dep.id)) {
            const el = document.createElement(dep.type);
            el.id = dep.id;
            el.rel = dep.rel;
            el.href = dep.href;
            document.head.appendChild(el);
        }
    });

    // 11. Initialize Custom Dialogs
    import(projectRoot + 'js/components/quick-view.js').then(m => {
        m.default.init();
    }).catch(err => console.error("Failed to load QuickView component:", err));

    import(projectRoot + 'js/components/notification.js').then(m => {
        m.default.init();
        window.Notification = m.default;
    }).catch(err => console.error("Failed to load Notification component:", err));

    window.addToCart = async function(variantId) {
        try {
            const { default: cartService } = await import(projectRoot + 'js/services/cartService.js');
            await cartService.addToCart(variantId, 1);
            if (window.Notification) window.Notification.show('Product added to cart!', 'success');
            else alert('Product added to cart!');
            window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
        } catch (err) {
            if (err.response && err.response.status === 401) {
                if (window.Notification) window.Notification.show('Please login to add to cart.', 'error');
                else await alert('Please login to add to cart.');
                window.location.href = projectRoot + 'pages/auth/index.html';
            } else {
                const msg = err.response?.data?.message || err.message;
                if (window.Notification) window.Notification.show('An error occurred: ' + msg, 'error');
                else await alert('An error occurred: ' + msg);
            }
        }
    };

    document.addEventListener('click', (event) => {
        const quickViewTrigger = event.target.closest('[data-action="quick-view"]');
        if (quickViewTrigger) {
            event.preventDefault();
            // Handled by QuickView.init()
            return;
        }

        const wishlistTrigger = event.target.closest('[data-action="toggle-wishlist"]');
        if (wishlistTrigger) {
            event.preventDefault();
            window.addToWishlist(wishlistTrigger, wishlistTrigger.dataset.productId);
            return;
        }

        const cartTrigger = event.target.closest('[data-action="add-to-cart"]');
        if (cartTrigger) {
            event.preventDefault();
            window.addToCart(cartTrigger.dataset.variantId);
        }
    });

    // QuickView implementation moved to js/components/quick-view.js

    // 12. Global Wishlist Logic
    window.addToWishlist = async function(btn, productId) {
        try {
            const { default: wishlistService } = await import(projectRoot + 'js/services/wishlistService.js');
            const res = await wishlistService.toggleItem(productId);
            
            // Find ALL buttons for this product across the page
            const allButtons = document.querySelectorAll(`[data-action="toggle-wishlist"][data-product-id="${productId}"]`);
            
            allButtons.forEach(button => {
                const icon = button.querySelector('i');
                if (res.status === 'added') {
                    if(icon) icon.className = 'fi fi-ss-heart';
                    button.classList.add('wishlist-active');
                    button.setAttribute('aria-label', 'Remove from Wishlist');
                    if(button.title) button.title = 'Remove from Wishlist';
                } else {
                    if(icon) icon.className = 'fi fi-rs-heart';
                    button.classList.remove('wishlist-active');
                    button.setAttribute('aria-label', 'Add to Wishlist');
                    if(button.title) button.title = 'Add to Wishlist';
                }
            });

            if (res.status === 'added') {
                if (window.Notification) window.Notification.show('Added to wishlist successfully!', 'success');
                else alert('Added to wishlist successfully!');
            } else {
                if (window.Notification) window.Notification.show('Removed from wishlist!', 'info');
                else alert('Removed from wishlist!');
            }
            
            window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
        } catch (err) {
            if (err.response && err.response.status === 401) {
                if (window.Notification) window.Notification.show('Please login to use wishlist.', 'warning');
                else alert('Please login to use wishlist.');
                window.location.href = projectRoot + 'pages/auth/index.html';
            } else {
                console.error("Wishlist Error:", err);
                const msg = err.response?.data?.message || err.message;
                if (window.Notification) window.Notification.show('Wishlist error: ' + msg, 'error');
                else alert('An error occurred while updating wishlist.');
            }
        }
    };
    // 13. Global Logout Handler (Event Delegation)
    document.addEventListener('click', async (e) => {
        const logoutBtn = e.target.closest('.logout-btn');
        if (!logoutBtn) return;
        
        e.preventDefault();
        
        // Immediate local cleanup to ensure UI responds on 1st click
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('eyewear_cart_count');
        localStorage.removeItem('eyewear_wishlist_count');
        
        try {
            // We still try to notify the server, but we don't wait for it to redirect
            const { default: authService } = await import(projectRoot + 'js/services/authService.js');
            authService.logout().catch(() => {}); 
        } catch (err) {}

        // Immediate redirect
        window.location.href = projectRoot + 'index.html';
    });
})();
