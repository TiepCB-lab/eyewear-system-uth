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

function initNewsletter() {
  document.addEventListener('submit', (e) => {
    if (e.target.classList.contains('newsletter__form')) {
      e.preventDefault();
      const input = e.target.querySelector('.newsletter__input');
      const email = input.value;
      if (email) {
        if (window.Notification) {
          window.Notification.show('Thank you for subscribing!', 'success');
        } else {
          alert('Thank you for subscribing!');
        }
        input.value = '';
      }
    }
  });
}

function initCoreUi() {
  initMenu();
  initImageGallery();
  initTabs();
  initSwiperInstances();
  initImageFallbacks();
  initNewsletter();
}

window.formatVND = function formatVND(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

window.EvelensNotify = {
    async _createOverlay() {
        let overlay = document.getElementById('evelens-notify-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'evelens-notify-overlay';
            overlay.className = 'evelens-notify-overlay';
            
            try {
                const response = await fetch('/components/modals/notification-template.html');
                if (!response.ok) throw new Error('Template not found');
                overlay.innerHTML = await response.text();
            } catch (err) {
                overlay.innerHTML = `
                    <div class="evelens-notify-card">
                        <div class="evelens-notify-content">
                            <h3 class="evelens-notify-title"></h3>
                            <p class="evelens-notify-desc"></p>
                            <div class="evelens-notify-actions"></div>
                        </div>
                    </div>
                `;
            }
            
            document.body.appendChild(overlay);
            const closeBtn = overlay.querySelector('.evelens-notify-close');
            if (closeBtn) closeBtn.onclick = () => this.hide();
            overlay.onclick = (e) => { if (e.target === overlay) this.hide(); };
        }
        return overlay;
    },

    async show({ type = 'success', title = '', desc = '', btnText = 'Close', onConfirm = null, secondaryBtn = null, image = null }) {
        const overlay = await this._createOverlay();
        const card = overlay.querySelector('.evelens-notify-card');
        const imgEl = overlay.querySelector('#evelens-notify-img');
        const statusIconEl = overlay.querySelector('#status-icon'); // From previous template maybe? No, let's use the new ones
        const iconBox = overlay.querySelector('.evelens-notify-icon-box');
        const titleEl = overlay.querySelector('#evelens-notify-title');
        const descEl = overlay.querySelector('#evelens-notify-desc');
        const actionsEl = overlay.querySelector('.evelens-notify-actions');

        // Set type class
        overlay.className = `evelens-notify-overlay notify-${type}`;
        
        // Handle Icon
        if (iconBox) {
            const icons = {
                success: '<i class="fi fi-rs-check"></i>',
                error: '<i class="fi fi-rs-cross-circle"></i>',
                warning: '<i class="fi fi-rs-exclamation"></i>',
                info: '<i class="fi fi-rs-info"></i>',
                loading: '<i class="fi fi-rs-spinner"></i>'
            };
            iconBox.innerHTML = icons[type] || icons.info;
        }

        // Set content
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;

        // Image Logic
        if (imgEl) {
            imgEl.src = image || '/assets/images/ui/notification-brand.png';
        }

        // Set actions
        if (actionsEl) {
            actionsEl.innerHTML = '';
            if (type !== 'loading') {
                if (secondaryBtn) {
                    const sBtn = document.createElement('button');
                    sBtn.className = 'evelens-notify-btn secondary';
                    sBtn.textContent = secondaryBtn.text;
                    sBtn.onclick = () => { this.hide(); secondaryBtn.action?.(); };
                    actionsEl.appendChild(sBtn);
                }

                const pBtn = document.createElement('button');
                pBtn.className = 'evelens-notify-btn primary';
                pBtn.textContent = btnText;
                pBtn.onclick = () => {
                    this.hide();
                    if (onConfirm) onConfirm();
                };
                actionsEl.appendChild(pBtn);
            }
        }

        // Show
        setTimeout(() => overlay.classList.add('show'), 10);

        return {
            update: (newOpts) => this.show({ ...{ type, title, desc, btnText, onConfirm, secondaryBtn, image }, ...newOpts }),
            hide: () => this.hide()
        };
    },

    async loading(desc = 'Processing...') {
        return await this.show({ type: 'loading', title: '', desc });
    },

    async success(title, desc, btnText = 'Close') {
        return await this.show({ type: 'success', title, desc, btnText });
    },

    async error(title, desc, btnText = 'Try Again') {
        return await this.show({ type: 'error', title, desc, btnText });
    },

    async info(title, desc, btnText = 'Got it') {
        return await this.show({ type: 'info', title, desc, btnText });
    },

    async confirm(title, desc, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel') {
        return await this.show({ 
            type: 'warning', 
            title, 
            desc, 
            btnText: confirmText, 
            onConfirm,
            secondaryBtn: { text: cancelText }
        });
    },

    hide() {
        const overlay = document.getElementById('evelens-notify-overlay');
        if (overlay) overlay.classList.remove('show');
    }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCoreUi);
} else {
  initCoreUi();
}


