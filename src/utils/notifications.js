import { collection, doc, addDoc, getDocs, updateDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const createNotification = async (userUid, data) => {
    try {
        const notificationData = {
            userUid,
            title: data.title,
            message: data.message,
            type: data.type || 'info', // 'success', 'error', 'info'
            read: false,
            createdAt: Date.now(),
            ...data.metadata // extra data like credits used, etc
        };

        const docRef = await addDoc(collection(db, 'notifications'), notificationData);
        return { id: docRef.id, ...notificationData };
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export const markNotificationRead = async (notificationId) => {
    try {
        const reqRef = doc(db, 'notifications', notificationId);
        await updateDoc(reqRef, {
            read: true
        });
        return true;
    } catch (error) {
        console.error('Error marking notification read:', error);
        return false;
    }
};

export const markAllNotificationsRead = async (userUid) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userUid', '==', userUid),
            where('read', '==', false)
        );
        const snapshot = await getDocs(q);

        const promises = snapshot.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true }));
        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        return false;
    }
};
