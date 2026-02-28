import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { getSystemSettings } from '../utils/system';

const ADMIN_EMAIL = 'tempomailis001@gmail.com';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Listen for auth state changes (persists across refreshes)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                };
                setUser(userData);

                // Create/update user document in Firestore
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                // Handle Monthly Free Credits
                const systemSettings = await getSystemSettings();
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`; // e.g. "2024-3"

                if (!userSnap.exists()) {
                    // New user — create with default or requested credits
                    const initialFreeCredits = systemSettings.enableMonthlyFreeCredits ? systemSettings.monthlyFreeCreditsAmount : 0;

                    await setDoc(userRef, {
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        credits: { free: initialFreeCredits, pro: 0 },
                        lastFreeCreditMonth: currentMonth,
                        isAdmin: firebaseUser.email === ADMIN_EMAIL,
                        createdAt: serverTimestamp(),
                        lastLoginAt: serverTimestamp(),
                    });
                } else {
                    // Existing user
                    const userData = userSnap.data();
                    const updates = {
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                        lastLoginAt: serverTimestamp(),
                    };

                    // Check if we need to refill free credits
                    if (
                        systemSettings.enableMonthlyFreeCredits &&
                        userData.lastFreeCreditMonth !== currentMonth
                    ) {
                        const currentPro = userData.credits?.pro || 0;
                        updates.credits = { free: systemSettings.monthlyFreeCreditsAmount, pro: currentPro };
                        updates.lastFreeCreditMonth = currentMonth;
                    }

                    await updateDoc(userRef, updates);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error('Sign-in error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isAdmin = user?.email === ADMIN_EMAIL;

    const value = {
        user,
        loading,
        isAdmin,
        signInWithGoogle,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
