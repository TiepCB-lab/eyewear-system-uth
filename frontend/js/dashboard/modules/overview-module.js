import { salesService } from '../../services/supportService.js';
import { getCurrentUserPermissions } from '../../core/rbac.js';

async function loadStats() {
    const { hasPermission } = await getCurrentUserPermissions();
    if (!hasPermission('view_sales_dashboard')) {
        return;
    }

    const response = await salesService.getPendingOrders();
    const element = document.getElementById('overview-new-orders');
    if (element) {
        element.innerText = response?.data?.length || 0;
    }
}

loadStats();
