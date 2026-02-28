import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { markNotificationRead, markAllNotificationsRead } from '../utils/notifications';
import './NotificationsPanel.css';

const NotificationsPanel = ({ isOpen, onClose, onUnreadCount }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('userUid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
            const unreadCount = notifs.filter(n => !n.read).length;
            onUnreadCount(unreadCount);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, onUnreadCount]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest('.navbar-notif-btn')) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleMarkAllRead = async () => {
        if (user) {
            await markAllNotificationsRead(user.uid);
        }
    };

    const handleNotifClick = async (notif) => {
        if (!notif.read) {
            await markNotificationRead(notif.id);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="notif-panel animate-scale-in" ref={panelRef}>
            <div className="notif-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                    <button className="notif-mark-read" onClick={handleMarkAllRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="notif-list">
                {loading ? (
                    <div className="notif-empty">
                        <div className="spinner"></div>
                        <p>Loading...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notif-empty">
                        <div className="notif-empty-icon">🔔</div>
                        <p>You have no notifications right now.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`notif-item ${notif.read ? 'read' : 'unread'} type-${notif.type}`}
                            onClick={() => handleNotifClick(notif)}
                        >
                            <div className="notif-icon">
                                {notif.type === 'success' ? '✅' :
                                    notif.type === 'error' ? '❌' : 'ℹ️'}
                            </div>
                            <div className="notif-content">
                                <h4>{notif.title}</h4>
                                <p>{notif.message}</p>
                                <span className="notif-time">{formatDate(notif.createdAt)}</span>
                                {notif.metadata?.creditsUsed && (
                                    <div className="notif-meta-badge">💎 {notif.metadata.creditsUsed} credits used</div>
                                )}
                            </div>
                            {!notif.read && <div className="notif-unread-dot"></div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
