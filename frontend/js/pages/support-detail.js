import { supportService } from '../services/supportService.js';

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

const ticketId = getQueryParam('id');
const ticketDetailDiv = document.getElementById('ticketDetail');
const repliesDiv = document.getElementById('replies');
const replyForm = document.getElementById('replyForm');
const replySuccess = document.getElementById('replySuccess');
const replyError = document.getElementById('replyError');

async function loadTicketDetail() {
    try {
        const response = await supportService.getTicketById(ticketId);
        const ticket = response.data;

        ticketDetailDiv.innerHTML = `
            <div class="support-ticket-detail">
                <div><b>Chá»§ Ä‘á»:</b> ${ticket.subject}</div>
                <div><b>Tráº¡ng thÃ¡i:</b> ${ticket.status}</div>
                <div><b>NgÃ y táº¡o:</b> ${ticket.created_at}</div>
                <div><b>Ná»™i dung:</b> <br>${ticket.message}</div>
            </div>
        `;

        let repliesHtml = '<h3 class="support-replies-title">Lá»‹ch sá»­ trao Ä‘á»•i</h3>';
        if (ticket.replies && ticket.replies.length > 0) {
            repliesHtml += ticket.replies.map((reply) => `
                <div class="support-reply-item">
                    <div><b>NgÆ°á»i gá»­i:</b> ${reply.user_id}</div>
                    <div><b>Thá»i gian:</b> ${reply.created_at}</div>
                    <div>${reply.message}</div>
                </div>
            `).join('');
        } else {
            repliesHtml += '<div>ChÆ°a cÃ³ trao Ä‘á»•i nÃ o.</div>';
        }

        repliesDiv.innerHTML = repliesHtml;
    } catch (err) {
        ticketDetailDiv.innerHTML = '<div class="support-ticket-error">KhÃ´ng tÃ¬m tháº¥y ticket!</div>';
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
    } catch (err) {
        if (replyError) {
            replyError.textContent = err?.response?.data?.error || 'Gá»­i tráº£ lá»i tháº¥t báº¡i!';
            replyError.hidden = false;
        }
    }
});

loadTicketDetail();
