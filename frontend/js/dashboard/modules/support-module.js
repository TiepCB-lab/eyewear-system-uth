import { supportService } from '../../services/supportService.js';

let allTickets = [];
let currentTicketId = null;
let currentTicketOwnerId = null;
let currentStaffId = null;

const ticketsBody = document.getElementById('supportTicketsBody');
const filterSelect = document.getElementById('support-filter-status');
const panel = document.getElementById('ticketDetailPanel');
const overlay = document.getElementById('ticketPanelOverlay');
const panelTitle = document.getElementById('panelTicketTitle');
const panelMeta = document.getElementById('panelTicketMeta');
const repliesContainer = document.getElementById('panelRepliesContainer');
const replyMessage = document.getElementById('staffReplyMessage');
const replyButton = document.getElementById('sendSupportReplyBtn');

function parseCurrentUser() {
    try {
        const raw = localStorage.getItem('user_info');
        if (!raw) {
            return null;
        }

        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

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

function getConversationState(ticket) {
    const replies = Array.isArray(ticket?.replies) ? ticket.replies : [];
    if (replies.length === 0) {
        return {
            label: 'Awaiting support reply',
            note: 'No staff response has been sent yet.',
            className: 'support-thread-state--waiting'
        };
    }

    const lastReply = replies[replies.length - 1];
    const lastReplyIsStaff = currentStaffId && Number(lastReply?.user_id) === currentStaffId;

    if (lastReplyIsStaff) {
        return {
            label: 'Staff replied',
            note: 'The latest message was sent by staff.',
            className: 'support-thread-state--replied'
        };
    }

    return {
        label: 'Awaiting support reply',
        note: 'Customer has the last message. Staff should respond next.',
        className: 'support-thread-state--waiting'
    };
}

function renderMessageBubble({ title, meta, message, side = 'left', accent = 'customer' }) {
    const positionClass = side === 'right' ? 'support-message--right' : 'support-message--left';
    const bubbleClass = accent === 'staff' ? 'support-message__bubble--staff' : 'support-message__bubble--customer';
    const avatarText = accent === 'staff' ? 'ST' : 'CU';

    return `
        <div class="support-message ${positionClass}">
            <div class="support-message__avatar">${escapeHtml(avatarText)}</div>
            <div class="support-message__body">
                <div class="support-message__meta">
                    <span class="support-message__name">${escapeHtml(title)}</span>
                    <span class="support-message__time">${escapeHtml(meta)}</span>
                </div>
                <div class="support-message__bubble ${bubbleClass}">${escapeHtml(message)}</div>
            </div>
        </div>
    `;
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

    const currentUser = parseCurrentUser();
    currentStaffId = currentUser?.id ? Number(currentUser.id) : null;

    try {
        const response = await supportService.getTicketById(ticketId);
        const ticket = response?.data;
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        currentTicketOwnerId = Number(ticket.user_id || 0) || null;
        const conversationState = getConversationState(ticket);

        panelTitle.textContent = `Ticket #${ticket.id}: ${ticket.subject}`;
        panelMeta.innerHTML = `
            <div class="support-ticket-detail">
                <div class="support-ticket-detail__subject">${escapeHtml(ticket.subject)}</div>
                <div class="support-ticket-detail__meta-row">
                    <span class="badge ${ticket.status === 'open' ? 'badge-pending' : ticket.status === 'in_progress' ? 'badge-qc' : ticket.status === 'resolved' ? 'badge-active' : 'badge-inactive'}">${escapeHtml(ticket.status || 'open')}</span>
                    <span class="support-ticket-detail__dot">•</span>
                    <span>Created ${escapeHtml(formatDateTime(ticket.created_at))}</span>
                    <span class="support-ticket-detail__dot">•</span>
                    <span>Customer #${escapeHtml(ticket.user_id || 'N/A')}</span>
                </div>
                <div class="support-ticket-detail__state ${conversationState.className}">
                    <span class="support-ticket-detail__state-label">${escapeHtml(conversationState.label)}</span>
                    <span class="support-ticket-detail__state-note">${escapeHtml(conversationState.note)}</span>
                </div>
                <div class="support-ticket-detail__label">Original message</div>
                <div class="support-ticket-detail__message">${escapeHtml(ticket.message)}</div>
            </div>
        `;

        const conversation = [];
        conversation.push({
            title: `Customer #${ticket.user_id || 'N/A'}`,
            meta: formatDateTime(ticket.created_at),
            message: ticket.message,
            side: 'left',
            accent: 'customer'
        });

        (ticket.replies || []).forEach((reply) => {
            const isStaffReply = currentStaffId ? Number(reply.user_id) === currentStaffId : false;
            conversation.push({
                title: isStaffReply ? 'Staff' : `Customer #${ticket.user_id || 'N/A'}`,
                meta: formatDateTime(reply.created_at),
                message: reply.message,
                side: isStaffReply ? 'right' : 'left',
                accent: isStaffReply ? 'staff' : 'customer'
            });
        });

        repliesContainer.innerHTML = conversation.length
            ? conversation.map((item) => renderMessageBubble(item)).join('')
            : '<p class="support-empty-note">No replies yet. Be the first to respond!</p>';
    } catch (err) {
        panelMeta.innerHTML = `<span class="support-ticket-error">Error: ${escapeHtml(err.message)}</span>`;
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
