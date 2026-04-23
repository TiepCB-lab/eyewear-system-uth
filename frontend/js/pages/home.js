import productService from '../services/productService.js';
import wishlistService from '../services/wishlistService.js';

async function initHome() {
    if (window.AOS) {
        window.AOS.init({ duration: 800, once: true, offset: 50 });
    }

    const featuredContainer = document.getElementById('featured-products');
    const popularContainer = document.getElementById('popular-products');
    const newAddedContainer = document.getElementById('new-added-products');
    const newArrivalsContainer = document.getElementById('new-arrivals-products');
    const hotReleasesContainer = document.getElementById('hot-releases');
    const dealsOutletContainer = document.getElementById('deals-outlet');
    const topSellingContainer = document.getElementById('top-selling');

    try {
        const productRes = await productService.getProducts();
        const products = productRes.data;
        let wishlistedIds = [];
        try {
            const wlRes = await wishlistService.getWishlist();
            wishlistedIds = (wlRes.data || []).map(item => item.product_id);
        } catch (e) {}

        if (!products || products.length === 0) return;

        // Helper to render product card (similar to shop.js but matching index.html styles)
        const renderProductItem = (p, idx) => {
            const variantId = p.first_variant_id || p.id;
            const isWishlisted = wishlistedIds.some(wid => wid == p.id);
            const heartIcon = isWishlisted ? 'fi fi-ss-heart' : 'fi fi-rs-heart';
            const heartClass = isWishlisted ? 'wishlist-active' : '';
            const label = isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist';
            
            let img = p.thumbnail || 'assets/images/products/placeholder.png';
            if (img.startsWith('/')) img = img.substring(1);
            
            const price = parseFloat(p.base_price || 0);
            const displayPrice = window.formatVND ? window.formatVND(price) : price + ' VND';

            return `
                <div class="product__item" data-aos="fade-up" data-aos-delay="${idx * 50}">
                    <div class="product__banner">
                        <a href="pages/details/?id=${p.id}" class="product__images">
                            <img src="${img}" alt="${p.name}" class="product__img default" data-fallback-src="assets/images/logo.png" />
                            <img src="${img}" alt="${p.name}" class="product__img hover" data-fallback-src="assets/images/logo.png" />
                        </a>
                        <div class="product__actions">
                            <button type="button" class="action__btn" aria-label="Quick View" data-action="quick-view" data-product-id="${p.id}"><i class="fi fi-rs-eye"></i></button>
                            <button type="button" class="action__btn ${heartClass}" aria-label="${label}" data-action="toggle-wishlist" data-product-id="${p.id}">
                                <i class="${heartIcon}"></i>
                            </button>
                        </div>
                        <div class="product__badge light-pink">Hot</div>
                    </div>
                    <div class="product__content">
                        <span class="product__category">${p.brand || 'Luxury'}</span>
                        <a href="pages/details/?id=${p.id}"><h3 class="product__title">${p.name}</h3></a>
                        <div class="product__rating">
                            <i class="fi fi-rs-star"></i><i class="fi fi-rs-star"></i><i class="fi fi-rs-star"></i><i class="fi fi-rs-star"></i><i class="fi fi-rs-star"></i>
                        </div>
                        <div class="product__price flex">
                            <span class="new__price">${displayPrice}</span>
                        </div>
                        <button type="button" class="action__btn cart__btn" aria-label="Add To Cart" data-action="add-to-cart" data-variant-id="${variantId}">
                            <i class="fi fi-rs-shopping-bag-add"></i>
                        </button>
                    </div>
                </div>
            `;
        };

        const renderShowcaseItem = (p) => {
            let img = p.thumbnail || 'assets/images/products/placeholder.png';
            if (img.startsWith('/')) img = img.substring(1);
            const price = parseFloat(p.base_price || 0);
            const displayPrice = window.formatVND ? window.formatVND(price) : price + ' VND';

            return `
                <div class="showcase__item">
                    <a href="pages/details/?id=${p.id}" class="showcase__img-box">
                        <img src="${img}" alt="${p.name}" class="showcase__img" data-fallback-src="assets/images/logo.png" />
                    </a>
                    <div class="showcase__content">
                        <a href="pages/details/?id=${p.id}">
                            <h4 class="showcase__title">${p.name}</h4>
                        </a>
                        <div class="showcase__price flex">
                            <span class="new__price">${displayPrice}</span>
                        </div>
                    </div>
                </div>
            `;
        };

        // Populate Sections
        if (featuredContainer) featuredContainer.innerHTML = products.slice(0, 8).map((p, i) => renderProductItem(p, i)).join('');
        if (popularContainer) popularContainer.innerHTML = products.slice(4, 12).map((p, i) => renderProductItem(p, i)).join('');
        if (newAddedContainer) newAddedContainer.innerHTML = products.slice(0, 8).map((p, i) => renderProductItem(p, i)).join('');
        
        if (newArrivalsContainer) {
            newArrivalsContainer.innerHTML = products.slice(0, 8).map(p => `
                <div class="swiper-slide">
                    ${renderProductItem(p, 0)}
                </div>
            `).join('');
            
            // Re-init Swiper for New Arrivals if needed
            if (window.swiperProducts) {
                window.swiperProducts.update();
            }
        }

        if (hotReleasesContainer) hotReleasesContainer.innerHTML = products.slice(0, 3).map(renderShowcaseItem).join('');
        if (dealsOutletContainer) dealsOutletContainer.innerHTML = products.slice(3, 6).map(renderShowcaseItem).join('');
        if (topSellingContainer) topSellingContainer.innerHTML = products.slice(6, 9).map(renderShowcaseItem).join('');

    } catch (error) {
        console.error('Error initializing home page:', error);
    }
}

document.addEventListener('DOMContentLoaded', initHome);
