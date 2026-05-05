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
            const code = document.getElementById('searchVoucher')?.value || '';
            const status = document.getElementById('statusVoucherFilter')?.value || '';
            const response = await api.client.get(`/v1/admin/vouchers?code=${code}&is_active=${status}`);
            this.vouchers = response.data?.data || [];
        } catch (error) {
            console.error('Failed to load vouchers:', error);
        }
    }

    render() {
        const tbody = document.getElementById('vouchers-table-body');
        if (!tbody) return;

        if (this.vouchers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-state-cell">No vouchers found matching filters.</td></tr>';
            return;
        }

        tbody.innerHTML = this.vouchers.map(v => `
            <tr>
                <td><strong class="product-sku" style="background: #f1f5f9; padding: 4px 10px; border-radius: 6px; color: var(--first-color);">${v.code}</strong></td>
                <td><div style="font-weight: 600;">${v.title}</div></td>
                <td>
                    <div style="color: #059669; font-weight: 700;">
                        ${v.discount_type === 'percentage' ? v.discount_value + '%' : api.formatCurrency(v.discount_value)}
                    </div>
                </td>
                <td>
                    <div style="font-size: 11px; color: #64748b;">
                        <i class="fi fi-rs-calendar"></i> ${new Date(v.starts_at).toLocaleDateString()} - ${new Date(v.ends_at).toLocaleDateString()}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${v.is_active ? 'status-in-stock' : 'status-out-of-stock'}" style="font-size: 10px;">
                        ${v.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons-group">
                        <button class="btn-inventory-action btn-edit" data-id="${v.id}" title="Edit Voucher">
                            <i class="fi fi-rs-pencil"></i>
                        </button>
                        <button class="btn-inventory-action btn-inventory-action--cancel btn-delete" data-id="${v.id}" style="display: ${v.is_active ? 'inline-flex' : 'none'}" title="Deactivate">
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
        document.getElementById('searchVoucher')?.addEventListener('input', () => this.init());
        document.getElementById('statusVoucherFilter')?.addEventListener('change', () => this.init());
        
        document.getElementById('vouchers-table-body')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');

            if (editBtn) this.openVoucherModal(editBtn.dataset.id);
            if (deleteBtn) this.handleDeleteVoucher(deleteBtn.dataset.id);
        });
    }

    openVoucherModal(voucherId = null) {
        const voucher = voucherId ? this.vouchers.find(v => v.id == voucherId) : null;
        
        const modalHtml = `
            <div class="admin-modal" id="voucher-modal">
                <div class="admin-modal__card" style="max-width: 500px;">
                    <div class="flex admin-modal__header">
                        <h3 class="admin-title-reset">${voucher ? 'Edit Voucher' : 'Create New Voucher'}</h3>
                        <button class="btn btn--sm modal-close" type="button">Close</button>
                    </div>
                    <form id="voucher-form" class="grid" style="gap: 1.5rem; padding: 1rem 0;">
                        <div class="form-group">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;">Voucher Code</label>
                            <input type="text" name="code" class="form__input" value="${voucher?.code || ''}" required ${voucher ? 'readonly' : ''} style="text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
                        </div>
                        <div class="form-group">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem;">Promotion Title</label>
                            <input type="text" name="title" class="form__input" value="${voucher?.title || ''}" required placeholder="e.g. Welcome Discount 10%">
                        </div>
                        <div class="flex gap-3">
                            <div class="form-group flex-1">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.8rem;">Discount Type</label>
                                <select name="discount_type" class="form__input">
                                    <option value="percentage" ${voucher?.discount_type === 'percentage' ? 'selected' : ''}>Percentage (%)</option>
                                    <option value="fixed" ${voucher?.discount_type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                                </select>
                            </div>
                            <div class="form-group flex-1">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.8rem;">Value</label>
                                <input type="number" name="discount_value" class="form__input" value="${voucher?.discount_value || 0}" required>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <div class="form-group flex-1">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.8rem;">Start Date</label>
                                <input type="date" name="starts_at" class="form__input" value="${voucher?.starts_at ? voucher.starts_at.split(' ')[0] : ''}" required>
                            </div>
                            <div class="form-group flex-1">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.8rem;">End Date</label>
                                <input type="date" name="ends_at" class="form__input" value="${voucher?.ends_at ? voucher.ends_at.split(' ')[0] : ''}" required>
                            </div>
                        </div>
                        <div class="flex justify-end gap-2 mt-2">
                            <button type="submit" class="btn btn--sm">${voucher ? 'Update Promotion' : 'Create Voucher'}</button>
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
                code: fd.get('code').toUpperCase(),
                title: fd.get('title'),
                discount_type: fd.get('discount_type'),
                discount_value: parseFloat(fd.get('discount_value')),
                starts_at: fd.get('starts_at') + ' 00:00:00',
                ends_at: fd.get('ends_at') + ' 23:59:59',
                is_active: 1
            };

            try {
                if (voucher) {
                    await api.client.put(`/v1/admin/vouchers/${voucher.id}`, payload);
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
        if (!confirm('Are you sure you want to deactivate this voucher?')) return;
        try {
            await api.client.delete(`/v1/admin/vouchers/${id}`);
            await this.init();
        } catch (err) {
            alert('Error deleting voucher');
        }
    }
}

const ctrl = new PromotionsController();
ctrl.init();
