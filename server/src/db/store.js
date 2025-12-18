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

const getWeek = (date) => {
    const monday = getMonday(date);
    const key = generateId(monday);

    if (!weeks.has(key)) {
        weeks.set(key, generateWeek(monday));
    }

    const week = weeks.get(key);

    // Check for skipped days
    const today = new Date();
    const todayId = generateId(today);

    week.forEach(day => {
        if (day.id < todayId && day.status === 'pending' && !day.isRestDay) {
            day.status = 'skipped';
        }
    });

    return week;
};

const updateDay = (dayId, data) => {
    // dayId is YYYY-MM-DD
    const [y, m, d] = dayId.split('-').map(Number);
    const dayDate = new Date(y, m - 1, d);
    const monday = getMonday(dayDate);
    const key = generateId(monday);

    if (weeks.has(key)) {
        const week = weeks.get(key);
        const index = week.findIndex(d => d.id === dayId);

        if (index !== -1) {
            week[index] = { ...week[index], ...data };
            return week[index];
        }
    }
    return null;
};

module.exports = {
    getWeek,
    updateDay
};
