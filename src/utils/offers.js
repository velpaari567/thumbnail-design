// Offers management via Firestore
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Default offers (used if Firestore is empty)
const DEFAULT_OFFERS = [];

export const getOffers = async () => {
    try {
        const q = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return DEFAULT_OFFERS;
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error('Error getting offers:', error);
        return DEFAULT_OFFERS;
    }
};

export const saveOffer = async (offer) => {
    try {
        const offerId = offer.id || `offer-${Date.now()}`;
        const offerData = {
            title: offer.title || '',
            description: offer.description || '',
            emoji: offer.emoji || '🎁',
            type: offer.type || 'discount', // discount, bonus, special
            startDate: offer.startDate || '',
            endDate: offer.endDate || '',
            isActive: offer.isActive !== undefined ? offer.isActive : true,
            createdAt: offer.createdAt || Date.now()
        };
        await setDoc(doc(db, 'offers', offerId), offerData);
        return { id: offerId, ...offerData };
    } catch (error) {
        console.error('Error saving offer:', error);
        return null;
    }
};

export const deleteOffer = async (offerId) => {
    try {
        await deleteDoc(doc(db, 'offers', offerId));
        return true;
    } catch (error) {
        console.error('Error deleting offer:', error);
        return false;
    }
};

// Categorize offers by status based on current time
export const categorizeOffers = (offers) => {
    const now = new Date();
    const active = [];
    const upcoming = [];
    const expired = [];

    offers.forEach(offer => {
        if (!offer.isActive) {
            expired.push(offer);
            return;
        }

        const start = offer.startDate ? new Date(offer.startDate) : null;
        const end = offer.endDate ? new Date(offer.endDate) : null;

        if (end && end < now) {
            expired.push(offer);
        } else if (start && start > now) {
            upcoming.push(offer);
        } else {
            active.push(offer);
        }
    });

    return { active, upcoming, expired };
};

// Format remaining time
export const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
};

// Format "starts in" time
export const getStartsIn = (startDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const diff = start - now;

    if (diff <= 0) return 'Starting now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Starts in ${days}d ${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    return `Starts in ${minutes}m`;
};
