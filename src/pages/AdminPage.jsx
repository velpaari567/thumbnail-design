import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTemplates, saveTemplates } from '../data/templateData';
import { getCreditPackages, saveCreditPackages, getSpeedTiers, saveSpeedTiers } from '../data/pricingData';
import { getSystemSettings, updateSystemSettings } from '../utils/system';
import { getAllOrders, deliverOrder } from '../utils/orders';
import { getAllPaymentRequests, approvePaymentRequest, rejectPaymentRequest } from '../utils/payments';
import { getOffers, saveOffer, deleteOffer } from '../utils/offers';
import { getAllUsers } from '../utils/users'; // Added import for getAllUsers
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminPage.css';

const AdminPage = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');
    const [templates, setTemplates] = useState([]);
    const [creditPackages, setCreditPackages] = useState([]);
    const [speedTiers, setSpeedTiers] = useState([]);
    const [systemSettings, setSystemSettings] = useState({
        disableFreeGeneration: false,
        disableAllGeneration: false,
        enableMonthlyFreeCredits: true,
        monthlyFreeCreditsAmount: 10
    });
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [saved, setSaved] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [deliveryFile, setDeliveryFile] = useState(null);
    const [deliveryPreview, setDeliveryPreview] = useState(null);
    const [delivering, setDelivering] = useState(false);
    const [deliveryDelay, setDeliveryDelay] = useState(0);
    const [loading, setLoading] = useState(true);
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [processingPayment, setProcessingPayment] = useState(null);
    const [allOffers, setAllOffers] = useState([]);
    const [editingOffer, setEditingOffer] = useState(null);
    const firstLoad = useRef(true);
    const fileInputRef = useRef(null);

    // Initial data load
    useEffect(() => {
        const loadData = async () => {
            try {
                const [o, u, p, t, c, s, sys, offers] = await Promise.all([
                    getAllOrders(),
                    getAllUsers(),
                    getAllPaymentRequests(),
                    getTemplates(),
                    getCreditPackages(),
                    getSpeedTiers(),
                    getSystemSettings(),
                    getOffers()
                ]);
                setOrders(o);
                setUsers(u);
                setPaymentRequests(p);
                setTemplates(t);
                setCreditPackages(c);
                setSpeedTiers(s);
                setSystemSettings(sys);
                setAllOffers(offers);

                setLoading(false);
                // Allow auto-save after initial load
                setTimeout(() => { firstLoad.current = false; }, 500);
            } catch (error) {
                console.error('Error loading admin data:', error);
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Refresh orders and users periodically
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const [allOrders, payments, allUsers] = await Promise.all([
                    getAllOrders(),
                    getAllPaymentRequests(),
                    getAllUsers()
                ]);
                setOrders(allOrders);
                setPaymentRequests(payments);
                setUsers(allUsers);
            } catch (error) {
                console.error('Error refreshing data:', error);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-save logic
    useEffect(() => {
        if (firstLoad.current) return;

        const saveData = async () => {
            try {
                if (activeTab === 'templates') {
                    await saveTemplates(templates);
                } else if (activeTab === 'packages') {
                    await saveCreditPackages(creditPackages);
                } else if (activeTab === 'speed') {
                    await saveSpeedTiers(speedTiers);
                } else if (activeTab === 'settings') {
                    await updateSystemSettings(systemSettings);
                }
                showSaved();
            } catch (error) {
                console.error(`Error saving data for tab ${activeTab}: `, error);
            }
        };

        const debounceSave = setTimeout(saveData, 1000); // Debounce save to prevent too many writes
        return () => clearTimeout(debounceSave);

    }, [templates, creditPackages, speedTiers, systemSettings, activeTab]);


    const showSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Template editing
    const addNewTemplate = () => {
        const newTemplate = {
            id: `template-${Date.now()}`,
            name: 'New Template',
            description: 'Enter a description',
            previewColor: 'linear-gradient(135deg, #333333, #666666)',
            icon: '✏️',
            requirements: {
                photos: [],
                texts: []
            },
            baseCost: 10,
            offerCost: null
        };
        setTemplates([...templates, newTemplate]);
    };

    const removeTemplate = (index) => {
        if (window.confirm("Are you sure you want to delete this template? This cannot be undone.")) {
            const updated = [...templates];
            updated.splice(index, 1);
            setTemplates(updated);
        }
    };

    const updateTemplate = (index, field, value) => {
        const updated = [...templates];
        updated[index] = { ...updated[index], [field]: value };
        setTemplates(updated);
    };

    const updateTemplateRequirement = (tIndex, type, rIndex, field, value) => {
        const updated = [...templates];
        updated[tIndex] = { ...updated[tIndex], requirements: { ...updated[tIndex].requirements } };
        updated[tIndex].requirements[type] = [...updated[tIndex].requirements[type]];
        updated[tIndex].requirements[type][rIndex] = { ...updated[tIndex].requirements[type][rIndex], [field]: value };
        setTemplates(updated);
    };

    const addRequirement = (tIndex, type) => {
        const updated = [...templates];
        updated[tIndex] = { ...updated[tIndex], requirements: { ...updated[tIndex].requirements } };
        updated[tIndex].requirements[type] = [...updated[tIndex].requirements[type]];

        if (type === 'photos') {
            updated[tIndex].requirements.photos.push({
                id: `photo - ${Date.now()} `,
                label: 'New Photo',
                required: false
            });
        } else {
            updated[tIndex].requirements.texts.push({
                id: `text - ${Date.now()} `,
                label: 'New Text Field',
                placeholder: 'Enter text...',
                required: false
            });
        }
        setTemplates(updated);
    };

    const removeRequirement = (tIndex, type, rIndex) => {
        const updated = [...templates];
        updated[tIndex] = { ...updated[tIndex], requirements: { ...updated[tIndex].requirements } };
        updated[tIndex].requirements[type] = updated[tIndex].requirements[type].filter((_, i) => i !== rIndex);
        setTemplates(updated);
    };

    // Credit package editing
    const updatePackage = (index, field, value) => {
        const updated = [...creditPackages];
        updated[index] = { ...updated[index], [field]: field === 'credits' || field === 'price' ? Number(value) : value };
        setCreditPackages(updated);
    };

    const handleTemplateImageUpload = (tIndex, e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1048576) {
                alert('Image is too large. Please use an image under 1MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                updateTemplate(tIndex, 'thumbnailUrl', ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Speed tier editing
    const updateSpeedTier = (index, field, value) => {
        const updated = [...speedTiers];
        updated[index] = { ...updated[index], [field]: field === 'extraCredits' || field === 'minutes' ? Number(value) : value };
        setSpeedTiers(updated);
    };

    // System Settings editing
    const handleSystemSettingToggle = (field) => {
        setSystemSettings(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // Order delivery
    const handleDeliveryFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDeliveryFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => {
                setDeliveryPreview(ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeliver = async (orderId) => {
        if (!deliveryPreview || delivering) return;
        setDelivering(true);

        await deliverOrder(orderId, deliveryPreview, deliveryDelay);

        // Refresh orders
        const refreshed = await getAllOrders();
        setOrders(refreshed);
        setExpandedOrder(null);
        setDeliveryFile(null);
        setDeliveryPreview(null);
        setDeliveryDelay(0);
        setDelivering(false);
        showSaved();
    };

    const handleDownloadPhoto = (dataUrl, label) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${label.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleApprovePayment = async (req) => {
        if (processingPayment) return;
        setProcessingPayment(req.id);
        const success = await approvePaymentRequest(req.id, req.userUid, req.credits);
        if (success) {
            const updated = await getAllPaymentRequests();
            setPaymentRequests(updated);
            showSaved();
        }
        setProcessingPayment(null);
    };

    const handleRejectPayment = async (req) => {
        if (processingPayment) return;
        setProcessingPayment(req.id);
        const success = await rejectPaymentRequest(req.id);
        if (success) {
            const updated = await getAllPaymentRequests();
            setPaymentRequests(updated);
        }
        setProcessingPayment(null);
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="admin-page page">
                <div className="container">
                    <div className="gen-empty animate-fade-in">
                        <div className="gen-waiting-spinner"></div>
                        <p>Loading admin panel...</p>
                    </div>
                </div>
            </div>
        );
    }

    const pendingOrders = orders.filter(o => o.status !== 'delivered');
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const pendingPayments = paymentRequests.filter(p => p.status === 'pending');

    return (
        <div className="admin-page page">
            <div className="container">
                <div className="admin-header animate-fade-in">
                    <button className="btn btn-secondary" onClick={() => navigate('/home')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>
                    <div>
                        <h1 className="admin-title">Admin Panel ⚙️</h1>
                        <p className="admin-subtitle">Manage orders, users, templates, and pricing</p>
                    </div>
                </div>

                {/* Saved Toast */}
                {saved && (
                    <div className="admin-saved-toast animate-scale-in">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20,6 9,17 4,12" />
                        </svg>
                        Saved!
                    </div>
                )}

                {/* Tabs */}
                <div className="admin-tabs animate-fade-in-up stagger-1">
                    {[
                        { id: 'payments', label: '💰 Payments', badge: pendingPayments.length || null },
                        { id: 'orders', label: '📦 Orders', badge: pendingOrders.length || null },
                        { id: 'offers', label: '🎁 Offers', badge: allOffers.length || null },
                        { id: 'users', label: '👥 Users', badge: `${users.length} ` },
                        { id: 'templates', label: '🎨 Templates' },
                        { id: 'packages', label: '💎 Credit Packages' },
                        { id: 'speed', label: '⚡ Speed Tiers' },
                        { id: 'settings', label: '⚙️ Controls' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            {tab.badge && <span className="admin-tab-badge">{tab.badge}</span>}
                        </button>
                    ))}
                </div>

                {/* PAYMENTS TAB */}
                {activeTab === 'payments' && (
                    <div className="admin-section animate-fade-in">
                        <h2>Payment Requests ({pendingPayments.length} pending)</h2>

                        {paymentRequests.length === 0 ? (
                            <div className="admin-empty glass-card">
                                <span className="admin-empty-icon">💰</span>
                                <p>No payment requests yet. They will appear here when users purchase credits.</p>
                            </div>
                        ) : (
                            <div className="admin-orders-list">
                                {paymentRequests.map(req => (
                                    <div key={req.id} className={`admin-order-card glass-card ${req.status === 'pending' ? 'admin-payment-pending' : ''}`}>
                                        <div className="admin-order-header">
                                            <div className="admin-order-left">
                                                <div className="admin-order-template-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                                                    💰
                                                </div>
                                                <div>
                                                    <div className="admin-order-name">
                                                        {req.packageLabel} — {req.credits} credits
                                                    </div>
                                                    <div className="admin-order-user">
                                                        {req.userName || req.userEmail} · {formatDate(req.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="admin-order-right">
                                                <span className={`admin-order-status status-${req.status}`}>
                                                    {req.status === 'pending' ? '⏳ Pending' :
                                                        req.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                                                </span>
                                                <span className="admin-order-cost" style={{ color: '#10b981', fontWeight: 700 }}>
                                                    {req.currency}{req.amount}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="admin-payment-details">
                                            <div className="admin-payment-info-grid">
                                                <div className="admin-payment-info-item">
                                                    <span className="admin-payment-info-label">User Email</span>
                                                    <span className="admin-payment-info-value">{req.userEmail}</span>
                                                </div>
                                                <div className="admin-payment-info-item">
                                                    <span className="admin-payment-info-label">Package</span>
                                                    <span className="admin-payment-info-value">{req.packageLabel}</span>
                                                </div>
                                                <div className="admin-payment-info-item">
                                                    <span className="admin-payment-info-label">Credits</span>
                                                    <span className="admin-payment-info-value">💎 {req.credits}</span>
                                                </div>
                                                <div className="admin-payment-info-item">
                                                    <span className="admin-payment-info-label">Amount</span>
                                                    <span className="admin-payment-info-value" style={{ color: '#10b981', fontWeight: 700 }}>{req.currency}{req.amount}</span>
                                                </div>
                                            </div>

                                            {req.status === 'pending' && (
                                                <div className="admin-payment-actions">
                                                    <button
                                                        className="btn btn-primary admin-approve-btn"
                                                        onClick={() => handleApprovePayment(req)}
                                                        disabled={processingPayment === req.id}
                                                    >
                                                        {processingPayment === req.id ? (
                                                            <><span className="spinner"></span> Processing...</>
                                                        ) : (
                                                            <>✅ Approve & Add Credits</>
                                                        )}
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary admin-reject-btn"
                                                        onClick={() => handleRejectPayment(req)}
                                                        disabled={processingPayment === req.id}
                                                    >
                                                        ❌ Reject
                                                    </button>
                                                </div>
                                            )}

                                            {req.status === 'approved' && (
                                                <div className="admin-payment-approved-note">
                                                    ✅ Payment approved — {req.credits} credits added to user's account
                                                </div>
                                            )}

                                            {req.status === 'rejected' && (
                                                <div className="admin-payment-rejected-note">
                                                    ❌ Payment request rejected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* OFFERS TAB */}
                {activeTab === 'offers' && (
                    <div className="admin-section animate-fade-in">
                        <div className="admin-orders-filter">
                            <h2>Manage Offers ({allOffers.length})</h2>
                            <button
                                className="btn btn-primary"
                                onClick={() => setEditingOffer({
                                    title: '',
                                    description: '',
                                    emoji: '🎁',
                                    type: 'discount',
                                    startDate: '',
                                    endDate: '',
                                    isActive: true
                                })}
                                style={{ marginLeft: 'auto' }}
                            >
                                + New Offer
                            </button>
                        </div>

                        {/* Create / Edit Offer Form */}
                        {editingOffer && (
                            <div className="admin-offer-form glass-card">
                                <h3>{editingOffer.id ? 'Edit Offer' : 'Create New Offer'}</h3>
                                <div className="admin-offer-form-grid">
                                    <div className="admin-field">
                                        <label>Emoji</label>
                                        <input
                                            type="text"
                                            value={editingOffer.emoji}
                                            onChange={(e) => setEditingOffer({ ...editingOffer, emoji: e.target.value })}
                                            style={{ width: '60px', textAlign: 'center', fontSize: '1.5rem' }}
                                        />
                                    </div>
                                    <div className="admin-field" style={{ flex: 1 }}>
                                        <label>Title</label>
                                        <input
                                            type="text"
                                            value={editingOffer.title}
                                            onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                                            placeholder="e.g. 50% OFF on all packages!"
                                        />
                                    </div>
                                </div>
                                <div className="admin-field">
                                    <label>Description</label>
                                    <textarea
                                        value={editingOffer.description}
                                        onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                                        placeholder="Describe the offer details..."
                                        rows={2}
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </div>
                                <div className="admin-offer-form-grid">
                                    <div className="admin-field">
                                        <label>Start Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={editingOffer.startDate}
                                            onChange={(e) => setEditingOffer({ ...editingOffer, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="admin-field">
                                        <label>End Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={editingOffer.endDate}
                                            onChange={(e) => setEditingOffer({ ...editingOffer, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="admin-offer-form-grid">
                                    <div className="admin-field">
                                        <label>Type</label>
                                        <select
                                            value={editingOffer.type}
                                            onChange={(e) => setEditingOffer({ ...editingOffer, type: e.target.value })}
                                        >
                                            <option value="discount">💰 Discount</option>
                                            <option value="bonus">🎁 Bonus Credits</option>
                                            <option value="special">⭐ Special Offer</option>
                                            <option value="flash">⚡ Flash Sale</option>
                                            <option value="seasonal">🎄 Seasonal</option>
                                        </select>
                                    </div>
                                    <div className="admin-field">
                                        <label className="admin-req-checkbox" style={{ marginTop: '24px' }}>
                                            <input
                                                type="checkbox"
                                                checked={editingOffer.isActive}
                                                onChange={(e) => setEditingOffer({ ...editingOffer, isActive: e.target.checked })}
                                            />
                                            Active (visible to users)
                                        </label>
                                    </div>
                                </div>
                                <div className="admin-offer-form-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={async () => {
                                            const saved = await saveOffer(editingOffer);
                                            if (saved) {
                                                const updated = await getOffers();
                                                setAllOffers(updated);
                                                setEditingOffer(null);
                                                showSaved();
                                            }
                                        }}
                                    >
                                        {editingOffer.id ? 'Update Offer' : 'Create Offer'}
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setEditingOffer(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Offers List */}
                        {allOffers.length === 0 && !editingOffer ? (
                            <div className="admin-empty glass-card">
                                <span className="admin-empty-icon">🎁</span>
                                <p>No offers created yet. Click "+ New Offer" to create your first offer!</p>
                            </div>
                        ) : (
                            <div className="admin-orders-list">
                                {allOffers.map(offer => {
                                    const now = new Date();
                                    const start = offer.startDate ? new Date(offer.startDate) : null;
                                    const end = offer.endDate ? new Date(offer.endDate) : null;
                                    let status = 'active';
                                    if (!offer.isActive) status = 'inactive';
                                    else if (end && end < now) status = 'expired';
                                    else if (start && start > now) status = 'upcoming';

                                    return (
                                        <div key={offer.id} className={`admin-order-card glass-card admin-offer-card-${status}`}>
                                            <div className="admin-order-header">
                                                <div className="admin-order-left">
                                                    <div className="admin-order-template-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', fontSize: '1.3rem' }}>
                                                        {offer.emoji}
                                                    </div>
                                                    <div>
                                                        <div className="admin-order-name">{offer.title}</div>
                                                        <div className="admin-order-user">
                                                            {offer.description}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="admin-order-right">
                                                    <span className={`admin-order-status status-${status}`}>
                                                        {status === 'active' ? '🟢 Live' :
                                                            status === 'upcoming' ? '🟡 Upcoming' :
                                                                status === 'expired' ? '🔴 Expired' : '⚪ Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="admin-offer-meta">
                                                <div className="admin-offer-dates">
                                                    {offer.startDate && (
                                                        <span>📅 Start: {new Date(offer.startDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    )}
                                                    {offer.endDate && (
                                                        <span>🏁 End: {new Date(offer.endDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    )}
                                                </div>
                                                <div className="admin-offer-actions">
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                        onClick={() => setEditingOffer({ ...offer })}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary admin-reject-btn"
                                                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                        onClick={async () => {
                                                            await deleteOffer(offer.id);
                                                            const updated = await getOffers();
                                                            setAllOffers(updated);
                                                        }}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="admin-section animate-fade-in">
                        <div className="admin-orders-filter">
                            <h2>Active Orders ({pendingOrders.length})</h2>
                        </div>

                        {orders.length === 0 ? (
                            <div className="admin-empty glass-card">
                                <span className="admin-empty-icon">📋</span>
                                <p>No orders yet. Orders will appear here when users generate thumbnails.</p>
                            </div>
                        ) : (
                            <div className="admin-orders-list">
                                {orders.map(order => (
                                    <div key={order.id} className="admin-order-card glass-card">
                                        <div
                                            className="admin-order-header"
                                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                        >
                                            <div className="admin-order-left">
                                                <div
                                                    className="admin-order-template-icon"
                                                    style={{ background: order.templatePreviewColor }}
                                                >
                                                    {order.templateIcon}
                                                </div>
                                                <div>
                                                    <div className="admin-order-name">{order.templateName}</div>
                                                    <div className="admin-order-user">
                                                        {order.userEmail} · {formatDate(order.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="admin-order-right">
                                                <span className={`admin - order - status status - ${order.status} `}>
                                                    {order.status === 'pending' ? '⏳ Pending' :
                                                        order.status === 'delivered' ? '✅ Delivered' : '🔄 In Progress'}
                                                </span>
                                                <span className="admin-order-cost">{order.totalCost} credits</span>
                                                <svg
                                                    width="20" height="20" viewBox="0 0 24 24" fill="none"
                                                    stroke="currentColor" strokeWidth="2"
                                                    style={{
                                                        transform: expandedOrder === order.id ? 'rotate(180deg)' : 'none',
                                                        transition: 'transform 0.2s'
                                                    }}
                                                >
                                                    <polyline points="6,9 12,15 18,9" />
                                                </svg>
                                            </div>
                                        </div>

                                        {expandedOrder === order.id && (
                                            <div className="admin-order-details animate-fade-in">
                                                {/* Text requirements */}
                                                {order.texts && Object.keys(order.texts).length > 0 && (
                                                    <div className="admin-order-section">
                                                        <h3>✏️ Text Content</h3>
                                                        <div className="admin-order-texts">
                                                            {Object.entries(order.texts).map(([key, value]) => (
                                                                <div key={key} className="admin-order-text-item">
                                                                    <span className="admin-order-text-label">{key}:</span>
                                                                    <span className="admin-order-text-value">{value || '(empty)'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Photo requirements */}
                                                {order.photos && order.photos.length > 0 && (
                                                    <div className="admin-order-section">
                                                        <h3>📸 Uploaded Photos</h3>
                                                        <div className="admin-order-photos">
                                                            {order.photos.map((photo, idx) => (
                                                                <div key={idx} className="admin-order-photo">
                                                                    <img src={photo.dataUrl} alt={photo.label} />
                                                                    <div className="admin-order-photo-info">
                                                                        <span>{photo.label}</span>
                                                                        <button
                                                                            className="btn btn-secondary"
                                                                            onClick={() => handleDownloadPhoto(photo.dataUrl, photo.label)}
                                                                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                                        >
                                                                            ⬇ Download
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Speed tier info */}
                                                {order.speedTier && (
                                                    <div className="admin-order-section">
                                                        <h3>⚡ Speed</h3>
                                                        <p>{order.speedTier.label} — {order.speedTier.description}</p>
                                                    </div>
                                                )}

                                                {/* Delivery section */}
                                                {order.status !== 'delivered' && (
                                                    <div className="admin-order-section admin-deliver-section">
                                                        <h3>🚀 Attach & Send Thumbnail</h3>
                                                        <div className="admin-deliver-upload">
                                                            <input
                                                                type="file"
                                                                ref={fileInputRef}
                                                                accept="image/*"
                                                                onChange={handleDeliveryFileChange}
                                                                style={{ display: 'none' }}
                                                            />
                                                            <button
                                                                className="btn btn-secondary"
                                                                onClick={() => fileInputRef.current?.click()}
                                                            >
                                                                {deliveryFile ? '📎 Change File' : '📎 Choose Thumbnail'}
                                                            </button>

                                                            {deliveryPreview && (
                                                                <div className="admin-deliver-preview">
                                                                    <img src={deliveryPreview} alt="Preview" />
                                                                    <span>{deliveryFile?.name}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {deliveryPreview && (
                                                            <>
                                                                <div className="admin-deliver-delay">
                                                                    <label>⏱️ Show thumbnail to user after:</label>
                                                                    <div className="admin-deliver-delay-input">
                                                                        <input
                                                                            type="number"
                                                                            value={deliveryDelay}
                                                                            onChange={(e) => setDeliveryDelay(Math.max(0, Number(e.target.value)))}
                                                                            min="0"
                                                                            placeholder="0"
                                                                        />
                                                                        <span>minutes</span>
                                                                    </div>
                                                                    <p className="admin-deliver-delay-note">
                                                                        {deliveryDelay > 0 ? `Thumbnail will appear to the user after ${deliveryDelay} minute${deliveryDelay !== 1 ? 's' : ''}.` : 'Thumbnail will appear immediately.'}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    className="btn btn-primary btn-large admin-send-btn"
                                                                    onClick={() => handleDeliver(order.id)}
                                                                    disabled={delivering}
                                                                >
                                                                    {delivering ? (
                                                                        <><span className="spinner"></span> Sending...</>
                                                                    ) : (
                                                                        <>🚀 Send to User{deliveryDelay > 0 ? ` (visible in ${deliveryDelay}m)` : ''}</>
                                                                    )}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Delivered thumbnail preview */}
                                                {order.status === 'delivered' && order.deliveredThumbnail && (
                                                    <div className="admin-order-section">
                                                        <h3>✅ Delivered Thumbnail</h3>
                                                        <div className="admin-deliver-preview">
                                                            <img src={order.deliveredThumbnail} alt="Delivered" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="admin-section animate-fade-in">
                        <div className="admin-users-stats">
                            <div className="admin-stat-card glass-card">
                                <div className="admin-stat-number">{users.length}</div>
                                <div className="admin-stat-label">Total Users</div>
                            </div>
                        </div>
                        <div className="admin-users-table-wrap glass-card">
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Free Credits</th>
                                        <th>Pro Credits</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.uid}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <div className="admin-user-avatar">
                                                        {(u.displayName || u.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    {u.displayName || 'Unknown'}
                                                </div>
                                            </td>
                                            <td>{u.email}</td>
                                            <td>{u.credits?.free || 0}</td>
                                            <td>{u.credits?.pro || 0}</td>
                                            <td><strong>{(u.credits?.free || 0) + (u.credits?.pro || 0)}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TEMPLATES TAB */}
                {activeTab === 'templates' && (
                    <div className="admin-section animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-md)' }}>
                            <button className="btn btn-primary" onClick={addNewTemplate}>
                                + Add New Template
                            </button>
                        </div>
                        {templates.map((template, tIndex) => (
                            <div key={template.id} className="admin-template-card glass-card" style={{ position: 'relative' }}>
                                <div className="admin-template-header">
                                    <div className="admin-template-preview" style={{
                                        background: template.previewColor,
                                        backgroundImage: template.thumbnailUrl ? `url(${template.thumbnailUrl})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <button
                                            onClick={() => removeTemplate(tIndex)}
                                            style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                left: '-5px',
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                zIndex: 10
                                            }}
                                            title="Delete Template"
                                        >
                                            ×
                                        </button>
                                        {!template.thumbnailUrl && (
                                            <input
                                                type="text"
                                                value={template.icon}
                                                onChange={(e) => updateTemplate(tIndex, 'icon', e.target.value)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'white',
                                                    fontSize: '1.5rem',
                                                    width: '40px',
                                                    textAlign: 'center',
                                                    padding: 0
                                                }}
                                                title="Edit Emoji/Icon"
                                            />
                                        )}
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '2px', textAlign: 'center' }}>
                                            <label style={{ fontSize: '0.6rem', color: 'white', cursor: 'pointer', display: 'block' }}>
                                                Upload
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleTemplateImageUpload(tIndex, e)}
                                                />
                                            </label>
                                            {template.thumbnailUrl && (
                                                <button
                                                    onClick={() => updateTemplate(tIndex, 'thumbnailUrl', null)}
                                                    style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '0.6rem', cursor: 'pointer', padding: '0 2px' }}
                                                    title="Remove Image"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            value={template.name}
                                            onChange={(e) => updateTemplate(tIndex, 'name', e.target.value)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '4px',
                                                color: 'white',
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold',
                                                width: '100%',
                                                marginBottom: '4px',
                                                padding: '4px 8px'
                                            }}
                                            title="Edit Template Name"
                                        />
                                        <input
                                            type="text"
                                            value={template.description}
                                            onChange={(e) => updateTemplate(tIndex, 'description', e.target.value)}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '4px',
                                                color: 'var(--text-muted)',
                                                fontSize: 'var(--font-sm)',
                                                width: '100%',
                                                padding: '4px 8px'
                                            }}
                                            title="Edit Template Description"
                                        />
                                    </div>
                                    <div className="admin-template-cost">
                                        <label>Regular Credits</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <input
                                                type="number"
                                                value={template.baseCost}
                                                onChange={(e) => updateTemplate(tIndex, 'baseCost', Number(e.target.value))}
                                                style={{ width: '60px', textAlign: 'center' }}
                                            />
                                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>credits</span>
                                        </div>
                                    </div>
                                    <div className="admin-template-cost">
                                        <label>Offer Credits</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <input
                                                type="text"
                                                value={template.offerCost !== null && template.offerCost !== undefined ? template.offerCost : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    updateTemplate(tIndex, 'offerCost', val === '' ? null : Number(val));
                                                }}
                                                placeholder="None"
                                                style={{ width: '60px', textAlign: 'center' }}
                                            />
                                            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>credits</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Photo requirements */}
                                <div className="admin-req-section">
                                    <div className="admin-req-header">
                                        <span>📸 Photo Requirements ({template.requirements.photos.length})</span>
                                        <button className="btn btn-secondary" onClick={() => addRequirement(tIndex, 'photos')}
                                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                            + Add Photo
                                        </button>
                                    </div>
                                    {template.requirements.photos.map((photo, pIndex) => (
                                        <div key={photo.id} className="admin-req-item">
                                            <input
                                                type="text"
                                                value={photo.label}
                                                onChange={(e) => updateTemplateRequirement(tIndex, 'photos', pIndex, 'label', e.target.value)}
                                            />
                                            <label className="admin-req-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={photo.required}
                                                    onChange={(e) => updateTemplateRequirement(tIndex, 'photos', pIndex, 'required', e.target.checked)}
                                                />
                                                Required
                                            </label>
                                            <button className="admin-req-remove" onClick={() => removeRequirement(tIndex, 'photos', pIndex)}>×</button>
                                        </div>
                                    ))}
                                </div>

                                {/* Text requirements */}
                                <div className="admin-req-section">
                                    <div className="admin-req-header">
                                        <span>✏️ Text Requirements ({template.requirements.texts.length})</span>
                                        <button className="btn btn-secondary" onClick={() => addRequirement(tIndex, 'texts')}
                                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                            + Add Text
                                        </button>
                                    </div>
                                    {template.requirements.texts.map((text, txIndex) => (
                                        <div key={text.id} className="admin-req-item">
                                            <input
                                                type="text"
                                                value={text.label}
                                                onChange={(e) => updateTemplateRequirement(tIndex, 'texts', txIndex, 'label', e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                value={text.placeholder}
                                                onChange={(e) => updateTemplateRequirement(tIndex, 'texts', txIndex, 'placeholder', e.target.value)}
                                                placeholder="Placeholder..."
                                            />
                                            <label className="admin-req-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={text.required}
                                                    onChange={(e) => updateTemplateRequirement(tIndex, 'texts', txIndex, 'required', e.target.checked)}
                                                />
                                                Required
                                            </label>
                                            <button className="admin-req-remove" onClick={() => removeRequirement(tIndex, 'texts', txIndex)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CREDIT PACKAGES TAB */}
                {activeTab === 'packages' && (
                    <div className="admin-section animate-fade-in">
                        <div className="admin-packages-grid">
                            {creditPackages.map((pkg, index) => (
                                <div key={pkg.id} className="admin-package-card glass-card">
                                    <div className="admin-package-header" style={{ background: pkg.color }}>
                                        <span className="admin-package-label">{pkg.label}</span>
                                    </div>
                                    <div className="admin-package-fields">
                                        <div className="admin-field">
                                            <label>Credits</label>
                                            <input
                                                type="number"
                                                value={pkg.credits}
                                                onChange={(e) => updatePackage(index, 'credits', e.target.value)}
                                            />
                                        </div>
                                        <div className="admin-field">
                                            <label>Regular Price ({pkg.currency})</label>
                                            <input
                                                type="number"
                                                value={pkg.price}
                                                onChange={(e) => updatePackage(index, 'price', e.target.value)}
                                            />
                                        </div>
                                        <div className="admin-field">
                                            <label>Sale Price ({pkg.currency})</label>
                                            <input
                                                type="text"
                                                value={pkg.salePrice !== null && pkg.salePrice !== undefined ? pkg.salePrice : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    updatePackage(index, 'salePrice', val === '' ? null : Number(val));
                                                }}
                                                placeholder="None"
                                            />
                                        </div>
                                        <label className="admin-req-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={pkg.popular}
                                                onChange={(e) => updatePackage(index, 'popular', e.target.checked)}
                                            />
                                            Mark as Popular
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SPEED TIERS TAB */}
                {activeTab === 'speed' && (
                    <div className="admin-section animate-fade-in">
                        <div className="admin-speed-grid">
                            {speedTiers.map((tier, index) => (
                                <div key={tier.id} className="admin-speed-card glass-card">
                                    <div className="admin-field">
                                        <label>Label</label>
                                        <input
                                            type="text"
                                            value={tier.label}
                                            onChange={(e) => updateSpeedTier(index, 'label', e.target.value)}
                                        />
                                    </div>
                                    <div className="admin-field">
                                        <label>Description</label>
                                        <input
                                            type="text"
                                            value={tier.description}
                                            onChange={(e) => updateSpeedTier(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="admin-field">
                                        <label>Minutes</label>
                                        <input
                                            type="number"
                                            value={tier.minutes}
                                            onChange={(e) => updateSpeedTier(index, 'minutes', e.target.value)}
                                        />
                                    </div>
                                    <div className="admin-field">
                                        <label>Extra Credits</label>
                                        <input
                                            type="number"
                                            value={tier.extraCredits}
                                            onChange={(e) => updateSpeedTier(index, 'extraCredits', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="admin-section animate-fade-in">
                        <div className="admin-settings-container glass-card" style={{ padding: 'var(--space-2xl)', maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: 'var(--space-xl)', color: 'var(--accent-primary)' }}>System Controls</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)', fontSize: 'var(--font-sm)' }}>
                                Use these switches to pause thumbnail generation during heavy server load or maintenance.
                            </p>

                            <div className="admin-setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-xl) 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>Disable FREE Generations</strong>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Users with 0 Pro credits will be blocked.</span>
                                </div>
                                <label className="admin-switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                                    <input
                                        type="checkbox"
                                        checked={systemSettings.disableFreeGeneration}
                                        onChange={() => handleSystemSettingToggle('disableFreeGeneration')}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span className="slider round" style={{
                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: systemSettings.disableFreeGeneration ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                                        transition: '.4s', borderRadius: '34px'
                                    }}>
                                        <span style={{
                                            position: 'absolute', height: '20px', width: '20px', left: '4px', bottom: '4px',
                                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                            transform: systemSettings.disableFreeGeneration ? 'translateX(22px)' : 'none'
                                        }}></span>
                                    </span>
                                </label>
                            </div>

                            <div className="admin-setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-xl) 0' }}>
                                <div>
                                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px', color: '#ef4444' }}>Disable ALL Generations</strong>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No user will be able to generate. Use for maintenance.</span>
                                </div>
                                <label className="admin-switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                                    <input
                                        type="checkbox"
                                        checked={systemSettings.disableAllGeneration}
                                        onChange={() => handleSystemSettingToggle('disableAllGeneration')}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span className="slider round" style={{
                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: systemSettings.disableAllGeneration ? '#ef4444' : 'rgba(255,255,255,0.2)',
                                        transition: '.4s', borderRadius: '34px'
                                    }}>
                                        <span style={{
                                            position: 'absolute', height: '20px', width: '20px', left: '4px', bottom: '4px',
                                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                            transform: systemSettings.disableAllGeneration ? 'translateX(22px)' : 'none'
                                        }}></span>
                                    </span>
                                </label>
                            </div>

                            <div className="admin-setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-xl) 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ flex: 1, paddingRight: 'var(--space-xl)' }}>
                                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px', color: '#10b981' }}>Monthly Free Credits</strong>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Users log in to receive this amount each new month.</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Amount</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={systemSettings.monthlyFreeCreditsAmount}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                const newSettings = { ...systemSettings, monthlyFreeCreditsAmount: val };
                                                setSystemSettings(newSettings);
                                                updateSystemSettings(newSettings).then(() => showSaved());
                                            }}
                                            style={{ width: '70px', padding: '6px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <label className="admin-switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', marginTop: '20px' }}>
                                        <input
                                            type="checkbox"
                                            checked={systemSettings.enableMonthlyFreeCredits}
                                            onChange={() => handleSystemSettingToggle('enableMonthlyFreeCredits')}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span className="slider round" style={{
                                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                            backgroundColor: systemSettings.enableMonthlyFreeCredits ? '#10b981' : 'rgba(255,255,255,0.2)',
                                            transition: '.4s', borderRadius: '34px'
                                        }}>
                                            <span style={{
                                                position: 'absolute', height: '20px', width: '20px', left: '4px', bottom: '4px',
                                                backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                                transform: systemSettings.enableMonthlyFreeCredits ? 'translateX(22px)' : 'none'
                                            }}></span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
