import adminService from '../services/adminService.js';

/**
 * Inventory Management Module
 * Handles real-time stock tracking and updates
 */

var inventoryData = [];
var editingRow = null;

document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
});

async function loadInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    try {
        // Show loading state
        tbody.innerHTML = '<tr><td colspan="9" class="table-state-cell table-state-cell--spacious">Loading inventory data...</td></tr>';

        const response = await adminService.getInventory();
        
        if (response && Array.isArray(response.data)) {
            inventoryData = response.data.map(item => ({
                ...item,
                productName: item.product_name,
                productImage: item.image || '/assets/images/placeholder.png',
                category: item.category,
                productId: item.product_id,
                variantId: item.variant_id
            }));
            
            renderTable();
            updateSummaryStats();
        } else {
            throw new Error('Invalid data format received from server');
        }
    } catch (error) {
        console.error('Failed to load inventory:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        tbody.innerHTML = `<tr><td colspan="9" class="table-state-cell table-state-cell--error table-state-cell--spacious">
            <i class="fi fi-rs-warning table-state-icon"></i>
            Error loading inventory data: ${errorMsg}<br>
            <small class="table-state-help">Please check the browser console for details.</small>
        </td></tr>`;
    }
}

function updateSummaryStats() {
    const totalSkus = inventoryData.length;
    const totalStock = inventoryData.reduce((sum, item) => sum + item.stock, 0);
    const lowStock = inventoryData.filter(item => item.stock > 0 && item.stock <= item.reorder_level).length;
    const outOfStock = inventoryData.filter(item => item.stock <= 0).length;

    if (document.getElementById('totalSkus')) document.getElementById('totalSkus').innerText = totalSkus;
    if (document.getElementById('totalStock')) document.getElementById('totalStock').innerText = totalStock.toLocaleString();
    if (document.getElementById('lowStock')) document.getElementById('lowStock').innerText = lowStock;
    if (document.getElementById('outOfStock')) document.getElementById('outOfStock').innerText = outOfStock;
}

function renderTable(data = null) {
    const displayData = data || inventoryData;
    const tbody = document.getElementById('inventoryTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('inventoryTable');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (displayData.length === 0) {
        if(table) table.hidden = true;
        if(emptyState) emptyState.hidden = false;
        return;
    }

    if(table) table.hidden = false;
    if(emptyState) emptyState.hidden = true;

    displayData.forEach((item, index) => {
        let statusClass = 'status-in-stock';
        let statusText = 'In Stock';
        
        if (item.stock <= 0) {
            statusClass = 'status-out-of-stock';
            statusText = 'Out of Stock';
        } else if (item.stock <= item.reorder_level) {
            statusClass = 'status-low-stock';
            statusText = 'Low Stock';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="${item.productImage}" alt="" class="product-image" data-fallback-src="/assets/images/products/placeholder.png">
                    <div class="product-info">
                        <div class="product-name">${item.productName}</div>
                        <div class="product-meta__sub">${item.category || 'Uncategorized'}</div>
                    </div>
                </div>
            </td>
            <td>
                <div>
                    <span class="variant-badge">${item.color || 'N/A'}</span>
                    <span class="variant-badge">${item.size || 'N/A'}</span>
                </div>
            </td>
            <td><span class="product-sku">${item.sku}</span></td>
            <td class="stock-cell"><span id="stock-val-${index}">${item.stock}</span></td>
            <td class="stock-cell">${item.reserved}</td>
            <td class="stock-cell">${item.available}</td>
            <td class="stock-cell">${item.reorder_level}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="btn-small btn-edit inventory-edit-btn" id="editBtn-${index}" data-index="${index}">
                        <i class="fi fi-rs-edit"></i> Edit
                    </button>
                    <button type="button" class="btn-small btn-save inventory-save-btn" id="saveBtn-${index}" data-index="${index}" hidden>
                        <i class="fi fi-rs-check"></i> Save
                    </button>
                    <button type="button" class="btn-small btn-cancel inventory-cancel-btn" id="cancelBtn-${index}" data-index="${index}" hidden>
                        <i class="fi fi-rs-cross"></i> Cancel
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterInventory() {
    const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;

    const filtered = inventoryData.filter(item => {
        const matchesSearch = item.productName.toLowerCase().includes(searchTerm) || 
                              item.sku.toLowerCase().includes(searchTerm);
        const matchesCategory = category === "" || item.category.toLowerCase() === category.toLowerCase();
        
        let matchesStatus = true;
        if (status === 'in-stock') matchesStatus = item.stock > item.reorder_level;
        if (status === 'low-stock') matchesStatus = item.stock > 0 && item.stock <= item.reorder_level;
        if (status === 'out-of-stock') matchesStatus = item.stock <= 0;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderTable(filtered);
}

function startEdit(index) {
    if (editingRow !== null) cancelEdit(editingRow);
    
    editingRow = index;
    const item = inventoryData[index];
    const stockCell = document.getElementById(`stock-val-${index}`);
    
    stockCell.innerHTML = `<input type="number" id="edit-input-${index}" class="stock-input" value="${item.stock}" min="0">`;
    
    document.getElementById(`editBtn-${index}`).hidden = true;
    document.getElementById(`saveBtn-${index}`).hidden = false;
    document.getElementById(`cancelBtn-${index}`).hidden = false;
}

async function saveEdit(index) {
    const newValue = parseInt(document.getElementById(`edit-input-${index}`).value);
    const item = inventoryData[index];

    try {
        const response = await adminService.updateStock(item.variantId, newValue);

        if (response) {
            // Update local data
            item.stock = newValue;
            item.available = newValue - item.reserved;
            
            editingRow = null;
            renderTable();
            updateSummaryStats();
            
            if (window.showToast) window.showToast('Stock updated successfully', 'success');
        }
    } catch (error) {
        console.error('Update failed:', error);
        if (window.showToast) window.showToast('Failed to update stock', 'error');
        cancelEdit(index);
    }
}


function cancelEdit(index) {
    editingRow = null;
    renderTable();
}

function refreshData() {
    loadInventory();
}

function exportToCSV() {
    let csv = 'Product,SKU,Color,Size,Stock,Reserved,Available\n';
    inventoryData.forEach(item => {
        csv += `"${item.productName}","${item.sku}","${item.color}","${item.size}",${item.stock},${item.reserved},${item.available}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'inventory_export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

document.addEventListener('click', (event) => {
    const exportButton = event.target.closest('#exportInventoryBtn');
    if (exportButton) {
        exportToCSV();
        return;
    }

    const refreshButton = event.target.closest('#refreshInventoryBtn');
    if (refreshButton) {
        refreshData();
        return;
    }

    const editButton = event.target.closest('.inventory-edit-btn');
    if (editButton) {
        startEdit(Number(editButton.dataset.index));
        return;
    }

    const saveButton = event.target.closest('.inventory-save-btn');
    if (saveButton) {
        saveEdit(Number(saveButton.dataset.index));
        return;
    }

    const cancelButton = event.target.closest('.inventory-cancel-btn');
    if (cancelButton) {
        cancelEdit(Number(cancelButton.dataset.index));
    }
});

document.addEventListener('input', (event) => {
    if (event.target.id === 'searchProduct') {
        filterInventory();
    }
});

document.addEventListener('change', (event) => {
    if (event.target.id === 'filterCategory' || event.target.id === 'filterStatus') {
        filterInventory();
    }
});
