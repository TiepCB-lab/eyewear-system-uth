function initMenu() {
  const navMenu = document.getElementById("nav-menu");
  const navToggle = document.getElementById("nav-toggle");
  const navClose = document.getElementById("nav-close");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.add("show-menu");
    });
  }

  if (navClose && navMenu) {
    navClose.addEventListener("click", () => {
      navMenu.classList.remove("show-menu");
    });
  }
}

function initImageGallery() {
  const mainImage = document.querySelector(".details__img");
  const thumbnails = document.querySelectorAll(".details__small-img");

  if (!mainImage || !thumbnails.length) {
    return;
  }

  thumbnails.forEach((img) => {
    img.addEventListener("click", () => {
      mainImage.src = img.src;
    });
  });
}

function initSwiperInstances() {
  if (typeof window.Swiper !== "function") {
    return;
  }

  const categoriesContainer = document.querySelector(".categories__container");
  if (categoriesContainer) {
    window.swiperCategories = new window.Swiper(categoriesContainer, {
      spaceBetween: 24,
      loop: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        350: { slidesPerView: 2, spaceBetween: 24 },
        768: { slidesPerView: 3, spaceBetween: 24 },
        992: { slidesPerView: 4, spaceBetween: 24 },
        1200: { slidesPerView: 5, spaceBetween: 24 },
        1400: { slidesPerView: 6, spaceBetween: 24 },
      },
    });
  }

  const productsContainer = document.querySelector(".new__container");
  if (productsContainer) {
    window.swiperProducts = new window.Swiper(productsContainer, {
      spaceBetween: 24,
      loop: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 24 },
        992: { slidesPerView: 4, spaceBetween: 24 },
        1400: { slidesPerView: 4, spaceBetween: 24 },
      },
    });
  }
}

function initTabs() {
  const tabs = document.querySelectorAll("[data-target]");
  const tabContents = document.querySelectorAll("[content]");

  if (!tabs.length || !tabContents.length) {
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = document.querySelector(tab.dataset.target);
      if (!target) {
        return;
      }

      tabContents.forEach((tabContent) => {
        tabContent.classList.remove("active-tab");
      });

      tabs.forEach((currentTab) => {
        currentTab.classList.remove("active-tab");
      });

      target.classList.add("active-tab");
      tab.classList.add("active-tab");
    });
  });
}

function initImageFallbacks() {
  document.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) {
        return;
      }

      const fallbackSrc = target.dataset.fallbackSrc;
      if (!fallbackSrc || target.dataset.fallbackApplied === "1") {
        return;
      }

      target.dataset.fallbackApplied = "1";
      target.src = fallbackSrc;
    },
    true
  );
}

function initCoreUi() {
  initMenu();
  initImageGallery();
  initTabs();
  initSwiperInstances();
  initImageFallbacks();
}

window.formatVND = function formatVND(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCoreUi);
} else {
  initCoreUi();
}


