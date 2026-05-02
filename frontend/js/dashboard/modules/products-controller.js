import api from '../../services/api.js';
import { getCurrentUserPermissions } from '../../core/rbac.js';

class ProductsController {
    constructor() {
        this.container = document.getElementById('dashboard-modules');
        this.products = [];
        this.categories = [];
    }

    async init() {
        console.log('Products Controller Initializing...');
        await this.loadInitialData();
        this.render();
        this.setupEventListeners();
    }

    async loadInitialData() {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                api.client.get('/v1/products?per_page=100&active=all'),
                api.client.get('/v1/products/categories?active=false')
            ]);
            
            this.products = productsRes.data?.data?.data || [];
            this.categories = categoriesRes.data?.data || [];
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
                            <i class="fi fi-rs-edit"></i> Edit
                        </button>
                        <button class="btn-small btn-cancel" data-id="${p.id}" style="display: ${p.is_active ? 'inline-flex' : 'none'}">
                            <i class="fi fi-rs-trash"></i> Disable
                        </button>
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

    setupEventListeners() {
        // Add New Product Button
        const addBtn = document.querySelector('.admin-button-block');
        addBtn?.addEventListener('click', () => this.openProductModal());

        // Edit/Delete buttons
        document.querySelector('.table tbody')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-cancel');

            if (editBtn) {
                const id = editBtn.dataset.id;
                this.openProductModal(id);
            }

            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                this.handleDeleteProduct(id);
            }
        });
    }

    async openProductModal(productId = null) {
        const product = productId ? this.products.find(p => p.id == productId) : null;
        
        // Simple modal implementation for demo (would ideally use a proper component)
        const modalHtml = `
            <div class="modal-overlay" id="product-modal">
                <div class="modal-container" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>${product ? 'Edit Product' : 'Add New Product'}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="product-form" class="p-3">
                        <div class="form-group mb-3">
                            <label>Product Name</label>
                            <input type="text" name="name" class="form-control" value="${product?.name || ''}" required>
                        </div>
                        <div class="form-row flex gap-3 mb-3">
                            <div class="form-group flex-1">
                                <label>Category</label>
                                <select name="category_id" class="form-control">
                                    <option value="">Select Category</option>
                                    ${this.categories.map(c => `<option value="${c.id}" ${product?.category?.id == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group flex-1">
                                <label>Brand</label>
                                <input type="text" name="brand" class="form-control" value="${product?.brand || ''}">
                            </div>
                        </div>
                        <div class="form-row flex gap-3 mb-3">
                            <div class="form-group flex-1">
                                <label>Base Price</label>
                                <input type="number" name="base_price" class="form-control" value="${product?.base_price || 0}" step="0.01" required>
                            </div>
                            <div class="form-group flex-1">
                                <label>Gender</label>
                                <select name="gender" class="form-control">
                                    <option value="unisex" ${product?.gender == 'unisex' ? 'selected' : ''}>Unisex</option>
                                    <option value="men" ${product?.gender == 'men' ? 'selected' : ''}>Men</option>
                                    <option value="women" ${product?.gender == 'women' ? 'selected' : ''}>Women</option>
                                    <option value="kids" ${product?.gender == 'kids' ? 'selected' : ''}>Kids</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group mb-3">
                            <label>Description</label>
                            <textarea name="description" class="form-control" rows="3">${product?.description || ''}</textarea>
                        </div>
                        <div class="form-group mb-3">
                            <label class="flex items-center gap-2">
                                <input type="checkbox" name="is_active" ${product === null || product.is_active ? 'checked' : ''}>
                                Product is Active
                            </label>
                        </div>
                        <div class="modal-footer mt-4 flex justify-end gap-2">
                            <button type="button" class="btn btn--secondary modal-close">Cancel</button>
                            <button type="submit" class="btn btn--primary">${product ? 'Save Changes' : 'Create Product'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');

        // Close handlers
        modal.querySelectorAll('.modal-close').forEach(el => {
            el.onclick = () => modal.remove();
        });

        // Submit handler
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const payload = {
                name: formData.get('name'),
                category_id: formData.get('category_id') ? parseInt(formData.get('category_id')) : null,
                brand: formData.get('brand'),
                base_price: parseFloat(formData.get('base_price')),
                gender: formData.get('gender'),
                description: formData.get('description'),
                is_active: formData.get('is_active') === 'on' ? 1 : 0
            };

            try {
                if (product) {
                    await api.client.put(`/v1/admin/products?id=${product.id}`, payload);
                    if (window.Notification) window.Notification.show('Product updated!', 'success');
                } else {
                    await api.client.post('/v1/admin/products', payload);
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
            await api.client.delete(`/v1/admin/products?id=${id}`);
            if (window.Notification) window.Notification.show('Product disabled.', 'success');
            await this.init();
        } catch (err) {
            alert('Error deleting product: ' + (err.response?.data?.message || err.message));
        }
    }
}

const controller = new ProductsController();
controller.init();
