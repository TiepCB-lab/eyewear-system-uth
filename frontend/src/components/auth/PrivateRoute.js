// PrivateRoute.js - Protects routes based on authentication and role
import authService from '../../services/authService.js';

class PrivateRoute {
  constructor(requiredRole = null) {
    this.requiredRole = requiredRole;
  }

  async checkAccess() {
    try {
      if (!authService.isAuthenticated()) {
        window.location.href = '../auth/';
        return false;
      }

      const response = await authService.getCurrentUser();
      const user = response.user;

      if (this.requiredRole && user.role !== this.requiredRole) {
        alert('Access denied. Insufficient permissions.');
        window.location.href = '../accounts/';
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '../auth/';
      return false;
    }
  }

  // Initialize on page load
  static init(requiredRole = null) {
    const route = new PrivateRoute(requiredRole);
    return route.checkAccess();
  }
}

export default PrivateRoute;