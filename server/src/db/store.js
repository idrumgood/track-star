const { generateId, getMonday } = require('../utils/dateUtils');

const weeks = new Map();

const generateWeek = (mondayDate) => {
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setDate(mondayDate.getDate() + i);
        const id = generateId(d);

        week.push({
            id: id,
            date: d.toISOString(),
            dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
            plannedActivity: "Plan",
            isRestDay: false,
            status: 'pending',
            extras: []
        });
    }
    return week;
};

const getWeek = (userId, date) => {
    const monday = getMonday(date);
    const weekKey = generateId(monday);
    const fullKey = `${userId}:${weekKey}`;

    if (!weeks.has(fullKey)) {
        weeks.set(fullKey, generateWeek(monday));
    }

    const week = weeks.get(fullKey);

    // Check for skipped days
    const today = new Date();
    const todayId = generateId(today);

    week.forEach(day => {
        // Enforce: Rest Days cannot be skipped
        if (day.isRestDay && day.status === 'skipped') {
            day.status = 'pending';
        }

        if (day.id < todayId && day.status === 'pending' && !day.isRestDay) {
            day.status = 'skipped';
        }
    });

    return week;
};

const updateDay = (userId, dayId, data) => {
    // dayId is YYYY-MM-DD
    const [y, m, d] = dayId.split('-').map(Number);
    const dayDate = new Date(y, m - 1, d);
    const monday = getMonday(dayDate);
    const weekKey = generateId(monday);
    const fullKey = `${userId}:${weekKey}`;

    if (weeks.has(fullKey)) {
        const week = weeks.get(fullKey);
        const index = week.findIndex(d => d.id === dayId);

        if (index !== -1) {
            week[index] = { ...week[index], ...data };

            // Enforce: Rest Days cannot be skipped
            if (week[index].isRestDay && week[index].status === 'skipped') {
                week[index].status = 'pending';
            }

            return week[index];
        }
    }
    return null;
};

module.exports = {
    getWeek,
    updateDay
};
