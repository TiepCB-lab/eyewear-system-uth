import { supportService } from '../services/supportService.js';

const form = document.getElementById('createTicketForm');
const successMsg = document.getElementById('ticketSuccess');
const errorMsg = document.getElementById('ticketError');

function resetMessages() {
    if (successMsg) {
        successMsg.hidden = true;
    }

    if (errorMsg) {
        errorMsg.hidden = true;
        errorMsg.textContent = '';
    }
}

form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    resetMessages();

    const subject = form.subject.value.trim();
    const message = form.message.value.trim();
    const orderId = form.orderId.value.trim();

    try {
        await supportService.createTicket(subject, message, orderId || null);
        if (successMsg) {
            successMsg.hidden = false;
        }
        form.reset();
    } catch (err) {
        if (errorMsg) {
            errorMsg.textContent = err?.response?.data?.error || 'Gá»­i yÃªu cáº§u tháº¥t báº¡i!';
            errorMsg.hidden = false;
        }
    }
});
