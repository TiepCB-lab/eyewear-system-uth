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

            // Detect pre-order items (stock_quantity = 0) vs in-stock items
            const preorderItems = items.filter(item => parseInt(item.stock_quantity || 0) <= 0);
            const instockItems = items.filter(item => parseInt(item.stock_quantity || 0) > 0);
            const hasPreorder = preorderItems.length > 0;
            const hasInstock = instockItems.length > 0;

            // Block mixed cart: cannot combine pre-order and in-stock in one order
            if (hasPreorder && hasInstock) {
                const preorderNames = preorderItems.map(i => i.product_name).join(', ');
                const instockNames = instockItems.map(i => i.product_name).join(', ');

                if (typeof EvelensNotify !== 'undefined') {
                    await EvelensNotify.info(
                        'Cannot Mix Order Types',
                        `Your cart contains both in-stock items (${instockNames}) and pre-order items (${preorderNames}). Please checkout them separately — go back to your cart and deselect one type before proceeding.`
                    );
                }
                
                if (placeOrderBtn) {
                    placeOrderBtn.disabled = true;
                    placeOrderBtn.style.opacity = '0.5';
                    placeOrderBtn.textContent = 'Mixed Cart — Cannot Checkout';
                }
            }

            // Update delivery estimate based on cart type
            const deliveryText = document.getElementById('delivery-estimate-text');
            const deliveryBox = document.getElementById('delivery-estimate-box');
            const deliveryIcon = document.getElementById('delivery-icon');
            
            if (hasPreorder && deliveryText) {
                deliveryText.innerHTML = 'Pre-order items detected. Estimated delivery in <strong>10 – 14 business days</strong> after confirmation.';
                if (deliveryBox) {
                    deliveryBox.style.borderColor = '#e65100';
                    deliveryBox.style.background = 'linear-gradient(135deg, #fff3e0, #ffe0b2)';
                }
                if (deliveryIcon) {
                    deliveryIcon.className = 'fi fi-rs-clock';
                    deliveryIcon.style.color = '#e65100';
                }
            }

            tbody.innerHTML = '';
            items.forEach(item => {
                const tr = document.createElement('tr');
                const pt = (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0);
                const isItemPreorder = parseInt(item.stock_quantity || 0) <= 0;
                
                tr.innerHTML = `
                    <td>
                        <img src="${api.fixImagePath(item.image_2d_url)}" alt="${item.product_name}" class="order__img" />
                    </td>
                    <td>
                        <h3 class="table__title">${item.product_name || 'Product'}</h3>
                        <p class="table__quantity">x ${item.quantity}</p>
                        ${isItemPreorder ? '<span style="font-size: 10px; padding: 2px 8px; background: #fff3e0; color: #e65100; border-radius: 4px; font-weight: 600;">Pre-order</span>' : ''}
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
            await EvelensNotify.info('Missing Info', 'Please select or add a shipping address.');
            return;
        }
        
        if (!name) {
            await EvelensNotify.info('Missing Info', 'Please provide your name.');
            return;
        }
        
        // We need to pass the actual full address text to checkout API since it expects a string
        const selectedOption = addressSelect.options[addressSelect.selectedIndex];
        const fullAddress = selectedOption ? selectedOption.text.split(':').slice(1).join(':').trim() : '';
        // Get selected payment method
        const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'cod';
        
        const loader = await EvelensNotify.loading('Processing your order...');
        try {
            placeOrderBtn.disabled = true;
            
            const response = await api.cart.checkout(fullAddress, paymentMethod);
            const orderData = response.data || {};
            
            if (!orderData.order_id) {
                throw new Error("Could not create order.");
            }

            loader.update({ desc: 'Processing payment...' });
            const payResponse = await paymentService.processPayment(orderData.order_id, paymentMethod, orderData.total);
            const isPaid = payResponse.data?.status === 'paid';

            if (orderData.order_type === 'prescription') {
                loader.update({
                    type: 'success',
                    title: 'Order Placed!',
                    desc: 'Your order has been recorded. Please wait for our staff to verify your prescription.',
                    btnText: 'Back to Home',
                    onConfirm: () => window.location.href = '../../index.html'
                });
            } else if (orderData.order_type === 'preorder') {
                loader.update({
                    type: 'success',
                    title: 'Pre-order Confirmed!',
                    desc: 'Your pre-order has been placed successfully. Estimated delivery is 10–14 business days. We will notify you once the item is ready.',
                    btnText: 'Back to Home',
                    onConfirm: () => window.location.href = '../../index.html'
                });
            } else {
                loader.update({
                    type: 'success',
                    title: 'Success!',
                    desc: isPaid ? 'Payment successful! Your order has been completed.' : 'Order placed successfully! Thank you for choosing Evelens.',
                    btnText: 'Back to Home',
                    onConfirm: () => window.location.href = '../../index.html'
                });
            }
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            loader.update({
                type: 'error',
                title: 'Checkout Failed',
                desc: 'An error occurred during checkout: ' + message,
                btnText: 'Check Again'
            });
            placeOrderBtn.disabled = false;
        }
    });

    loadProfileData();
    loadSummary();
});
