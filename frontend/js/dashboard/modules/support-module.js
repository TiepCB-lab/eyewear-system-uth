import { supportService } from '../../services/supportService.js';

let allTickets = [];
let currentTicketId = null;

const ticketsBody = document.getElementById('supportTicketsBody');
const filterSelect = document.getElementById('support-filter-status');
const panel = document.getElementById('ticketDetailPanel');
const overlay = document.getElementById('ticketPanelOverlay');
const panelTitle = document.getElementById('panelTicketTitle');
const panelMeta = document.getElementById('panelTicketMeta');
const repliesContainer = document.getElementById('panelRepliesContainer');
const replyMessage = document.getElementById('staffReplyMessage');
const replyButton = document.getElementById('sendSupportReplyBtn');

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

function escapeHtml(value) {
    if (!value) {
        return '';
    }

    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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
                <td><button type="button" class="btn btn--sm support-ticket-open-btn" data-ticket-id="${ticket.id}">View / Reply</button></td>
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

async function openTicketPanel(ticketId) {
    currentTicketId = ticketId;
    panel.hidden = false;
    overlay.hidden = false;
    panelTitle.textContent = `Ticket #${ticketId}`;
    panelMeta.innerHTML = '<em>Loading details...</em>';
    repliesContainer.innerHTML = '<em class="support-empty-note">Loading replies...</em>';

    try {
        const response = await supportService.getTicketById(ticketId);
        const ticket = response?.data;
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        panelTitle.textContent = `Ticket #${ticket.id}: ${ticket.subject}`;
        panelMeta.innerHTML = `
            <p><strong>Status:</strong> ${getStatusBadge(ticket.status)}</p>
            <p><strong>Priority:</strong> ${getPriorityBadge(ticket.priority)}</p>
            <p><strong>User #${ticket.user_id || 'N/A'}</strong> â€” ${ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '-'}</p>
            <p class="support-ticket-summary">${escapeHtml(ticket.message)}</p>
        `;

        const replies = ticket.replies || [];
        if (!replies.length) {
            repliesContainer.innerHTML = '<p class="support-empty-note">No replies yet. Be the first to respond!</p>';
            return;
        }

        repliesContainer.innerHTML = replies.map((reply) => `
            <div class="support-reply-card">
                <small class="support-reply-card__meta">${reply.created_at ? new Date(reply.created_at).toLocaleString() : ''} â€” User #${reply.user_id}</small>
                <p>${escapeHtml(reply.message)}</p>
            </div>
        `).join('');
    } catch (err) {
        panelMeta.innerHTML = `<span class="support-ticket-error">Error: ${err.message}</span>`;
    }
}

function closeSupportPanel() {
    panel.hidden = true;
    overlay.hidden = true;
    if (replyMessage) {
        replyMessage.value = '';
    }
    currentTicketId = null;
}

async function sendSupportReply() {
    if (!currentTicketId || !replyMessage || !replyButton) {
        return;
    }

    const message = replyMessage.value.trim();
    if (!message) {
        alert('Please enter a reply message.');
        return;
    }

    replyButton.disabled = true;
    replyButton.textContent = 'Sending...';

    try {
        await supportService.replyTicket(currentTicketId, message);
        replyMessage.value = '';
        await openTicketPanel(currentTicketId);
        loadSupportTickets();
    } catch (err) {
        alert('Failed to send reply: ' + (err.response?.data?.error || err.message));
    } finally {
        replyButton.disabled = false;
        replyButton.textContent = 'Send Reply';
    }
}

async function updateSupportStatus(newStatus) {
    if (!currentTicketId) {
        return;
    }

    if (!confirm(`Update ticket status to "${newStatus}"?`)) {
        return;
    }

    try {
        await supportService.updateTicketStatus(currentTicketId, newStatus);
        alert(`Ticket status updated to "${newStatus}"`);
        await openTicketPanel(currentTicketId);
        loadSupportTickets();
    } catch (err) {
        alert('Failed to update status: ' + (err.response?.data?.error || err.message));
    }
}

filterSelect?.addEventListener('change', () => renderTickets(allTickets));

document.addEventListener('click', async (event) => {
    const refreshButton = event.target.closest('#reloadSupportTicketsBtn');
    if (refreshButton) {
        loadSupportTickets();
        return;
    }

    const openButton = event.target.closest('.support-ticket-open-btn');
    if (openButton) {
        await openTicketPanel(Number(openButton.dataset.ticketId));
        return;
    }

    const closeButton = event.target.closest('[data-action="close-support-panel"]');
    if (closeButton) {
        closeSupportPanel();
        return;
    }

    const statusButton = event.target.closest('[data-support-status]');
    if (statusButton) {
        await updateSupportStatus(statusButton.dataset.supportStatus);
        return;
    }

    const sendButton = event.target.closest('#sendSupportReplyBtn');
    if (sendButton) {
        await sendSupportReply();
    }
});

loadSupportTickets();
