import api from '../services/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const nameInput = document.querySelector('input[placeholder="Name"]');
    const addressInput = document.querySelector('input[placeholder="Address"]');
    const cityInput = document.querySelector('input[placeholder="City"]');
    const phoneInput = document.querySelector('input[placeholder="Phone"]');
    const emailInput = document.querySelector('input[placeholder="Email"]');

    const fillCheckoutFields = (profile) => {
        const user = profile?.user || {};

        if (nameInput) nameInput.value = user.full_name || user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = profile?.phone || user.phone || '';
    };

    const loadProfileData = async () => {
        try {
            const response = await api.profile.getProfile();
            const profile = response.profile || {};

            fillCheckoutFields(profile);

            if (addressInput) addressInput.readOnly = false;
            if (cityInput) cityInput.readOnly = false;
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    };


    const loadSummary = async () => {
        try {
            const result = await api.cart.getCart();
            const data = result.data || {};
            const items = data.items || [];
            const totals = data.totals || { subtotal: 0, shipping: 0, total: 0 };
            
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
        
        const shippingAddress = addressInput?.value;
        const city = cityInput?.value;

        if (!shippingAddress || !city) {
            alert('Please fill in your shipping details.');
            return;
        }

        const fullAddress = `${shippingAddress}, ${city}`;

        try {
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerText = 'Processing...';
            
            await api.cart.checkout(fullAddress);
            
            if (window.Notification) window.Notification.show('Order placed successfully!', 'success');
            else alert('Order placed successfully!');

            await new Promise((resolve) => setTimeout(resolve, 1500));

            window.location.href = '../../index.html';
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            if (window.Notification) window.Notification.show('Checkout failed: ' + message, 'error');
            else alert('Checkout failed: ' + message);
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerText = 'Place Order';
        }
    });

    loadProfileData();
    loadSummary();
});
