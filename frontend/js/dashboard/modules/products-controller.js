import api from '../../services/api.js';
import productsView from './products-view.js';

/**
 * ProductsController manages the logic for product listing, filtering, and CRUD operations.
 * It coordinates data fetching and UI updates via ProductsView.
 */
class ProductsController {
    constructor() {
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

    /**
     * Fetches products and categories from the backend.
     */
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

    /**
     * Delegates rendering to the View.
     */
    render() {
        productsView.renderProductTable(this.products);
    }

    /**
     * Delegates category filter population to the View.
     */
    populateCategoryFilter() {
        productsView.populateCategoryFilter(this.categories, this.filters.category_id);
    }

    /**
     * Sets up listeners for filters, buttons, and table actions.
     */
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

        // Delegate table action buttons
        document.querySelector('.table tbody')?.addEventListener('click', (e) => {
            const id = e.target.closest('button')?.dataset.id;
            if (!id) return;

            if (e.target.closest('.btn-edit')) this.openProductModal(id);
            if (e.target.closest('.btn-cancel')) this.handleDeleteProduct(id);
            if (e.target.closest('.btn-activate')) this.handleActivateProduct(id);
        });
    }

    /**
     * API: Activate a product.
     */
    async handleActivateProduct(id) {
        try {
            await api.client.put(`/admin/products?id=${id}`, { is_active: 1 });
            if (window.Notification) window.Notification.show('Product activated!', 'success');
            await this.init();
        } catch (err) {
            alert('Error activating product: ' + (err.response?.data?.message || err.message));
        }
    }

    /**
     * Handles image file selection and preview updates.
     */
    handleImageSelection(file, previewElement, dropTextElement) {
        if (!file || !file.type.startsWith('image/')) {
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

    /**
     * Opens the modal for adding or editing a product.
     */
    async openProductModal(productId = null) {
        const product = productId ? this.products.find(p => p.id == productId) : null;
        const isEdit = !!product;
        this.selectedImageFile = null;

        // Get template and inject into body
        const modalHtml = productsView.getProductModalTemplate(product, this.categories);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const dropZone = document.getElementById('drop-zone');
        const imageInput = document.getElementById('product-image-input');
        const preview = document.getElementById('product-image-preview');
        const dropText = document.getElementById('drop-text');

        // Animation
        setTimeout(() => modal.classList.add('show'), 10);

        // UI Interactions within modal
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
            if (file?.type.startsWith('image/')) this.handleImageSelection(file, preview, dropText);
        };

        modal.querySelectorAll('.modal-close').forEach(el => {
            el.onclick = () => {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 500);
            };
        });

        // Form Submission
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const payload = { base_price: parseFloat(formData.get('base_price')) };

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
                await this.init();
            } catch (err) {
                alert('Error saving product: ' + (err.response?.data?.message || err.message));
            }
        };
    }

    /**
     * API: Disable a product.
     */
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

// Global initialization logic to avoid multiple instances in SPA environment
if (!window.__productsControllerInitialized) {
    const controller = new ProductsController();
    controller.init();
    window.__productsControllerInitialized = true;
}
