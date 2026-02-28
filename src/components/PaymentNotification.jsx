import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './PaymentNotification.css';

const PaymentNotification = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'paymentRequests'),
            where('userUid', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newNotifications = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(req => (req.status === 'approved' || req.status === 'rejected') && !req.notified);

            setNotifications(newNotifications);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDismiss = async (notificationId) => {
        // Optimistically remove from UI
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        try {
            const reqRef = doc(db, 'paymentRequests', notificationId);
            await updateDoc(reqRef, { notified: true });
        } catch (error) {
            console.error('Error updating notification status:', error);
            // We could revert the optimistic update here if needed
        }
    };

    if (notifications.length === 0) return null;

    return (
        <div className="payment-notification-container">
            {notifications.map(notif => (
                <div key={notif.id} className={`payment-notification-popup ${notif.status}`}>
                    <div className="notification-content">
                        {notif.status === 'approved' ? (
                            <>
                                <div className="notification-icon success">✅</div>
                                <div className="notification-text">
                                    <h4>Payment Successful</h4>
                                    <p>The credits have been added to your account.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="notification-icon error">❌</div>
                                <div className="notification-text">
                                    <h4>Payment Failed</h4>
                                    <p>Your payment was not successful. Kindly send the payment to the valid owner.</p>
                                </div>
                            </>
                        )}
                    </div>
                    <button className="notification-close-btn" onClick={() => handleDismiss(notif.id)} aria-label="Close notification">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
};

export default PaymentNotification;
