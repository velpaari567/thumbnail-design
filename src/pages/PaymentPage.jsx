import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTemplateById } from '../data/templateData';
import { getUserCredits, deductCredits } from '../utils/credits';
import { startTimer } from '../utils/timer';
import { saveOrder } from '../utils/orders';
import { useAuth } from '../context/AuthContext';
import './PaymentPage.css';

const PaymentPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('template');
    const [order, setOrder] = useState(null);
    const [template, setTemplate] = useState(null);
    const [credits, setCredits] = useState({ free: 0, pro: 0 });
    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!templateId) {
                navigate('/templates');
                return;
            }
            const t = await getTemplateById(templateId);
            if (!t) {
                navigate('/templates');
                return;
            }
            setTemplate(t);

            const savedOrder = sessionStorage.getItem('thumbnail_order');
            if (!savedOrder) {
                navigate('/templates');
                return;
            }
            setOrder(JSON.parse(savedOrder));

            if (user) {
                const creds = await getUserCredits(user.uid);
                setCredits(creds);
            }
            setLoading(false);
        };
        loadData();
    }, [templateId, navigate, user]);

    if (loading || !order || !template) return null;

    // Use offerCost if available, otherwise baseCost
    const effectiveCost = (template.offerCost && template.offerCost > 0 && template.offerCost < template.baseCost)
        ? template.offerCost : template.baseCost;
    const speedExtra = order.speedTier?.extraCredits || 0;
    const totalCost = effectiveCost + speedExtra;
    const totalCredits = (credits.free || 0) + (credits.pro || 0);
    const hasEnough = totalCredits >= totalCost;

    const handleGenerate = async () => {
        if (!hasEnough || processing || !user) return;

        setProcessing(true);

        // Deduct credits
        const result = await deductCredits(user.uid, totalCost);
        if (!result) {
            setProcessing(false);
            return;
        }

        // Save full order to Firestore (for admin panel)
        const savedOrder = await saveOrder(`order-${Date.now()}`, {
            userUid: user.uid,
            userEmail: user.email,
            userName: user.displayName,
            templateId: template.id,
            templateName: template.name,
            templateIcon: template.icon,
            templatePreviewColor: template.previewColor,
            texts: order.texts || {},
            photos: order.photos || [],
            speedTier: order.speedTier,
            baseCost: effectiveCost,
            totalCost: totalCost
        });

        if (!savedOrder) {
            setProcessing(false);
            return;
        }

        // Start local timer with template info for the generation page
        const durationMinutes = order.speedTier?.minutes || 60;
        startTimer(savedOrder.id, durationMinutes, {
            icon: template.icon,
            previewColor: template.previewColor,
            name: template.name
        });

        // Save active order ID (localStorage so it persists across refresh)
        localStorage.setItem('active_order_id', savedOrder.id);

        // Redirect to generation page
        setTimeout(() => {
            navigate(`/generating?order=${savedOrder.id}`);
        }, 800);
    };

    return (
        <div className="payment-page page">
            <div className="container">
                <div className="payment-header animate-fade-in">
                    <button className="btn btn-secondary" onClick={() => navigate(`/timing?template=${templateId}`)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>
                    <div>
                        <h1 className="payment-title">Confirm & Generate</h1>
                        <p className="payment-subtitle">Review your order before generating</p>
                    </div>
                    <div className="templates-step-badge">Step 4 of 4</div>
                </div>

                <div className="payment-content animate-fade-in-up stagger-1">
                    <div className="payment-summary glass-card">
                        <h2 className="payment-section-title">Order Summary</h2>

                        <div className="payment-item">
                            <div className="payment-item-left">
                                <div className="payment-template-preview" style={{ background: template.previewColor }}>
                                    <span>{template.icon}</span>
                                </div>
                                <div>
                                    <div className="payment-item-name">{template.name}</div>
                                    <div className="payment-item-desc">Base thumbnail creation</div>
                                </div>
                            </div>
                            <div className="payment-item-cost">{effectiveCost} credits</div>
                        </div>

                        <div className="payment-item">
                            <div className="payment-item-left">
                                <div className="payment-speed-icon">{order.speedTier?.icon || '⏰'}</div>
                                <div>
                                    <div className="payment-item-name">Delivery: {order.speedTier?.label || '1 Hour'}</div>
                                    <div className="payment-item-desc">{order.speedTier?.description || 'Standard delivery'}</div>
                                </div>
                            </div>
                            <div className="payment-item-cost">
                                {speedExtra === 0 ? (
                                    <span className="payment-free">FREE</span>
                                ) : (
                                    `+${speedExtra} credits`
                                )}
                            </div>
                        </div>

                        <div className="payment-divider"></div>

                        <div className="payment-total">
                            <span>Total Cost</span>
                            <span className="payment-total-value">{totalCost} credits</span>
                        </div>
                    </div>

                    <div className="payment-balance glass-card animate-fade-in-up stagger-2">
                        <h2 className="payment-section-title">Your Balance</h2>
                        <div className="payment-balance-row">
                            <div className="payment-balance-item">
                                <span className="badge badge-free">FREE</span>
                                <span className="payment-balance-count">{credits.free}</span>
                            </div>
                            <span className="payment-balance-plus">+</span>
                            <div className="payment-balance-item">
                                <span className="badge badge-pro">PRO</span>
                                <span className="payment-balance-count">{credits.pro}</span>
                            </div>
                            <span className="payment-balance-eq">=</span>
                            <div className="payment-balance-item">
                                <span className="payment-balance-total">{totalCredits}</span>
                                <span className="payment-balance-label">Total</span>
                            </div>
                        </div>

                        {!hasEnough && (
                            <div className="payment-insufficient">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>Insufficient credits! You need {totalCost - totalCredits} more credits.</span>
                                <button className="btn btn-secondary" onClick={() => navigate('/credits')} style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                                    Buy Credits
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="payment-confirm animate-fade-in-up stagger-3">
                        <div className="payment-confirm-text">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span>Are you sure you want to proceed? <strong>{totalCost} credits</strong> will be deducted from your balance.</span>
                        </div>
                        <button
                            className={`btn btn-primary btn-large ${processing ? 'processing' : ''}`}
                            disabled={!hasEnough || processing}
                            onClick={handleGenerate}
                            id="generate-btn"
                        >
                            {processing ? (
                                <>
                                    <span className="spinner"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    Generate Thumbnail
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
