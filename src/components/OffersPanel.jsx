import { useState, useEffect, useRef } from 'react';
import { getOffers, categorizeOffers, getTimeRemaining, getStartsIn } from '../utils/offers';
import './OffersPanel.css';

const OffersPanel = ({ isOpen, onClose }) => {
    const [offers, setOffers] = useState({ active: [], upcoming: [], expired: [] });
    const [loading, setLoading] = useState(true);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const loadOffers = async () => {
            setLoading(true);
            const all = await getOffers();
            const categorized = categorizeOffers(all);
            setOffers(categorized);
            setLoading(false);
        };
        loadOffers();

        // Refresh every 30 seconds when open
        const interval = setInterval(async () => {
            const all = await getOffers();
            setOffers(categorizeOffers(all));
        }, 30000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target) && !e.target.closest('.navbar-offers-btn')) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const hasOffers = offers.active.length > 0 || offers.upcoming.length > 0;

    return (
        <div className="offers-panel animate-fade-in" ref={panelRef}>
            <div className="offers-panel-header">
                <h3>🎁 Offers & Deals</h3>
                <button className="offers-close-btn" onClick={onClose}>×</button>
            </div>

            {loading ? (
                <div className="offers-loading">
                    <div className="gen-waiting-spinner" style={{ width: 24, height: 24 }}></div>
                    <span>Loading offers...</span>
                </div>
            ) : !hasOffers ? (
                <div className="offers-empty">
                    <span className="offers-empty-icon">🎁</span>
                    <p>No offers available right now.</p>
                    <span className="offers-empty-sub">Check back soon for exciting deals!</span>
                </div>
            ) : (
                <div className="offers-list">
                    {/* Active Offers */}
                    {offers.active.length > 0 && (
                        <div className="offers-section">
                            <div className="offers-section-label offers-section-active">
                                <span className="offers-section-dot active"></span>
                                LIVE NOW
                            </div>
                            {offers.active.map(offer => (
                                <div key={offer.id} className="offer-card offer-card-active">
                                    <div className="offer-card-emoji">{offer.emoji}</div>
                                    <div className="offer-card-content">
                                        <div className="offer-card-title">{offer.title}</div>
                                        <div className="offer-card-desc">{offer.description}</div>
                                        {offer.endDate && (
                                            <div className="offer-card-timer">
                                                ⏰ {getTimeRemaining(offer.endDate)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Upcoming Offers */}
                    {offers.upcoming.length > 0 && (
                        <div className="offers-section">
                            <div className="offers-section-label offers-section-upcoming">
                                <span className="offers-section-dot upcoming"></span>
                                COMING SOON
                            </div>
                            {offers.upcoming.map(offer => (
                                <div key={offer.id} className="offer-card offer-card-upcoming">
                                    <div className="offer-card-emoji">{offer.emoji}</div>
                                    <div className="offer-card-content">
                                        <div className="offer-card-title">{offer.title}</div>
                                        <div className="offer-card-desc">{offer.description}</div>
                                        {offer.startDate && (
                                            <div className="offer-card-timer offer-card-starts">
                                                🗓️ {getStartsIn(offer.startDate)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OffersPanel;
