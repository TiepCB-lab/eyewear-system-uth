import api from '../services/api.js';
import WishlistService from '../services/wishlistService.js';

const COLOR_CLASS_MAP = [
    { pattern: /(tortoise|amber|brown|havana)/i, className: 'color-swatch--amber' },
    { pattern: /(crimson|red|burgundy)/i, className: 'color-swatch--crimson' },
    { pattern: /(gold|yellow)/i, className: 'color-swatch--gold' },
    { pattern: /(rose|pink)/i, className: 'color-swatch--rose' },
    { pattern: /(emerald|green)/i, className: 'color-swatch--emerald' },
    { pattern: /(silver|gray|grey)/i, className: 'color-swatch--silver' },
    { pattern: /(black)/i, className: 'color-swatch--black' },
];

function resolveColorClass(color) {
    const match = COLOR_CLASS_MAP.find((item) => item.pattern.test(color || ''));
    return match ? match.className : 'color-swatch--neutral';
}

function formatPrice(value) {
    return window.formatVND ? window.formatVND(value) : `${value} VND`;
}

function setActiveColor(element) {
    document.querySelectorAll('#variant-colors .color__link').forEach((link) => {
        link.dataset.active = '0';
        link.classList.remove('is-active-swatch');
    });

    element.dataset.active = '1';
    element.classList.add('is-active-swatch');
}

async function loadTryOnComponent() {
    const container = document.getElementById('tryon-container');
    if (!container) {
        return;
    }

    try {
        const response = await fetch('../../components/VirtualTryOn.html');
        if (!response.ok) {
            throw new Error('VirtualTryOn component not found');
        }

        container.innerHTML = await response.text();

        container.querySelectorAll('script').forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    } catch (err) {
        console.warn('Optional component [VirtualTryOn] failed to load:', err.message);
    }
}

function updateWishlistButton(button, isActive) {
    const icon = button?.querySelector('i');
    if (!button || !icon) {
        return;
    }

    icon.className = isActive ? 'fi fi-ss-heart' : 'fi fi-rs-heart';
    button.classList.toggle('wishlist-active', isActive);
    button.setAttribute('aria-label', isActive ? 'Remove from Wishlist' : 'Add to Wishlist');
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTryOnComponent();

    const params = new URLSearchParams(window.location.search);
    let productId = params.get('id') || '1';

    const titleEl = document.getElementById('details-title');
    const brandEl = document.getElementById('details-brand');
    const breadcrumbEl = document.getElementById('breadcrumb-product');
    const mainImageEl = document.getElementById('details-main-image');
    const colorContainer = document.getElementById('variant-colors');
    const sizeContainer = document.getElementById('variant-sizes');
    const lensSelect = document.getElementById('lens-package');
    const quantityInput = document.getElementById('quantity-input');
    const addToCartBtn = document.querySelector('.details__action .btn:not(.btn-tryon)');
    const wishlistBtn = document.querySelector('.details__action-btn');

    const ui = {
        priceCurrent: document.getElementById('price-current'),
        priceOld: document.getElementById('price-old'),
        priceDiscount: document.getElementById('price-discount'),
        lineBase: document.getElementById('line-base'),
        lineVariant: document.getElementById('line-variant'),
        lineLens: document.getElementById('line-lens'),
        lineQty: document.getElementById('line-qty'),
        lineTotal: document.getElementById('line-total'),
        variantSku: document.getElementById('variant-sku'),
        variantStock: document.getElementById('variant-stock'),
    };

    let product = null;
    let selectedVariant = null;

    try {
        const response = await api.client.get('/v1/products/show?id=' + productId);
        product = response.data.data;
    } catch (error) {
        console.error('Failed to fetch product', error);
        alert('Product does not exist or connection error.');
        return;
    }

    // Load Related Products
    const loadRelatedProducts = async () => {
        const container = document.getElementById('related-products');
        if (!container) return;

        try {
            const categoryId = product?.category?.id || null;
            const params = {
                per_page: 8,
                sort_by: 'created_at',
                sort_direction: 'DESC'
            };
            if (categoryId) {
                params.category_ids = categoryId;
            }

            const res = await api.client.get('/v1/products', { params });
            const allProds = res.data?.data?.data || [];
            
            // Filter out current product and take top 4
            const related = allProds.filter(p => p.id != product.id).slice(0, 4);

            if (related.length === 0) {
                container.closest('section').style.display = 'none';
                return;
            }

            // Fetch wishlist state to show correct heart icons
            let wishlistedIds = [];
            try {
                const wl = await WishlistService.getWishlist();
                wishlistedIds = (wl.data || []).map(i => i.product_id);
            } catch(e) {
                console.warn("Wishlist fetch failed", e);
            }

            const badgeColors = ['light-pink', 'light-blue', 'light-orange', 'light-green'];

            let html = '';
            related.forEach((p, idx) => {
                const img = api.fixImagePath(p.thumbnail);
                const isWishlisted = wishlistedIds.includes(p.id);
                const heartIcon = isWishlisted ? 'fi fi-ss-heart' : 'fi fi-rs-heart';
                const heartClass = isWishlisted ? 'wishlist-active' : '';
                const priceValue = parseFloat(p.base_price || 0);
                const displayPrice = api.formatCurrency(priceValue);
                const oldPrice = api.formatCurrency(priceValue * 1.2);
                const badgeColor = badgeColors[idx % badgeColors.length];

                html += `
                    <div class="product__item">
                        <a href="index.html?id=${p.id}" class="product__item__overlay-link" aria-label="View Details"></a>
                        <div class="product__banner">
                            <a href="index.html?id=${p.id}" class="product__images">
                                <img src="${img}" alt="${p.name}" class="product__img default" onerror="this.src='../../assets/images/products/placeholder.png'" />
                                <img src="${img}" alt="${p.name}" class="product__img hover" onerror="this.src='../../assets/images/products/placeholder.png'" />
                            </a>
                            <div class="product__actions">
                                <button type="button" class="action__btn" aria-label="Quick View" data-action="quick-view" data-product-id="${p.id}">
                                    <i class="fi fi-rs-eye"></i>
                                </button>
                                <button type="button" class="action__btn ${heartClass}" aria-label="Wishlist" data-action="toggle-wishlist" data-product-id="${p.id}">
                                    <i class="${heartIcon}"></i>
                                </button>
                            </div>
                            <div class="product__badge ${badgeColor}">Hot</div>
                        </div>
                        <div class="product__content">
                            <span class="product__category">${p.brand || 'Luxury'}</span>
                            <a href="index.html?id=${p.id}"><h3 class="product__title">${p.name}</h3></a>
                            <div class="product__rating">
                                <i class="fi fi-rs-star"></i><i class="fi fi-rs-star"></i><i class="fi fi-rs-star"></i><i class="fi fi-rs-star"></i><i class="fi fi-rs-star"></i>
                            </div>
                            <div class="product__price flex">
                                <span class="new__price">${displayPrice}</span>
                                <span class="old__price">${oldPrice}</span>
                            </div>
                            <button type="button" class="action__btn cart__btn" aria-label="Add To Cart" data-action="add-to-cart" data-product-id="${p.id}">
                                <i class="fi fi-rs-shopping-bag-add"></i>
                            </button>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

        } catch (err) {
            console.error("Critical error loading related products:", err);
            // If API fails, hide the section instead of showing broken mock data
            if (container.closest('section')) container.closest('section').style.display = 'none';
        }
    };
    loadRelatedProducts();

    // Update Info Table with real data
    const infoTable = document.getElementById('info-table');
    if (infoTable) {
        const uniqueColors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
        const uniqueSizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))];
        
        infoTable.innerHTML = `
            <tr><th>Brand</th><td>${product.brand || 'EVELENS'}</td></tr>
            <tr><th>Model Name</th><td>${product.model_name || 'N/A'}</td></tr>
            <tr><th>Product Code</th><td>${product.slug.toUpperCase()}</td></tr>
            <tr><th>Bridge Width</th><td>18mm - 22mm</td></tr>
            <tr><th>Temple Length</th><td>140mm - 145mm</td></tr>
            <tr><th>Lens Diameter</th><td>50mm - 54mm</td></tr>
            <tr><th>Frame Material</th><td>Premium Hand-polished Acetate</td></tr>
            <tr><th>Gender</th><td>${product.gender ? product.gender.charAt(0).toUpperCase() + product.gender.slice(1) : 'Unisex'}</td></tr>
            <tr><th>Available Finishes</th><td>${uniqueColors.join(', ') || 'N/A'}</td></tr>
            <tr><th>Available Sizes</th><td>${uniqueSizes.join(', ') || 'N/A'}</td></tr>
        `;
    }

    try {
        const lensResponse = await api.client.get('/v1/products/lenses/available');
        const lenses = lensResponse.data?.data || [];

        lensSelect.innerHTML = '<option value="">Frame only (no lens add-on)</option>';
        lenses.forEach((lens) => {
            const option = document.createElement('option');
            option.value = lens.id;
            option.dataset.price = lens.price;
            option.innerText = `${lens.name} - ${lens.lens_type} (+${formatPrice(lens.price)})`;
            lensSelect.appendChild(option);
        });
    } catch (error) {
        console.warn('Failed to load optional lens packages', error);
        lensSelect.innerHTML = '<option value="">Frame only (no lens add-on)</option><option value="0">API Lens Data Unavailable</option>';
    }

    titleEl.textContent = product.name;
    brandEl.textContent = product.brand;
    if (breadcrumbEl) {
        breadcrumbEl.textContent = product.name;
    }
    document.title = `${product.name} — EVELENS`;

    const colors = {};
    const sizes = {};
    product.variants.forEach((variant) => {
        if (!colors[variant.color]) colors[variant.color] = [];
        colors[variant.color].push(variant);

        if (!sizes[variant.size]) sizes[variant.size] = [];
        sizes[variant.size].push(variant);
    });

    colorContainer.innerHTML = '';
    Object.keys(colors).forEach((color, index) => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.className = `color__link ${resolveColorClass(color)}`;
        link.dataset.color = color;
        link.title = color;

        if (index === 0) {
            setActiveColor(link);
        }

        listItem.appendChild(link);
        colorContainer.appendChild(listItem);
    });

    sizeContainer.innerHTML = '';
    Object.keys(sizes).forEach((size, index) => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.className = `size__link ${index === 0 ? 'size-active' : ''}`;
        link.dataset.size = size;
        link.innerText = size;
        listItem.appendChild(link);
        sizeContainer.appendChild(listItem);
    });

    function getActiveColor() {
        return colorContainer.querySelector('.color__link[data-active="1"]')?.dataset.color || null;
    }

    function getActiveSize() {
        return sizeContainer.querySelector('.size-active')?.dataset.size || null;
    }

    function updatePricing() {
        const color = getActiveColor();
        const size = getActiveSize();

        selectedVariant = product.variants.find((variant) => variant.color === color && variant.size === size)
            || product.variants.find((variant) => variant.color === color)
            || product.variants[0];

        let imagePath = selectedVariant.image_2d_url || '../../assets/images/products/placeholder.png';
        if (imagePath.startsWith('/')) {
            imagePath = '../../' + imagePath.substring(1);
        }
        mainImageEl.src = imagePath;

        const basePrice = parseFloat(product.base_price);
        const variantFee = parseFloat(selectedVariant.additional_price || 0);
        const selectedLens = lensSelect.options[lensSelect.selectedIndex];
        const lensFee = selectedLens && selectedLens.value ? parseFloat(selectedLens.dataset.price) : 0;
        const maxStock = Number(selectedVariant.stock_quantity || 0);
        const qty = Math.max(1, Math.min(maxStock > 0 ? maxStock : 1, Math.min(10, Number(quantityInput.value || 1))));
        quantityInput.value = String(qty);

        const unitPrice = basePrice + variantFee + lensFee;
        const total = unitPrice * qty;
        const oldPrice = unitPrice * 1.2;

        ui.priceCurrent.textContent = formatPrice(unitPrice);
        ui.priceOld.textContent = formatPrice(oldPrice);
        ui.priceDiscount.textContent = `Save ${formatPrice(oldPrice - unitPrice)}`;
        ui.lineBase.textContent = formatPrice(basePrice);
        ui.lineVariant.textContent = formatPrice(variantFee);
        ui.lineLens.textContent = formatPrice(lensFee);
        ui.lineQty.textContent = String(qty);
        ui.lineTotal.textContent = formatPrice(total);
        ui.variantSku.textContent = selectedVariant.sku;

        const isOutOfStock = maxStock <= 0;
        ui.variantStock.textContent = isOutOfStock ? 'Out of Stock' : `${maxStock} Items in Stock`;
        ui.variantStock.classList.toggle('text-danger', isOutOfStock);
        addToCartBtn.classList.toggle('is-disabled-link', isOutOfStock);
        addToCartBtn.innerHTML = isOutOfStock
            ? '<i class="fi fi-rs-shopping-bag"></i><span class="btn-text">Out of Stock</span><i class="fi fi-rs-glasses falling-item"></i>'
            : '<i class="fi fi-rs-shopping-bag"></i><span class="btn-text">Add to Cart</span><i class="fi fi-rs-glasses falling-item"></i>';
    }

    colorContainer.addEventListener('click', (event) => {
        const colorLink = event.target.closest('.color__link');
        if (!colorLink) {
            return;
        }

        event.preventDefault();
        setActiveColor(colorLink);
        updatePricing();
    });

    sizeContainer.addEventListener('click', (event) => {
        const sizeLink = event.target.closest('.size__link');
        if (!sizeLink) {
            return;
        }

        event.preventDefault();
        sizeContainer.querySelectorAll('.size__link').forEach((link) => link.classList.remove('size-active'));
        sizeLink.classList.add('size-active');
        updatePricing();
    });

    lensSelect.addEventListener('change', updatePricing);
    quantityInput.addEventListener('input', updatePricing);

    addToCartBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!selectedVariant || addToCartBtn.classList.contains('animating') || addToCartBtn.classList.contains('is-disabled-link')) {
            return;
        }

        const lensId = lensSelect.value ? parseInt(lensSelect.value, 10) : null;
        addToCartBtn.classList.add('animating');

        try {
            await api.client.post('/v1/cart', {
                variant_id: selectedVariant.id,
                lens_id: lensId,
                quantity: parseInt(quantityInput.value, 10),
            });

            window.setTimeout(() => {
                addToCartBtn.classList.remove('animating');
                addToCartBtn.classList.add('success-state');
                addToCartBtn.querySelector('.btn-text').textContent = 'Added!';
                addToCartBtn.querySelector('i:first-child').className = 'fi fi-rs-check';

                window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));

                window.setTimeout(() => {
                    if (selectedVariant && Number(selectedVariant.stock_quantity) > 0) {
                        addToCartBtn.classList.remove('success-state');
                        addToCartBtn.querySelector('.btn-text').textContent = 'Add to Cart';
                        addToCartBtn.querySelector('i:first-child').className = 'fi fi-rs-shopping-bag';
                    }
                }, 2000);
            }, 700);
        } catch (err) {
            addToCartBtn.classList.remove('animating');
            if (err.response?.status === 401) {
                await alert('Please login first!');
                window.location.href = '../auth/';
            } else {
                await alert('Error: ' + (err.response?.data?.message || err.message));
            }
        }
    });

    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', async (event) => {
            event.preventDefault();

            try {
                const response = await WishlistService.toggleItem(productId);
                const isActive = response.status === 'added';
                updateWishlistButton(wishlistBtn, isActive);
                await alert(isActive ? 'Added to wishlist!' : 'Removed from wishlist!');
                window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
            } catch (err) {
                if (err.response?.status === 401) {
                    alert('Please login to use wishlist.');
                } else {
                    alert('Failed to update wishlist.');
                }
            }
        });

        try {
            const response = await WishlistService.getWishlist();
            const items = response.data || [];
            updateWishlistButton(wishlistBtn, items.some((item) => item.product_id == productId));
        } catch (err) {
            updateWishlistButton(wishlistBtn, false);
        }
    }

    updatePricing();
});
