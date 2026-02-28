import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPaymentRequest } from '../utils/payments';
import './QRPaymentPage.css';

const UPI_ID = 'am451086-2@okhdfcbank';
const UPI_NAME = 'Abdullah';

const QRPaymentPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const credits = Number(searchParams.get('credits')) || 0;
    const amount = Number(searchParams.get('amount')) || 0;
    const currency = searchParams.get('currency') || '₹';
    const packageId = searchParams.get('packageId') || '';
    const packageLabel = searchParams.get('label') || '';

    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Generate UPI deep link with amount pre-filled
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`ThumbCraftAI - ${credits} Credits`)}`;

    // Generate QR code using free API (amount pre-filled)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiLink)}`;

    const handlePaymentDone = async () => {
        if (submitting || !user) return;
        setSubmitting(true);

        const result = await createPaymentRequest({
            userUid: user.uid,
            userEmail: user.email,
            userName: user.displayName,
            packageId,
            packageLabel,
            credits,
            amount,
            currency
        });

        if (result) {
            setSubmitted(true);
        }
        setSubmitting(false);
    };

    if (submitted) {
        return (
            <div className="qr-page page">
                <div className="container">
                    <div className="qr-success animate-scale-in">
                        <div className="qr-success-icon">✅</div>
                        <h1 className="qr-success-title">Payment Request Submitted!</h1>
                        <p className="qr-success-desc">
                            Your payment of <strong>{currency}{amount}</strong> for <strong>{credits} credits</strong> is being verified.
                            Credits will be added to your account once the admin confirms the payment.
                        </p>
                        <div className="qr-success-info glass-card">
                            <div className="qr-success-info-row">
                                <span>Package</span>
                                <strong>{packageLabel}</strong>
                            </div>
                            <div className="qr-success-info-row">
                                <span>Credits</span>
                                <strong>{credits}</strong>
                            </div>
                            <div className="qr-success-info-row">
                                <span>Amount Paid</span>
                                <strong>{currency}{amount}</strong>
                            </div>
                            <div className="qr-success-info-row">
                                <span>Status</span>
                                <strong className="qr-status-pending">⏳ Awaiting Verification</strong>
                            </div>
                        </div>
                        <div className="qr-success-actions">
                            <button className="btn btn-primary" onClick={() => navigate('/home')}>
                                Back to Home
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/credits')}>
                                Credit Store
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="qr-page page">
            <div className="container">
                <div className="qr-header animate-fade-in">
                    <button className="btn btn-secondary" onClick={() => navigate('/credits')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6" />
                        </svg>
                        Back
                    </button>
                    <div>
                        <h1 className="qr-title">Complete Payment</h1>
                        <p className="qr-subtitle">Scan the QR code to pay via UPI</p>
                    </div>
                </div>

                <div className="qr-content">
                    {/* Order Summary */}
                    <div className="qr-summary glass-card animate-fade-in-up stagger-1">
                        <h2 className="qr-section-title">Order Summary</h2>
                        <div className="qr-summary-row">
                            <span>Package</span>
                            <strong>{packageLabel}</strong>
                        </div>
                        <div className="qr-summary-row">
                            <span>Credits</span>
                            <strong>💎 {credits} credits</strong>
                        </div>
                        <div className="qr-summary-divider"></div>
                        <div className="qr-summary-row qr-summary-total">
                            <span>Total Amount</span>
                            <strong>{currency}{amount}</strong>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="qr-card glass-card animate-fade-in-up stagger-2">
                        <div className="qr-card-header">
                            <span className="qr-card-icon">📱</span>
                            <h2>Scan & Pay</h2>
                        </div>

                        <div className="qr-code-wrapper">
                            <div className="qr-code-box">
                                <img src={qrUrl} alt="UPI QR Code" className="qr-code-image" />
                            </div>
                            <div className="qr-amount-display">
                                <span className="qr-amount-label">Pay exactly</span>
                                <span className="qr-amount-value">{currency}{amount}</span>
                            </div>
                        </div>

                        <div className="qr-upi-info">
                            <span className="qr-upi-label">UPI ID</span>
                            <div className="qr-upi-id">
                                <span>{UPI_ID}</span>
                                <button
                                    className="qr-copy-btn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(UPI_ID);
                                    }}
                                    title="Copy UPI ID"
                                >
                                    📋 Copy
                                </button>
                            </div>
                        </div>

                        <div className="qr-pay-link">
                            <a href={upiLink} className="btn btn-primary btn-large qr-open-app-btn">
                                Open UPI App to Pay
                            </a>
                        </div>

                        <div className="qr-instructions">
                            <h3>How to pay:</h3>
                            <ol>
                                <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                                <li>Scan the QR code above or use the UPI ID</li>
                                <li>Pay exactly <strong>{currency}{amount}</strong></li>
                                <li>After payment, click <strong>"I've Completed Payment"</strong> below</li>
                            </ol>
                        </div>
                    </div>

                    {/* Confirm Payment Button */}
                    <div className="qr-confirm animate-fade-in-up stagger-3">
                        <div className="qr-confirm-note">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <span>Only click after you've successfully completed the payment. Your credits will be added after admin verification.</span>
                        </div>
                        <button
                            className={`btn btn-primary btn-large qr-done-btn ${submitting ? 'processing' : ''}`}
                            onClick={handlePaymentDone}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <><span className="spinner"></span> Submitting...</>
                            ) : (
                                <>✅ I've Completed Payment</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRPaymentPage;
