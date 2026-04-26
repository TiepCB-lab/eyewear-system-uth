import api from '../services/api.js';

const state = {
  view: "grid",
  sort_by: "created_at",
  sort_direction: "DESC",
  search: "",
  category_ids: [],
  brands: [],
  genders: [],
  max_price: 5000000,
  page: 1
};

const productContainer = document.getElementById("productContainer");
const resultCount = document.getElementById("resultCount");
const sortSelect = document.getElementById("sortSelect");
const gridViewBtn = document.getElementById("gridViewBtn");
const listViewBtn = document.getElementById("listViewBtn");

let searchDebounceTimer = null;
let productCardTemplate = "";
let wishlistedIds = [];

async function loadFilterComponent() {
  const mount = document.getElementById("catalogFilterMount");
  if (!mount) return;
  try {
    const response = await fetch("/components/forms/search-form.html");
    mount.innerHTML = await response.text();
    await fetchFilters(); // Load dynamic data into the template
    initFilters();
  } catch (error) {
    console.error("Failed to load filters:", error);
  }
}

async function fetchFilters() {
    // Load categories
    try {
        const catRes = await api.client.get('/v1/products/categories');
        const categories = catRes.data?.data || [];
        const catContainer = document.querySelector('#categoryFilters .filter-options');
        if (catContainer && categories.length > 0) {
            catContainer.innerHTML = categories.map(c => `
                <label class="filter-option">
                    <input type="checkbox" name="category" value="${c.id}"> ${c.name}
                </label>
            `).join('');
        }
    } catch (err) {
        console.warn("Failed to fetch categories:", err);
    }

    // Load brands
    try {
        const brandRes = await api.client.get('/v1/products/brands');
        const brands = brandRes.data?.data || [];
        const brandContainer = document.querySelector('#brandFilters .filter-options');
        if (brandContainer && brands.length > 0) {
            brandContainer.innerHTML = brands.map(b => `
                <label class="filter-option">
                    <input type="checkbox" name="brand" value="${b}"> ${b}
                </label>
            `).join('');
        }
    } catch (err) {
        console.warn("Failed to fetch brands:", err);
    }
}

async function loadProductCardTemplate() {
  try {
    const response = await fetch("/components/product/product-card.html");
    productCardTemplate = await response.text();
  } catch (error) {
    console.error("Failed to load template:", error);
  }
}

async function fetchProducts() {
  try {
    const params = {
      q: state.search,
      sort_by: state.sort_by,
      sort_direction: state.sort_direction,
      category_ids: state.category_ids.join(','),
      brands: state.brands.join(','),
      gender: state.genders.join(','),
      max_price: state.max_price,
      page: state.page
    };

    const response = await api.client.get('/v1/products', { params });
    // Structure: response.data = { success: true, data: { data: [...], pagination: {...} } }
    const payload = response.data?.data || {};
    const products = payload.data || [];
    const pagination = payload.pagination || {};
    
    if (resultCount) resultCount.textContent = `${pagination.total || products.length} product(s)`;
    
    if (products.length === 0) {
      productContainer.innerHTML = '<div class="catalog-empty"><h3>No products found</h3></div>';
      if (document.getElementById("productPagination")) document.getElementById("productPagination").innerHTML = "";
      return;
    }

    productContainer.innerHTML = products.map(item => {
        const detailUrl = `../details/index.html?id=${item.id}`;
        const isWishlisted = wishlistedIds.includes(item.id);
        
        return productCardTemplate
            .replaceAll("{{DETAIL_URL}}", detailUrl)
            .replaceAll("{{IMAGE}}", api.fixImagePath(item.thumbnail))
            .replaceAll("{{NAME}}", item.name)
            .replaceAll("{{BADGE}}", item.is_active ? 'Sale' : '')
            .replaceAll("{{CATEGORY}}", item.category?.name || 'Eyewear')
            .replaceAll("{{BRAND}}", item.brand || '')
            .replaceAll("{{PRICE}}", api.formatCurrency(item.base_price))
            .replaceAll("{{OLD_PRICE}}", api.formatCurrency(item.base_price * 1.2))
            .replaceAll("{{ID}}", item.first_variant_id)
            .replaceAll("{{PRODUCT_ID}}", item.id)
            .replaceAll("{{WISHLIST_ICON}}", isWishlisted ? 'fi fi-ss-heart' : 'fi fi-rs-heart')
            .replaceAll("{{WISHLIST_CLASS}}", isWishlisted ? 'wishlist-active' : '')
            .replaceAll("{{WISHLIST_LABEL}}", isWishlisted ? 'Remove' : 'Add');
    }).join("");

    renderPagination(pagination);

  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

function renderPagination(pagination) {
    const container = document.getElementById("productPagination");
    if (!container) return;

    const { page, total_pages } = pagination;
    if (!total_pages || total_pages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    
    // Prev Button
    html += `<button class="pagination-btn ${page === 1 ? 'disabled' : ''}" data-page="${page - 1}"><i class="fi fi-rs-angle-small-left"></i></button>`;

    // Page Numbers
    for (let i = 1; i <= total_pages; i++) {
        html += `<button class="pagination-btn ${page === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    // Next Button
    html += `<button class="pagination-btn ${page === total_pages ? 'disabled' : ''}" data-page="${page + 1}"><i class="fi fi-rs-angle-small-right"></i></button>`;

    container.innerHTML = html;

    // Add events
    container.querySelectorAll('.pagination-btn:not(.disabled):not(.active)').forEach(btn => {
        btn.onclick = () => {
            state.page = parseInt(btn.dataset.page);
            fetchProducts();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    });
}

function initFilters() {
    const searchInput = document.getElementById("searchInput");
    searchInput?.addEventListener("input", (e) => {
        state.search = e.target.value;
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(fetchProducts, 400);
    });

    const priceRange = document.getElementById("priceRange");
    const priceValue = document.getElementById("priceValue");
    priceRange?.addEventListener("input", (e) => {
        state.max_price = e.target.value;
        if (priceValue) priceValue.textContent = api.formatCurrency(state.max_price);
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(fetchProducts, 400);
    });

    // Handle checkboxes for categories and brands
    document.getElementById('catalogFilterMount')?.addEventListener('change', (e) => {
        const input = e.target;
        if (input.type === 'checkbox') {
            const val = input.value;
            // Determine if it's category or brand based on parent ID
            const isCategory = input.closest('#categoryFilters');
            const isBrand = input.closest('#brandFilters');
            
            if (isCategory) {
                if (input.checked) state.category_ids.push(val);
                else state.category_ids = state.category_ids.filter(id => id !== val);
            } else if (isBrand) {
                if (input.checked) state.brands.push(val);
                else state.brands = state.brands.filter(b => b !== val);
            }
            state.page = 1; // Reset to page 1 on filter change
            fetchProducts();
        } else if (input.name === 'gender') {
            state.genders = input.value === 'all' ? [] : [input.value];
            state.page = 1; // Reset to page 1 on filter change
            fetchProducts();
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadProductCardTemplate();
    await loadFilterComponent();
    
    // Load Wishlist state
    try {
        const wl = await api.client.get('/v1/wishlist').catch(() => ({ data: { data: [] } }));
        wishlistedIds = (wl.data.data || []).map(i => i.product_id);
    } catch (e) {}

    sortSelect?.addEventListener("change", (e) => {
        const [by, dir] = e.target.value.split('-');
        state.sort_by = by === 'price' ? 'base_price' : by;
        state.sort_direction = dir.toUpperCase();
        state.page = 1; // Reset to page 1 on sort change
        fetchProducts();
    });

    fetchProducts();
});

