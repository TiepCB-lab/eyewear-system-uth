import apiClient from './apiClient.js';

const CartService = {
  getCart: async () => {
    try {
      const response = await apiClient.get('/cart');
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  addToCart: async ({ variant_id, quantity = 1, lens_id = null, prescription = null, is_preorder = false }) => {
    if (!variant_id) {
      throw new Error('Variant ID is required.');
    }
    try {
      const response = await apiClient.post('/cart', {
        variant_id: Number(variant_id),
        quantity: Number(quantity),
        lens_id: lens_id ? Number(lens_id) : null,
        prescription: prescription,
        is_preorder: is_preorder ? true : false
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  updateQuantity: async (cartItemId, quantity) => {
    try {
      const response = await apiClient.put(`/cart/items/${cartItemId}`, {
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
      const response = await apiClient.delete(`/cart/items/${cartItemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },

  setSelected: async (cartItemId, isSelected) => {
    try {
      const response = await apiClient.post('/cart/toggle-selection', {
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
      const response = await apiClient.post('/cart/select-all', {
        is_selected: isSelected ? 1 : 0
      });
      return response.data;
    } catch (error) {
      console.error('Error selecting all cart items:', error);
      throw error;
    }
  },

  checkout: async (shippingAddress, paymentMethod = 'cod', billingAddress = null) => {
    try {
      const response = await apiClient.post('/checkout', {
        shipping_address: shippingAddress,
        billing_address: billingAddress || shippingAddress,
        payment_method: paymentMethod
      });
      return response.data;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  },

  applyVoucher: async (code) => {
    try {
      const response = await apiClient.post('/cart/voucher', { code });
      return response.data;
    } catch (error) {
      console.error('Error applying voucher:', error);
      throw error;
    }
  },

  removeVoucher: async () => {
    try {
      const response = await apiClient.delete('/cart/voucher');
      return response.data;
    } catch (error) {
      console.error('Error removing voucher:', error);
      throw error;
    }
  },
};

export default CartService;
