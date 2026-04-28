export const PERMISSIONS = {
    // CUSTOMER
    VIEW_PRODUCTS: 'view_products',
    SEARCH_PRODUCTS: 'search_products',
    VIEW_PRODUCT_DETAIL: 'view_product_detail',
    MANAGE_CART: 'manage_cart',
    CREATE_ORDER: 'create_order',
    VIEW_OWN_ORDERS: 'view_own_orders',
    REQUEST_RETURN: 'request_return',
    
    // SALES_STAFF
    VIEW_ORDERS: 'view_orders',
    VALIDATE_PRESCRIPTION: 'validate_prescription',
    CONTACT_CUSTOMER: 'contact_customer',
    CONFIRM_ORDER: 'confirm_order',
    HANDLE_PREORDER: 'handle_preorder',
    HANDLE_RETURNS: 'handle_returns',
    
    // OPERATIONS_STAFF
    PACK_ORDER: 'pack_order',
    CREATE_SHIPMENT: 'create_shipment',
    UPDATE_TRACKING: 'update_tracking',
    PROCESS_PREORDER_INVENTORY: 'process_preorder_inventory',
    PROCESS_PRESCRIPTION_ORDERS: 'process_prescription_orders',
    UPDATE_ORDER_STATUS: 'update_order_status',
    
    // MANAGER
    MANAGE_PRODUCTS: 'manage_products',
    MANAGE_PRICING: 'manage_pricing',
    MANAGE_PROMOTIONS: 'manage_promotions',
    MANAGE_USERS: 'manage_users',
    VIEW_REPORTS: 'view_reports',
    MANAGE_POLICIES: 'manage_policies',
    
    // ADMIN
    MANAGE_ROLES: 'manage_roles',
    MANAGE_PERMISSIONS: 'manage_permissions',
    MANAGE_SYSTEM_CONFIG: 'manage_system_config',
    MANAGE_ALL_USERS: 'manage_all_users',
    VIEW_SYSTEM_LOGS: 'view_system_logs'
};
