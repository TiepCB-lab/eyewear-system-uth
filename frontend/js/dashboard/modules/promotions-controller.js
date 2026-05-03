import api from '../../services/api.js';

class PromotionsController {
    constructor() {
        this.vouchers = [];
    }

    async init() {
        await this.loadVouchers();
        this.render();
        this.setupEventListeners();
    }

    async loadVouchers() {
        try {
            const response = await api.client.get('/v1/admin/vouchers');
            this.vouchers = response.data?.data || [];
        } catch (error) {
            console.error('Failed to load vouchers:', error);
        }
    }

    render() {
        const tbody = document.getElementById('vouchers-table-body');
        if (!tbody) return;

        if (this.vouchers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell">No vouchers found.</td></tr>';
            return;
        }

        tbody.innerHTML = this.vouchers.map(v => `
            <tr>
                <td><strong class="product-sku">${v.code}</strong></td>
                <td>${v.title}</td>
                <td>${v.discount_type === 'percentage' ? v.discount_value + '%' : api.formatCurrency(v.discount_value)}</td>
                <td>
                    <small>${new Date(v.starts_at).toLocaleDateString()} - ${new Date(v.ends_at).toLocaleDateString()}</small>
                </td>
                <td>
                    <span class="status-badge ${v.is_active ? 'badge-active' : 'badge-pending'}">
                        ${v.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" data-id="${v.id}">
                            <i class="fi fi-rs-edit"></i>
                        </button>
                        <button class="btn-small btn-cancel" data-id="${v.id}" style="display: ${v.is_active ? 'inline-flex' : 'none'}">
                            <i class="fi fi-rs-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        const countEl = document.getElementById('active-vouchers-count');
        if (countEl) {
            countEl.innerText = this.vouchers.filter(v => v.is_active).length;
        }
    }

    setupEventListeners() {
        document.getElementById('add-voucher-btn')?.addEventListener('click', () => this.openVoucherModal());
        
        document.getElementById('vouchers-table-body')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-cancel');

            if (editBtn) this.openVoucherModal(editBtn.dataset.id);
            if (deleteBtn) this.handleDeleteVoucher(deleteBtn.dataset.id);
        });
    }

    openVoucherModal(voucherId = null) {
        const voucher = voucherId ? this.vouchers.find(v => v.id == voucherId) : null;
        
        const modalHtml = `
            <div class="modal-overlay" id="voucher-modal">
                <div class="modal-container" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>${voucher ? 'Edit Voucher' : 'Create New Voucher'}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="voucher-form" class="p-3">
                        <div class="form-group mb-3">
                            <label>Voucher Code</label>
                            <input type="text" name="code" class="form-control" value="${voucher?.code || ''}" required ${voucher ? 'readonly' : ''}>
                        </div>
                        <div class="form-group mb-3">
                            <label>Title</label>
                            <input type="text" name="title" class="form-control" value="${voucher?.title || ''}" required>
                        </div>
                        <div class="form-row flex gap-3 mb-3">
                            <div class="form-group flex-1">
                                <label>Type</label>
                                <select name="discount_type" class="form-control">
                                    <option value="percentage" ${voucher?.discount_type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
                                    <option value="fixed" ${voucher?.discount_type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                                </select>
                            </div>
                            <div class="form-group flex-1">
                                <label>Value</label>
                                <input type="number" name="discount_value" class="form-control" value="${voucher?.discount_value || 0}" required>
                            </div>
                        </div>
                        <div class="form-row flex gap-3 mb-3">
                            <div class="form-group flex-1">
                                <label>Starts At</label>
                                <input type="date" name="starts_at" class="form-control" value="${voucher?.starts_at ? voucher.starts_at.split(' ')[0] : ''}" required>
                            </div>
                            <div class="form-group flex-1">
                                <label>Ends At</label>
                                <input type="date" name="ends_at" class="form-control" value="${voucher?.ends_at ? voucher.ends_at.split(' ')[0] : ''}" required>
                            </div>
                        </div>
                        <div class="modal-footer mt-4 flex justify-end gap-2">
                            <button type="button" class="btn btn--secondary modal-close">Cancel</button>
                            <button type="submit" class="btn btn--primary">${voucher ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('voucher-modal');
        const form = document.getElementById('voucher-form');

        modal.querySelectorAll('.modal-close').forEach(el => el.onclick = () => modal.remove());

        form.onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const payload = {
                code: fd.get('code'),
                title: fd.get('title'),
                discount_type: fd.get('discount_type'),
                discount_value: parseFloat(fd.get('discount_value')),
                starts_at: fd.get('starts_at') + ' 00:00:00',
                ends_at: fd.get('ends_at') + ' 23:59:59',
                is_active: 1
            };

            try {
                if (voucher) {
                    await api.client.put(`/v1/admin/vouchers/update?id=${voucher.id}`, payload);
                } else {
                    await api.client.post('/v1/admin/vouchers', payload);
                }
                modal.remove();
                await this.init();
            } catch (err) {
                alert('Error saving voucher: ' + (err.response?.data?.message || err.message));
            }
        };
    }

    async handleDeleteVoucher(id) {
        if (!confirm('Deactivate this voucher?')) return;
        try {
            await api.client.delete(`/v1/admin/vouchers/delete?id=${id}`);
            await this.init();
        } catch (err) {
            alert('Error deleting voucher');
        }
    }
}

const ctrl = new PromotionsController();
ctrl.init();
