const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const generateId = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
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

module.exports = { getMonday, generateId, getRangeMondays };
