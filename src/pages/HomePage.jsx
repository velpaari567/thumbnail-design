import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserCredits } from '../utils/credits';
import { getActiveTimer } from '../utils/timer';
import { getUnseenDeliveredOrders } from '../utils/orders';
import { useEffect, useState } from 'react';
import './HomePage.css';

const HomePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [credits, setCredits] = useState(getUserCredits());
    const [activeTimer, setActiveTimer] = useState(null);
    const [deliveredOrders, setDeliveredOrders] = useState([]);

    useEffect(() => {
        setCredits(getUserCredits());
        setActiveTimer(getActiveTimer());
        setDeliveredOrders(getUnseenDeliveredOrders());
    }, []);

    return (
        <div className="home-page page">
            <div className="container">
                {/* Welcome Section */}
                <div className="home-welcome animate-fade-in">
                    <div className="home-welcome-text">
                        <h1 className="home-greeting">
                            Welcome back, <span className="home-name">{user?.displayName || 'Creator'}</span> 👋
                        </h1>
                        <p className="home-subtitle">Ready to create your next viral thumbnail?</p>
                    </div>
                </div>

                {/* Delivered Notification — thumbnail is ready to view */}
                {deliveredOrders.length > 0 && (
                    <div className="home-delivered-banner animate-scale-in" onClick={() => navigate(`/generating?order=${deliveredOrders[0].id}`)}>
                        <span className="home-delivered-icon">🎉</span>
                        <div className="home-delivered-text">
                            <strong>Your thumbnail has been successfully generated!</strong>
                            <span>Your "{deliveredOrders[0].templateName}" thumbnail is ready to download.</span>
                        </div>
                        <span className="home-delivered-link">View the Result →</span>
                    </div>
                )}

                {/* Credits Section */}
                <div className="home-credits animate-fade-in-up stagger-1">
                    <div className="credit-card credit-card-free glass-card">
                        <div className="credit-card-header">
                            <span className="badge badge-free">FREE</span>
                            <span className="credit-card-label">Monthly Credits</span>
                        </div>
                        <div className="credit-card-value">{credits.free}</div>
                        <div className="credit-card-footer">Refreshes every month</div>
                    </div>

                    <div className="credit-card credit-card-pro glass-card">
                        <div className="credit-card-header">
                            <span className="badge badge-pro">PRO</span>
                            <span className="credit-card-label">Purchased Credits</span>
                        </div>
                        <div className="credit-card-value">{credits.pro}</div>
                        <div className="credit-card-footer">
                            <button className="btn btn-secondary" onClick={() => navigate('/credits')} style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
                                Buy More
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Generation Banner — only show if generating (not delivered) */}
                {activeTimer && deliveredOrders.length === 0 && (
                    <div className="home-active-gen animate-scale-in" onClick={() => navigate('/generating')}>
                        <div className="home-active-gen-pulse"></div>
                        <span className="home-active-gen-icon">⏳</span>
                        <span>Your thumbnail is being generated!</span>
                        <span className="home-active-gen-link">View Progress →</span>
                    </div>
                )}

                {/* CTA Section */}
                <div className="home-cta animate-fade-in-up stagger-2">
                    <div className="home-cta-card glass-card">
                        <div className="home-cta-bg"></div>
                        <div className="home-cta-content">
                            <div className="home-cta-icon">🎨</div>
                            <h2 className="home-cta-title">Create Your Thumbnail</h2>
                            <p className="home-cta-desc">
                                Choose from our professional templates and let AI create
                                a stunning thumbnail for your content.
                            </p>
                            <button
                                className="btn btn-primary btn-large"
                                onClick={() => navigate('/templates')}
                                id="create-thumbnail-btn"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Create New Thumbnail
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="home-links animate-fade-in-up stagger-3">
                    <div className="home-link-card glass-card" onClick={() => navigate('/credits')}>
                        <span className="home-link-icon">💎</span>
                        <span className="home-link-text">Credit Store</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,18 15,12 9,6" />
                        </svg>
                    </div>
                    <div className="home-link-card glass-card" onClick={() => navigate('/generating')}>
                        <span className="home-link-icon">📋</span>
                        <span className="home-link-text">My Generations</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,18 15,12 9,6" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
