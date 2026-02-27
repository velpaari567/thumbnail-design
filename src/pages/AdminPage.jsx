import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTemplates, saveTemplates } from '../data/templateData';
import { getCreditPackages, saveCreditPackages, getSpeedTiers, saveSpeedTiers } from '../data/pricingData';
import { getAllOrders, deliverOrder } from '../utils/orders';
import { getUsersWithCredits } from '../utils/users';
import './AdminPage.css';

const AdminPage = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');
    const [templates, setTemplates] = useState(getTemplates());
    const [creditPackages, setCreditPackages] = useState(getCreditPackages());
    const [speedTiers, setSpeedTiers] = useState(getSpeedTiers());
    const [orders, setOrders] = useState(getAllOrders());
    const [users, setUsers] = useState(getUsersWithCredits());
    const [saved, setSaved] = useState(false);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [deliveryFile, setDeliveryFile] = useState(null);
    const [deliveryPreview, setDeliveryPreview] = useState(null);
    const [delivering, setDelivering] = useState(false);
    const [deliveryDelay, setDeliveryDelay] = useState(0);
    const firstLoad = useRef(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isAdmin) {
            // For demo purposes, allow access
        }
    }, [isAdmin, navigate]);

    // Refresh orders and users periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setOrders(getAllOrders());
            setUsers(getUsersWithCredits());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Auto-save templates
    useEffect(() => {
        if (firstLoad.current) return;
        saveTemplates(templates);
        showSaved();
    }, [templates]);

    // Auto-save credit packages
    useEffect(() => {
        if (firstLoad.current) return;
        saveCreditPackages(creditPackages);
        showSaved();
    }, [creditPackages]);

    // Auto-save speed tiers
    useEffect(() => {
        if (firstLoad.current) return;
        saveSpeedTiers(speedTiers);
        showSaved();
    }, [speedTiers]);

    useEffect(() => {
        firstLoad.current = false;
    }, []);

    const showSaved = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Template editing
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
                id: `photo-${Date.now()}`,
                label: 'New Photo',
                required: false
            });
        } else {
            updated[tIndex].requirements.texts.push({
                id: `text-${Date.now()}`,
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

    // Speed tier editing
    const updateSpeedTier = (index, field, value) => {
        const updated = [...speedTiers];
        updated[index] = { ...updated[index], [field]: field === 'extraCredits' || field === 'minutes' ? Number(value) : value };
        setSpeedTiers(updated);
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

    const handleDeliver = (orderId) => {
        if (!deliveryPreview || delivering) return;
        setDelivering(true);

        deliverOrder(orderId, deliveryPreview, deliveryDelay);

        // Refresh orders
        setOrders(getAllOrders());
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

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
                    <div className="credits-toast animate-scale-in" style={{ background: 'var(--success-bg)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--success)' }}>
                        ✅ Auto-saved!
                    </div>
                )}

                {/* Tabs */}
                <div className="admin-tabs animate-fade-in">
                    <button
                        className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        📦 Orders
                        {orders.filter(o => o.status !== 'delivered').length > 0 && (
                            <span className="admin-tab-badge">{orders.filter(o => o.status !== 'delivered').length}</span>
                        )}
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 Users ({users.length})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'templates' ? 'active' : ''}`}
                        onClick={() => setActiveTab('templates')}
                    >
                        🎨 Templates
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'credits' ? 'active' : ''}`}
                        onClick={() => setActiveTab('credits')}
                    >
                        💎 Credit Packages
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'speed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('speed')}
                    >
                        ⚡ Speed Tiers
                    </button>
                </div>

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="admin-section animate-fade-in">
                        {orders.length === 0 ? (
                            <div className="admin-empty-state glass-card">
                                <span className="admin-empty-icon">📭</span>
                                <h3>No Orders Yet</h3>
                                <p>Orders from users will appear here when they generate thumbnails.</p>
                            </div>
                        ) : (
                            <div className="admin-orders-list">
                                {[...orders].reverse().map(order => (
                                    <div key={order.id} className={`admin-order-card glass-card ${order.status === 'delivered' ? 'delivered' : ''}`}>
                                        <div className="admin-order-header" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                            <div className="admin-order-left">
                                                <div className="admin-order-template-icon" style={{ background: order.templatePreviewColor }}>
                                                    <span>{order.templateIcon}</span>
                                                </div>
                                                <div>
                                                    <div className="admin-order-title">{order.templateName}</div>
                                                    <div className="admin-order-user">{order.userEmail}</div>
                                                    <div className="admin-order-date">{formatDate(order.createdAt)}</div>
                                                </div>
                                            </div>
                                            <div className="admin-order-right">
                                                <span className={`admin-order-status status-${order.status}`}>
                                                    {order.status === 'delivered' ? '✅ Delivered' : '⏳ Pending'}
                                                </span>
                                                <span className="admin-order-cost">{order.totalCost} credits</span>
                                                <svg className={`admin-order-chevron ${expandedOrder === order.id ? 'expanded' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </div>
                                        </div>

                                        {expandedOrder === order.id && (
                                            <div className="admin-order-details animate-fade-in">
                                                {/* Speed Tier */}
                                                <div className="admin-order-detail-row">
                                                    <span className="admin-detail-label">Delivery Speed:</span>
                                                    <span>{order.speedTier?.label || '1 Hour'} ({order.speedTier?.icon || '⏰'})</span>
                                                </div>
                                                <div className="admin-order-detail-row">
                                                    <span className="admin-detail-label">Base Cost:</span>
                                                    <span>{order.baseCost} credits</span>
                                                </div>

                                                {/* Text Inputs */}
                                                {order.texts && Object.keys(order.texts).length > 0 && (
                                                    <div className="admin-order-texts">
                                                        <h4>📝 Text Content</h4>
                                                        {Object.entries(order.texts).map(([key, value]) => (
                                                            value && (
                                                                <div key={key} className="admin-order-text-item">
                                                                    <span className="admin-detail-label">{key}:</span>
                                                                    <span className="admin-text-value">{value}</span>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Uploaded Photos */}
                                                {order.photos && order.photos.length > 0 && (
                                                    <div className="admin-order-photos">
                                                        <h4>📸 Uploaded Photos</h4>
                                                        <div className="admin-photos-grid">
                                                            {order.photos.map((photo, i) => (
                                                                <div key={i} className="admin-photo-item">
                                                                    <img src={photo.dataUrl} alt={photo.label} />
                                                                    <div className="admin-photo-overlay">
                                                                        <span>{photo.label}</span>
                                                                        <button
                                                                            className="admin-photo-download"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDownloadPhoto(photo.dataUrl, photo.label);
                                                                            }}
                                                                        >
                                                                            ⬇️ Download
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Delivered Thumbnail */}
                                                {order.status === 'delivered' && order.deliveredThumbnail && (
                                                    <div className="admin-order-delivered">
                                                        <h4>✅ Delivered Thumbnail</h4>
                                                        <img src={order.deliveredThumbnail} alt="Delivered thumbnail" className="admin-delivered-img" />
                                                        <p className="admin-delivered-date">Delivered on {formatDate(order.deliveredAt)}</p>
                                                    </div>
                                                )}

                                                {/* Attach & Send (for pending orders) */}
                                                {order.status !== 'delivered' && (
                                                    <div className="admin-deliver-section">
                                                        <h4>📎 Attach & Send Thumbnail</h4>
                                                        <p className="admin-deliver-desc">Upload the finished thumbnail from your Photoshop and send it to the user.</p>

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

                        {users.length === 0 ? (
                            <div className="admin-empty-state glass-card">
                                <span className="admin-empty-icon">👤</span>
                                <h3>No Users Yet</h3>
                                <p>Users who sign in with Google will appear here.</p>
                            </div>
                        ) : (
                            <div className="admin-users-table glass-card">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Free Credits</th>
                                            <th>Pro Credits</th>
                                            <th>Total</th>
                                            <th>Last Login</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="admin-user-cell">
                                                        <div className="admin-user-avatar">
                                                            {u.displayName ? u.displayName.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <span>{u.displayName || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td>{u.email}</td>
                                                <td><span className="badge badge-free">{u.credits?.free || 0}</span></td>
                                                <td><span className="badge badge-pro">{u.credits?.pro || 0}</span></td>
                                                <td><strong>{(u.credits?.free || 0) + (u.credits?.pro || 0)}</strong></td>
                                                <td>{u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <div className="admin-section animate-fade-in">
                        {templates.map((template, tIndex) => (
                            <div key={template.id} className="admin-template-card glass-card">
                                <div className="admin-template-header">
                                    <div className="admin-template-preview" style={{ background: template.previewColor }}>
                                        <span>{template.icon}</span>
                                    </div>
                                    <div className="admin-template-info">
                                        <h3>{template.name}</h3>
                                        <p>{template.description}</p>
                                    </div>
                                    <div className="admin-template-cost">
                                        <label>Regular Credits</label>
                                        <input
                                            type="number"
                                            value={template.baseCost}
                                            onChange={(e) => updateTemplate(tIndex, 'baseCost', Number(e.target.value))}
                                            min="1"
                                            style={{ width: '80px' }}
                                        />
                                        <span className="admin-unit">credits</span>
                                    </div>
                                    <div className="admin-template-cost">
                                        <label>Offer Credits</label>
                                        <input
                                            type="number"
                                            value={template.offerCost || ''}
                                            onChange={(e) => updateTemplate(tIndex, 'offerCost', e.target.value ? Number(e.target.value) : null)}
                                            min="0"
                                            placeholder="None"
                                            style={{ width: '80px' }}
                                        />
                                        <span className="admin-unit">credits</span>
                                    </div>
                                </div>

                                {/* Photo Requirements */}
                                <div className="admin-requirements">
                                    <div className="admin-req-header">
                                        <h4>📸 Photo Requirements ({template.requirements.photos.length})</h4>
                                        <button className="btn btn-secondary" onClick={() => addRequirement(tIndex, 'photos')} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                                            + Add Photo
                                        </button>
                                    </div>
                                    {template.requirements.photos.map((photo, rIndex) => (
                                        <div key={photo.id} className="admin-req-item">
                                            <input
                                                type="text"
                                                value={photo.label}
                                                onChange={(e) => updateTemplateRequirement(tIndex, 'photos', rIndex, 'label', e.target.value)}
                                                placeholder="Photo label"
                                            />
                                            <label className="admin-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={photo.required}
                                                    onChange={(e) => updateTemplateRequirement(tIndex, 'photos', rIndex, 'required', e.target.checked)}
                                                />
                                                Required
                                            </label>
                                            <button className="admin-remove-btn" onClick={() => removeRequirement(tIndex, 'photos', rIndex)} title="Remove">
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Text Requirements */}
                                <div className="admin-requirements">
                                    <div className="admin-req-header">
                                        <h4>✏️ Text Requirements ({template.requirements.texts.length})</h4>
                                        <button className="btn btn-secondary" onClick={() => addRequirement(tIndex, 'texts')} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                                            + Add Text
                                        </button>
                                    </div>
                                    {template.requirements.texts.map((text, rIndex) => (
                                        <div key={text.id} className="admin-req-item">
                                            <input
                                                type="text"
                                                value={text.label}
                                                onChange={(e) => updateTemplateRequirement(tIndex, 'texts', rIndex, 'label', e.target.value)}
                                                placeholder="Field label"
                                            />
                                            <input
                                                type="text"
                                                value={text.placeholder}
                                                onChange={(e) => updateTemplateRequirement(tIndex, 'texts', rIndex, 'placeholder', e.target.value)}
                                                placeholder="Placeholder text"
                                            />
                                            <label className="admin-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={text.required}
                                                    onChange={(e) => updateTemplateRequirement(tIndex, 'texts', rIndex, 'required', e.target.checked)}
                                                />
                                                Required
                                            </label>
                                            <button className="admin-remove-btn" onClick={() => removeRequirement(tIndex, 'texts', rIndex)} title="Remove">
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Credit Packages Tab */}
                {activeTab === 'credits' && (
                    <div className="admin-section animate-fade-in">
                        <div className="admin-packages-grid">
                            {creditPackages.map((pkg, index) => (
                                <div key={pkg.id} className="admin-package-card glass-card">
                                    <h3>{pkg.label}</h3>
                                    <div className="admin-field">
                                        <label>Credits</label>
                                        <input
                                            type="number"
                                            value={pkg.credits}
                                            onChange={(e) => updatePackage(index, 'credits', e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                    <div className="admin-field">
                                        <label>Regular Price (₹)</label>
                                        <input
                                            type="number"
                                            value={pkg.price}
                                            onChange={(e) => updatePackage(index, 'price', e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                    <div className="admin-field">
                                        <label>Sale Price (₹)</label>
                                        <input
                                            type="number"
                                            value={pkg.salePrice || ''}
                                            onChange={(e) => updatePackage(index, 'salePrice', e.target.value ? Number(e.target.value) : null)}
                                            min="0"
                                            placeholder="No sale"
                                        />
                                    </div>
                                    <label className="admin-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={pkg.popular}
                                            onChange={(e) => updatePackage(index, 'popular', e.target.checked)}
                                        />
                                        Mark as Popular
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Speed Tiers Tab */}
                {activeTab === 'speed' && (
                    <div className="admin-section animate-fade-in">
                        <div className="admin-speed-grid">
                            {speedTiers.map((tier, index) => (
                                <div key={tier.id} className="admin-speed-card glass-card">
                                    <div className="admin-speed-icon">{tier.icon}</div>
                                    <h3>{tier.label}</h3>
                                    <div className="admin-field">
                                        <label>Duration (minutes)</label>
                                        <input
                                            type="number"
                                            value={tier.minutes}
                                            onChange={(e) => updateSpeedTier(index, 'minutes', e.target.value)}
                                            min="5"
                                        />
                                    </div>
                                    <div className="admin-field">
                                        <label>Extra Credits Charge</label>
                                        <input
                                            type="number"
                                            value={tier.extraCredits}
                                            onChange={(e) => updateSpeedTier(index, 'extraCredits', e.target.value)}
                                            min="0"
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;
