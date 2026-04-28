import { salesService, supportService } from '../../services/supportService.js';
import { getCurrentUserPermissions } from '../../core/rbac.js';

async function loadStats() {
    const { hasPermission } = await getCurrentUserPermissions();
    if (!hasPermission('view_sales_dashboard')) {
        return;
    }

    const [ordersResponse, ticketsResponse] = await Promise.all([
        salesService.getPendingOrders(),
        supportService.getTickets(true)
    ]);

    const newOrdersElement = document.getElementById('overview-new-orders');
    if (newOrdersElement) {
        newOrdersElement.innerText = ordersResponse?.data?.length || 0;
    }

    const supportCountElement = document.getElementById('overview-open-tickets');
    if (supportCountElement) {
        supportCountElement.innerText = ticketsResponse?.data?.length || 0;
    }
}

loadStats();
