import api from '../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const selectAllCheckbox = document.getElementById('select-all-cart');
    let cachedCartItems = []; // Cache for checkout mixed-cart validation
    

    const loadCart = async () => {
        try {
            const body = await api.cart.getCart();
            const data = body.data || {}; // Inner data object
            const items = data.items || [];
            const totals = data.totals || { subtotal: 0, total: 0 };
            cachedCartItems = items; // Cache for checkout validation
            
            tbody.innerHTML = '';
            
            if (!items || items.length === 0) {
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
                    <td data-label="Select">
                        <input type="checkbox" class="cart-item-check" data-id="${itemId}" ${isSelected ? 'checked' : ''}>
                    </td>
                    <td data-label="Image">
                        <a href="../details/index.html?id=${item.product_id}">
                            <img src="${api.fixImagePath(item.image_2d_url)}" alt="${item.product_name}" class="table__img" />
                        </a>
                    </td>
                    <td data-label="Product">
                        <a href="../details/index.html?id=${item.product_id}">
                            <h3 class="table__title">${item.product_name || 'Product'}</h3>
                        </a>
                        <p class="table__description">
                            Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'} <br>
                            ${item.lens_name ? `Lens: ${item.lens_name} (+${api.formatCurrency(item.lens_price)})` : ''}
                            ${item.prescription_id ? `
                                <div class="cart-prescription-info" style="font-size: 0.75rem; color: var(--first-color); margin-top: 5px; background: #f0f9f9; padding: 5px; border-radius: 4px;">
                                    <strong>Prescription:</strong><br>
                                    R: ${item.sph_od}/${item.cyl_od}/${item.axis_od} | 
                                    L: ${item.sph_os}/${item.cyl_os}/${item.axis_os} | PD: ${item.pd}
                                </div>
                            ` : ''}
                        </p>
                    </td>
                    <td data-label="Price"><span class="table__price">${api.formatCurrency(item.unit_price)}</span></td>
                    <td data-label="Quantity"><input type="number" value="${item.quantity}" class="quantity cart-qty-input" data-id="${itemId}" min="1"/></td>
                    <td data-label="Subtotal"><span class="subtotal">${api.formatCurrency(itemTotal)}</span></td>
                    <td data-label="Remove"><i class="fi fi-rs-trash table__trash table__trash--interactive cart-remove-btn" data-id="${itemId}"></i></td>
                `;
                tbody.appendChild(tr);
            });

            renderTotals(totals);
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

    const renderTotals = (totals) => {
        subtotalEl.innerText = api.formatCurrency(totals.subtotal || 0);
        totalEl.innerText = api.formatCurrency(totals.total || 0);

        // Hiển thị dòng giảm giá nếu có
        const discountRow = document.querySelector('.cart__total-table tr:nth-child(2)');
        if (totals.discount > 0) {
            if (discountRow) {
                discountRow.innerHTML = `
                    <td><span class="cart__total-title">Discount (${totals.promotion_code})</span></td>
                    <td><span class="cart__total-price" style="color: red;">-${api.formatCurrency(totals.discount)}</span></td>
                `;
            }
        } else if (discountRow) {
            // Trả về mặc định nếu không có giảm giá
            discountRow.innerHTML = `
                <td><span class="cart__total-title">Shipping</span></td>
                <td><span class="cart__total-price">Free</span></td>
            `;
        }
        
        if (checkoutBtn) {
            if (totals.total > 0) checkoutBtn.classList.remove('is-disabled-link');
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
                await EvelensNotify.error('Error', 'Could not update quantity. Please try again.');
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
                await EvelensNotify.error('Error', 'Could not update selection status.');
            }
            return;
        }

        const removeButton = e.target.closest('.cart-remove-btn');
        if (removeButton) {
            await EvelensNotify.confirm(
                'Confirm Removal',
                'Are you sure you want to remove this item from your cart?',
                async () => {
                    try {
                        await api.cart.removeItem(removeButton.dataset.id);
                        loadCart();
                        window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
                    } catch (err) {
                        await EvelensNotify.error('Error', 'Could not remove item.');
                    }
                }
            );
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

    // Xử lý áp dụng mã giảm giá
    const couponForm = document.querySelector('.coupon__form');
    const couponInput = document.querySelector('.coupon__form input');
    
    couponForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = couponInput.value.trim();
        if (!code) return;

        try {
            await api.cart.applyVoucher(code);
            loadCart();
            alert('Voucher applied successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Could not apply voucher');
        }
    });

    // --- Mixed cart check: block checkout if both in-stock and pre-order items ---
    // Intercept checkout button click
    checkoutBtn?.addEventListener('click', (e) => {
        const selectedItems = cachedCartItems.filter(i => parseInt(i.is_selected) === 1);
        const preorderItems = selectedItems.filter(i => parseInt(i.stock_quantity || 0) <= 0);
        const instockItems = selectedItems.filter(i => parseInt(i.stock_quantity || 0) > 0);

        if (preorderItems.length > 0 && instockItems.length > 0) {
            e.preventDefault();
            const preorderNames = preorderItems.map(i => i.product_name).join(', ');
            const instockNames = instockItems.map(i => i.product_name).join(', ');

            if (typeof EvelensNotify !== 'undefined') {
                EvelensNotify.info(
                    'Cannot Mix Order Types',
                    `Your cart has both in-stock items (${instockNames}) and pre-order items (${preorderNames}). Please deselect one type and checkout them separately.`
                );
            }
        }
    });

    loadCart();
});
