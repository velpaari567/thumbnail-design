// Credit management utilities

export const getUserCredits = () => {
    const saved = localStorage.getItem('user_credits');
    if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return { free: 5, pro: 0 };
};

export const saveUserCredits = (credits) => {
    localStorage.setItem('user_credits', JSON.stringify(credits));
};

export const getTotalCredits = () => {
    const credits = getUserCredits();
    return credits.free + credits.pro;
};

export const deductCredits = (amount) => {
    const credits = getUserCredits();
    const total = credits.free + credits.pro;

    if (total < amount) {
        return { success: false, message: 'Insufficient credits' };
    }

    // Deduct from free credits first, then pro
    let remaining = amount;

    if (credits.free >= remaining) {
        credits.free -= remaining;
        remaining = 0;
    } else {
        remaining -= credits.free;
        credits.free = 0;
        credits.pro -= remaining;
        remaining = 0;
    }

    saveUserCredits(credits);
    return { success: true, credits };
};

export const addCredits = (amount, type = 'pro') => {
    const credits = getUserCredits();
    credits[type] += amount;
    saveUserCredits(credits);
    return credits;
};
