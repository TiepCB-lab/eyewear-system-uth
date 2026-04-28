import { salesService, supportService } from '../../services/supportService.js';
import dashboardService from '../../services/dashboardService.js';
import { getCurrentUserPermissions } from '../../core/rbac.js';

async function loadStats() {
    const { hasPermission } = await getCurrentUserPermissions();

    try {
        const [ordersResponse, summaryResponse, opsOverview] = await Promise.all([
            hasPermission('view_orders') ? salesService.getPendingOrders() : Promise.resolve(null),
            hasPermission('view_reports') ? dashboardService.getSummary() : Promise.resolve(null),
            hasPermission('pack_order') ? dashboardService.getOperationsOverview() : Promise.resolve(null)
        ]);

        const newOrdersElement = document.getElementById('overview-new-orders');
        if (newOrdersElement && ordersResponse) {
            newOrdersElement.innerText = ordersResponse?.data?.length || 0;
        }

        const revenueElement = document.getElementById('overview-revenue');
        if (revenueElement && summaryResponse) {
            const rev = summaryResponse?.data?.revenue || 0;
            revenueElement.innerText = `$${parseFloat(rev).toLocaleString()}`;
        }

        const toPackElement = document.getElementById('overview-to-pack');
        if (toPackElement && opsOverview) {
            const shipments = opsOverview?.data?.pending_shipments || 0;
            const productionSteps = opsOverview?.data?.production_steps || [];
            const packaging = productionSteps.find(s => s.production_step === 'packaging')?.total || 0;
            
            toPackElement.innerText = parseInt(packaging) + parseInt(shipments);
        }
    } catch (err) {
        console.error("Error loading overview stats:", err);
    }
}

loadStats();
