// Mock Inventory Data
var mockInventory = [
    {
        id: 1,
        name: "Premium Acetate Optical",
        image: "/assets/images/products/AN550012_3849.png",
        category: "optical",
        variants: [
            { sku: "AN550012-BLK-54", color: "Black", size: "54mm", stock: 45, reserved: 5, reorderLevel: 10 },
            { sku: "AN550012-BRN-54", color: "Brown", size: "54mm", stock: 2, reserved: 1, reorderLevel: 10 },
            { sku: "AN550012-BLU-54", color: "Blue", size: "54mm", stock: 28, reserved: 2, reorderLevel: 10 }
        ]
    },
    {
        id: 2,
        name: "Blue Light Pro Frame",
        image: "/assets/images/products/AN550016_3796.png",
        category: "bluelight",
        variants: [
            { sku: "AN550016-BLU-52", color: "Blue", size: "52mm", stock: 0, reserved: 0, reorderLevel: 15 },
            { sku: "AN550016-BLK-52", color: "Black", size: "52mm", stock: 18, reserved: 3, reorderLevel: 15 }
        ]
    },
    {
        id: 3,
        name: "Polarized Aviator",
        image: "/assets/images/products/AN550012_3849.png",
        category: "sunglasses",
        variants: [
            { sku: "AVT-001-GLD-56", color: "Gold", size: "56mm", stock: 65, reserved: 8, reorderLevel: 10 },
            { sku: "AVT-001-SLV-56", color: "Silver", size: "56mm", stock: 3, reserved: 0, reorderLevel: 10 }
        ]
    }
];

var inventoryData = [];
var editingRow = null;

function loadInventory() {
    inventoryData = [];
    mockInventory.forEach(product => {
        product.variants.forEach(variant => {
            inventoryData.push({
                ...variant,
                productName: product.name,
                productImage: product.image,
                category: product.category,
                productId: product.id
            });
        });
    });
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('inventoryTable');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (inventoryData.length === 0) {
        if(table) table.style.display = 'none';
        if(emptyState) emptyState.style.display = 'block';
        return;
    }

    if(table) table.style.display = 'table';
    if(emptyState) emptyState.style.display = 'none';

    inventoryData.forEach((item, index) => {
        const available = item.stock - item.reserved;
        let statusClass = 'status-in-stock';
        let statusText = 'In Stock';
        
        if (item.stock === 0) {
            statusClass = 'status-out-of-stock';
            statusText = 'Out of Stock';
        } else if (item.stock <= item.reorderLevel) {
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
                    </div>
                </div>
            </td>
            <td>
                <div>
                    <span class="variant-badge">${item.color}</span>
                    <span class="variant-badge">${item.size}</span>
                </div>
            </td>
            <td><span class="product-sku">${item.sku}</span></td>
            <td class="stock-cell">
                <span id="stockDisplay-${index}">${item.stock}</span>
                <input type="number" id="stockInput-${index}" class="stock-input" value="${item.stock}" style="display: none;" min="0"/>
            </td>
            <td class="stock-cell">${item.reserved}</td>
            <td class="stock-cell" id="availableCell-${index}">${available}</td>
            <td class="stock-cell">${item.reorderLevel}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-edit" id="editBtn-${index}" onclick="startEdit(${index})">
                        <i class="fi fi-rs-edit"></i> Edit
                    </button>
                    <button class="btn-small btn-save" id="saveBtn-${index}" onclick="saveEdit(${index})">
                        <i class="fi fi-rs-check"></i> Save
                    </button>
                    <button class="btn-small btn-cancel" id="cancelBtn-${index}" onclick="cancelEdit(${index})">
                        <i class="fi fi-rs-cross"></i> Cancel
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.startEdit = function(index) {
    if (editingRow !== null && editingRow !== index) cancelEdit(editingRow);
    editingRow = index;
    document.getElementById(`stockDisplay-${index}`).style.display = 'none';
    document.getElementById(`stockInput-${index}`).style.display = 'block';
    document.getElementById(`editBtn-${index}`).style.display = 'none';
    document.getElementById(`saveBtn-${index}`).style.display = 'inline-flex';
    document.getElementById(`cancelBtn-${index}`).style.display = 'inline-flex';
    document.getElementById(`stockInput-${index}`).focus();
};

window.cancelEdit = function(index) {
    document.getElementById(`stockDisplay-${index}`).style.display = 'block';
    document.getElementById(`stockInput-${index}`).style.display = 'none';
    document.getElementById(`editBtn-${index}`).style.display = 'inline-flex';
    document.getElementById(`saveBtn-${index}`).style.display = 'none';
    document.getElementById(`cancelBtn-${index}`).style.display = 'none';
    document.getElementById(`stockInput-${index}`).value = inventoryData[index].stock;
    editingRow = null;
};

window.saveEdit = function(index) {
    const newStock = parseInt(document.getElementById(`stockInput-${index}`).value);
    if (isNaN(newStock) || newStock < 0) {
        showAlert('Please enter a valid quantity', 'error');
        return;
    }
    inventoryData[index].stock = newStock;
    const available = newStock - inventoryData[index].reserved;
    document.getElementById(`availableCell-${index}`).textContent = available;
    document.getElementById(`stockDisplay-${index}`).textContent = newStock;
    cancelEdit(index);
    showAlert(`Stock updated successfully: ${inventoryData[index].sku}`, 'success');
    updateStats();
};

window.filterInventory = function() {
    const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const statusFilter = document.getElementById('filterStatus').value;

    inventoryData = [];
    mockInventory.forEach(product => {
        product.variants.forEach(variant => {
            const item = {
                ...variant,
                productName: product.name,
                productImage: product.image,
                category: product.category,
                productId: product.id
            };
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                 variant.sku.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            let matchesStatus = true;
            if (statusFilter === 'in-stock') matchesStatus = item.stock > item.reorderLevel;
            else if (statusFilter === 'low-stock') matchesStatus = item.stock > 0 && item.stock <= item.reorderLevel;
            else if (statusFilter === 'out-of-stock') matchesStatus = item.stock === 0;

            if (matchesSearch && matchesCategory && matchesStatus) inventoryData.push(item);
        });
    });
    renderTable();
};

function updateStats() {
    let total = 0, lowStock = 0, outOfStock = 0;
    mockInventory.forEach(product => {
        product.variants.forEach(variant => {
            total += variant.stock;
            if (variant.stock === 0) outOfStock++;
            else if (variant.stock <= variant.reorderLevel) lowStock++;
        });
    });
    const skusEl = document.getElementById('totalSkus');
    const stockEl = document.getElementById('totalStock');
    const lowEl = document.getElementById('lowStock');
    const outEl = document.getElementById('outOfStock');
    
    if(skusEl) skusEl.textContent = mockInventory.reduce((sum, p) => sum + p.variants.length, 0);
    if(stockEl) stockEl.textContent = total;
    if(lowEl) lowEl.textContent = lowStock;
    if(outEl) outEl.textContent = outOfStock;
}

function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    if(!container) return;
    const alertBox = document.createElement('div');
    alertBox.className = `alert-box alert-${type}`;
    alertBox.innerHTML = `<i class="fi fi-rs-${type === 'success' ? 'check-circle' : 'alert'}"></i>${message}`;
    container.innerHTML = '';
    container.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 4000);
}

window.exportToCSV = function() {
    const headers = ['Product', 'Color', 'Size', 'SKU', 'Stock', 'Reserved', 'Available', 'Reorder Level'];
    const rows = inventoryData.map(item => [
        item.productName, item.color, item.size, item.sku, item.stock, item.reserved,
        item.stock - item.reserved, item.reorderLevel
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showAlert('CSV exported successfully', 'success');
};

window.refreshData = function() {
    loadInventory();
    showAlert('Data refreshed', 'success');
};

// Initialize
loadInventory();
updateStats();
