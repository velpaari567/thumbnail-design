// User registry utilities
// Tracks all users who have signed in via Google

export const registerUser = (user) => {
    const users = getRegisteredUsers();
    const existing = users.findIndex(u => u.email === user.email);

    const userData = {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || null,
        uid: user.uid || '',
        registeredAt: Date.now(),
        lastLoginAt: Date.now()
    };

    if (existing !== -1) {
        // Update last login
        users[existing] = { ...users[existing], lastLoginAt: Date.now() };
    } else {
        users.push(userData);
    }

    localStorage.setItem('registered_users', JSON.stringify(users));
};

export const getRegisteredUsers = () => {
    const saved = localStorage.getItem('registered_users');
    if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
};

export const getUserCount = () => {
    return getRegisteredUsers().length;
};

// Get all users with their current credit info
export const getUsersWithCredits = () => {
    const users = getRegisteredUsers();
    // In localStorage mode, we only have one user's credits
    // In production, each user would have their own credit record
    const credits = JSON.parse(localStorage.getItem('user_credits') || '{"free":5,"pro":0}');

    return users.map(user => ({
        ...user,
        credits
    }));
};
