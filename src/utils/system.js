import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const SYSTEM_DOC_ID = 'systemSettings';

const defaultSettings = {
    disableFreeGeneration: false,
    disableAllGeneration: false
};

// Get settings once
export const getSystemSettings = async () => {
    try {
        const docRef = doc(db, 'config', SYSTEM_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { ...defaultSettings, ...docSnap.data() };
        }

        // First run — save defaults
        await setDoc(docRef, defaultSettings);
        return defaultSettings;
    } catch (error) {
        console.error('Error getting system settings:', error);
        return defaultSettings;
    }
};

// Update settings
export const updateSystemSettings = async (newSettings) => {
    try {
        const docRef = doc(db, 'config', SYSTEM_DOC_ID);
        await setDoc(docRef, newSettings, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating system settings:', error);
        return false;
    }
};

// Listen for realtime settings changes
export const listenToSystemSettings = (callback) => {
    const docRef = doc(db, 'config', SYSTEM_DOC_ID);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ ...defaultSettings, ...docSnap.data() });
        } else {
            callback(defaultSettings);
        }
    }, (error) => {
        console.error('Error listening to system settings:', error);
    });
};
