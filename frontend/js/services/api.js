import apiClient from './apiClient.js';
import authService from './authService.js';
import profileService from './profileService.js';
import cartService from './cartService.js';
import { supportService } from './supportService.js';

/**
 * Unified API Service Layer (Thin Client Architecture)
 * All business logic must remain on the backend.
 * This service layer only handles data transmission.
 */
const api = {
    auth: authService,
    profile: profileService,
    cart: cartService,
    support: supportService,
    
    // Direct access to client if needed
    client: apiClient,
    
    // Shared formatting utilities (UI only)
    formatCurrency: (value) => {
        return window.formatVND ? window.formatVND(value) : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    },
    fixImagePath: (path, depth = '../../') => {
        if (typeof path !== 'string' || !path) return depth + 'assets/images/products/placeholder.png';
        if (path.startsWith('http')) return path;
        if (path.startsWith('/storage')) return `http://localhost:8000${path}`;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return encodeURI(depth + cleanPath);
    }
};

export default api;
