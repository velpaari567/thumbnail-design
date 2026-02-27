import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreditPackages } from '../data/pricingData';
import { addCredits, getUserCredits } from '../utils/credits';
import './CreditStorePage.css';

const CreditStorePage = () => {
    const navigate = useNavigate();
    const packages = getCreditPackages();
    const [credits, setCredits] = useState(getUserCredits());
    const [purchasedId, setPurchasedId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleBuy = (pkg) => {
        // Mock purchase — in production, integrate with payment gateway
        setPurchasedId(pkg.id);

        setTimeout(() => {
            const updated = addCredits(pkg.credits, 'pro');
            setCredits(updated);
            setPurchasedId(null);
            setShowSuccess(true);

            setTimeout(() => setShowSuccess(false), 3000);
        }, 1200);
    };

    return (
        <div className="credits-page page">
            <div className="container">
                <div className="credits-header animate-fade-in">
                    <button className="btn btn-secondary" onClick={() => navigate('/home')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>
                    <div>
                        <h1 className="credits-title">Credit Store 💎</h1>
                        <p className="credits-subtitle">Purchase credits to create stunning thumbnails</p>
                    </div>
                </div>

                {/* Current Balance */}
                <div className="credits-balance glass-card animate-fade-in-up stagger-1">
                    <div className="credits-balance-left">
                        <span className="credits-balance-label">Current Balance</span>
                        <div className="credits-balance-values">
                            <span className="badge badge-free">FREE</span>
                            <span className="credits-balance-num">{credits.free}</span>
                            <span className="credits-balance-separator">+</span>
                            <span className="badge badge-pro">PRO</span>
                            <span className="credits-balance-num">{credits.pro}</span>
                            <span className="credits-balance-separator">=</span>
                            <span className="credits-balance-total">{credits.free + credits.pro}</span>
                        </div>
                    </div>
                </div>

                {/* Success Toast */}
                {showSuccess && (
                    <div className="credits-toast animate-scale-in">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Credits added successfully!
                    </div>
                )}

                {/* Packages Grid */}
                <div className="credits-grid">
                    {packages.map((pkg, index) => (
                        <div
                            key={pkg.id}
                            className={`credits-card glass-card animate-fade-in-up stagger-${index + 1} ${pkg.popular ? 'popular' : ''}`}
                            id={`credit-pack-${pkg.id}`}
                        >
                            {pkg.popular && (
                                <div className="credits-popular-tag">Most Popular</div>
                            )}
                            <div className="credits-card-header">
                                <span className="credits-card-label">{pkg.label}</span>
                            </div>
                            <div className="credits-card-amount">{pkg.credits}</div>
                            <div className="credits-card-unit">credits</div>
                            <div className="credits-card-price">
                                {pkg.salePrice && pkg.salePrice > 0 && pkg.salePrice < pkg.price ? (
                                    <>
                                        <span className="credits-price-original">
                                            <span className="credits-currency">{pkg.currency}</span>{pkg.price}
                                        </span>
                                        <span className="credits-currency">{pkg.currency}</span>
                                        <span className="credits-price-value credits-price-sale">{pkg.salePrice}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="credits-currency">{pkg.currency}</span>
                                        <span className="credits-price-value">{pkg.price}</span>
                                    </>
                                )}
                            </div>
                            <div className="credits-card-per">
                                {pkg.currency}{((pkg.salePrice && pkg.salePrice > 0 && pkg.salePrice < pkg.price ? pkg.salePrice : pkg.price) / pkg.credits).toFixed(1)} per credit
                            </div>
                            <button
                                className={`btn ${pkg.popular ? 'btn-primary' : 'btn-secondary'} credits-buy-btn`}
                                onClick={() => handleBuy(pkg)}
                                disabled={purchasedId === pkg.id}
                            >
                                {purchasedId === pkg.id ? (
                                    <>
                                        <span className="spinner"></span>
                                        Processing...
                                    </>
                                ) : (
                                    'Buy Now'
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CreditStorePage;
