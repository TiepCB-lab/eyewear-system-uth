import api from '../services/api.js';
import AddressEditor from '../components/address-editor.js';
import { paymentService } from '../services/paymentService.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tbody = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    
    const nameInput = document.getElementById('checkout-name');
    const emailInput = document.getElementById('checkout-email');
    const addressSelect = document.getElementById('checkout-address-select');
    const addAddressBtn = document.getElementById('checkout-add-address-btn');
    const noteInput = document.getElementById('checkout-note');

    // Initialize AddressEditor modal
    const initAddressEditorIfLoaded = () => {
        const el = document.querySelector('[data-include="components/modals/address-editor"]');
        if (el && el.classList.contains('component-loaded')) {
            AddressEditor.init(() => loadAddresses());
            return true;
        }
        return false;
    };

    if (!initAddressEditorIfLoaded()) {
        window.addEventListener('content-loaded', (e) => {
            if (e.detail.path === 'components/modals/address-editor') {
                AddressEditor.init(() => loadAddresses());
            }
        });
    }

    addAddressBtn?.addEventListener('click', () => {
        AddressEditor.open();
    });

    const loadAddresses = async () => {
        try {
            const response = await api.profile.getAddresses();
            const addresses = response.data || [];
            
            if (addressSelect) {
                addressSelect.innerHTML = '';
                if (addresses.length === 0) {
                    addressSelect.innerHTML = '<option value="">No addresses saved. Please add one.</option>';
                } else {
                    addressSelect.innerHTML = addresses.map(addr => 
                        `<option value="${addr.id}" ${addr.is_default ? 'selected' : ''}>${addr.label}: ${addr.address} (Tel: ${addr.phone})</option>`
                    ).join('');
                }
            }
            return addresses;
        } catch (error) {
            console.error('Failed to load addresses:', error);
            if (addressSelect) {
                addressSelect.innerHTML = '<option value="">Error loading addresses</option>';
            }
        }
    };

    const fillCheckoutFields = (profile) => {
        const user = profile?.user || {};

        if (nameInput) nameInput.value = user.full_name || user.name || '';
        if (emailInput) emailInput.value = user.email || '';
    };

    const loadProfileData = async () => {
        try {
            const response = await api.profile.getProfile();
            const data = response.data || {};
            fillCheckoutFields(data.profile);
            
            // Addresses might be cached in profile, but let's fetch fresh
            await loadAddresses();

        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    };

    const loadSummary = async () => {
        try {
            const result = await api.cart.getCart();
            const data = result.data || {};
            const items = (data.items || []).filter(item => parseInt(item.is_selected) === 1);
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
        
        const selectedAddressId = addressSelect?.value;
        const name = nameInput?.value;

        if (!selectedAddressId) {
            alert('Please select or add a shipping address.');
            return;
        }
        
        if (!name) {
            alert('Please provide your name.');
            return;
        }
        
        // We need to pass the actual full address text to checkout API since it expects a string
        const selectedOption = addressSelect.options[addressSelect.selectedIndex];
        const fullAddress = selectedOption ? selectedOption.text.split(':').slice(1).join(':').trim() : '';

        try {
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerText = 'Processing Order...';
            
            const response = await api.cart.checkout(fullAddress);
            const orderData = response.data || {};
            
            if (!orderData.order_id) {
                throw new Error("Failed to create order, missing order ID");
            }

            // Lấy payment method
            const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'cod';
            
            placeOrderBtn.innerText = 'Processing Payment...';
            const payResponse = await paymentService.processPayment(orderData.order_id, paymentMethod, orderData.total);
            const isPaid = payResponse.data?.status === 'paid';

            if (orderData.status === 'pending_confirmation') {
                if (window.Notification) window.Notification.show('Order placed! Waiting for sales staff to verify your prescription.', 'success');
                else alert('Order placed! Waiting for sales staff to verify your prescription.');
            } else {
                if (window.Notification) window.Notification.show(isPaid ? 'Payment successful! Order completed.' : 'Order placed successfully! (COD/Transfer)', 'success');
                else alert(isPaid ? 'Payment successful! Order completed.' : 'Order placed successfully! (COD/Transfer)');
            }

            await new Promise((resolve) => setTimeout(resolve, 2000));
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
