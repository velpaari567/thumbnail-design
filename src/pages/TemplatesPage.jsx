import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplates } from '../data/templateData';
import { getPendingOrdersByUser } from '../utils/orders';
import { getSystemSettings } from '../utils/system';
import { getUserCredits } from '../utils/credits';
import { useAuth } from '../context/AuthContext';
import './TemplatesPage.css';

const TemplatesPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [showBlockedPopup, setShowBlockedPopup] = useState(false);
    const [hasActiveRequest, setHasActiveRequest] = useState(false);
    const [systemSettings, setSystemSettings] = useState(null);
    const [userCredits, setUserCredits] = useState({ free: 0, pro: 0 });
    const [loading, setLoading] = useState(true);
    const [blockReason, setBlockReason] = useState(null); // 'active', 'maintenance', 'free_limit'

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [tmpl, pending, sys, creds] = await Promise.all([
                    getTemplates(),
                    user ? getPendingOrdersByUser(user.uid) : Promise.resolve([]),
                    getSystemSettings(),
                    user ? getUserCredits(user.uid) : Promise.resolve({ free: 0, pro: 0 })
                ]);
                setTemplates(tmpl);
                setHasActiveRequest(pending.length > 0);
                setSystemSettings(sys);
                setUserCredits(creds);
            } catch (error) {
                console.error('Error loading templates:', error);
            }
            setLoading(false);
        };
        loadData();
    }, [user]);

    const handleNext = () => {
        if (hasActiveRequest) {
            setBlockReason('active');
            setShowBlockedPopup(true);
            return;
        }

        if (systemSettings) {
            if (systemSettings.disableAllGeneration) {
                setBlockReason('maintenance');
                setShowBlockedPopup(true);
                return;
            }
            if (systemSettings.disableFreeGeneration && userCredits.pro <= 0) {
                setBlockReason('free_limit');
                setShowBlockedPopup(true);
                return;
            }
        }

        if (selectedId) {
            navigate(`/requirements?template=${selectedId}`);
        }
    };

    const getDisplayCost = (template) => {
        const offer = template.offerCost;
        if (offer !== null && offer !== undefined && offer > 0 && offer < template.baseCost) {
            return { regular: template.baseCost, current: offer, hasOffer: true };
        }
        return { regular: template.baseCost, current: template.baseCost, hasOffer: false };
    };

    if (loading) {
        return (
            <div className="templates-page page">
                <div className="container">
                    <div className="gen-empty animate-fade-in">
                        <div className="gen-waiting-spinner"></div>
                        <p>Loading templates...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="templates-page page">
            <div className="container">
                <div className="templates-header animate-fade-in">
                    <button className="btn btn-secondary" onClick={() => navigate('/home')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>
                    <div>
                        <h1 className="templates-title">Choose a Template</h1>
                        <p className="templates-subtitle">Select one template to create your thumbnail</p>
                    </div>
                    <div className="templates-step-badge">Step 1 of 4</div>
                </div>

                <div className="templates-grid">
                    {templates.map((template, index) => {
                        const pricing = getDisplayCost(template);
                        return (
                            <div
                                key={template.id}
                                className={`template-card glass-card animate-fade-in-up stagger-${index + 1} ${selectedId === template.id ? 'selected' : ''}`}
                                onClick={() => setSelectedId(template.id)}
                                id={`template-${template.id}`}
                            >
                                <div className="template-preview" style={{
                                    background: template.previewColor,
                                    backgroundImage: template.thumbnailUrl ? `url(${template.thumbnailUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}>
                                    {!template.thumbnailUrl && <span className="template-icon">{template.icon}</span>}
                                    <div className={`template-credit-badge ${pricing.hasOffer ? 'has-offer' : ''}`}>
                                        {pricing.hasOffer ? (
                                            <>
                                                <span className="template-credit-original">💎 {pricing.regular}</span>
                                                <span className="template-credit-offer">💎 {pricing.current} credits</span>
                                            </>
                                        ) : (
                                            <>💎 {pricing.current} credits</>
                                        )}
                                    </div>
                                    {selectedId === template.id && (
                                        <div className="template-check animate-scale-in">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                <polyline points="20,6 9,17 4,12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="template-info">
                                    <h3 className="template-name">{template.name}</h3>
                                    <p className="template-desc">{template.description}</p>
                                    <div className="template-usage-info">
                                        <span className="template-usage-label">⚡ This template uses</span>
                                        {pricing.hasOffer ? (
                                            <>
                                                <span className="template-usage-original">{pricing.regular}</span>
                                                <span className="template-usage-credits">{pricing.current} credits</span>
                                            </>
                                        ) : (
                                            <span className="template-usage-credits">{pricing.current} credits</span>
                                        )}
                                    </div>
                                    <div className="template-meta">
                                        <span className="template-items">
                                            📸 {template.requirements.photos.length} photo{template.requirements.photos.length !== 1 ? 's' : ''} · ✏️ {template.requirements.texts.length} text{template.requirements.texts.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="templates-footer animate-fade-in">
                    <button
                        className="btn btn-primary btn-large"
                        disabled={!selectedId}
                        onClick={handleNext}
                        id="templates-next-btn"
                    >
                        Next Step
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,18 15,12 9,6" />
                        </svg>
                    </button>
                </div>

                {/* Blocked Popup */}
                {showBlockedPopup && (
                    <div className="templates-blocked-overlay" onClick={() => setShowBlockedPopup(false)}>
                        <div className="templates-blocked-popup animate-scale-in glass-card" onClick={e => e.stopPropagation()}>
                            <button className="templates-blocked-close" onClick={() => setShowBlockedPopup(false)}>✕</button>

                            {blockReason === 'active' && (
                                <>
                                    <div className="templates-blocked-icon">⏳</div>
                                    <h3>Request Already in Progress</h3>
                                    <p>You already have a thumbnail request being processed. Please wait until it's completed before creating a new one.</p>
                                    <div className="templates-blocked-actions">
                                        <button className="btn btn-primary" onClick={() => navigate('/generating')}>
                                            View Current Request
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => setShowBlockedPopup(false)}>
                                            Close
                                        </button>
                                    </div>
                                </>
                            )}

                            {blockReason === 'maintenance' && (
                                <>
                                    <div className="templates-blocked-icon">🛠️</div>
                                    <h3 style={{ color: '#ef4444' }}>System Maintenance</h3>
                                    <p>Our AI servers are temporarily offline or experiencing extreme load. Please check back soon.</p>
                                    <div className="templates-blocked-actions">
                                        <button className="btn btn-secondary" onClick={() => setShowBlockedPopup(false)}>
                                            Understood
                                        </button>
                                    </div>
                                </>
                            )}

                            {blockReason === 'free_limit' && (
                                <>
                                    <div className="templates-blocked-icon">📈</div>
                                    <h3 style={{ color: '#f59e0b' }}>High Server Load</h3>
                                    <p>Due to heavy traffic, free generations are temporarily paused. Upgrading to Pro bypasses this queue.</p>
                                    <div className="templates-blocked-actions">
                                        <button className="btn btn-primary" onClick={() => navigate('/credits')}>
                                            Get Pro Credits
                                        </button>
                                        <button className="btn btn-secondary" onClick={() => setShowBlockedPopup(false)}>
                                            Close
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplatesPage;
