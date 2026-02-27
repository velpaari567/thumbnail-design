// Order management utilities
// Stores all user orders with their data, photos, and delivery status

export const ORDER_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    DELIVERED: 'delivered'
};

export const saveOrder = (orderId, data) => {
    const orders = getAllOrders();
    const order = {
        id: orderId,
        userEmail: data.userEmail || 'user@gmail.com',
        userName: data.userName || 'Demo User',
        templateId: data.templateId,
        templateName: data.templateName,
        templateIcon: data.templateIcon,
        templatePreviewColor: data.templatePreviewColor,
        texts: data.texts || {},
        photos: data.photos || [], // Array of { label, dataUrl }
        speedTier: data.speedTier,
        baseCost: data.baseCost,
        totalCost: data.totalCost,
        status: ORDER_STATUS.PENDING,
        createdAt: Date.now(),
        deliveredAt: null,
        deliveredThumbnail: null, // base64 of the finished thumbnail
        seen: false // whether user has seen the delivered result
    };
    orders.push(order);
    localStorage.setItem('all_orders', JSON.stringify(orders));
    return order;
};

export const getAllOrders = () => {
    const saved = localStorage.getItem('all_orders');
    if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
};

export const getOrderById = (orderId) => {
    const orders = getAllOrders();
    return orders.find(o => o.id === orderId);
};

export const getPendingOrders = () => {
    return getAllOrders().filter(o => o.status !== ORDER_STATUS.DELIVERED);
};

export const getDeliveredOrders = () => {
    return getAllOrders().filter(o => o.status === ORDER_STATUS.DELIVERED);
};

export const deliverOrder = (orderId, thumbnailBase64, delayMinutes = 0) => {
    const orders = getAllOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return false;

    const now = Date.now();
    const visibleAt = delayMinutes > 0 ? now + (delayMinutes * 60 * 1000) : now;

    orders[index] = {
        ...orders[index],
        status: ORDER_STATUS.DELIVERED,
        deliveredAt: now,
        deliveredThumbnail: thumbnailBase64,
        visibleAt: visibleAt,
        seen: false
    };
    localStorage.setItem('all_orders', JSON.stringify(orders));
    return true;
};

export const markOrderSeen = (orderId) => {
    const orders = getAllOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return;

    orders[index] = { ...orders[index], seen: true };
    localStorage.setItem('all_orders', JSON.stringify(orders));
};

export const isOrderVisible = (order) => {
    if (!order || order.status !== ORDER_STATUS.DELIVERED) return false;
    const now = Date.now();
    // If visibleAt is not set (older orders), treat as immediately visible
    return !order.visibleAt || now >= order.visibleAt;
};

export const getUnseenDeliveredOrders = () => {
    return getAllOrders().filter(o =>
        o.status === ORDER_STATUS.DELIVERED && !o.seen && isOrderVisible(o)
    );
};

export const updateOrderStatus = (orderId, status) => {
    const orders = getAllOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return;

    orders[index] = { ...orders[index], status };
    localStorage.setItem('all_orders', JSON.stringify(orders));
};
