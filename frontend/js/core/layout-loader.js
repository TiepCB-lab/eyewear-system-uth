/**
 * Highly Robust Layout Loader for EYEWEAR.UTH
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
            navCandidates.push({ link, cleanHref });
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

                // Content for Staff Portal (Admin Header)
                if (adminPortal) {
                    adminPortal.innerHTML = `
                        <div class="user-info dropdown">
                            <div class="user-trigger flex user-trigger--admin">
                                <img src="${projectRoot}assets/images/avatar-1.jpg" class="admin-user-avatar" alt="${displayName}">
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

                document.querySelectorAll('.logout-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        authService.logout().then(() => window.location.href = `${projectRoot}index.html`);
                    });
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
                // 1. Synchronous Update from Cache
                const cachedWlCount = localStorage.getItem('eyewear_wishlist_count');
                if (cachedWlCount !== null) {
                    wishlistCountEl.innerText = cachedWlCount;
                    wishlistCountEl.hidden = parseInt(cachedWlCount, 10) <= 0;
                }

                // 2. Asynchronous API fetch
                import(projectRoot + 'js/services/wishlistService.js').then(module => {
                    module.default.getWishlist().then(res => {
                        const count = res.data ? res.data.length : 0;
                        wishlistCountEl.innerText = count;
                        localStorage.setItem('eyewear_wishlist_count', count);
                        wishlistCountEl.hidden = count <= 0;
                    }).catch(err => {
                        wishlistCountEl.innerText = 0;
                        wishlistCountEl.hidden = true;
                    });
                }).catch(err => console.error("LayoutLoader: Could not load wishlistService", err));
            }

            if (cartCountEl) {
                 // 1. Instant Synchronous Update to Prevent UI Flicker (FOUC)
                 const cachedCount = localStorage.getItem('eyewear_cart_count');
                 if (cachedCount !== null) {
                     cartCountEl.innerText = cachedCount;
                     cartCountEl.hidden = parseInt(cachedCount, 10) <= 0;
                 }

                 // 2. Asynchronous API fetch for ultimate accuracy
                 import(projectRoot + 'js/services/cartService.js').then(module => {
                     module.default.getCart().then(res => {
                         let totalItems = 0;
                         if (res.data && res.data.length > 0) {
                            totalItems = res.data.reduce((sum, item) => sum + parseInt(item.quantity), 0);
                         }
                         cartCountEl.innerText = totalItems;
                         cartCountEl.hidden = totalItems <= 0;
                         localStorage.setItem('eyewear_cart_count', totalItems); // Save for next page load
                     }).catch(err => {
                         cartCountEl.innerText = 0;
                         cartCountEl.hidden = true;
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

    // 10. Load Custom UI Assets
    const refactorStyle = document.createElement('link');
    refactorStyle.rel = 'stylesheet';
    refactorStyle.href = projectRoot + 'assets/css/refactor-utils.css';
    document.head.appendChild(refactorStyle);

    const uiStyle = document.createElement('link');
    uiStyle.rel = 'stylesheet';
    uiStyle.href = projectRoot + 'assets/css/custom-ui.css';
    document.head.appendChild(uiStyle);

    // 11. Initialize Custom Dialogs
    import(projectRoot + 'js/core/dialog-manager.js').then(m => {
        window.originalAlert = window.alert;
        window.alert = m.default.alert;
    }).catch(err => console.error("Failed to load DialogManager:", err));

    window.addToCart = async function(variantId) {
        try {
            const { default: cartService } = await import(projectRoot + 'js/services/cartService.js');
            await cartService.addToCart(variantId, 1);
            await alert('Product added to cart!');
            window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
        } catch (err) {
            if (err.response && err.response.status === 401) {
                await alert('Please login to add to cart.');
                window.location.href = projectRoot + 'pages/auth/index.html';
            } else {
                await alert('An error occurred: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    document.addEventListener('click', (event) => {
        const quickViewTrigger = event.target.closest('[data-action="quick-view"]');
        if (quickViewTrigger) {
            event.preventDefault();
            window.quickView(quickViewTrigger.dataset.productId);
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

    // --- QUICK VIEW IMPLEMENTATION ---
    window.quickView = async function(productId) {
        // 1. Show dynamic loader overlay
        const loaderOverlay = document.createElement('div');
        loaderOverlay.className = 'qv-overlay';
        loaderOverlay.innerHTML = `
            <div class="quick-view-loader">
                <i class="fi fi-rs-spinner quick-view-loader__icon"></i>
                <span class="quick-view-loader__label">Preparing Product...</span>
            </div>
        `;
        document.body.appendChild(loaderOverlay);
        loaderOverlay.offsetHeight;
        loaderOverlay.classList.add('show');

        try {
            const { default: productService } = await import(projectRoot + 'js/services/productService.js');
            
            const res = await productService.getProduct(productId);
            const p = res.data;
            if (!p) throw new Error("Product not found");

            const price = parseFloat(p.base_price || 0);
            const oldPrice = p.old_price ? parseFloat(p.old_price) : 0;
            const displayPrice = window.formatVND ? window.formatVND(price) : price + ' VND';
            const displayOldPrice = oldPrice > price ? (window.formatVND ? window.formatVND(oldPrice) : oldPrice + ' VND') : '';
            
            let img = p.thumbnail || '/assets/images/products/placeholder.png';
            if (img.startsWith('/')) img = projectRoot + img.substring(1);
            else if (!img.startsWith('http')) img = projectRoot + img;

            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="qv-modal">
                    <button class="qv-close"><i class="fi fi-rs-cross"></i></button>
                    <div class="qv-image-side">
                        <div class="qv-sale-badge">Hot</div>
                        <img src="${img}" alt="${p.name}">
                    </div>
                    <div class="qv-content-side">
                        <div class="qv-brand">${p.brand || 'Luxury Eyewear'}</div>
                        <h2 class="qv-title">${p.name}</h2>
                        <div class="qv-price">
                            ${displayPrice}
                            <span class="qv-old-price">${displayOldPrice}</span>
                        </div>
                        <p class="qv-desc">${p.description || 'Experience the perfect blend of style and clarity with our artisan-crafted eyewear. Designed for those who appreciate the finer things in life.'}</p>
                        
                        <div class="qv-stock-status">
                            <div class="qv-pulse"></div>
                            ${p.total_stock || 0} items available in stock
                        </div>

                        <div class="qv-actions">
                            <button class="qv-add-btn btn-cart-animate" id="qv-add-to-cart">
                                <i class="fi fi-rs-shopping-bag-add"></i>
                                <span class="btn-text">Add to Cart</span>
                                <i class="fi fi-rs-glasses falling-item"></i>
                            </button>
                            <a href="${projectRoot}pages/details/?id=${p.id}" class="qv-details-btn" title="View Full Details">
                                <i class="fi fi-rs-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            const content = modal.firstElementChild;
            loaderOverlay.innerHTML = '';
            loaderOverlay.appendChild(content);
            
            const closeModal = () => {
                loaderOverlay.classList.remove('show');
                setTimeout(() => loaderOverlay.remove(), 500);
            };

            modal.querySelector('.qv-close').addEventListener('click', closeModal);
            loaderOverlay.onclick = (e) => { if (e.target === loaderOverlay) closeModal(); };

            // Handle Add to Cart inside Quick View
            const addBtn = modal.querySelector('#qv-add-to-cart');
            addBtn.addEventListener('click', async () => {
                if (addBtn.classList.contains('animating')) return;
                
                const variantId = p.first_variant_id || p.id;
                
                // Start animation
                addBtn.classList.add('animating');
                
                try {
                    const { default: cartService } = await import(projectRoot + 'js/services/cartService.js');
                    await cartService.addToCart(variantId, 1);
                    
                    // Wait for animation to progress
                    setTimeout(async () => {
                        addBtn.classList.remove('animating');
                        addBtn.classList.add('success-state');
                        addBtn.querySelector('.btn-text').textContent = 'Added!';
                        addBtn.querySelector('i:first-child').className = 'fi fi-rs-check';
                        
                        // Sync header
                        window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
                        
                        // Reset after delay
                        setTimeout(() => {
                            addBtn.classList.remove('success-state');
                            addBtn.querySelector('.btn-text').textContent = 'Add to Cart';
                            addBtn.querySelector('i:first-child').className = 'fi fi-rs-shopping-bag-add';
                        }, 2000);
                    }, 700);
                    
                } catch (err) {
                    addBtn.classList.remove('animating');
                    if (err.response && err.response.status === 401) {
                        await alert('Please login first!');
                        window.location.href = projectRoot + 'pages/auth/index.html';
                    } else {
                        await alert('Error: ' + (err.response?.data?.message || err.message));
                    }
                }
            });

        } catch (err) {
            console.error("QuickView Error:", err);
            loaderOverlay.innerHTML = `<div class="eyewear-dialog">
                <div class="eyewear-dialog-icon error"><i class="fi fi-rs-cross-circle"></i></div>
                <p class="eyewear-dialog-msg">We couldn't retrieve the product information right now.</p>
                <button type="button" class="eyewear-dialog-btn quick-view-error-close">Close</button>
            </div>`;
            const closeButton = loaderOverlay.querySelector('.quick-view-error-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => loaderOverlay.remove());
            }
        }
    };

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

            if (res.status === 'added') await alert('Added to wishlist successfully!');
            else await alert('Removed from wishlist!');
            
            window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
        } catch (err) {
            if (err.response && err.response.status === 401) {
                await alert('Please login to use wishlist.');
                window.location.href = projectRoot + 'pages/auth/index.html';
            } else {
                console.error("Wishlist Error:", err);
                await alert('An error occurred while updating wishlist.');
            }
        }
    };
})();
