// Pricing and credit store configuration

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
    {
        id: 'speed-60',
        label: '1 Hour',
        minutes: 60,
        extraCredits: 0,
        description: 'Standard delivery',
        icon: '⏰'
    },
    {
        id: 'speed-30',
        label: '30 Minutes',
        minutes: 30,
        extraCredits: 5,
        description: 'Fast delivery',
        icon: '⚡'
    },
    {
        id: 'speed-15',
        label: '15 Minutes',
        minutes: 15,
        extraCredits: 15,
        description: 'Express delivery',
        icon: '🚀'
    }
];

export const getCreditPackages = () => {
    const saved = localStorage.getItem('admin_credit_packages');
    if (saved) {
        try { return JSON.parse(saved); } catch { return defaultCreditPackages; }
    }
    return defaultCreditPackages;
};

export const saveCreditPackages = (packages) => {
    localStorage.setItem('admin_credit_packages', JSON.stringify(packages));
};

export const getSpeedTiers = () => {
    const saved = localStorage.getItem('admin_speed_tiers');
    if (saved) {
        try { return JSON.parse(saved); } catch { return defaultSpeedTiers; }
    }
    return defaultSpeedTiers;
};

export const saveSpeedTiers = (tiers) => {
    localStorage.setItem('admin_speed_tiers', JSON.stringify(tiers));
};

// Free credits given monthly  
export const FREE_MONTHLY_CREDITS = 5;

export const ADMIN_EMAIL = 'admin@thumbnail.ai';
