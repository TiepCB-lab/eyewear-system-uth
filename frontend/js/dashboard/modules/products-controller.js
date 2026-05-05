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
        this.selectedImageFile = null;
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

    handleImageSelection(file, previewElement, dropTextElement) {
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        this.selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
            if (dropTextElement) dropTextElement.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    async openProductModal(productId) {
        const product = this.products.find(p => p.id == productId) || null;
        const isEdit = !!product;
        this.selectedImageFile = null; // Reset selection

        const modalHtml = `
            <div class="modal-overlay" id="product-modal">
                <div class="modal-content qv-modal" style="max-width: 850px; display: flex; flex-direction: row; padding: 0; overflow: hidden; border-radius: 40px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 40px 100px rgba(0,0,0,0.2); background: rgba(255,255,255,0.85); backdrop-filter: blur(20px);">
                    <button class="qv-close modal-close" style="z-index: 10;"><i class="fi fi-rs-cross"></i></button>
                    
                    <div class="qv-image-side" id="drop-zone" style="width: 40%; background: #fdfdfd; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; position: relative; border-right: 1px solid rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease;">
                        <div style="position: absolute; top: 20px; left: 20px; background: var(--primary-color); color: white; padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; box-shadow: 0 10px 20px rgba(var(--primary-color-rgb), 0.2);">
                            ${isEdit ? 'Update Image' : 'Add Image'}
                        </div>
                        
                        <div id="image-preview-container" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;">
                            <img id="product-image-preview" src="${isEdit ? api.fixImagePath(product.thumbnail) : 'https://placehold.co/400x400?text=Select+Image'}" 
                                 alt="${isEdit ? product.name : 'New Product'}" 
                                 style="width: 100%; max-height: 250px; object-fit: contain; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.1)); border-radius: 20px; transition: all 0.4s ease; ${!isEdit ? 'display: none;' : ''}">
                            
                            <div id="drop-text" style="text-align: center; color: #94a3b8; font-size: 12px; font-weight: 600; line-height: 1.6; ${isEdit ? 'display: none;' : ''}">
                                <i class="fi fi-rs-upload" style="font-size: 24px; display: block; margin-bottom: 8px; color: var(--primary-color);"></i>
                                <span>Click or Drag & Drop<br>product photo here</span>
                            </div>
                        </div>
                        
                        <input type="file" id="product-image-input" accept="image/*" style="display: none;">
                    </div>

                    <div class="qv-content-side" style="width: 60%; padding: 50px; display: flex; flex-direction: column; justify-content: flex-start; overflow-y: auto; max-height: 85vh; background: transparent;">
                        <div class="qv-brand" style="color: var(--primary-color); font-weight: 700; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8;">
                            ${isEdit ? (product.brand || 'Luxury Eyewear') : 'New Collection'}
                        </div>
                        <h2 class="qv-title" style="font-size: 32px; font-weight: 800; margin-bottom: 35px; line-height: 1.1; color: #0f172a; letter-spacing: -1px;">
                            ${isEdit ? product.name : 'Product Details'}
                        </h2>
                        
                        <form id="product-form" style="display: grid; gap: 25px;">
                            ${!isEdit ? `
                                <div class="form-group">
                                    <label style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 10px; letter-spacing: 1px;">Product Title</label>
                                    <input type="text" name="name" class="form-control" style="width: 100%; padding: 16px 20px; border: 1.5px solid #e2e8f0; border-radius: 18px; font-family: 'Inter', sans-serif; transition: all 0.3s;" required placeholder="e.g. Aviator Classic Gold">
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div class="form-group">
                                        <label style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 10px; letter-spacing: 1px;">Brand</label>
                                        <input type="text" name="brand" class="form-control" style="width: 100%; padding: 16px 20px; border: 1.5px solid #e2e8f0; border-radius: 18px; font-family: 'Inter', sans-serif;" placeholder="Ray-Ban, Oakley...">
                                    </div>
                                    <div class="form-group">
                                        <label style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 10px; letter-spacing: 1px;">Gender</label>
                                        <select name="gender" class="form-control" style="width: 100%; padding: 16px 20px; border: 1.5px solid #e2e8f0; border-radius: 18px; font-family: 'Outfit', sans-serif; appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 20px center; background-size: 12px auto;">
                                            <option value="unisex">Unisex</option>
                                            <option value="men">Men</option>
                                            <option value="women">Women</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 10px; letter-spacing: 1px;">Collection / Category</label>
                                    <select name="category_id" class="form-control" style="width: 100%; padding: 16px 20px; border: 1.5px solid #e2e8f0; border-radius: 18px; font-family: 'Outfit', sans-serif; appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 20px center; background-size: 12px auto;" required>
                                        <option value="">Select Category</option>
                                        ${this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                </div>
                            ` : ''}

                            <div class="form-group">
                                <label style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; margin-bottom: 15px; letter-spacing: 1.5px;">
                                    ${isEdit ? 'Update Price' : 'Market Price (VND)'}
                                </label>
                                <div style="position: relative; display: flex; align-items: baseline; background: #f8fafc; padding: 20px; border-radius: 20px; border: 1.5px dashed #cbd5e1;">
                                    <span style="font-size: 28px; font-weight: 800; color: #94a3b8; margin-right: 12px;">₫</span>
                                    <input type="number" name="base_price" class="form-control" 
                                           value="${isEdit ? product.base_price : ''}" 
                                           style="border: none; background: transparent; font-size: 36px; font-weight: 900; width: 100%; color: #0f172a; outline: none;" 
                                           required placeholder="0">
                                </div>
                                ${isEdit ? `<p style="font-size: 13px; color: #94a3b8; margin-top: 15px; font-weight: 500;">Current Value: <span style="text-decoration: line-through;">${api.formatCurrency(product.base_price)}</span></p>` : ''}
                            </div>

                            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 20px;">
                                <button type="submit" class="btn btn--primary" style="height: 65px; border-radius: 22px; font-weight: 800; font-size: 16px; background: #0f172a; border: none; color: white; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2); transition: all 0.3s ease;">
                                    ${isEdit ? 'Save Changes' : 'Confirm & Create'}
                                </button>
                                <button type="button" class="btn btn--secondary modal-close" style="height: 65px; border-radius: 22px; font-weight: 700; background: #f1f5f9; color: #64748b; border: none;">Discard</button>
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

        // Image Selection Handling
        const dropZone = document.getElementById('drop-zone');
        const imageInput = document.getElementById('product-image-input');
        const preview = document.getElementById('product-image-preview');
        const dropText = document.getElementById('drop-text');

        dropZone.onclick = () => imageInput.click();

        imageInput.onchange = (e) => this.handleImageSelection(e.target.files[0], preview, dropText);

        dropZone.ondragover = (e) => {
            e.preventDefault();
            dropZone.style.background = '#f0f9ff';
            dropZone.style.borderColor = 'var(--primary-color)';
        };

        dropZone.ondragleave = () => {
            dropZone.style.background = '#fdfdfd';
            dropZone.style.borderColor = 'rgba(0,0,0,0.05)';
        };

        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.style.background = '#fdfdfd';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageSelection(file, preview, dropText);
            }
        };

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

            if (!isEdit) {
                payload.name = formData.get('name');
                payload.brand = formData.get('brand');
                payload.category_id = parseInt(formData.get('category_id'));
                payload.gender = formData.get('gender');
                payload.is_active = 1;
            }

            try {
                if (isEdit) {
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
