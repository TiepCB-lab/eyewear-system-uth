import { salesService } from '../../services/supportService.js';
import orderService from '../../services/orderService.js';
import api from '../../services/api.js';

const ordersBody = document.getElementById('ordersListBody');
const countEl = document.getElementById('sales-new-orders-count');
const searchInput = document.getElementById('orderSearchInput');
const statusFilter = document.getElementById('orderStatusFilter');
const syncBtn = document.getElementById('syncOrdersBtn');

const detailModal = document.getElementById('salesOrderDetailModal');
const modalContent = document.getElementById('salesModalContent');
const closeModalBtn = document.getElementById('closeSalesModal');

let currentOrders = [];

async function initializeOrdersPage() {
    await loadOrders();
    setupEventListeners();
}

async function loadOrders() {
    try {
        const filters = {
            status: statusFilter?.value || '',
            search: searchInput?.value || ''
        };
        const response = await salesService.getOrders(filters);
        currentOrders = Array.isArray(response) ? response : (response?.data || []);
        
        if (countEl) {
            const pendingCount = currentOrders.filter(o => o.status === 'pending' || o.status === 'paid').length;
            countEl.innerText = pendingCount;
        }
        renderOrdersTable(currentOrders);
    } catch (err) {
        console.error('LoadOrders Error:', err);
        alert('Failed to load orders: ' + (err.response?.data?.message || err.message));
    }
}

function renderOrdersTable(rows) {
    if (!ordersBody) return;
    if (!rows || rows.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="7" class="table-state-cell">No orders found.</td></tr>';
        return;
    }

    ordersBody.innerHTML = rows.map((order) => {
        const status = order.status || 'pending';
        const statusClass = getStatusClass(status);
        const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
        const isCOD = (order.payment_method || '').toLowerCase() === 'cod';
        
        let paymentLabel = (order.payment_status || 'unpaid').toUpperCase();
        let paymentClass = isPaid ? 'badge-active' : 'badge-pending';
        if (isCOD && !isPaid) { paymentLabel = 'COD'; paymentClass = 'badge-shipped'; }

        let dateStr = order.placed_at ? new Date(order.placed_at).toLocaleDateString() : '—';

        return `
            <tr>
                <td data-label="Order #">#${order.order_number || order.id}</td>
                <td data-label="Date"><span style="font-size: 11px;">${dateStr}</span></td>
                <td data-label="Customer">
                    <div class="flex-column" style="gap: 2px;">
                        <strong>${order.customer_name || 'Customer'}</strong>
                        <span style="font-size: 10px; color: #666;">${order.customer_phone || ''}</span>
                    </div>
                </td>
                <td data-label="Status"><span class="badge ${statusClass}">${status.toUpperCase()}</span></td>
                <td data-label="Payment">
                    <div class="flex-column" style="gap: 2px;">
                        <span class="badge ${paymentClass}">${paymentLabel}</span>
                        <span style="font-size: 10px; color: #888; text-transform: uppercase;">${order.payment_method || 'N/A'}</span>
                    </div>
                </td>
                <td data-label="Total">${api.formatCurrency(order.total_amount)}</td>
                <td data-label="Action">
                    <button type="button" class="btn btn--sm order-manage-btn" data-order-id="${order.id}">Manage</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    const map = {
        'pending': 'badge-pending', 
        'paid': 'badge-active', 
        'processing': 'badge-shipped',
        'shipped': 'badge-shipped',
        'delivered': 'badge-active', 
        'cancelled': 'badge-qc', 
        'refunded': 'badge-pending'
    };
    return map[status?.toLowerCase()] || 'badge-pending';
}

function setupEventListeners() {
    if (searchInput) searchInput.addEventListener('input', debounce(() => loadOrders(), 500));
    if (statusFilter) statusFilter.addEventListener('change', () => loadOrders());
    if (syncBtn) syncBtn.addEventListener('click', () => loadOrders());
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { detailModal.hidden = true; });

    // Use a stable parent container for delegated clicks (module root)
    const moduleContainer = document.getElementById('dashboard-modules');
    if (moduleContainer) {
        moduleContainer.addEventListener('click', async (event) => {
            const target = event.target;
            
            // Manage button in table
            const manageBtn = target.closest('.order-manage-btn');
            if (manageBtn) {
                await openOrderManagement(Number(manageBtn.dataset.orderId));
                return;
            }

            // Action button in modal
            const actionBtn = target.closest('.modal-action-btn');
            if (actionBtn) {
                const orderId = Number(actionBtn.dataset.orderId);
                const action = actionBtn.dataset.action;
                await handleOrderAction(orderId, action);
                return;
            }
        });

        moduleContainer.addEventListener('click', async (event) => {
            const submitBtn = event.target.closest('button[type="submit"]');
            if (submitBtn && submitBtn.closest('.pres-update-form')) {
                event.preventDefault();
                const form = submitBtn.closest('.pres-update-form');
                const originalText = submitBtn.innerText;
                submitBtn.disabled = true;
                submitBtn.innerText = 'Saving...';

                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                const showNotify = (msg, type) => window.Notification ? window.Notification.show(msg, type) : alert(msg);

                try {
                    await salesService.updateOrderPrescription(data.order_item_id, data);
                    showNotify('Prescription parameters updated successfully!', 'success');
                } catch (err) {
                    if (err.response && err.response.status === 403) {
                        showNotify('Permission Denied: You do not have the required rights to modify prescription parameters. This action is restricted to Sales Staff.', 'error');
                    } else {
                        showNotify('Update failed: ' + (err.response?.data?.message || err.message), 'error');
                    }
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                }
            }
        });
    }
}

async function openOrderManagement(orderId) {
    try {
        const response = await orderService.getStaffOrderDetail(orderId);
        const order = response.data || response;
        renderModalContent(order);
        
        const card = detailModal.querySelector('.admin-modal__card');
        if (card) {
            card.style.maxWidth = '1000px'; // Reduced width
            card.style.width = '90%';
            card.style.margin = '20px auto';
        }
        detailModal.hidden = false;
    } catch (err) {
        console.error('OpenOrderManagement Error:', err);
        alert('Failed to load details: ' + err.message);
    }
}

function renderModalContent(order) {
    const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
    const isCOD = (order.payment_method || '').toLowerCase() === 'cod';

    const itemsHtml = order.items.map(item => {
        const hasPrescription = item.sph_od !== null || item.sph_os !== null;
        const canEditPrescription = api.auth.getUserPermissions().includes('validate_prescription');

        const presHtml = hasPrescription ? `
            <div style="margin-top: 12px; padding: 15px; background: #fff; border: 1px solid #eee; border-radius: 10px;">
                <form class="pres-update-form">
                    <input type="hidden" name="order_item_id" value="${item.id}">
                    <div class="flex admin-flex-between" style="margin-bottom: 10px;">
                        <h5 style="margin: 0; font-size: 13px; color: #555;">Prescription Info</h5>
                        ${canEditPrescription ? `<button type="submit" class="btn btn--sm" style="padding: 2px 10px; font-size: 10px; background: #333;">Save</button>` : ''}
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; min-width: 450px; font-size: 11px; border-collapse: collapse;">
                            <thead>
                                <tr style="text-align: left; color: #888;">
                                    <th>Eye</th><th>SPH</th><th>CYL</th><th>AXIS</th><th style="text-align: center;">PD</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>OD</strong></td>
                                    <td><input type="text" name="sph_od" value="${item.sph_od}" class="form__input" style="padding: 4px; height: 28px;" ${canEditPrescription ? '' : 'readonly'}></td>
                                    <td><input type="text" name="cyl_od" value="${item.cyl_od}" class="form__input" style="padding: 4px; height: 28px;" ${canEditPrescription ? '' : 'readonly'}></td>
                                    <td><input type="number" name="axis_od" value="${item.axis_od}" class="form__input" style="padding: 4px; height: 28px;" ${canEditPrescription ? '' : 'readonly'}></td>
                                    <td rowspan="2" style="text-align: center; border-left: 1px dashed #eee;">
                                        <input type="text" name="pd" value="${item.pd}" class="form__input" style="padding: 4px; width: 45px; text-align: center;" ${canEditPrescription ? '' : 'readonly'}>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>OS</strong></td>
                                    <td><input type="text" name="sph_os" value="${item.sph_os}" class="form__input" style="padding: 4px; height: 28px;" ${canEditPrescription ? '' : 'readonly'}></td>
                                    <td><input type="text" name="cyl_os" value="${item.cyl_os}" class="form__input" style="padding: 4px; height: 28px;" ${canEditPrescription ? '' : 'readonly'}></td>
                                    <td><input type="number" name="axis_os" value="${item.axis_os}" class="form__input" style="padding: 4px; height: 28px;" ${canEditPrescription ? '' : 'readonly'}></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </form>
            </div>
        ` : '';

        return `
            <div class="order-item-row" style="padding: 15px 0; border-bottom: 1px solid #eee; display: flex; flex-wrap: wrap; gap: 15px;">
                <img src="${api.fixImagePath(item.image_2d_url, '../../../')}" style="width: 70px; height: 50px; object-fit: contain;">
                <div style="flex: 1; min-width: 250px;">
                    <strong style="display: block; font-size: 14px;">${item.product_name}</strong>
                    <div style="font-size: 11px; color: #888; margin: 4px 0;">${item.sku} | ${item.color} / ${item.size}</div>
                    <div style="display: flex; gap: 5px;">
                        ${item.lens_name ? `<span class="badge badge-shipped" style="font-size: 9px; padding: 2px 6px;">${item.lens_name}</span>` : ''}
                    </div>
                    ${presHtml}
                </div>
                <div style="text-align: right; min-width: 100px;">
                    <strong style="color: var(--first-color); font-size: 15px;">${api.formatCurrency(item.unit_price)}</strong>
                    <div style="font-size: 12px; color: #999;">Qty: ${item.quantity}</div>
                </div>
            </div>
        `;
    }).join('');

    modalContent.innerHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 30px; align-items: start;">
            <div style="flex: 1; min-width: 300px; max-height: 65vh; overflow-y: auto;">
                <h4 class="table__title" style="font-size: 16px; margin-bottom: 15px;">Order Items</h4>
                <div class="items-list">${itemsHtml}</div>
            </div>
            <div style="width: 320px; flex-shrink: 0; background: #fafafa; padding: 20px; border-radius: 15px; border: 1px solid #eee;">
                <h4 class="table__title" style="font-size: 16px; margin-bottom: 20px;">Order Summary</h4>
                
                <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #ddd;">
                    <h5 style="font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 8px;">Delivery Information</h5>
                    <div style="font-size: 12px; line-height: 1.5;">
                        <div style="font-weight: 700; margin-bottom: 4px;">${order.customer_name}</div>
                        <div style="color: #555;"><i class="fi fi-rs-phone-call" style="font-size: 10px;"></i> ${order.customer_phone || 'N/A'}</div>
                        <div style="color: #555;"><i class="fi fi-rs-envelope" style="font-size: 10px;"></i> ${order.customer_email || 'N/A'}</div>
                        <div style="margin-top: 8px; padding: 8px; background: #fff; border-radius: 6px; border: 1px solid #eee; font-style: italic; color: #444;">
                            <i class="fi fi-rs-marker" style="font-size: 10px;"></i> ${order.shipping_address || 'No shipping address provided'}
                        </div>
                    </div>
                </div>

                <div style="display: grid; gap: 12px; font-size: 13px;">
                    <div class="flex admin-flex-between"><span>Status:</span> <span class="badge ${getStatusClass(order.status)}">${order.status.toUpperCase()}</span></div>
                    <div class="flex admin-flex-between"><span>Payment:</span> <strong style="font-size: 11px;">${order.payment_method || 'N/A'}</strong></div>
                    <div class="flex admin-flex-between"><span>Amount:</span> <strong style="color: var(--first-color); font-size: 18px;">${api.formatCurrency(order.total_amount)}</strong></div>
                </div>
                <div style="margin-top: 25px;">
                    ${(!order.verified_by && ['pending', 'paid'].includes(order.status.toLowerCase())) ? 
                        `<button class="modal-action-btn" data-action="confirm" data-order-id="${order.id}" 
                            style="width: 100%; padding: 14px; background: #008080; color: #fff; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,128,128,0.2);">Confirm Order</button>` : ''}
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                        <button class="btn btn--sm btn--outline modal-action-btn" data-action="complaint_refund" data-order-id="${order.id}" style="font-size: 11px;">Refund</button>
                        <button class="btn btn--sm btn--outline modal-action-btn" data-action="complaint_warranty" data-order-id="${order.id}" style="font-size: 11px;">Warranty</button>
                    </div>
                    <button class="btn btn--sm btn--outline modal-action-btn" style="color: #dc3545; border-color: #dc3545; width: 100%; margin-top: 10px;" data-action="cancel" data-order-id="${order.id}">Cancel</button>
                </div>
            </div>
        </div>
    `;
}

async function handleOrderAction(orderId, action) {
    if (!confirm(`Are you sure you want to perform action: ${action.toUpperCase()}?`)) return;
    try {
        if (action === 'confirm') { await salesService.verifyOrder(orderId); alert('Order moved to production!'); }
        else if (action === 'cancel') { await salesService.processComplaint(orderId, 'return', 'Sales cancelled'); alert('Cancelled!'); }
        else if (action === 'complaint_refund') { 
            const reason = prompt('Refund reason:'); 
            if (reason) { await salesService.processComplaint(orderId, 'refund', reason); alert('Refund initiated!'); }
        }
        else if (action === 'complaint_warranty') { 
            const reason = prompt('Issue:'); 
            if (reason) { await salesService.processComplaint(orderId, 'warranty', reason); alert('Warranty created!'); }
        }
        detailModal.hidden = true;
        await loadOrders();
    } catch (err) {
        alert('Action failed: ' + err.message);
    }
}

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

initializeOrdersPage();
