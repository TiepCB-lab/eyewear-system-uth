import { supportService } from '../../services/supportService.js';

let allTickets = [];

const ticketsBody = document.getElementById('supportTicketsBody');
const filterSelect = document.getElementById('support-filter-status');

function formatDateTime(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function updateMetrics(tickets) {
    const openCount = tickets.filter((ticket) => ticket.status === 'open').length;
    const inProgressCount = tickets.filter((ticket) => ticket.status === 'in_progress').length;
    const resolvedCount = tickets.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed').length;

    const openEl = document.getElementById('support-open-count');
    const inProgressEl = document.getElementById('support-inprogress-count');
    const resolvedEl = document.getElementById('support-resolved-count');

    if (openEl) openEl.textContent = openCount;
    if (inProgressEl) inProgressEl.textContent = inProgressCount;
    if (resolvedEl) resolvedEl.textContent = resolvedCount;
}

function getStatusBadge(status) {
    const map = {
        open: { cls: 'badge-pending', label: 'Open' },
        in_progress: { cls: 'badge-qc', label: 'In Progress' },
        resolved: { cls: 'badge-active', label: 'Resolved' },
        closed: { cls: 'badge-inactive', label: 'Closed' },
    };

    const current = map[status] || { cls: 'badge-pending', label: status };
    return `<span class="badge ${current.cls}">${current.label}</span>`;
}

function getPriorityBadge(priority) {
    const map = {
        low: { cls: 'badge-active', label: 'Low' },
        medium: { cls: 'badge-qc', label: 'Medium' },
        high: { cls: 'badge-pending', label: 'High' },
        urgent: { cls: 'badge-inactive', label: 'Urgent' },
    };

    const current = map[priority] || { cls: 'badge-qc', label: priority || 'Medium' };
    return `<span class="badge ${current.cls}">${current.label}</span>`;
}

function renderTickets(tickets) {
    const filterStatus = filterSelect?.value || '';
    const filtered = filterStatus ? tickets.filter((ticket) => ticket.status === filterStatus) : tickets;

    if (!filtered.length) {
        ticketsBody.innerHTML = `<tr><td colspan="7" class="table-state-cell">${filterStatus ? 'No tickets with this status.' : 'No open support tickets. All clear! âœ“'}</td></tr>`;
        return;
    }

    ticketsBody.innerHTML = filtered.map((ticket) => {
        const created = ticket.created_at
            ? new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-';

        return `
            <tr>
                <td><strong>#${ticket.id}</strong></td>
                <td>${ticket.user_id ? `User #${ticket.user_id}` : 'N/A'}</td>
                <td>
                    <strong>${escapeHtml(ticket.subject)}</strong><br>
                    <small class="support-message-preview">${escapeHtml((ticket.message || '').substring(0, 60))}${(ticket.message || '').length > 60 ? '...' : ''}</small>
                </td>
                <td>${getStatusBadge(ticket.status)}</td>
                <td>${getPriorityBadge(ticket.priority)}</td>
                <td>${created}</td>
                <td><a class="btn btn--sm support-ticket-open-btn" href="support-detail/index.html?id=${ticket.id}">View / Reply</a></td>
            </tr>
        `;
    }).join('');
}

async function loadSupportTickets() {
    ticketsBody.innerHTML = '<tr><td colspan="7" class="table-state-cell">Loading tickets...</td></tr>';

    try {
        const response = await supportService.getTickets(true);
        allTickets = response?.data || [];
        updateMetrics(allTickets);
        renderTickets(allTickets);
    } catch (err) {
        console.error('Support load error:', err);
        ticketsBody.innerHTML = '<tr><td colspan="7" class="table-state-cell table-state-cell--error">Failed to load tickets. Please check API connection.</td></tr>';
    }
}

filterSelect?.addEventListener('change', () => renderTickets(allTickets));

document.addEventListener('click', (event) => {
    const refreshButton = event.target.closest('#reloadSupportTicketsBtn');
    if (refreshButton) {
        loadSupportTickets();
    }
});

loadSupportTickets();
