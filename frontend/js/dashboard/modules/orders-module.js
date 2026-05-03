import { salesService } from '../../services/supportService.js';
import api from '../../services/api.js';

const ordersBody = document.getElementById('ordersListBody');
const countEl = document.getElementById('sales-new-orders-count');

function renderOrders(rows) {
    if (!ordersBody) {
        return;
    }

    if (!rows || rows.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="4" class="table-state-cell">No pending orders.</td></tr>';
        return;
    }

    ordersBody.innerHTML = rows.map((order) => `
        <tr>
            <td><strong>#${order.order_number}</strong></td>
            <td><span class="badge badge-pending">${order.status}</span></td>
            <td>${api.formatCurrency(order.total_amount)}</td>
            <td><button type="button" class="btn btn--sm order-verify-btn" data-order-id="${order.id}">Verify Order</button></td>
        </tr>
    `).join('');
}

async function loadOrders() {
    try {
        const response = await salesService.getPendingOrders();
        if (countEl) {
            countEl.innerText = response?.data?.length || 0;
        }
        renderOrders(response?.data || []);
    } catch (err) {
        ordersBody.innerHTML = '<tr><td colspan="4" class="table-state-cell table-state-cell--error">Error loading orders.</td></tr>';
    }
}

document.addEventListener('click', async (event) => {
    const verifyButton = event.target.closest('.order-verify-btn');
    if (verifyButton) {
        if (!confirm('Verify this order for production?')) {
            return;
        }

        try {
            await salesService.verifyOrder(Number(verifyButton.dataset.orderId));
            alert('Order verified successfully!');
            loadOrders();
        } catch (err) {
            alert('Verification failed: ' + err.message);
        }
        return;
    }
});

loadOrders();
