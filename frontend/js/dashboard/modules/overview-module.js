import { salesService, supportService } from '../../services/supportService.js';
import dashboardService from '../../services/dashboardService.js';
import api from '../../services/api.js';
import { getCurrentUserPermissions } from '../../core/rbac.js';

async function loadStats() {
    const { hasPermission } = await getCurrentUserPermissions();

    try {
        const [ordersResponse, summaryResponse, opsOverview, recentActivityResponse] = await Promise.all([
            hasPermission('view_orders') ? salesService.getOrders({ status: 'pending' }) : Promise.resolve(null),
            hasPermission('view_reports') ? dashboardService.getSummary() : Promise.resolve(null),
            hasPermission('pack_order') ? dashboardService.getOperationsOverview() : Promise.resolve(null),
            hasPermission('view_orders') ? salesService.getOrders() : Promise.resolve(null)
        ]);

        // 1. Update New Orders Count
        const newOrdersElement = document.getElementById('overview-new-orders');
        if (newOrdersElement && ordersResponse) {
            const data = Array.isArray(ordersResponse.data) ? ordersResponse.data : (ordersResponse || []);
            newOrdersElement.innerText = data.length || 0;
        }

        // 2. Update Revenue (if permitted)
        const revenueElement = document.getElementById('overview-revenue');
        if (revenueElement && summaryResponse) {
            const rev = summaryResponse?.data?.revenue || summaryResponse?.revenue || 0;
            revenueElement.innerText = api.formatCurrency(rev);
        }

        // 3. Update To Pack Count (Operations)
        const toPackElement = document.getElementById('overview-to-pack');
        if (toPackElement && opsOverview) {
            const opsData = opsOverview?.data || opsOverview || {};
            const shipments = opsData.pending_shipments || 0;
            const productionSteps = opsData.production_steps || [];
            const packaging = productionSteps.find(s => s.production_step === 'packaging')?.total || 0;
            
            toPackElement.innerText = parseInt(packaging) + parseInt(shipments);
        }

        // 4. Update Recent Activity Table
        if (recentActivityResponse) {
            const recentOrders = Array.isArray(recentActivityResponse.data) 
                ? recentActivityResponse.data 
                : (recentActivityResponse || []);
            renderRecentActivity(recentOrders.slice(0, 5));
        }
    } catch (err) {
        console.error("Error loading overview stats:", err);
    }
}

function renderRecentActivity(orders) {
    const tbody = document.querySelector('.admin-panel:last-child tbody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="table-state-cell">No recent activity found.</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const date = new Date(order.placed_at);
        const timeStr = date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const status = order.status || 'pending';
        
        return `
            <tr>
                <td><strong>Order Placed: #${order.order_number || order.id}</strong></td>
                <td>${order.customer_name || 'Customer'}</td>
                <td>${timeStr}</td>
                <td><span class="badge ${getStatusClass(status)}">${status.toUpperCase()}</span></td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    const map = {
        'pending': 'badge-pending',
        'pending_confirmation': 'badge-pending',
        'paid': 'badge-active',
        'confirmed': 'badge-active',
        'shipped': 'badge-shipped',
        'delivered': 'badge-active',
        'cancelled': 'badge-qc'
    };
    return map[status.toLowerCase()] || 'badge-pending';
}

loadStats();
