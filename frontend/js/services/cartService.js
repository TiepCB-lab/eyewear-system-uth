import apiClient from './apiClient.js';

const CartService = {
  getCart: async () => {
    try {
      const response = await apiClient.get('/v1/cart');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  addToCart: async (variantId, quantity = 1) => {
    try {
      const response = await apiClient.post('/v1/cart', {
        variant_id: Number(variantId),
        quantity: quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  updateQuantity: async (cartItemId, quantity) => {
    try {
      const response = await apiClient.put('/v1/cart/update', {
        cart_item_id: cartItemId,
        quantity: quantity
      });
      return response.data;
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      throw error;
    }
  },

  removeItem: async (cartItemId) => {
    try {
      const response = await apiClient.delete('/v1/cart/delete', {
        data: { cart_item_id: cartItemId }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },

  setSelected: async (cartItemId, isSelected) => {
    try {
      const response = await apiClient.post('/v1/cart/toggle-selection', {
        cart_item_id: cartItemId,
        is_selected: isSelected ? 1 : 0
      });
      return response.data;
    } catch (error) {
      console.error('Error toggling cart item selection:', error);
      throw error;
    }
  },

  selectAll: async (isSelected) => {
    try {
      const response = await apiClient.post('/v1/cart/select-all', {
        is_selected: isSelected ? 1 : 0
      });
      return response.data;
    } catch (error) {
      console.error('Error selecting all cart items:', error);
      throw error;
    }
  },

  checkout: async (shippingAddress, billingAddress = null) => {
    try {
      // Backend now relies on is_selected state in the database
      const response = await apiClient.post('/v1/checkout', {
        shipping_address: shippingAddress,
        billing_address: billingAddress || shippingAddress
      });
      return response.data;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  },
};

export default CartService;
