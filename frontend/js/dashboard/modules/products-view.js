import api from '../../services/api.js';

/**
 * ProductsView handles all UI-related tasks for the Product Management module.
 * It separates the visual presentation (HTML templates) from the business logic.
 */
class ProductsView {
    constructor() {
        this.loadStyles();
    }

    /**
     * Dynamically loads the module-specific CSS.
     */
    loadStyles() {
        if (document.getElementById('products-module-styles')) return;
        const link = document.createElement('link');
        link.id = 'products-module-styles';
        link.rel = 'stylesheet';
        link.href = '/assets/css/products-module.css';
        document.head.appendChild(link);
    }

    /**
     * Renders the product table rows.
     * @param {Array} products - List of products to display.
     */
    renderProductTable(products) {
        const tbody = document.querySelector('.table tbody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-state-cell">No products found.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr class="product-management-table">
                <td>
                    <img src="${api.fixImagePath(p.thumbnail)}" alt="${p.name}">
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
            activeCountEl.innerText = products.filter(p => p.is_active).length;
        }
    }

    /**
     * Populates the category filter dropdown.
     * @param {Array} categories - List of categories.
     * @param {string} currentValue - Current selected category ID.
     */
    populateCategoryFilter(categories, currentValue) {
        const select = document.getElementById('categoryFilter');
        if (!select || categories.length === 0) return;
        
        select.innerHTML = '<option value="">All Categories</option>' + 
            categories.map(c => `<option value="${c.id}" ${currentValue == c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    /**
     * Returns the HTML template for the Product Creation/Editing Modal.
     * @param {Object|null} product - Product data if editing, null if creating.
     * @param {Array} categories - List of available categories.
     */
    getProductModalTemplate(product, categories) {
        const isEdit = !!product;
        
        return `
            <div class="modal-overlay" id="product-modal">
                <div class="modal-content qv-modal">
                    <button class="qv-close modal-close"><i class="fi fi-rs-cross"></i></button>
                    
                    <div class="qv-image-side" id="drop-zone">
                        <div class="badge">
                            ${isEdit ? 'Update Image' : 'Add Image'}
                        </div>
                        
                        <div class="image-preview-container">
                            <img id="product-image-preview" src="${isEdit ? api.fixImagePath(product.thumbnail) : 'https://placehold.co/400x400?text=Select+Image'}" 
                                 alt="${isEdit ? product.name : 'New Product'}" 
                                 style="${!isEdit ? 'display: none;' : ''}">
                            
                            <div id="drop-text" class="drop-text" style="${isEdit ? 'display: none;' : ''}">
                                <i class="fi fi-rs-upload"></i>
                                <span>Click or Drag & Drop<br>product photo here</span>
                            </div>
                        </div>
                        
                        <input type="file" id="product-image-input" accept="image/*" style="display: none;">
                    </div>

                    <div class="qv-content-side">
                        <div class="qv-brand">
                            ${isEdit ? (product.brand || 'Luxury Eyewear') : 'New Collection'}
                        </div>
                        <h2 class="qv-title">
                            ${isEdit ? product.name : 'Product Details'}
                        </h2>
                        
                        <form id="product-form" class="qv-form">
                            ${!isEdit ? `
                                <div class="form-group">
                                    <label class="qv-label">Product Title</label>
                                    <input type="text" name="name" class="qv-input" required placeholder="e.g. Aviator Classic Gold">
                                </div>
                                <div class="qv-form-row">
                                    <div class="form-group">
                                        <label class="qv-label">Brand</label>
                                        <input type="text" name="brand" class="qv-input" placeholder="Ray-Ban, Oakley...">
                                    </div>
                                    <div class="form-group">
                                        <label class="qv-label">Gender</label>
                                        <select name="gender" class="qv-select">
                                            <option value="unisex">Unisex</option>
                                            <option value="men">Men</option>
                                            <option value="women">Women</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="qv-label">Collection / Category</label>
                                    <select name="category_id" class="qv-select" required>
                                        <option value="">Select Category</option>
                                        ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                </div>
                            ` : ''}

                            <div class="form-group">
                                <label class="qv-label">
                                    ${isEdit ? 'Update Price' : 'Market Price (VND)'}
                                </label>
                                <div class="qv-price-container">
                                    <span class="qv-price-symbol">₫</span>
                                    <input type="number" name="base_price" class="qv-price-input" 
                                           value="${isEdit ? product.base_price : ''}" 
                                           required placeholder="0">
                                </div>
                                ${isEdit ? `<p class="qv-price-note">Current Value: <span style="text-decoration: line-through;">${api.formatCurrency(product.base_price)}</span></p>` : ''}
                            </div>

                            <div class="qv-actions">
                                <button type="submit" class="btn-confirm">
                                    ${isEdit ? 'Save Changes' : 'Confirm & Create'}
                                </button>
                                <button type="button" class="btn-discard modal-close">Discard</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
}

export default new ProductsView();
;
