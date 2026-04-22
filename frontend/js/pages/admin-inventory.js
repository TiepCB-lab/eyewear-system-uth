import apiClient from '../services/apiClient.js';

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
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 3rem;">Loading inventory data...</td></tr>';

        const response = await apiClient.get('/v1/admin/inventory');
        
        if (response && response.data && Array.isArray(response.data.data)) {
            inventoryData = response.data.data.map(item => ({
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
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 3rem; color: #e11d48;">
            <i class="fi fi-rs-warning" style="font-size: 2rem; display: block; margin-bottom: 1rem;"></i>
            Error loading inventory data: ${errorMsg}<br>
            <small style="color: #64748b;">Please check the browser console for details.</small>
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
        if(table) table.style.display = 'none';
        if(emptyState) emptyState.style.display = 'block';
        return;
    }

    if(table) table.style.display = 'table';
    if(emptyState) emptyState.style.display = 'none';

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
                    <img src="${item.productImage}" alt="" class="product-image" onerror="this.src='/assets/images/placeholder.png'">
                    <div class="product-info">
                        <div class="product-name">${item.productName}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${item.category || 'Uncategorized'}</div>
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
                    <button class="btn-small btn-edit" id="editBtn-${index}" onclick="startEdit(${index})">
                        <i class="fi fi-rs-edit"></i> Edit
                    </button>
                    <button class="btn-small btn-save" id="saveBtn-${index}" onclick="saveEdit(${index})" style="display:none">
                        <i class="fi fi-rs-check"></i> Save
                    </button>
                    <button class="btn-small btn-cancel" id="cancelBtn-${index}" onclick="cancelEdit(${index})" style="display:none">
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
    
    document.getElementById(`editBtn-${index}`).style.display = 'none';
    document.getElementById(`saveBtn-${index}`).style.display = 'inline-flex';
    document.getElementById(`cancelBtn-${index}`).style.display = 'inline-flex';
}

async function saveEdit(index) {
    const newValue = parseInt(document.getElementById(`edit-input-${index}`).value);
    const item = inventoryData[index];

    try {
        const response = await apiClient.put('/v1/admin/inventory/stock', {
            variant_id: item.variantId,
            quantity: newValue
        });

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

// Expose functions to window for HTML onclick handlers
window.loadInventory = loadInventory;
window.filterInventory = filterInventory;
window.startEdit = startEdit;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.refreshData = refreshData;
window.exportToCSV = exportToCSV;
