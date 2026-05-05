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
        <td class="ops-table__cell" data-label="Customer">
            <div class="flex-column">
                <span class="ops-table__cell--strong">${order.customer_name || 'Guest User'}</span>
                <span style="font-size: 11px; color: #475569;"><i class="fi fi-rs-phone-call"></i> ${order.customer_phone || 'N/A'}</span>
                <p style="font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.3; max-width: 180px;">
                    <i class="fi fi-rs-marker"></i> ${order.shipping_address || 'No address provided'}
                </p>
            </div>
        </td>
        <td class="ops-table__cell" data-label="Production Details">
            <div class="flex-column" title="${order.items_summary || ''}">
                <span class="ops-table__cell--strong" style="font-size: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2;">
                    ${order.items_summary || 'Order Items'}
                </span>
                ${Number(order.lab_count) > 0 
                  ? `<span style="font-size: 10px; color: #e11d48; font-weight: 700; margin-top: 4px;"><i class="fi fi-rs-beaker"></i> RX LAB REQUIRED</span>` 
                  : `<span style="font-size: 10px; color: #10b981; font-weight: 700; margin-top: 4px;"><i class="fi fi-rs-box-open"></i> READY STOCK</span>`}
            </div>
        </td>
        <td class="ops-table__cell" data-label="Step">
            <div class="production-step-badge">
                <i class="fi ${stepIcon}"></i> ${stepLabel}
            </div>
        </td>
        <td class="ops-table__cell" data-label="Progress"><span class="status-pill ${status.class}">${status.label}</span></td>
        <td class="ops-table__cell" data-label="Action">
          ${['shipped', 'shipping', 'delivered'].includes((order.status || '').toLowerCase())
            ? `<span class="status-pill status-done">Shipped</span>`
            : (!order.verified_by && ['pending', 'paid'].includes((order.status || '').toLowerCase()))
              ? `<div class="status-pill status-wait" style="font-size: 10px; opacity: 0.8;"><i class="fi fi-rs-time-clock"></i> Waiting for Sales</div>`
              : (order.production_step === 'ready_to_ship'
                  ? (order.shipment_id
                      ? `<button type="button" class="btn btn--sm btn--outline ops-table__action" onclick="window.handleOpsAction(this, ${order.id}, 'update', ${order.shipment_id})">
                           <i class="fi fi-rs-edit"></i> Update
                         </button>`
                      : `<button type="button" class="btn btn--sm btn--outline ops-table__action" onclick="window.handleOpsAction(this, ${order.id}, 'ship')">
                           <i class="fi fi-rs-paper-plane"></i> Ship
                         </button>`)
                  : `<button type="button" class="btn btn--sm ops-table__action" onclick="window.handleOpsAction(this, ${order.id}, 'advance')">
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
  if (!step) return 'fi-rs-time-clock';
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
  if (!step) return 'Pending Verification';
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

  // Global handler for inline onclicks
  window.handleOpsAction = async (btn, orderId, action, shipmentId = 0) => {
    if (action === 'ship') {
      await handleShipAction(orderId);
    } else if (action === 'update') {
      await handleUpdateShipment(orderId, shipmentId);
    } else {
      await advanceStep(orderId);
    }
  };
}

async function handleShipAction(orderId) {
    if (!window.EvelensNotify) {
        const tracking = prompt("Enter Tracking Number:");
        if (tracking === null) return;
        return executeShipment(orderId, tracking);
    }

    await window.EvelensNotify.confirm(
        'Confirm Shipment',
        'Are you sure you want to mark this order as Shipped? A tracking number will be generated automatically.',
        async () => {
            await executeShipment(orderId);
        },
        'Ship Now',
        'Cancel'
    );
}

async function executeShipment(orderId, trackingNumber = null) {
    try {
        await dashboardService.createShipment({
            order_id: orderId,
            tracking_number: trackingNumber || 'TRK-' + Date.now(),
            courier: 'GHTK',
            shipping_status: 'shipping'
        });
        showAlert('Order marked as Shipped!', 'success');
        await loadOperationsData();
    } catch (error) {
        const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Unknown error';
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
  const notify = window.Notification;
  if (notify && typeof notify.show === 'function') {
      notify.show(message, type);
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
