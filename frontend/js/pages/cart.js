import CartService from '../services/cartService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    const fixImagePath = (path) => {
        if (!path) return '../../assets/images/products/placeholder.png';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return encodeURI('../../' + cleanPath);
    };

    const loadCart = async () => {
        try {
            const result = await CartService.getCart();
            const items = result.data;
            const totals = result.totals;

            tbody.innerHTML = '';
            
            if (!items || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell table-state-cell--empty">Your cart is empty</td></tr>';
                subtotalEl.innerText = '$0.00';
                totalEl.innerText = '$0.00';
                if (checkoutBtn) {
                    checkoutBtn.classList.add('is-disabled-link');
                }
                return;
            } else {
                if (checkoutBtn) {
                    checkoutBtn.classList.remove('is-disabled-link');
                }
            }

            items.forEach(item => {
                const tr = document.createElement('tr');
                const itemTotal = item.unit_price * item.quantity;
                
                tr.innerHTML = `
                    <td>
                        <img src="${fixImagePath(item.image_2d_url)}" alt="${item.product_name}" class="table__img" data-fallback-src="../../assets/images/products/placeholder.png" />
                    </td>
                    <td>
                        <h3 class="table__title">${item.product_name}</h3>
                        <p class="table__description">
                            Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'} <br>
                            ${item.lens_name ? `Lens: ${item.lens_name} (${window.formatVND ? window.formatVND(item.lens_price) : '$' + item.lens_price})` : ''}
                        </p>
                    </td>
                    <td><span class="table__price">${window.formatVND ? window.formatVND(item.unit_price) : item.unit_price}</span></td>
                    <td><input type="number" value="${item.quantity}" class="quantity cart-qty-input" data-id="${item.id}" min="1"/></td>
                    <td><span class="subtotal">${window.formatVND ? window.formatVND(itemTotal) : itemTotal}</span></td>
                    <td><i class="fi fi-rs-trash table__trash table__trash--interactive cart-remove-btn" data-id="${item.id}"></i></td>
                `;
                tbody.appendChild(tr);
            });

            subtotalEl.innerText = window.formatVND ? window.formatVND(totals.subtotal) : totals.subtotal;
            totalEl.innerText = window.formatVND ? window.formatVND(totals.total) : totals.total;
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    };

    tbody?.addEventListener('change', async (e) => {
        const input = e.target.closest('.cart-qty-input');
        if (!input) {
            return;
        }

        const id = input.dataset.id;
        const qty = parseInt(input.value, 10);
        if (qty < 1) {
            return;
        }

        try {
            await CartService.updateQuantity(id, qty);
            loadCart();
            window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
        } catch (err) {
            alert('Failed to update quantity');
        }
    });

    tbody?.addEventListener('click', async (e) => {
        const removeButton = e.target.closest('.cart-remove-btn');
        if (!removeButton) {
            return;
        }

        if (!confirm('Are you sure you want to remove this item?')) {
            return;
        }

        const id = removeButton.dataset.id;
        try {
            await CartService.removeItem(id);
            loadCart();
            window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
        } catch (err) {
            alert('Failed to remove item');
        }
    });

    loadCart();
});
