import authService from '../services/authService.js';

export function protectStaffPortal() {
    if (!authService.isStaff()) {
        alert('Access Denied: This area is for staff members only.');
        window.location.href = '/pages/auth/index.html';
    }
}

// Auto-run if imported directly
if (window.location.pathname.includes('/dashboard/')) {
    protectStaffPortal();
}






