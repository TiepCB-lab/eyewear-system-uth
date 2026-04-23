import { paymentService } from '../services/paymentService.js';

const queryParams = new URLSearchParams(window.location.search);
const currentOrder = {
    id: queryParams.get('order_id') || '',
    amount: Number(queryParams.get('amount')) || 0
};

const displayOrderId = document.getElementById('displayOrderId');
const billOrderNumber = document.getElementById('billOrderNumber');
const displayAmount = document.getElementById('displayAmount');
const resultDiv = document.getElementById('paymentResult');
const paymentForm = document.getElementById('paymentForm');
const submitButton = document.getElementById('btnSubmit');

function formatVND(value) {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function renderResult(message, type) {
    if (!resultDiv) {
        return;
    }

    resultDiv.textContent = '';
    resultDiv.className = `payment-result ${type ? `payment-result--${type}` : ''}`.trim();

    if (message) {
        resultDiv.innerHTML = message;
    }
}

function renderAmount(amount) {
    if (displayAmount) {
        displayAmount.innerText = amount > 0 ? formatVND(amount) : '0 Ä‘';
    }
}

async function loadOrderAmount() {
    if (!currentOrder.id) {
        renderResult('Order ID is missing.', 'error');
        if (submitButton) {
            submitButton.disabled = true;
        }
        return;
    }

    if (displayOrderId) {
        displayOrderId.innerText = '#' + currentOrder.id;
    }

    if (billOrderNumber) {
        billOrderNumber.innerText = '#' + currentOrder.id;
    }

    renderAmount(currentOrder.amount);

    if (currentOrder.amount > 0) {
        return;
    }

    try {
        const orderResponse = await paymentService.getOrderDetail(currentOrder.id);
        const orderData = orderResponse?.data || {};
        currentOrder.amount = Number(orderData.total_amount) || Number(orderData.payment_amount) || 0;
        renderAmount(currentOrder.amount);
    } catch (error) {
        console.error('Failed to load order detail', error);
        renderResult('Unable to load order total.', 'error');
    }
}

paymentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!currentOrder.id) {
        renderResult('Order ID is missing.', 'error');
        return;
    }

    const method = document.querySelector('input[name="payment_method"]:checked')?.value;
    if (!method || !submitButton) {
        return;
    }

    submitButton.disabled = true;
    submitButton.innerText = 'Processing...';
    renderResult('', '');

    try {
        const response = await paymentService.processPayment(currentOrder.id, method, currentOrder.amount);
        renderResult(
            `Payment ${response.data.status === 'paid' ? 'Successful' : 'Pending (COD/Transfer)'}!<br/>Transaction Ref: ${response.data.transaction_ref || 'N/A'}`,
            'success'
        );

        window.setTimeout(() => {
            window.location.href = '../accounts/index.html';
        }, 3000);
    } catch (error) {
        renderResult(`Failed to process: ${error.message || 'Server Error'}`, 'error');
        submitButton.disabled = false;
        submitButton.innerText = 'Process Payment';
    }
});

loadOrderAmount();
