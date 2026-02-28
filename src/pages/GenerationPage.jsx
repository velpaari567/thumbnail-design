import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTimerState, formatTime, getActiveTimer } from '../utils/timer';
import { getOrderById, markOrderSeen, isOrderVisible } from '../utils/orders';
import './GenerationPage.css';

const GenerationPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order') || localStorage.getItem('active_order_id');
    const [timerState, setTimerState] = useState(null);
    const [displayTime, setDisplayTime] = useState('00:00:00');
    const [progress, setProgress] = useState(0);
    const [deliveredThumbnail, setDeliveredThumbnail] = useState(null);
    const [showDelivered, setShowDelivered] = useState(false);
    const intervalRef = useRef(null);
    const pollRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            // Try to get timer by orderId, or find any active timer
            let state = orderId ? getTimerState(orderId) : getActiveTimer();

            if (!state) {
                // Check if there's a delivered order to show (only if visible)
                if (orderId) {
                    const order = await getOrderById(orderId);
                    if (order && order.deliveredThumbnail && isOrderVisible(order)) {
                        setDeliveredThumbnail(order.deliveredThumbnail);
                        setShowDelivered(true);
                        await markOrderSeen(orderId);
                        return;
                    }
                }
                setTimerState(null);
                return;
            }

            setTimerState(state);

            // Update timer every second
            intervalRef.current = setInterval(() => {
                const currentState = getTimerState(state.orderId);
                if (currentState) {
                    setTimerState(currentState);
                    setDisplayTime(formatTime(currentState.remaining));
                    setProgress(currentState.progress * 100);
                }
            }, 1000);

            // Poll for delivery every 3 seconds (checks if admin has delivered AND it's visible)
            pollRef.current = setInterval(async () => {
                const order = await getOrderById(state.orderId);
                if (order && order.deliveredThumbnail && isOrderVisible(order)) {
                    setDeliveredThumbnail(order.deliveredThumbnail);
                    setShowDelivered(true);
                    await markOrderSeen(order.id);
                    // Clear timers
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    if (pollRef.current) clearInterval(pollRef.current);
                }
            }, 3000);
        };

        init();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [orderId]);

    // Get template info from timer state
    const templateInfo = timerState?.templateInfo;

    // Calculate circle properties
    const circumference = 2 * Math.PI * 88;
    const offset = circumference - (progress / 100) * circumference;

    const handleDownload = () => {
        if (!deliveredThumbnail) return;
        const link = document.createElement('a');
        link.href = deliveredThumbnail;
        link.download = `thumbnail-${orderId || 'download'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Delivered state — show the finished thumbnail
    if (showDelivered && deliveredThumbnail) {
        return (
            <div className="generation-page page">
                <div className="container">
                    <div className="gen-content animate-fade-in">
                        <div className="gen-delivered animate-scale-in">
                            <div className="gen-delivered-confetti">🎉</div>
                            <h1 className="gen-delivered-title">Your Thumbnail is Ready!</h1>
                            <p className="gen-delivered-desc">
                                Your AI-crafted thumbnail has been delivered. Download it below!
                            </p>
                            <div className="gen-delivered-preview">
                                <img src={deliveredThumbnail} alt="Your finished thumbnail" />
                            </div>
                            <div className="gen-delivered-actions">
                                <button className="btn btn-primary btn-large" onClick={handleDownload}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download Thumbnail
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/home')}>
                                    Back to Home
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/templates')}>
                                    Create Another
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No active timer state
    if (!timerState) {
        return (
            <div className="generation-page page">
                <div className="container">
                    <div className="gen-empty animate-fade-in">
                        <div className="gen-empty-icon">📋</div>
                        <h2>No Active Generation</h2>
                        <p>You don't have any thumbnails being generated right now.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/templates')}>
                            Create New Thumbnail
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="generation-page page">
            <div className="container">
                <div className="gen-content animate-fade-in">
                    {!timerState.isComplete ? (
                        <>
                            <div className="gen-status">
                                <div className="gen-status-dot"></div>
                                <span>Your thumbnail is being created...</span>
                            </div>

                            {/* Blurry Template Preview Animation */}
                            <div className="gen-preview-section animate-scale-in">
                                <div className="gen-preview-wrapper">
                                    {/* Background glow layers */}
                                    <div
                                        className="gen-preview-glow-1"
                                        style={{ background: templateInfo?.previewColor || 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                                    ></div>
                                    <div
                                        className="gen-preview-glow-2"
                                        style={{ background: templateInfo?.previewColor || 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                                    ></div>

                                    {/* Main blurry thumbnail card */}
                                    <div className="gen-preview-card">
                                        <div
                                            className="gen-preview-image"
                                            style={{ background: templateInfo?.previewColor || 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                                        >
                                            <span className="gen-preview-icon">{templateInfo?.icon || '🎨'}</span>
                                        </div>
                                        {/* Scanning line effect */}
                                        <div className="gen-preview-scanline"></div>
                                        {/* Shimmer overlay */}
                                        <div className="gen-preview-shimmer"></div>
                                    </div>

                                    {/* Floating particles */}
                                    <div className="gen-particles">
                                        <div className="gen-particle gen-particle-1">✦</div>
                                        <div className="gen-particle gen-particle-2">✧</div>
                                        <div className="gen-particle gen-particle-3">◆</div>
                                        <div className="gen-particle gen-particle-4">✦</div>
                                        <div className="gen-particle gen-particle-5">✧</div>
                                    </div>
                                </div>

                                <div className="gen-preview-label">
                                    <span className="gen-preview-template-name">{templateInfo?.name || 'Thumbnail'}</span>
                                    <span className="gen-preview-generating">Generating with AI...</span>
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="gen-timer-wrapper">
                                <svg className="gen-timer-ring" width="200" height="200" viewBox="0 0 200 200">
                                    <circle
                                        className="gen-timer-track"
                                        cx="100" cy="100" r="88"
                                        fill="none"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        className="gen-timer-progress"
                                        cx="100" cy="100" r="88"
                                        fill="none"
                                        strokeWidth="6"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        transform="rotate(-90 100 100)"
                                    />
                                </svg>
                                <div className="gen-timer-display">
                                    <div className="gen-timer-time">{displayTime}</div>
                                    <div className="gen-timer-label">remaining</div>
                                </div>
                            </div>

                            <div className="gen-progress-bar">
                                <div className="gen-progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="gen-progress-text">{Math.round(progress)}% complete</div>

                            <div className="gen-info animate-fade-in-up stagger-2">
                                <div className="gen-info-card glass-card">
                                    <span className="gen-info-icon">💡</span>
                                    <p>You can safely close this page. The timer will continue running and you'll find your thumbnail ready when you come back!</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="gen-complete animate-scale-in">
                            <div className="gen-complete-icon">⏳</div>
                            <h1 className="gen-complete-title">Almost There!</h1>
                            <p className="gen-complete-desc">
                                Timer complete! Our AI is putting the finishing touches on your thumbnail.
                                It will appear here automatically when ready.
                            </p>
                            <div className="gen-waiting-spinner"></div>
                            <div className="gen-complete-actions">
                                <button className="btn btn-secondary" onClick={() => navigate('/home')}>
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerationPage;
