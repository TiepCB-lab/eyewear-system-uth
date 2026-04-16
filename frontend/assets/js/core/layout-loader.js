/**
 * Highly Robust Layout Loader for EYEWEAR.UTH
 * Automatically detects project root based on script location.
 */

(function() {
    // 1. Detect project root from script source
    const scriptTag = document.currentScript;
    const scriptSrc = scriptTag ? scriptTag.src : '';
    // assets/js/core/layout-loader.js -> go up 4 times to get the frontend root
    const projectRoot = scriptSrc.substring(0, scriptSrc.indexOf('assets/js/core/layout-loader.js'));

    async function loadComponent(el) {
        const componentPath = el.getAttribute('data-include');
        let mappedPath = componentPath;
        
        // Legacy mapping for partials
        if (componentPath === 'layout/Header') mappedPath = 'header/header';
        if (componentPath === 'layout/Footer') mappedPath = 'footer/footer';
        if (componentPath === 'layout/AdminSidebar') mappedPath = 'sidebar/sidebar';
        if (componentPath === 'layout/AdminHeader') mappedPath = 'header/admin-profile';

        const url = `${projectRoot}src/partials/${mappedPath}.html`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            
            // Clean injection
            el.innerHTML = html;
            
            // Fix internal paths to be relative to the PAGE if needed? 
            // Better: components already use absolute paths from root like "/assets/img".
            // If project is in a subdir, we need to prefix them.
            if (projectRoot !== '/') {
                fixInternalPaths(el, projectRoot);
            }

            rehydrateScripts(el);
            if (mappedPath.includes('header')) {
                initMenu();
                initHeaderAuthState();
            }
        } catch (err) {
            console.error(`LayoutLoader Error [${componentPath}]:`, err);
            el.innerHTML = `<div style="color:#d9534f; padding:10px; border:1px solid #d9534f; margin:10px;">Failed to load ${componentPath}</div>`;
        }
    }

    function fixInternalPaths(container, root) {
        // Find all src and href that start with "/" and are NOT external
        const attrs = ['src', 'href'];
        attrs.forEach(attr => {
            container.querySelectorAll(`[${attr}^="/"]`).forEach(el => {
                const val = el.getAttribute(attr);
                if (val.startsWith('/') && !val.startsWith('//')) {
                    // Prepend root (removing leading slash from val)
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
        // Reuse main.js logic but cautiously
        const navMenu = document.getElementById("nav-menu"),
              navToggle = document.getElementById("nav-toggle"),
              navClose = document.getElementById("nav-close");
        if (navToggle && navMenu) navToggle.onclick = () => navMenu.classList.add("show-menu");
        if (navClose && navMenu) navClose.onclick = () => navMenu.classList.remove("show-menu");
    }

    function initHeaderAuthState() {
        const token = localStorage.getItem('auth_token');
        const topAuthLink = document.querySelector('.header__top-action');
        const navLoginLink = document.querySelector('.nav__list .nav__link[href$="/src/pages/auth/"]');

        if (!token) {
            if (topAuthLink) {
                topAuthLink.textContent = 'Log In / Sign Up';
                topAuthLink.href = '/src/pages/auth/';
            }
            if (navLoginLink) {
                navLoginLink.textContent = 'Login';
                navLoginLink.href = '/src/pages/auth/';
            }
            return;
        }

        if (topAuthLink) {
            topAuthLink.textContent = 'My Account';
            topAuthLink.href = '/src/pages/accounts/';
        }
        if (navLoginLink) {
            navLoginLink.textContent = 'Logout';
            navLoginLink.href = '#';
            navLoginLink.onclick = (event) => {
                event.preventDefault();
                localStorage.removeItem('auth_token');
                window.location.href = '/index.html';
            };
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-include]').forEach(loadComponent);
    });
})();
