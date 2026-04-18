import dashboardService from '../../services/dashboardService.js';

// DOM Elements
const kpiValues = document.querySelectorAll('.kpi-value');
const queueTableBody = document.querySelector('.queue-table tbody');

let productionQueue = [];

async function initializeOpsPage() {
  await loadOperationsData();
  setupEventListeners();
}

async function loadOperationsData() {
  try {
    // Load production queue and operations overview
    const [queueData, overviewData] = await Promise.all([
      dashboardService.getProductionQueue(),
      dashboardService.getOperationsOverview()
    ]);

    productionQueue = Array.isArray(queueData) ? queueData : queueData.queue || [];
    
    // Update KPI values from overview
    if (overviewData) {
      updateKPIs(overviewData);
    }

    // Update production queue table
    renderQueueTable(productionQueue);
  } catch (error) {
    console.error('Error loading operations data:', error);
    showAlert('Failed to load operations data', 'error');
  }
}

function updateKPIs(overviewData) {
  if (!kpiValues || kpiValues.length < 4) return;

  // Calculate KPI values from overview data
  const ordersInLab = overviewData.total_in_production || 0;
  const shippedToday = overviewData.shipped_today || 0;
  const pendingQC = overviewData.pending_qc || 0;
  const avgTurnaround = overviewData.avg_turnaround_hours || 0;

  // Update KPI display values
  kpiValues[0].textContent = ordersInLab;
  kpiValues[1].textContent = shippedToday;
  kpiValues[2].textContent = pendingQC;
  kpiValues[3].textContent = avgTurnaround.toFixed(1) + 'h';
}

function renderQueueTable(queue) {
  if (!queueTableBody) return;

  if (!queue || queue.length === 0) {
    queueTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No orders in production queue</td></tr>';
    return;
  }

  queueTableBody.innerHTML = queue.map((order) => {
    const stepLabel = formatProductionStep(order.production_step);
    const status = getStatusPill(order.production_step);

    return `
      <tr style="border-bottom: 1px solid var(--border-color-alt);">
        <td style="padding: 15px 10px; font-weight: 700;">#${order.id}</td>
        <td style="padding: 15px 10px;">${order.customer_name || 'Unknown'}</td>
        <td style="padding: 15px 10px;">${stepLabel}</td>
        <td style="padding: 15px 10px;"><span class="status-pill ${status.class}">${status.label}</span></td>
        <td style="padding: 15px 10px;">
          <button class="btn btn--sm" style="padding: 8px 12px; font-size: 0.7rem;" onclick="advanceStep(${order.id})">
            Advance
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function formatProductionStep(step) {
  const stepMap = {
    'lens_cutting': 'Lens Cutting',
    'frame_mounting': 'Frame Mounting',
    'qc_inspection': 'QC Inspection',
    'packaging': 'Packaging',
    'ready_to_ship': 'Ready to Ship'
  };
  return stepMap[step] || step;
}

function getStatusPill(step) {
  const statusMap = {
    'lens_cutting': { class: 'status-progress', label: 'In Progress' },
    'frame_mounting': { class: 'status-progress', label: 'In Progress' },
    'qc_inspection': { class: 'status-wait', label: 'Waiting' },
    'packaging': { class: 'status-progress', label: 'In Progress' },
    'ready_to_ship': { class: 'status-done', label: 'Ready' }
  };
  return statusMap[step] || { class: 'status-wait', label: 'Pending' };
}

function setupEventListeners() {
  // Sync button
  const syncButton = document.querySelector('.topbar-actions .btn');
  if (syncButton) {
    syncButton.addEventListener('click', () => {
      loadOperationsData();
    });
  }
}

async function advanceStep(orderId) {
  try {
    await dashboardService.advanceProduction(orderId);
    showAlert('Production step advanced successfully', 'success');
    await loadOperationsData();
  } catch (error) {
    console.error('Error advancing production step:', error);
    showAlert('Failed to advance production step', 'error');
  }
}

function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 8px;
    background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
    color: ${type === 'success' ? '#065f46' : '#991b1b'};
    border: 1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'};
  `;
  
  const container = document.querySelector('.ops-topbar');
  if (container) {
    container.parentElement.insertBefore(alertDiv, container);
    setTimeout(() => alertDiv.remove(), 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOpsPage);
} else {
  initializeOpsPage();
}
