import api from '../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const selectAllCheckbox = document.getElementById('select-all-cart');
    

    const loadCart = async () => {
        try {
            console.log('Fetching cart...');
            const body = await api.cart.getCart();
            const data = body.data || {}; // Inner data object
            const items = data.items || [];
            const totals = data.totals || { subtotal: 0, total: 0 };
            
            tbody.innerHTML = '';
            
            if (!items || items.length === 0) {
                console.log('Cart is empty');
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Your cart is empty. <a href="../shop/" class="inline-link">Go shopping!</a></td></tr>';
                subtotalEl.innerText = api.formatCurrency(0);
                totalEl.innerText = api.formatCurrency(0);
                if (checkoutBtn) checkoutBtn.classList.add('is-disabled-link');
                return;
            }

            items.forEach(item => {
                const tr = document.createElement('tr');
                const itemId = item.id || item.cart_item_id;
                const isSelected = !!item.is_selected;
                const itemTotal = (item.unit_price || 0) * (item.quantity || 0);
                
                tr.innerHTML = `
                    <td>
                        <input type="checkbox" class="cart-item-check" data-id="${itemId}" ${isSelected ? 'checked' : ''}>
                    </td>
                    <td>
                        <img src="${api.fixImagePath(item.image_2d_url)}" alt="${item.product_name}" class="table__img" />
                    </td>
                    <td>
                        <h3 class="table__title">${item.product_name || 'Product'}</h3>
                        <p class="table__description">
                            Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'} <br>
                            ${item.lens_name ? `Lens: ${item.lens_name} (${api.formatCurrency(item.lens_price)})` : ''}
                        </p>
                    </td>
                    <td><span class="table__price">${api.formatCurrency(item.unit_price)}</span></td>
                    <td><input type="number" value="${item.quantity}" class="quantity cart-qty-input" data-id="${itemId}" min="1"/></td>
                    <td><span class="subtotal">${api.formatCurrency(itemTotal)}</span></td>
                    <td><i class="fi fi-rs-trash table__trash table__trash--interactive cart-remove-btn" data-id="${itemId}"></i></td>
                `;
                tbody.appendChild(tr);
            });

            renderTotals(totals.total);
            updateSelectAllState(items);
        } catch (error) {
            console.error('Error loading cart:', error);
            if (error.response?.status === 401) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Please <a href="../auth/">login</a> to view your cart.</td></tr>';
            } else {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red; padding: 2rem;">Error: ${error.message}</td></tr>`;
            }
        }
    };

    const renderTotals = (total) => {
        const formatted = api.formatCurrency(total);
        subtotalEl.innerText = formatted;
        totalEl.innerText = formatted;
        
        if (checkoutBtn) {
            if (total > 0) checkoutBtn.classList.remove('is-disabled-link');
            else checkoutBtn.classList.add('is-disabled-link');
        }
    };

    const updateSelectAllState = (items) => {
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = items.length > 0 && items.every(item => item.is_selected);
        }
    };

    tbody?.addEventListener('change', async (e) => {
        const input = e.target.closest('.cart-qty-input');
        if (input) {
            const qty = parseInt(input.value, 10);
            if (qty < 1) return;
            try {
                await api.cart.updateQuantity(input.dataset.id, qty);
                loadCart();
                window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
            } catch (err) {
                alert('Failed to update quantity');
            }
        }
    });

    tbody?.addEventListener('click', async (e) => {
        if (e.target.classList.contains('cart-item-check')) {
            try {
                await api.cart.setSelected(e.target.dataset.id, e.target.checked);
                loadCart();
            } catch (err) {
                e.target.checked = !e.target.checked; // Revert on failure
                alert('Failed to update selection');
            }
            return;
        }

        const removeButton = e.target.closest('.cart-remove-btn');
        if (removeButton && confirm('Are you sure you want to remove this item?')) {
            try {
                await api.cart.removeItem(removeButton.dataset.id);
                loadCart();
                window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
            } catch (err) {
                alert('Failed to remove item');
            }
        }
    });

    selectAllCheckbox?.addEventListener('change', async (e) => {
        try {
            await api.cart.selectAll(e.target.checked);
            loadCart();
        } catch (err) {
            e.target.checked = !e.target.checked;
            alert('Failed to update selection');
        }
    });

    loadCart();
});
