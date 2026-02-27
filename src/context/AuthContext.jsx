import { createContext, useContext, useState, useEffect } from 'react';
import { FREE_MONTHLY_CREDITS, ADMIN_EMAIL } from '../data/pricingData';
import { getUserCredits, saveUserCredits } from '../utils/credits';
import { registerUser } from '../utils/users';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for saved session
        const saved = localStorage.getItem('auth_user');
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch { /* ignore */ }
        }
        setLoading(false);
    }, []);

    // Check and grant monthly free credits
    useEffect(() => {
        if (user) {
            const lastGrant = localStorage.getItem('last_free_credit_grant');
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;

            if (lastGrant !== currentMonth) {
                const credits = getUserCredits();
                credits.free = FREE_MONTHLY_CREDITS;
                saveUserCredits(credits);
                localStorage.setItem('last_free_credit_grant', currentMonth);
            }
        }
    }, [user]);

    const signInWithGoogle = async () => {
        // Mock Google sign-in for development
        // Replace with Firebase Auth later
        const mockUser = {
            email: 'user@gmail.com',
            displayName: 'Demo User',
            photoURL: null,
            uid: 'mock-uid-12345'
        };

        setUser(mockUser);
        localStorage.setItem('auth_user', JSON.stringify(mockUser));
        registerUser(mockUser);

        // Initialize credits if first time
        if (!localStorage.getItem('user_credits')) {
            saveUserCredits({ free: FREE_MONTHLY_CREDITS, pro: 0 });
        }

        return mockUser;
    };

    const signOut = () => {
        setUser(null);
        localStorage.removeItem('auth_user');
    };

    const isAdmin = user?.email === ADMIN_EMAIL;

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
