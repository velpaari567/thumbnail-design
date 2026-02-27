import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSpeedTiers } from '../data/pricingData';
import { getTemplateById } from '../data/templateData';
import './TimingPage.css';

const TimingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const templateId = searchParams.get('template');
    const [selectedSpeed, setSelectedSpeed] = useState('speed-60');
    const speedTiers = getSpeedTiers();
    const [template, setTemplate] = useState(null);

    useEffect(() => {
        if (!templateId) {
            navigate('/templates');
            return;
        }
        const t = getTemplateById(templateId);
        if (!t) {
            navigate('/templates');
            return;
        }
        setTemplate(t);
    }, [templateId, navigate]);

    const handleNext = () => {
        const order = JSON.parse(sessionStorage.getItem('thumbnail_order') || '{}');
        const selectedTier = speedTiers.find(s => s.id === selectedSpeed);
        order.speedTier = selectedTier;
        sessionStorage.setItem('thumbnail_order', JSON.stringify(order));
        navigate(`/payment?template=${templateId}`);
    };

    if (!template) return null;

    return (
        <div className="timing-page page">
            <div className="container">
                <div className="timing-header animate-fade-in">
                    <button className="btn btn-secondary" onClick={() => navigate(`/requirements?template=${templateId}`)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>
                    <div>
                        <h1 className="timing-title">Choose Delivery Speed</h1>
                        <p className="timing-subtitle">
                            How fast do you need your thumbnail?
                        </p>
                    </div>
                    <div className="templates-step-badge">Step 3 of 4</div>
                </div>

                <div className="timing-grid">
                    {speedTiers.map((tier, index) => (
                        <div
                            key={tier.id}
                            className={`timing-card glass-card animate-fade-in-up stagger-${index + 1} ${selectedSpeed === tier.id ? 'selected' : ''}`}
                            onClick={() => setSelectedSpeed(tier.id)}
                            id={`speed-${tier.id}`}
                        >
                            {selectedSpeed === tier.id && (
                                <div className="timing-check animate-scale-in">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                        <polyline points="20,6 9,17 4,12" />
                                    </svg>
                                </div>
                            )}
                            <div className="timing-icon">{tier.icon}</div>
                            <h3 className="timing-label">{tier.label}</h3>
                            <p className="timing-desc">{tier.description}</p>
                            <div className="timing-price">
                                {tier.extraCredits === 0 ? (
                                    <span className="timing-free">No extra charge</span>
                                ) : (
                                    <span className="timing-extra">+{tier.extraCredits} credits</span>
                                )}
                            </div>
                            {tier.id === 'speed-60' && (
                                <div className="timing-tag">Recommended</div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="templates-footer animate-fade-in">
                    <button
                        className="btn btn-primary btn-large"
                        onClick={handleNext}
                        id="timing-next-btn"
                    >
                        Next Step
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,18 15,12 9,6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimingPage;
