const CACHE_PREFIX = 'ts_stats_cache_v1_';

export const getCacheKey = (userId, yearMonth) => `${CACHE_PREFIX}${userId}_${yearMonth}`;

export const getMonthFromCache = (userId, yearMonth) => {
    const data = localStorage.getItem(getCacheKey(userId, yearMonth));
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse stats cache', e);
        return null;
    }
};

export const saveMonthToCache = (userId, yearMonth, days) => {
    localStorage.setItem(getCacheKey(userId, yearMonth), JSON.stringify(days));
};

export const invalidateMonthCache = (userId, date) => {
    // date can be a YYYY-MM-DD string or a Date object
    const d = new Date(date);
    const yearMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    localStorage.removeItem(getCacheKey(userId, yearMonth));
};

export const invalidateAllCache = () => {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
};
