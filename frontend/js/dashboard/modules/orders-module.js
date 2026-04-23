import { supportService, salesService } from '../../services/supportService.js';

const ordersBody = document.getElementById('ordersListBody');
const ticketsBody = document.getElementById('ticketsListBody');
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
            <td>$${order.total_amount}</td>
            <td><button type="button" class="btn btn--sm order-verify-btn" data-order-id="${order.id}">Verify Order</button></td>
        </tr>
    `).join('');
}

function renderTickets(rows) {
    if (!ticketsBody) {
        return;
    }

    if (!rows || rows.length === 0) {
        ticketsBody.innerHTML = '<tr><td colspan="4" class="table-state-cell">No open tickets.</td></tr>';
        return;
    }

    ticketsBody.innerHTML = rows.map((ticket) => `
        <tr>
            <td><strong>${ticket.subject}</strong><br/><small class="support-message-preview">${ticket.message}</small></td>
            <td><span class="badge badge-pending">${ticket.status}</span></td>
            <td>${ticket.priority}</td>
            <td><button type="button" class="btn btn--sm ticket-reply-btn" data-ticket-id="${ticket.id}">Reply to Customer</button></td>
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

async function loadTickets() {
    try {
        const response = await supportService.getTickets(true);
        renderTickets(response?.data || []);
    } catch (err) {
        ticketsBody.innerHTML = '<tr><td colspan="4" class="table-state-cell table-state-cell--error">Error loading tickets.</td></tr>';
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

    const replyButton = event.target.closest('.ticket-reply-btn');
    if (!replyButton) {
        return;
    }

    const message = prompt('Enter the support reply message to the customer:');
    if (!message) {
        return;
    }

    try {
        await supportService.replyTicket(Number(replyButton.dataset.ticketId), message);
        alert('Reply sent to customer!');
        loadTickets();
    } catch (err) {
        alert('Failed to reply: ' + err.message);
    }
});

loadOrders();
loadTickets();
