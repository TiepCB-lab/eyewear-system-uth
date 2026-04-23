import CartService from '../services/cartService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');

    const fixImagePath = (path) => {
        if (!path) return '../../assets/images/products/placeholder.png';
        if (path.startsWith('http')) return path;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return encodeURI('../../' + cleanPath);
    };

    const loadSummary = async () => {
        try {
            const result = await CartService.getCart();
            const items = result.data;
            const totals = result.totals;

            if (!items || items.length === 0) {
                window.location.href = '../cart/index.html';
                return;
            }

            tbody.innerHTML = '';
            items.forEach(item => {
                const tr = document.createElement('tr');
                const pt = item.unit_price * item.quantity;
                tr.innerHTML = `
                    <td>
                        <img src="${fixImagePath(item.image_2d_url)}" alt="${item.product_name}" class="order__img" onerror="this.src='../../assets/images/products/placeholder.png'" />
                    </td>
                    <td>
                        <h3 class="table__title">${item.product_name}</h3>
                        <p class="table__quantity">x ${item.quantity}</p>
                    </td>
                    <td><span class="table__price">${window.formatVND ? window.formatVND(pt) : pt}</span></td>
                `;
                tbody.appendChild(tr);
            });

            subtotalEl.innerText = window.formatVND ? window.formatVND(totals.subtotal) : totals.subtotal;
            totalEl.innerText = window.formatVND ? window.formatVND(totals.total) : totals.total;
        } catch (error) {
            console.error('Error loading checkout summary:', error);
        }
    };

    if (placeOrderBtn) {
        placeOrderBtn.onclick = async (e) => {
            e.preventDefault();
            
            const shippingAddress = document.querySelector('input[placeholder="Address"]').value;
            const city = document.querySelector('input[placeholder="City"]').value;
            const country = document.querySelector('input[placeholder="State / Country"]').value;
            const postcode = document.querySelector('input[placeholder="PostCode"]').value;

            if (!shippingAddress || !city || !country) {
                alert('Please fill in your shipping details.');
                return;
            }

            const fullAddress = `${shippingAddress}, ${city}, ${country} ${postcode}`;

            try {
                placeOrderBtn.disabled = true;
                placeOrderBtn.innerText = 'Processing...';
                await CartService.checkout(fullAddress);
                alert('Order placed successfully!');
                window.location.href = '../../index.html';
            } catch (err) {
                alert('Checkout failed: ' + (err.response?.data?.message || err.message));
                placeOrderBtn.disabled = false;
                placeOrderBtn.innerText = 'Place Order';
            }
        };
    }

    loadSummary();
});
