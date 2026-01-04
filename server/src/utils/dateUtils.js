const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getUTCDay();
    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);

    // Create new date in UTC
    const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff));
    return monday;
};

const generateId = (dateObj) => {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getRangeMondays = (start, end) => {
    const mondays = [];
    let current = getMonday(start);
    const last = getMonday(end);

    while (current <= last) {
        mondays.push(new Date(current));
        current.setDate(current.getDate() + 7);
    }
    return mondays;
};

const getMonthDocPath = (userId, date) => {
    const d = new Date(date);
    const monthId = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    return `users/${userId}/months/${monthId}`;
};

module.exports = { getMonday, generateId, getRangeMondays, getMonthDocPath };
