// Credits management via Firestore
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const getUserCredits = async (uid) => {
    if (!uid) return { free: 0, pro: 0 };

    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data().credits || { free: 0, pro: 0 };
        }
        return { free: 0, pro: 0 };
    } catch (error) {
        console.error('Error getting credits:', error);
        return { free: 0, pro: 0 };
    }
};

export const addCredits = async (uid, amount, type = 'pro') => {
    if (!uid) return;

    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const currentCredits = userSnap.data().credits || { free: 0, pro: 0 };
            currentCredits[type] = (currentCredits[type] || 0) + amount;
            await updateDoc(userRef, { credits: currentCredits });
            return currentCredits;
        }
    } catch (error) {
        console.error('Error adding credits:', error);
    }
};

export const deductCredits = async (uid, amount) => {
    if (!uid) return false;

    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return false;

        const credits = userSnap.data().credits || { free: 0, pro: 0 };
        const totalAvailable = (credits.free || 0) + (credits.pro || 0);

        if (totalAvailable < amount) return false;

        let remaining = amount;

        // Deduct from free first, then pro
        if (credits.free >= remaining) {
            credits.free -= remaining;
        } else {
            remaining -= credits.free;
            credits.free = 0;
            credits.pro -= remaining;
        }

        await updateDoc(userRef, { credits });
        return true;
    } catch (error) {
        console.error('Error deducting credits:', error);
        return false;
    }
};
