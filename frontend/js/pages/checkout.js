import api from '../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');


    const loadSummary = async () => {
        try {
            const result = await api.cart.getCart();
            const allItems = result.data || [];
            const totals = result.totals || { total: 0 };
            
            // Filter items based on backend selection state
            const items = allItems.filter(item => !!item.is_selected);

            if (items.length === 0) {
                if (window.Notification) window.Notification.show('No items selected for checkout.', 'warning');
                window.location.href = '../cart/index.html';
                return;
            }

            tbody.innerHTML = '';
            items.forEach(item => {
                const tr = document.createElement('tr');
                const pt = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0);
                
                tr.innerHTML = `
                    <td>
                        <img src="${api.fixImagePath(item.image_2d_url)}" alt="${item.product_name}" class="order__img" />
                    </td>
                    <td>
                        <h3 class="table__title">${item.product_name || 'Product'}</h3>
                        <p class="table__quantity">x ${item.quantity}</p>
                    </td>
                    <td><span class="table__price">${api.formatCurrency(pt)}</span></td>
                `;
                tbody.appendChild(tr);
            });

            const formattedTotal = api.formatCurrency(totals.total);
            subtotalEl.innerText = formattedTotal;
            totalEl.innerText = formattedTotal;

        } catch (error) {
            console.error('Error loading checkout summary:', error);
        }
    };

    placeOrderBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const shippingAddress = document.querySelector('input[placeholder="Address"]')?.value;
        const city = document.querySelector('input[placeholder="City"]')?.value;
        const country = document.querySelector('input[placeholder="State / Country"]')?.value;
        const postcode = document.querySelector('input[placeholder="PostCode"]')?.value;

        if (!shippingAddress || !city || !country) {
            alert('Please fill in your shipping details.');
            return;
        }

        const fullAddress = `${shippingAddress}, ${city}, ${country} ${postcode}`;

        try {
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerText = 'Processing...';
            
            await api.cart.checkout(fullAddress);
            
            if (window.Notification) window.Notification.show('Order placed successfully!', 'success');
            else alert('Order placed successfully!');
            
            window.location.href = '../../index.html';
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            if (window.Notification) window.Notification.show('Checkout failed: ' + message, 'error');
            else alert('Checkout failed: ' + message);
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerText = 'Place Order';
        }
    });

    loadSummary();
});
