import apiClient from '../services/apiClient.js';

let catalogProducts = [];

const state = {
  view: "grid",
  sort: "price-asc",
  searchQuery: ""
};

const productContainer = document.getElementById("productContainer");
const resultCount = document.getElementById("resultCount");
let searchInput;
let searchClearBtn;
let priceRange;
let priceValue;
let inStockOnly;
const sortSelect = document.getElementById("sortSelect");
const gridViewBtn = document.getElementById("gridViewBtn");
const listViewBtn = document.getElementById("listViewBtn");
let searchDebounceTimer = null;
const CART_STORAGE_KEY = "eyewear_cart_v1";
let productCardTemplate = "";

async function loadFilterComponent() {
  const mount = document.getElementById("catalogFilterMount");
  if (!mount) return false;

  try {
    const response = await fetch("/components/forms/search-form.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    mount.innerHTML = await response.text();
    initFilterUI();
    return true;
  } catch (error) {
    console.error("Failed to load search-form component:", error);
    mount.innerHTML = "<p style=\"color:#c0392b\">Unable to load filters.</p>";
    return false;
  }
}

function initFilterUI() {
    searchInput = document.getElementById("searchInput");
    searchClearBtn = document.getElementById("searchClearBtn");
    priceRange = document.getElementById("priceRange");
    priceValue = document.getElementById("priceValue");
    inStockOnly = document.getElementById("inStockOnly");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.searchQuery = e.target.value;
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(renderProducts, 300);
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener("click", () => {
            searchInput.value = "";
            state.searchQuery = "";
            renderProducts();
        });
    }

    if (priceRange) {
        priceRange.addEventListener("input", (e) => {
            priceValue.textContent = window.formatVND ? window.formatVND(e.target.value) : `${e.target.value} VND`;
            renderProducts();
        });
    }

    document.querySelectorAll(".filter-block input").forEach(input => {
        input.addEventListener("change", renderProducts);
    });
}

async function loadProductCardTemplate() {
  try {
    const response = await fetch("/components/product/product-card.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    productCardTemplate = await response.text();
    return true;
  } catch (error) {
    console.error("Failed to load product-card component:", error);
    return false;
  }
}

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function syncCartBadge() {
  window.dispatchEvent(new CustomEvent('content-loaded', { detail: { path: 'layout/Header' } }));
}

function showToast(message) {
  const oldToast = document.querySelector(".catalog-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "catalog-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 250);
  }, 1400);
}

window.addToCart = async function(variantId) {
  try {
    const res = await apiClient.post('/v1/cart', {
        variant_id: Number(variantId),
        quantity: 1
    });
    showToast('Đã thêm sản phẩm vào giỏ!');
    syncCartBadge();
  } catch (err) {
    if(err.response && err.response.status === 401) {
        alert('Vui lòng đăng nhập để thêm vào giỏ hàng.');
        window.location.href = '../auth/';
    } else {
        alert('Có lỗi xảy ra: ' + (err.response?.data?.message || err.message));
    }
  }
};

function getCheckedValues(containerId) {
  const container = document.getElementById(containerId);
  if(!container) return [];
  return Array.from(container.querySelectorAll("input[type=\"checkbox\"]:checked")).map(input => input.value);
}

function getSelectedGender() {
  const container = document.getElementById("genderFilters");
  if(!container) return "all";
  const selected = container.querySelector("input[type='radio']:checked");
  return selected ? selected.value : "all";
}

function applySort(products) {
  const sorted = [...products];
  if (state.sort === "price-asc") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (state.sort === "price-desc") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (state.sort === "name-asc") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

function getFilteredProducts() {
  const keyword = state.searchQuery.trim().toLowerCase();
  const categoryValues = getCheckedValues("categoryFilters");
  const brandValues = getCheckedValues("brandFilters");
  const gender = getSelectedGender();
  const maxPrice = priceRange ? Number(priceRange.value) : 5000000;

  const filtered = catalogProducts.filter((item) => {
    const keywordMatch = item.name.toLowerCase().includes(keyword) ||
                        item.brand.toLowerCase().includes(keyword) ||
                        item.category.toLowerCase().includes(keyword);

    const categoryMatch = categoryValues.length === 0 || categoryValues.includes(item.category);
    const brandMatch = brandValues.length === 0 || brandValues.includes(item.brand);
    const genderMatch = gender === "all" || item.gender === gender;
    const priceMatch = item.price <= maxPrice;
    const stockMatch = (!inStockOnly || !inStockOnly.checked) || item.stock > 0;

    return keywordMatch && categoryMatch && brandMatch && genderMatch && priceMatch && stockMatch;
  });

  return applySort(filtered);
}

function renderProductCard(item) {
  const detailUrl = `../details/index.html?id=${encodeURIComponent(item.product_id)}&name=${encodeURIComponent(item.name)}`;
  const displayPrice = window.formatVND ? window.formatVND(item.price) : item.price + ' VND';
  // Old price markup demo
  const displayOldPrice = window.formatVND ? window.formatVND(item.price * 1.2) : (item.price * 1.2) + ' VND';

  // Fix absolute path to proper relative path for the shop page depth
  let imagePath = item.image;
  if(imagePath.startsWith('/')) {
      imagePath = '../../' + imagePath.substring(1);
  }

  return productCardTemplate
    .replaceAll("{{DETAIL_URL}}", detailUrl)
    .replaceAll("{{IMAGE}}", imagePath)
    .replaceAll("{{NAME}}", item.name)
    .replaceAll("{{BADGE}}", item.badge || '')
    .replaceAll("{{CATEGORY}}", item.category || 'Eyewear')
    .replaceAll("{{BRAND}}", item.brand || 'No Brand')
    .replaceAll("{{PRICE}}", displayPrice)
    .replaceAll("{{OLD_PRICE}}", displayOldPrice)
    .replaceAll("{{ID}}", item.id); // Add variant ID!
}

function renderProducts() {
  const products = getFilteredProducts();
  if(resultCount) resultCount.textContent = `${products.length} product${products.length === 1 ? "" : "s"}`;

  if (!products.length) {
    productContainer.innerHTML = '<div class="catalog-empty"><h3>No products found</h3><p>Try changing filters or search keyword.</p></div>';
    return;
  }

  if(searchClearBtn && searchInput) searchClearBtn.classList.toggle("is-visible", searchInput.value.trim().length > 0);
  productContainer.innerHTML = products.map(renderProductCard).join("");
}

// Bootstrap
document.addEventListener("DOMContentLoaded", async () => {
    const isFilterLoaded = await loadFilterComponent();
    await loadProductCardTemplate();
    
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            state.sort = e.target.value;
            renderProducts();
        });
    }

    if (gridViewBtn) {
        gridViewBtn.addEventListener("click", () => {
            state.view = "grid";
            productContainer.className = "catalog-products grid-view";
            gridViewBtn.classList.add("active");
            listViewBtn.classList.remove("active");
        });
    }

    if (listViewBtn) {
        listViewBtn.addEventListener("click", () => {
            state.view = "list";
            productContainer.className = "catalog-products list-view";
            listViewBtn.classList.add("active");
            gridViewBtn.classList.remove("active");
        });
    }

    // LOAD FROM DB
    try {
        const res = await apiClient.get('/v1/products');
        const items = res.data.data;
        catalogProducts = items.map(p => ({
            id: p.first_variant_id || p.id,
            product_id: p.id,
            name: p.name,
            category: p.category ? p.category.name : 'Eyewear',
            brand: p.brand,
            gender: p.gender,
            price: parseFloat(p.base_price),
            stock: parseInt(p.total_stock),
            image: p.thumbnail || '../../assets/images/products/placeholder.png',
            badge: p.is_active ? 'Sale' : 'Out'
        }));
    } catch(e) {
        console.error("Failed fetching shop DB logic", e);
        showToast("Lỗi tải API dữ liệu kính!");
    }

    renderProducts();
});
