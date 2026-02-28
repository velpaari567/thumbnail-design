// Pricing data with Firestore persistence
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ADMIN_EMAIL = 'tempomailis001@gmail.com';

const defaultCreditPackages = [
    {
        id: 'pack-1',
        credits: 50,
        price: 99,
        currency: '₹',
        label: 'Starter',
        popular: false,
        salePrice: null,
        color: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
        id: 'pack-2',
        credits: 150,
        price: 249,
        currency: '₹',
        label: 'Popular',
        popular: true,
        salePrice: null,
        color: 'linear-gradient(135deg, #f093fb, #f5576c)'
    },
    {
        id: 'pack-3',
        credits: 500,
        price: 699,
        currency: '₹',
        label: 'Pro',
        popular: false,
        salePrice: null,
        color: 'linear-gradient(135deg, #4facfe, #00f2fe)'
    },
    {
        id: 'pack-4',
        credits: 1000,
        price: 1299,
        currency: '₹',
        label: 'Enterprise',
        popular: false,
        salePrice: null,
        color: 'linear-gradient(135deg, #43e97b, #38f9d7)'
    }
];

const defaultSpeedTiers = [
    { id: 'speed-1', label: '⚡ Express', description: 'Under 15 minutes', minutes: 15, extraCredits: 10 },
    { id: 'speed-2', label: '🔥 Fast', description: 'Under 1 hour', minutes: 60, extraCredits: 5 },
    { id: 'speed-3', label: '⏰ Standard', description: 'Under 6 hours', minutes: 360, extraCredits: 0 },
    { id: 'speed-4', label: '🌙 Relaxed', description: 'Under 24 hours', minutes: 1440, extraCredits: 0 }
];

const CONFIG_DOC_ID = 'pricing';

export const getCreditPackages = async () => {
    try {
        const docRef = doc(db, 'config', CONFIG_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().creditPackages) {
            return docSnap.data().creditPackages;
        }

        // First run — save defaults
        await setDoc(docRef, {
            creditPackages: defaultCreditPackages,
            speedTiers: defaultSpeedTiers
        }, { merge: true });
        return defaultCreditPackages;
    } catch (error) {
        console.error('Error getting credit packages:', error);
        return defaultCreditPackages;
    }
};

export const saveCreditPackages = async (packages) => {
    try {
        const docRef = doc(db, 'config', CONFIG_DOC_ID);
        await setDoc(docRef, { creditPackages: packages }, { merge: true });
    } catch (error) {
        console.error('Error saving credit packages:', error);
    }
};

export const getSpeedTiers = async () => {
    try {
        const docRef = doc(db, 'config', CONFIG_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().speedTiers) {
            return docSnap.data().speedTiers;
        }

        await setDoc(docRef, {
            creditPackages: defaultCreditPackages,
            speedTiers: defaultSpeedTiers
        }, { merge: true });
        return defaultSpeedTiers;
    } catch (error) {
        console.error('Error getting speed tiers:', error);
        return defaultSpeedTiers;
    }
};

export const saveSpeedTiers = async (tiers) => {
    try {
        const docRef = doc(db, 'config', CONFIG_DOC_ID);
        await setDoc(docRef, { speedTiers: tiers }, { merge: true });
    } catch (error) {
        console.error('Error saving speed tiers:', error);
    }
};

export { ADMIN_EMAIL };
