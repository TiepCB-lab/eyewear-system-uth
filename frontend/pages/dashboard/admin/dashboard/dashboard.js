import adminService from '../../../../js/services/adminService.js';
import dashboardService from '../../../../js/services/dashboardService.js';

const totalRevenueEl = document.getElementById('totalRevenue');
const revenueChangeEl = document.getElementById('revenueChange');
const activeOrdersEl = document.getElementById('activeOrders');
const pendingOrdersEl = document.getElementById('pendingOrders');
const paidOrdersEl = document.getElementById('paidOrders');
const topProductsTable = document.getElementById('topProductsTable');
const staffList = document.getElementById('staffList');

async function initializeDashboard() {
  try {
    await loadDashboardSummary();
    await loadStaffOverview();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
}

async function loadDashboardSummary() {
  try {
    const response = await dashboardService.getSummary();
    const data = response.data || response;

    if (totalRevenueEl) {
      totalRevenueEl.textContent = `$${parseFloat(data.revenue || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if (revenueChangeEl) {
      revenueChangeEl.textContent = 'Updated in real-time';
      revenueChangeEl.style.color = '#28a745';
    }

    if (activeOrdersEl) {
      activeOrdersEl.textContent = data.active_orders || 0;
    }

    if (pendingOrdersEl) {
      const pending = Math.floor((data.active_orders || 0) * 0.15);
      pendingOrdersEl.textContent = `${pending} pending production steps`;
    }

    if (paidOrdersEl) {
      paidOrdersEl.textContent = data.paid_orders || 0;
    }

    loadTopProducts(data.top_products || []);
  } catch (error) {
    console.error('Error loading dashboard summary:', error);
    if (totalRevenueEl) totalRevenueEl.textContent = 'Error loading';
  }
}

function loadTopProducts(topProducts) {
  try {
    if (!topProductsTable) return;

    topProductsTable.innerHTML = '';

    if (!topProducts || topProducts.length === 0) {
      topProductsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No products found</td></tr>';
      return;
    }

    topProducts.forEach((product) => {
      const row = document.createElement('tr');
      const revenue = parseFloat(product.revenue || 0);
      const quantity = parseInt(product.units_sold || 0);

      row.innerHTML = `
        <td>${product.product_name || 'Unknown'}</td>
        <td>${quantity}</td>
        <td>$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>
          <span class="badge ${quantity > 100 ? 'badge-shipped' : 'badge-pending'}"
                style="background:${quantity > 100 ? '#d4edda' : '#fff3cd'}; color:${quantity > 100 ? '#155724' : '#856404'};">
            ${quantity > 100 ? 'In Stock' : 'Low Stock'}
          </span>
        </td>
      `;

      topProductsTable.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading top products:', error);
    if (topProductsTable) {
      topProductsTable.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Error loading products</td></tr>';
    }
  }
}

async function loadStaffOverview() {
  try {
    if (!staffList) return;

    const response = await adminService.getStaffList({ status: 'active' });
    const staff = Array.isArray(response) ? response : response.data || [];

    staffList.innerHTML = '';

    if (!staff || staff.length === 0) {
      staffList.innerHTML = '<li style="text-align: center; padding: 2rem;">No active staff found</li>';
      return;
    }

    staff.slice(0, 5).forEach((member) => {
      const li = document.createElement('li');
      li.style.marginBottom = '1rem';
      li.innerHTML = `
        <strong>#${member.id}:</strong> ${member.full_name}
        <span style="color: #666; font-size: 0.85rem;">(${member.role_name || 'No role'})</span>
      `;
      staffList.appendChild(li);
    });

    if (staff.length > 5) {
      const viewAllLi = document.createElement('li');
      viewAllLi.style.marginTop = '1rem';
      viewAllLi.innerHTML = '<a href="../users/" style="color: var(--first-color); font-weight: bold;">View all staff members</a>';
      staffList.appendChild(viewAllLi);
    }
  } catch (error) {
    console.error('Error loading staff overview:', error);
    if (staffList) {
      staffList.innerHTML = '<li style="text-align: center; padding: 2rem;">Error loading staff</li>';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}
