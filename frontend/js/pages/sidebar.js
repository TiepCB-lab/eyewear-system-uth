import authService from '../services/authService.js';

function initSidebar() {
    console.log('Sidebar Logic Initialized');
    
    // Handle Logout in Sidebar
    const logoutBtn = document.getElementById('staff-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authService.logout().then(() => window.location.href = '/frontend/index.html');
        });
    }

    // Active link highlighting logic can be added here
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initial run
initSidebar();






