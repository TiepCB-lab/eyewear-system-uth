import { supportService } from '../services/supportService.js';

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

const ticketId = getQueryParam('id');
const ticketDetailDiv = document.getElementById('ticketDetail');
const repliesDiv = document.getElementById('replies');
const threadNotice = document.getElementById('threadNotice');
const replyForm = document.getElementById('replyForm');
const replySuccess = document.getElementById('replySuccess');
const replyError = document.getElementById('replyError');
const currentUserId = Number(localStorage.getItem('user_id') || 0);
let pollTimer = null;
let lastTicketSignature = '';

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

function getInitials(name) {
    const safeName = String(name || '').trim();
    if (!safeName) return '?';

    const parts = safeName.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || parts[0]?.[1] || '';
    return `${first}${second}`.toUpperCase();
}

function renderMessageBubble({ title, meta, message, side = 'left', accent = 'support' }) {
    const positionClass = side === 'right' ? 'support-message--right' : 'support-message--left';
    const bubbleClass = accent === 'you' ? 'support-message__bubble--you' : 'support-message__bubble--support';
    const avatarText = accent === 'you' ? 'You' : 'EV';

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

function scrollThreadToBottom() {
    if (!repliesDiv) {
        return;
    }

    window.requestAnimationFrame(() => {
        repliesDiv.scrollTop = repliesDiv.scrollHeight;
    });
}

function showThreadNotice(message) {
    if (!threadNotice) {
        return;
    }

    threadNotice.textContent = message;
    threadNotice.hidden = false;

    window.clearTimeout(showThreadNotice._timer);
    showThreadNotice._timer = window.setTimeout(() => {
        threadNotice.hidden = true;
    }, 2500);
}

function getTicketSignature(ticket) {
    const replies = Array.isArray(ticket?.replies) ? ticket.replies : [];
    const lastReply = replies[replies.length - 1] || {};

    return [
        ticket?.status || '',
        ticket?.updated_at || '',
        replies.length,
        lastReply.id || '',
        lastReply.created_at || ''
    ].join('|');
}

function getConversationState(ticket) {
    const replies = Array.isArray(ticket?.replies) ? ticket.replies : [];
    if (replies.length === 0) {
        return {
            label: 'Awaiting support reply',
            note: 'No support agent has replied yet.',
            className: 'support-state--waiting'
        };
    }

    const lastReply = replies[replies.length - 1];
    const lastReplyIsCustomer = Number(lastReply?.user_id) === currentUserId || Number(lastReply?.user_id) === Number(ticket?.user_id);

    if (lastReplyIsCustomer) {
        return {
            label: 'Awaiting support reply',
            note: 'You already sent a message. Support has not replied to the latest update yet.',
            className: 'support-state--waiting'
        };
    }

    return {
        label: 'Support replied',
        note: 'A support agent has responded to this ticket.',
        className: 'support-state--replied'
    };
}

async function loadTicketDetail(options = {}) {
    const { notifyNewReply = false } = options;

    try {
        if (!ticketId) {
            ticketDetailDiv.innerHTML = '<div class="support-ticket-error">Ticket ID is missing.</div>';
            repliesDiv.innerHTML = '<div class="support-empty-note">No conversation available.</div>';
            if (replyForm) replyForm.hidden = true;
            return;
        }

        const response = await supportService.getTicketById(ticketId);
        const ticket = response.data;
        lastTicketSignature = getTicketSignature(ticket);
        const conversationState = getConversationState(ticket);

        ticketDetailDiv.innerHTML = `
            <div class="support-ticket-detail">
                <div class="support-ticket-detail__subject">${escapeHtml(ticket.subject)}</div>
                <div class="support-ticket-detail__meta-row">
                    <span class="badge">${escapeHtml(ticket.status || 'open')}</span>
                    <span class="support-ticket-detail__dot">•</span>
                    <span>Created ${escapeHtml(formatDateTime(ticket.created_at))}</span>
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
            title: 'You',
            meta: formatDateTime(ticket.created_at),
            message: ticket.message,
            side: 'right',
            accent: 'you'
        });

        (ticket.replies || []).forEach((reply) => {
            const isCustomerReply = Number(reply.user_id) === currentUserId || Number(reply.user_id) === Number(ticket.user_id);
            conversation.push({
                title: isCustomerReply ? 'You' : 'Support Team',
                meta: formatDateTime(reply.created_at),
                message: reply.message,
                side: isCustomerReply ? 'right' : 'left',
                accent: isCustomerReply ? 'you' : 'support'
            });
        });

        let repliesHtml = '';
        if (conversation.length > 0) {
            repliesHtml = conversation.map((item) => renderMessageBubble(item)).join('');
        } else {
            repliesHtml = '<div class="support-empty-note">No messages yet.</div>';
        }

        repliesDiv.innerHTML = repliesHtml;
        scrollThreadToBottom();

        if (notifyNewReply) {
            showThreadNotice('New reply loaded');
        }
    } catch (err) {
        ticketDetailDiv.innerHTML = '<div class="support-ticket-error">Ticket not found.</div>';
        repliesDiv.innerHTML = '<div class="support-empty-note">Unable to load conversation.</div>';
    }
}

async function refreshTicketIfChanged() {
    if (!ticketId) {
        return;
    }

    try {
        const response = await supportService.getTicketById(ticketId);
        const ticket = response.data;
        const signature = getTicketSignature(ticket);

        if (signature !== lastTicketSignature) {
            await loadTicketDetail({ notifyNewReply: true });
        }
    } catch (error) {
        console.error('Support detail polling error:', error);
    }
}

function startPolling() {
    if (pollTimer || !ticketId) {
        return;
    }

    pollTimer = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
            refreshTicketIfChanged();
        }
    }, 5000);
}

function stopPolling() {
    if (pollTimer) {
        window.clearInterval(pollTimer);
        pollTimer = null;
    }
}

replyForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (replySuccess) {
        replySuccess.hidden = true;
    }

    if (replyError) {
        replyError.hidden = true;
    }

    const message = replyForm.replyMessage.value.trim();
    if (!message) {
        return;
    }

    try {
        await supportService.replyTicket(ticketId, message);
        if (replySuccess) {
            replySuccess.hidden = false;
        }
        replyForm.reset();
        await loadTicketDetail();
        showThreadNotice('Reply sent');
    } catch (err) {
        if (replyError) {
            replyError.textContent = err?.response?.data?.error || 'Failed to send reply.';
            replyError.hidden = false;
        }
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        refreshTicketIfChanged();
    }
});

window.addEventListener('beforeunload', stopPolling);

loadTicketDetail().finally(startPolling);
