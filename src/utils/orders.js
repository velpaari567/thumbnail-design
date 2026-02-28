// Order management via Firestore
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const ORDER_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    DELIVERED: 'delivered'
};

export const saveOrder = async (orderId, data) => {
    try {
        const orderData = {
            userUid: data.userUid || '',
            userEmail: data.userEmail || '',
            userName: data.userName || '',
            templateId: data.templateId,
            templateName: data.templateName,
            templateIcon: data.templateIcon,
            templatePreviewColor: data.templatePreviewColor,
            texts: data.texts || {},
            photos: data.photos || [],
            speedTier: data.speedTier,
            baseCost: data.baseCost,
            totalCost: data.totalCost,
            status: ORDER_STATUS.PENDING,
            createdAt: Date.now(),
            deliveredAt: null,
            deliveredThumbnail: null,
            visibleAt: null,
            seen: false
        };

        const docRef = await addDoc(collection(db, 'orders'), orderData);
        return { id: docRef.id, ...orderData };
    } catch (error) {
        console.error('Error saving order:', error);
        return null;
    }
};

export const getAllOrders = async () => {
    try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error getting orders:', error);
        return [];
    }
};

export const getOrderById = async (orderId) => {
    try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting order:', error);
        return null;
    }
};

export const getPendingOrdersByUser = async (userUid) => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('userUid', '==', userUid),
            where('status', 'in', [ORDER_STATUS.PENDING, ORDER_STATUS.IN_PROGRESS])
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error getting pending orders:', error);
        return [];
    }
};

export const getDeliveredOrders = async () => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('status', '==', ORDER_STATUS.DELIVERED)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error getting delivered orders:', error);
        return [];
    }
};

export const deliverOrder = async (orderId, thumbnailBase64, delayMinutes = 0) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const now = Date.now();
        const visibleAt = delayMinutes > 0 ? now + (delayMinutes * 60 * 1000) : now;

        await updateDoc(orderRef, {
            status: ORDER_STATUS.DELIVERED,
            deliveredAt: now,
            deliveredThumbnail: thumbnailBase64,
            visibleAt: visibleAt,
            seen: false
        });
        return true;
    } catch (error) {
        console.error('Error delivering order:', error);
        return false;
    }
};

export const markOrderSeen = async (orderId) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { seen: true });
    } catch (error) {
        console.error('Error marking order seen:', error);
    }
};

export const isOrderVisible = (order) => {
    if (!order || order.status !== ORDER_STATUS.DELIVERED) return false;
    const now = Date.now();
    return !order.visibleAt || now >= order.visibleAt;
};

export const getUnseenDeliveredOrders = async (userUid) => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('userUid', '==', userUid),
            where('status', '==', ORDER_STATUS.DELIVERED),
            where('seen', '==', false)
        );
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter by visibility client-side
        return orders.filter(o => isOrderVisible(o));
    } catch (error) {
        console.error('Error getting unseen orders:', error);
        return [];
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status });
    } catch (error) {
        console.error('Error updating order status:', error);
    }
};
