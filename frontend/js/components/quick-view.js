/**
 * QuickView Component - Handles product preview modals
 */

import productService from '../services/productService.js';

const QuickView = {
    init: function() {
        // Global event listener for quick view triggers
        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-action="quick-view"]');
            if (trigger) {
                event.preventDefault();
                this.show(trigger.dataset.productId);
            }
        });
    },

    show: async function(productId) {
        // 1. Show dynamic loader overlay
        const loaderOverlay = document.createElement('div');
        loaderOverlay.className = 'qv-overlay modal-overlay';
        loaderOverlay.innerHTML = `
            <div class="quick-view-loader">
                <i class="fi fi-rs-spinner quick-view-loader__icon"></i>
                <span class="quick-view-loader__label">Preparing Product...</span>
            </div>
        `;
        document.body.appendChild(loaderOverlay);
        
        // Trigger animation
        setTimeout(() => loaderOverlay.classList.add('show'), 10);

        try {
            const res = await productService.getProduct(productId);
            const p = res.data;
            if (!p) throw new Error("Product not found");

            const price = parseFloat(p.base_price || 0);
            const oldPrice = p.old_price ? parseFloat(p.old_price) : 0;
            const displayPrice = window.formatVND ? window.formatVND(price) : price + ' VND';
            const displayOldPrice = oldPrice > price ? (window.formatVND ? window.formatVND(oldPrice) : oldPrice + ' VND') : '';
            
            // Resolve project root for images
            const scriptTag = document.querySelector('script[src*="layout-loader.js"]');
            const scriptSrc = scriptTag ? scriptTag.src : window.location.origin + '/';
            let projectRoot = scriptSrc.substring(0, scriptSrc.indexOf('js/core/layout-loader.js')) || '/';
            if (!projectRoot.endsWith('/')) projectRoot += '/';

            const rawImg = p.thumbnail || (p.variants && p.variants[0] ? p.variants[0].image_2d_url : null);
            let img = '';
            if (!rawImg) {
                img = projectRoot + 'assets/images/products/placeholder.png';
            } else if (rawImg.startsWith('http')) {
                img = rawImg;
            } else if (rawImg.startsWith('/storage')) {
                img = 'http://localhost:8000' + rawImg;
            } else {
                const cleanPath = rawImg.startsWith('/') ? rawImg.substring(1) : rawImg;
                img = projectRoot + cleanPath;
            }

            const modalContent = `
                <div class="qv-modal modal-content">
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
                        <p class="qv-desc">${p.description || 'Experience the perfect blend of style and clarity with our artisan-crafted eyewear.'}</p>
                        
                        <div class="qv-stock-status">
                            <div class="qv-pulse"></div>
                            ${p.total_stock || 0} items available in stock
                        </div>

                        <div class="qv-actions">
                            <button class="btn-eyewear-action btn-cart-animate" id="qv-add-to-cart">
                                <i class="fi fi-rs-shopping-bag-add"></i>
                                <span class="btn-text">Add to Cart</span>
                                <i class="fi fi-rs-glasses falling-item"></i>
                            </button>
                            <a href="${projectRoot}pages/details/?id=${p.id}" class="btn-eyewear-icon-action" title="View Full Details">
                                <i class="fi fi-rs-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            
            loaderOverlay.innerHTML = modalContent;
            
            const closeModal = () => {
                loaderOverlay.classList.remove('show');
                setTimeout(() => loaderOverlay.remove(), 500);
            };

            loaderOverlay.querySelector('.qv-close').addEventListener('click', closeModal);
            loaderOverlay.onclick = (e) => { if (e.target === loaderOverlay) closeModal(); };

            // Handle Add to Cart inside Quick View
            const addBtn = loaderOverlay.querySelector('#qv-add-to-cart');
            addBtn.addEventListener('click', async () => {
                if (addBtn.classList.contains('animating')) return;
                
                const variantId = p.first_variant_id || p.id;
                addBtn.classList.add('animating');
                
                try {
                    const { default: cartService } = await import(projectRoot + 'js/services/cartService.js');
                    await cartService.addToCart(variantId, 1);
                    
                    setTimeout(() => {
                        addBtn.classList.remove('animating');
                        addBtn.classList.add('success-state');
                        addBtn.querySelector('.btn-text').textContent = 'Added!';
                        addBtn.querySelector('i:first-child').className = 'fi fi-rs-check';
                        
                        window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
                        
                        setTimeout(() => {
                            addBtn.classList.remove('success-state');
                            addBtn.querySelector('.btn-text').textContent = 'Add to Cart';
                            addBtn.querySelector('i:first-child').className = 'fi fi-rs-shopping-bag-add';
                        }, 2000);
                    }, 700);
                    
                } catch (err) {
                    addBtn.classList.remove('animating');
                    if (err.response && err.response.status === 401) {
                        if(window.alert) await window.alert('Please login first!');
                        window.location.href = projectRoot + 'pages/auth/index.html';
                    } else {
                        if(window.alert) await window.alert('Error: ' + (err.response?.data?.message || err.message));
                    }
                }
            });

        } catch (err) {
            console.error("QuickView Error:", err);
            loaderOverlay.innerHTML = `
                <div class="eyewear-dialog">
                    <div class="eyewear-dialog-icon error"><i class="fi fi-rs-cross-circle"></i></div>
                    <p class="eyewear-dialog-msg">We couldn't retrieve the product information right now.</p>
                    <button type="button" class="eyewear-dialog-btn qv-error-close">Close</button>
                </div>
            `;
            loaderOverlay.querySelector('.qv-error-close').onclick = () => loaderOverlay.remove();
        }
    }
};

export default QuickView;
