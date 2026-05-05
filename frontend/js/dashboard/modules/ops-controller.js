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
    const [queueResponse, overviewResponse] = await Promise.all([
      dashboardService.getProductionQueue(),
      dashboardService.getOperationsOverview()
    ]);

    const queueData = queueResponse?.data || queueResponse || [];
    const overviewData = overviewResponse?.data || overviewResponse || {};

    productionQueue = Array.isArray(queueData) ? queueData : (queueData.data || queueData.queue || []);
    
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

  const productionSteps = overviewData.production_steps || [];
  const shipmentStatuses = overviewData.shipment_statuses || [];

  // Calculate KPI values from overview data
  const ordersInLab = productionSteps.reduce((acc, curr) => acc + (parseInt(curr.total) || 0), 0);
  const shippedToday = shipmentStatuses.find(s => s.shipping_status === 'shipping')?.total || 0;
  const pendingQC = productionSteps.find(s => s.production_step === 'qc_inspection')?.total || 0;
  
  // Use real turnaround data from API
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
    queueTableBody.innerHTML = '<tr><td colspan="5" class="table-state-cell">No orders in production queue</td></tr>';
    return;
  }

  queueTableBody.innerHTML = queue.map((order) => {
    const stepLabel = formatProductionStep(order.production_step);
    const status = getStatusPill(order.production_step);
    const stepIcon = getStepIcon(order.production_step);

    return `
      <tr class="ops-table__row">
        <td class="ops-table__cell ops-table__cell--strong" data-label="Order">
            <div class="flex-column">
                <strong>#${order.order_number || order.id}</strong>
                <span style="font-size: 10px; color: #888;">${new Date(order.placed_at || Date.now()).toLocaleDateString()}</span>
            </div>
        </td>
        <td class="ops-table__cell" data-label="Details">
            <div class="flex-column">
                <span>${order.customer_name || 'Customer'}</span>
                <span style="font-size: 11px; color: var(--first-color); font-weight: 600;">${order.lens_name || 'Standard Lens'}</span>
            </div>
        </td>
        <td class="ops-table__cell" data-label="Step">
            <div class="production-step-badge">
                <i class="fi ${stepIcon}"></i> ${stepLabel}
            </div>
        </td>
        <td class="ops-table__cell" data-label="Progress"><span class="status-pill ${status.class}">${status.label}</span></td>
        <td class="ops-table__cell" data-label="Action">
          ${order.status === 'shipped' || order.status === 'shipping'
            ? `<span class="status-pill status-done">Shipped</span>`
            : (!order.verified_by && ['pending', 'paid'].includes((order.status || '').toLowerCase()))
              ? `<div class="status-pill status-wait" style="font-size: 10px; opacity: 0.8;"><i class="fi fi-rs-time-clock"></i> Waiting for Sales</div>`
              : (order.production_step === 'ready_to_ship'
                  ? (order.shipment_id
                      ? `<button type="button" class="btn btn--sm btn--outline ops-table__action" data-order-id="${order.id}" data-shipment-id="${order.shipment_id}" data-action="update">
                           <i class="fi fi-rs-edit"></i> Update
                         </button>`
                      : `<button type="button" class="btn btn--sm btn--outline ops-table__action" data-order-id="${order.id}" data-action="ship">
                           <i class="fi fi-rs-paper-plane"></i> Ship
                         </button>`)
                  : `<button type="button" class="btn btn--sm ops-table__action" data-order-id="${order.id}" data-action="advance">
                       Next Step <i class="fi fi-rs-angle-small-right"></i>
                     </button>`)
          }
        </td>
      </tr>
    `;
  }).join('');
}

function getStepIcon(step) {
  const iconMap = {
    'lens_cutting': 'fi-rs-scissors',
    'frame_mounting': 'fi-rs-settings',
    'qc_inspection': 'fi-rs-search',
    'packaging': 'fi-rs-box-alt',
    'ready_to_ship': 'fi-rs-truck-side'
  };
  return iconMap[step] || 'fi-rs-settings';
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

  document.addEventListener('click', async (event) => {
    const advanceButton = event.target.closest('.ops-table__action');
    if (!advanceButton) {
      return;
    }

    const orderId = Number(advanceButton.dataset.orderId);
    const shipmentId = Number(advanceButton.dataset.shipmentId || 0);
    const action = advanceButton.dataset.action;

    if (action === 'ship') {
      await handleShipAction(orderId);
    } else if (action === 'update') {
      await handleUpdateShipment(orderId, shipmentId);
    } else {
      await advanceStep(orderId);
    }
  });
}

async function handleShipAction(orderId) {
    const trackingNumber = prompt("Enter Tracking Number (e.g., GHTK123456):");
    if (trackingNumber === null) return; // User cancelled

    try {
        await dashboardService.createShipment({
            order_id: orderId,
            tracking_number: trackingNumber || 'SHIP-' + Date.now(),
        courier: 'GHTK',
        shipping_status: 'shipping'
        });
        showAlert('Order marked as Shipped!', 'success');
        await loadOperationsData();
    } catch (error) {
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unknown error';
      console.error('Error creating shipment:', error?.response || error);
      showAlert('Failed to create shipment: ' + serverMsg, 'error');
    }
}

  async function handleUpdateShipment(orderId, shipmentId) {
    const trackingNumber = prompt("Update Tracking Number (leave blank to keep):");
    if (trackingNumber === null) return;

    try {
      const payload = {
        shipment_id: shipmentId,
        courier: 'GHTK',
        shipping_status: 'shipping'
      };

      if (trackingNumber && trackingNumber.trim() !== '') {
        payload.tracking_number = trackingNumber.trim();
      }

      await dashboardService.updateShipment(payload);
      showAlert('Shipment updated successfully', 'success');
      await loadOperationsData();
    } catch (error) {
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unknown error';
      console.error('Error updating shipment:', error?.response || error);
      showAlert('Failed to update shipment: ' + serverMsg, 'error');
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
  if (window.Notification) {
      window.Notification.show(message, type);
      return;
  }

  const alertDiv = document.createElement('div');
  alertDiv.className = `admin-alert ${type === 'success' ? 'admin-alert--success' : 'admin-alert--error'}`;
  alertDiv.textContent = message;
  
  const container = document.querySelector('.ops-topbar');
  if (container) {
    container.parentElement.insertBefore(alertDiv, container);
    setTimeout(() => alertDiv.remove(), 3000);
  } else {
    alert(message);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOpsPage);
} else {
  initializeOpsPage();
}
