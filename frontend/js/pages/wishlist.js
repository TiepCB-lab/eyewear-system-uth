import WishlistService from '../services/wishlistService.js';
import CartService from '../services/cartService.js';
import ProductService from '../services/productService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.querySelector('.wishlist .table tbody');
    
    const fixImagePath = (path) => {
        if (!path) return '../../assets/images/products/placeholder.png';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return encodeURI('../../' + cleanPath);
    };

    const loadWishlist = async () => {
        try {
            const result = await WishlistService.getWishlist();
            const items = result.data;

            if (!items || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell table-state-cell--empty table-state-cell--spacious">Your wishlist is empty.</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            items.forEach(item => {
                const tr = document.createElement('tr');
                const stockStatus = item.stock_quantity > 0 ? 'In Stock' : 'Out of Stock';
                const stockClass = item.stock_quantity > 0 ? 'table__stock' : 'table__stock out-of-stock';
                
                tr.innerHTML = `
                    <td>
                        <img src="${fixImagePath(item.thumbnail)}" alt="${item.name}" class="table__img" data-fallback-src="../../assets/images/products/placeholder.png"/>
                    </td>
                    <td>
                        <h3 class="table__title">${item.name}</h3>
                        <p class="table__description">${item.brand || 'Premium Brand'}</p>
                    </td>
                    <td><span class="table__price">${window.formatVND ? window.formatVND(item.base_price) : '$' + item.base_price}</span></td>
                    <td><span class="${stockClass}">${stockStatus}</span></td>
                    <td>
                        <button class="btn btn--sm add-to-cart-btn" data-id="${item.product_id}" ${item.stock_quantity <= 0 ? 'disabled' : ''}>
                            Add to Cart
                        </button>
                    </td>
                    <td><i class="fi fi-rs-trash table__trash table__trash--interactive remove-wishlist-btn" data-id="${item.product_id}"></i></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error loading wishlist:', error);
            if(error.response && error.response.status === 401) {
                tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell table-state-cell--empty table-state-cell--spacious">Please <a href="../auth/" class="inline-link">login</a> to view your wishlist.</td></tr>';
            }
        }
    };

    tbody?.addEventListener('click', async (e) => {
        const removeButton = e.target.closest('.remove-wishlist-btn');
        if (removeButton) {
            const id = removeButton.dataset.id;
            try {
                await WishlistService.removeItem(id);
                loadWishlist();
                window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
            } catch (err) {
                alert('Failed to remove item.');
            }
            return;
        }

        const addToCartButton = e.target.closest('.add-to-cart-btn');
        if (!addToCartButton) {
            return;
        }

        const productId = addToCartButton.dataset.id;
        try {
            const productRes = await ProductService.getProduct(productId);
            const firstVariantId = productRes.data.variants[0]?.id;
            
            if (!firstVariantId) {
                alert('This product is currently unavailable.');
                return;
            }

            await CartService.addToCart(firstVariantId, 1);
            alert('Added to cart!');
            window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
        } catch (err) {
            alert('Failed to add to cart.');
        }
    });

    loadWishlist();
});
