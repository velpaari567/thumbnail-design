// Timer utility - persists across browser refresh using localStorage

export const startTimer = (orderId, durationMinutes, templateInfo = null) => {
    const timerData = {
        orderId,
        startTime: Date.now(),
        durationMs: durationMinutes * 60 * 1000,
        status: 'running',
        templateInfo // { icon, previewColor, name }
    };
    localStorage.setItem(`timer_${orderId}`, JSON.stringify(timerData));
    return timerData;
};

export const getTimerState = (orderId) => {
    const saved = localStorage.getItem(`timer_${orderId}`);
    if (!saved) return null;

    try {
        const timerData = JSON.parse(saved);
        const elapsed = Date.now() - timerData.startTime;
        const remaining = Math.max(0, timerData.durationMs - elapsed);

        return {
            ...timerData,
            elapsed,
            remaining,
            isComplete: remaining <= 0,
            progress: Math.min(1, elapsed / timerData.durationMs)
        };
    } catch {
        return null;
    }
};

export const getActiveTimer = () => {
    // Find any active timer
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('timer_')) {
            const state = getTimerState(key.replace('timer_', ''));
            if (state && !state.isComplete) {
                return state;
            }
        }
    }
    return null;
};

export const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const clearTimer = (orderId) => {
    localStorage.removeItem(`timer_${orderId}`);
};
