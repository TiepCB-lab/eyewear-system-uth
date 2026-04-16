const catalogProducts = [
  {
    id: 1,
    name: "Aviator Edge 2.0",
    category: "Sunglasses",
    brand: "Ray-Ban",
    gender: "unisex",
    price: 229,
    stock: 14,
    image: "/assets/images/products/AN550012_3849.png",
    badge: "Hot"
  },
  {
    id: 2,
    name: "Urban Focus",
    category: "Optical",
    brand: "Molsion",
    gender: "women",
    price: 165,
    stock: 8,
    image: "/assets/images/products/AN550015_3817.png",
    badge: "New"
  },
  {
    id: 3,
    name: "Trail Carbon X",
    category: "Sunglasses",
    brand: "Oakley",
    gender: "men",
    price: 289,
    stock: 4,
    image: "/assets/images/products/AN550016_3796.png",
    badge: "Low stock"
  },
  {
    id: 4,
    name: "Night Reader Pro",
    category: "Blue Light",
    brand: "Gentle Monster",
    gender: "unisex",
    price: 199,
    stock: 22,
    image: "/assets/images/products/AN550021_3933.png",
    badge: "Best seller"
  },
  {
    id: 5,
    name: "M Street Lite",
    category: "Optical",
    brand: "Molsion",
    gender: "men",
    price: 129,
    stock: 0,
    image: "/assets/images/products/AN550029_3863.png",
    badge: "Restock soon"
  },
  {
    id: 6,
    name: "Sunline Drift",
    category: "Sunglasses",
    brand: "Ray-Ban",
    gender: "women",
    price: 254,
    stock: 9,
    image: "/assets/images/products/AN550030_3896.png",
    badge: "Trending"
  }
];

const state = {
  view: "grid",
  sort: "featured",
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
            priceValue.textContent = `$${e.target.value}`;
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
  const totalQty = readCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('.header__action-btn[title="Cart"] .count').forEach((el) => {
    el.textContent = String(totalQty);
  });
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

window.addToCart = function(productId) {
  const product = catalogProducts.find((item) => item.id === Number(productId));
  if (!product) return;

  const cartItems = readCart();
  const found = cartItems.find((item) => item.id === product.id);

  if (found) {
    found.quantity += 1;
  } else {
    cartItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  writeCart(cartItems);
  syncCartBadge();
  showToast(`${product.name} added to cart`);
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
  const maxPrice = priceRange ? Number(priceRange.value) : 1000;

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
  const detailUrl = `../details/index.html?id=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}`;
  const oldPrice = (item.price * 1.1).toFixed(1);

  return productCardTemplate
    .replaceAll("{{DETAIL_URL}}", detailUrl)
    .replaceAll("{{IMAGE}}", item.image)
    .replaceAll("{{NAME}}", item.name)
    .replaceAll("{{BADGE}}", item.badge)
    .replaceAll("{{CATEGORY}}", item.category)
    .replaceAll("{{BRAND}}", item.brand)
    .replaceAll("{{PRICE}}", item.price)
    .replaceAll("{{OLD_PRICE}}", oldPrice)
    .replaceAll("{{ID}}", item.id);
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
    await loadFilterComponent();
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

    renderProducts();
    syncCartBadge();
});
