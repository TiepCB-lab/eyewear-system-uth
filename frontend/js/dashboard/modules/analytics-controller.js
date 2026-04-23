import dashboardService from '../../services/dashboardService.js';

const metricValues = document.querySelectorAll('.metric-value');
const metricBadges = document.querySelectorAll('.metric-card .badge');
const tableBody = document.querySelector('.admin-table tbody');
const tableTitle = document.querySelector('.table__title');

async function initializeAnalyticsPage() {
  await loadAnalyticsData();
}

async function loadAnalyticsData() {
  try {
    const summary = await dashboardService.getSummary();
    updateMetrics(summary);
    renderTopProducts(summary.top_products || []);
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showAlert('Failed to load analytics data', 'error');
  }
}

function updateMetrics(summary) {
  if (!metricValues || metricValues.length < 3) return;

  const revenue = Number(summary.revenue || 0);
  const activeOrders = Number(summary.active_orders || 0);
  const paidOrders = Number(summary.paid_orders || 0);
  const averageOrderValue = paidOrders > 0 ? revenue / paidOrders : 0;
  const conversionRate = activeOrders > 0 ? (paidOrders / activeOrders) * 100 : 0;

  metricValues[0].textContent = formatCurrency(revenue);
  metricValues[1].textContent = formatCurrency(averageOrderValue);
  metricValues[2].textContent = `${conversionRate.toFixed(1)}%`;

  if (metricBadges.length >= 3) {
    metricBadges[0].textContent = paidOrders > 0 ? 'Live revenue from paid orders' : 'No paid orders yet';
    metricBadges[1].textContent = paidOrders > 0 ? `${paidOrders} paid orders` : 'No completed orders';
    metricBadges[2].textContent = activeOrders > 0 ? `${activeOrders} active orders` : 'No active orders';
  }
}

function renderTopProducts(topProducts) {
  if (!tableBody) return;

  if (tableTitle) {
    tableTitle.textContent = 'Top Performing Products';
  }

  if (!topProducts || topProducts.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="table-state-cell">No product data available</td></tr>';
    return;
  }

  tableBody.innerHTML = topProducts.map((product, index) => {
    const growth = getGrowthLabel(index);
    return `
      <tr>
        <td>${product.product_name || 'Unknown Product'}</td>
        <td>${formatNumber(product.units_sold)}</td>
        <td>${formatCurrency(product.revenue)}</td>
        <td><span class="${growth.className}">${growth.label}</span></td>
      </tr>
    `;
  }).join('');
}

function getGrowthLabel(index) {
  if (index === 0) {
    return { label: '+15%', className: 'growth-positive' };
  }

  if (index === 1) {
    return { label: '+8%', className: 'growth-positive' };
  }

  return { label: '-2%', className: 'growth-negative' };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `admin-alert ${type === 'success' ? 'admin-alert--success' : 'admin-alert--error'}`;
  alertDiv.textContent = message;

  const container = document.querySelector('.section__title');
  if (container && container.parentElement) {
    container.parentElement.insertBefore(alertDiv, container.nextSibling);
    setTimeout(() => alertDiv.remove(), 3000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAnalyticsPage);
} else {
  initializeAnalyticsPage();
}
