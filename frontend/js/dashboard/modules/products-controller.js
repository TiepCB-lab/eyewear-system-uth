import api from '../../services/api.js';
import { getCurrentUserPermissions } from '../../core/rbac.js';

class ProductsController {
    constructor() {
        this.container = document.getElementById('dashboard-modules');
        this.products = [];
        this.categories = [];
        this.filters = {
            search: '',
            category_id: '',
            status: 'all'
        };
    }

    async init() {
        await this.loadInitialData();
        this.render();
        this.setupEventListeners();
        this.populateCategoryFilter();
    }

    async loadInitialData() {
        try {
            const params = new URLSearchParams();
            if (this.filters.search) params.append('q', this.filters.search);
            if (this.filters.category_id) params.append('category_ids', this.filters.category_id);
            if (this.filters.status !== 'all') params.append('active', this.filters.status);
            params.append('per_page', '100');

            const [productsRes, categoriesRes] = await Promise.all([
                api.client.get(`/products?${params.toString()}`),
                api.client.get('/products/categories?active=false')
            ]);
            
            this.products = productsRes.data?.data?.data || [];
            this.categories = categoriesRes.data?.data?.data || [];
        } catch (error) {
            console.error('Failed to load products initial data:', error);
        }
    }

    render() {
        const tbody = document.querySelector('.table tbody');
        if (!tbody) return;

        if (this.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-state-cell">No products found.</td></tr>';
            return;
        }

        tbody.innerHTML = this.products.map(p => `
            <tr>
                <td>
                    <img src="${api.fixImagePath(p.thumbnail)}" alt="${p.name}" class="product-image" style="width: 50px; height: 50px; object-fit: contain;">
                </td>
                <td>
                    <div class="product-name">${p.name}</div>
                    <small class="text-muted">${p.brand || ''}</small>
                </td>
                <td>${p.category?.name || 'Uncategorized'}</td>
                <td>${api.formatCurrency(p.base_price)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" data-id="${p.id}">
                            <i class="fi fi-rs-edit"></i> Edit Price
                        </button>
                        ${p.is_active ? `
                            <button class="btn-small btn-cancel" data-id="${p.id}">
                                <i class="fi fi-rs-trash"></i> Disable
                            </button>
                        ` : `
                            <button class="btn-small btn-success btn-activate" data-id="${p.id}" style="background: #eefdf5; color: #10b981; border: 1px solid #10b981;">
                                <i class="fi fi-rs-play"></i> Activate
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');

        // Update active count
        const activeCountEl = document.querySelector('.metric-card .metric-value');
        if (activeCountEl) {
            activeCountEl.innerText = this.products.filter(p => p.is_active).length;
        }
    }

    populateCategoryFilter() {
        const select = document.getElementById('categoryFilter');
        if (!select || this.categories.length === 0) return;
        
        const currentVal = select.value;
        select.innerHTML = '<option value="">All Categories</option>' + 
            this.categories.map(c => `<option value="${c.id}" ${currentVal == c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    setupEventListeners() {
        // Add New Product Button
        const addBtn = document.querySelector('.admin-button-block');
        addBtn?.addEventListener('click', () => this.openProductModal());

        // Filter events
        const searchInput = document.getElementById('productSearch');
        const catFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');

        let debounceTimer;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                this.filters.search = e.target.value;
                await this.loadInitialData();
                this.render();
            }, 500);
        });

        catFilter?.addEventListener('change', async (e) => {
            this.filters.category_id = e.target.value;
            await this.loadInitialData();
            this.render();
        });

        statusFilter?.addEventListener('change', async (e) => {
            this.filters.status = e.target.value;
            await this.loadInitialData();
            this.render();
        });

        // Edit/Delete/Activate buttons
        document.querySelector('.table tbody')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-cancel');
            const activateBtn = e.target.closest('.btn-activate');

            if (editBtn) {
                const id = editBtn.dataset.id;
                this.openProductModal(id);
            }

            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                this.handleDeleteProduct(id);
            }

            if (activateBtn) {
                const id = activateBtn.dataset.id;
                this.handleActivateProduct(id);
            }
        });
    }

    async handleActivateProduct(id) {
        try {
            await api.client.put(`/admin/products?id=${id}`, { is_active: 1 });
            if (window.Notification) window.Notification.show('Product activated!', 'success');
            await this.init();
        } catch (err) {
            alert('Error activating product: ' + (err.response?.data?.message || err.message));
        }
    }

    async openProductModal(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        const modalHtml = `
            <div class="modal-overlay" id="product-modal">
                <div class="modal-content qv-modal" style="max-width: 650px; display: flex; flex-direction: row; padding: 0; overflow: hidden; border-radius: 30px;">
                    <button class="qv-close modal-close" style="z-index: 10;"><i class="fi fi-rs-cross"></i></button>
                    
                    <div class="qv-image-side" style="width: 45%; background: #f8f9fa; display: flex; align-items: center; justify-content: center; padding: 30px; position: relative;">
                        <div style="position: absolute; top: 20px; left: 20px; background: var(--primary-color); color: white; padding: 5px 12px; border-radius: 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Pricing</div>
                        <img src="${api.fixImagePath(product.thumbnail)}" alt="${product.name}" style="width: 100%; height: auto; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));">
                    </div>

                    <div class="qv-content-side" style="width: 55%; padding: 40px; display: flex; flex-direction: column; justify-content: center;">
                        <div class="qv-brand" style="color: var(--primary-color); font-weight: 600; font-size: 13px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">${product.brand || 'Luxury Eyewear'}</div>
                        <h2 class="qv-title" style="font-size: 24px; font-weight: 800; margin-bottom: 25px; line-height: 1.2;">${product.name}</h2>
                        
                        <form id="product-form">
                            <div style="margin-bottom: 30px;">
                                <label style="display: block; font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 15px; letter-spacing: 0.5px;">Update Market Price</label>
                                <div style="position: relative; display: flex; align-items: baseline;">
                                    <span style="font-size: 24px; font-weight: 700; color: #64748b; margin-right: 8px;">₫</span>
                                    <input type="number" name="base_price" class="form-control" 
                                           value="${product.base_price}" 
                                           style="border: none; border-bottom: 2px solid #e2e8f0; border-radius: 0; background: transparent; font-size: 32px; font-weight: 800; padding: 0 0 8px 0; width: 100%; color: #1e293b; outline: none; transition: border-color 0.3s;" 
                                           onfocus="this.style.borderColor='var(--primary-color)'"
                                           onblur="this.style.borderColor='#e2e8f0'"
                                           required>
                                </div>
                                <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">Current: <span style="text-decoration: line-through;">${api.formatCurrency(product.base_price)}</span></p>
                            </div>

                            <div style="display: flex; gap: 15px;">
                                <button type="submit" class="btn btn--primary" style="flex: 2; height: 50px; border-radius: 15px; font-weight: 700; background: #1e293b; border: none; color: white;">Confirm Update</button>
                                <button type="button" class="btn btn--secondary modal-close" style="flex: 1; height: 50px; border-radius: 15px; font-weight: 600;">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');

        // Trigger animation
        setTimeout(() => modal.classList.add('show'), 10);

        // Close handlers
        modal.querySelectorAll('.modal-close').forEach(el => {
            el.onclick = () => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 500);
            };
        });

        // Submit handler
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const payload = {
                base_price: parseFloat(formData.get('base_price'))
            };

            try {
                if (product) {
                    await api.client.put(`/admin/products?id=${product.id}`, payload);
                    if (window.Notification) window.Notification.show('Product updated!', 'success');
                } else {
                    await api.client.post('/admin/products', payload);
                    if (window.Notification) window.Notification.show('Product created!', 'success');
                }
                modal.remove();
                await this.init(); // Refresh data and view
            } catch (err) {
                alert('Error saving product: ' + (err.response?.data?.message || err.message));
            }
        };
    }

    async handleDeleteProduct(id) {
        if (!confirm('Are you sure you want to disable this product?')) return;
        try {
            await api.client.delete(`/admin/products?id=${id}`);
            if (window.Notification) window.Notification.show('Product disabled.', 'success');
            await this.init();
        } catch (err) {
            alert('Error deleting product: ' + (err.response?.data?.message || err.message));
        }
    }
}

const controller = new ProductsController();
controller.init();
