import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserCredits } from '../utils/credits';
import { getOffers, categorizeOffers } from '../utils/offers';
import { useState, useEffect } from 'react';
import OffersPanel from './OffersPanel';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [credits, setCredits] = useState({ free: 0, pro: 0 });
    const [offersOpen, setOffersOpen] = useState(false);
    const [activeOfferCount, setActiveOfferCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            if (user) {
                const [creds, allOffers] = await Promise.all([
                    getUserCredits(user.uid),
                    getOffers()
                ]);
                setCredits(creds);
                const { active, upcoming } = categorizeOffers(allOffers);
                setActiveOfferCount(active.length + upcoming.length);
            }
        };
        loadData();

        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [user]);

    const handleSignOut = () => {
        logout();
        navigate('/');
    };

    if (!user) return null;

    return (
        <nav className="navbar">
            <div className="navbar-inner container">
                <Link to="/home" className="navbar-brand">
                    <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                        <rect width="48" height="48" rx="12" fill="url(#nav-logo-gradient)" />
                        <path d="M14 18L24 12L34 18V30L24 36L14 30V18Z" stroke="white" strokeWidth="2.5" fill="none" />
                        <circle cx="24" cy="24" r="5" fill="white" opacity="0.9" />
                        <defs>
                            <linearGradient id="nav-logo-gradient" x1="0" y1="0" x2="48" y2="48">
                                <stop stopColor="#7c3aed" />
                                <stop offset="1" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="navbar-brand-text">ThumbCraft<span className="text-accent">AI</span></span>
                </Link>

                <div className="navbar-center">
                    <Link to="/home" className={`navbar-link ${location.pathname === '/home' ? 'active' : ''}`}>Home</Link>
                    <Link to="/credits" className={`navbar-link ${location.pathname === '/credits' ? 'active' : ''}`}>Credit Store</Link>
                    {isAdmin && (
                        <Link to="/admin" className={`navbar-link navbar-link-admin ${location.pathname === '/admin' ? 'active' : ''}`}>Admin</Link>
                    )}
                </div>

                <div className="navbar-right">
                    {/* Gift / Offers Icon */}
                    <div className="navbar-offers-wrapper">
                        <button
                            className="navbar-offers-btn"
                            onClick={() => setOffersOpen(!offersOpen)}
                            title="Offers & Deals"
                        >
                            <span className="gift-icon">🎁</span>
                            {activeOfferCount > 0 && (
                                <span className="navbar-offers-badge">{activeOfferCount}</span>
                            )}
                        </button>
                        <OffersPanel isOpen={offersOpen} onClose={() => setOffersOpen(false)} />
                    </div>

                    <div className="navbar-credits">
                        <div className="navbar-credit-item">
                            <span className="badge badge-free">FREE</span>
                            <span className="credit-count">{credits.free}</span>
                        </div>
                        <div className="navbar-credit-item">
                            <span className="badge badge-pro">PRO</span>
                            <span className="credit-count">{credits.pro}</span>
                        </div>
                    </div>

                    <div className="navbar-user">
                        <div className="navbar-avatar">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} />
                            ) : (
                                <span>{(user.email || '?')[0].toUpperCase()}</span>
                            )}
                        </div>
                        <div className="navbar-user-info">
                            <span className="navbar-email">{user.email}</span>
                        </div>
                        <button className="navbar-signout" onClick={handleSignOut} title="Sign out">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                <polyline points="16,17 21,12 16,7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
