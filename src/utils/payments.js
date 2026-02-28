// Payment request management via Firestore
import { collection, doc, addDoc, getDocs, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { addCredits } from './credits';

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

export const createPaymentRequest = async (data) => {
    try {
        const requestData = {
            userUid: data.userUid,
            userEmail: data.userEmail,
            userName: data.userName,
            packageId: data.packageId,
            packageLabel: data.packageLabel,
            credits: data.credits,
            amount: data.amount,
            currency: data.currency || '₹',
            status: PAYMENT_STATUS.PENDING,
            createdAt: Date.now(),
            processedAt: null,
            notified: false
        };

        const docRef = await addDoc(collection(db, 'paymentRequests'), requestData);
        return { id: docRef.id, ...requestData };
    } catch (error) {
        console.error('Error creating payment request:', error);
        return null;
    }
};

export const getAllPaymentRequests = async () => {
    try {
        const q = query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error getting payment requests:', error);
        return [];
    }
};

export const getPendingPaymentRequests = async () => {
    try {
        const q = query(
            collection(db, 'paymentRequests'),
            where('status', '==', PAYMENT_STATUS.PENDING),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error getting pending payments:', error);
        return [];
    }
};

export const approvePaymentRequest = async (requestId, userUid, credits) => {
    try {
        const reqRef = doc(db, 'paymentRequests', requestId);
        await updateDoc(reqRef, {
            status: PAYMENT_STATUS.APPROVED,
            processedAt: Date.now()
        });

        // Add credits to the user's account
        await addCredits(userUid, credits, 'pro');
        return true;
    } catch (error) {
        console.error('Error approving payment:', error);
        return false;
    }
};

export const rejectPaymentRequest = async (requestId) => {
    try {
        const reqRef = doc(db, 'paymentRequests', requestId);
        await updateDoc(reqRef, {
            status: PAYMENT_STATUS.REJECTED,
            processedAt: Date.now()
        });
        return true;
    } catch (error) {
        console.error('Error rejecting payment:', error);
        return false;
    }
};
