const db = require('./firestore');
const { generateId, getMonday, getMonthDocPath } = require('../utils/dateUtils');
const { sanitizeString, sanitizeArray } = require('../utils/sanitize');

const mapFirestoreDay = (dateId, dayData) => {
    const date = new Date(dayData.date || `${dateId}T12:00:00Z`);
    return {
        id: dateId,
        date: dayData.date || date.toISOString(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
        plannedActivity: dayData.plannedActivityRaw,
        isRestDay: dayData.isRestDay || false,
        status: dayData.status || 'pending',
        extras: dayData.extras || []
    };
};

const ensureUser = async (userData) => {
    const { id, email, name, picture } = userData;
    const userRef = db.doc(`users/${id}`);
    const doc = await userRef.get();

    const dataToSet = {
        email,
        name,
        picture,
        lastLogin: new Date().toISOString()
    };

    if (!doc.exists) {
        // Initialize settings for new users
        dataToSet.settings = {
            theme: 'dark'
        };
        await userRef.set(dataToSet);
    } else {
        await userRef.set(dataToSet, { merge: true });
    }

    return { id, ...dataToSet, ...(doc.exists ? doc.data().settings : { theme: 'dark' }) };
};

const getUserProfile = async (userId) => {
    const doc = await db.doc(`users/${userId}`).get();
    if (!doc.exists) return null;
    return { id: userId, ...doc.data() };
};

const updateUserProfile = async (userId, data) => {
    const userRef = db.doc(`users/${userId}`);
    await userRef.set(data, { merge: true });
    const updated = await userRef.get();
    return { id: userId, ...updated.data() };
};

const deleteActivity = async (userId, activityId) => {
    await db.doc(`users/${userId}/activities/${activityId}`).delete();
    return true;
};

const generateWeekData = (userId, mondayDate) => {
    const week = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setUTCDate(mondayDate.getUTCDate() + i);
        const dayDateId = generateId(d);

        week[dayDateId] = {
            date: d.toISOString(),
            plannedActivityRaw: "Plan",
            isRestDay: false,
            status: 'pending',
            extras: []
        };
    }
    return week;
};

const getWeek = async (userId, date) => {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const startMonth = getMonthDocPath(userId, monday);
    const endMonth = getMonthDocPath(userId, sunday);

    const monthDocs = new Set([startMonth, endMonth]);
    const monthsData = {};

    for (const path of monthDocs) {
        const doc = await db.doc(path).get();
        if (doc.exists) {
            monthsData[path] = doc.data().days || {};
        } else {
            monthsData[path] = {};
        }
    }

    const todayId = generateId(new Date());
    const weekDays = [];
    let changed = false;
    const updates = {};

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setUTCDate(monday.getUTCDate() + i);
        const dayDateId = generateId(d);
        const monthPath = getMonthDocPath(userId, d);

        let dayData = monthsData[monthPath][dayDateId];

        if (!dayData) {
            // Initialize day if missing
            dayData = {
                date: d.toISOString(),
                plannedActivityRaw: "Plan",
                isRestDay: false,
                status: 'pending',
                extras: []
            };
            if (!updates[monthPath]) updates[monthPath] = { days: {} };
            updates[monthPath].days[dayDateId] = dayData;
            changed = true;
        }

        // Apply business rules for 'skipped'
        let updatedStatus = dayData.status;
        if (dayData.isRestDay && dayData.status === 'skipped') {
            updatedStatus = 'pending';
            changed = true;
        }
        if (dayDateId < todayId && dayData.status === 'pending' && !dayData.isRestDay) {
            updatedStatus = 'skipped';
            changed = true;
        }

        if (updatedStatus !== dayData.status) {
            dayData.status = updatedStatus;
            if (!updates[monthPath]) updates[monthPath] = { days: {} };
            if (!updates[monthPath].days[dayDateId]) updates[monthPath].days[dayDateId] = {};
            updates[monthPath].days[dayDateId].status = updatedStatus;
        }

        weekDays.push(mapFirestoreDay(dayDateId, dayData));
    }

    if (changed) {
        for (const [path, fields] of Object.entries(updates)) {
            await db.doc(path).set(fields, { merge: true });
        }
    }

    return weekDays;
};

const updateDay = async (userId, dayDateId, data) => {
    const date = new Date(dayDateId + 'T12:00:00Z'); // Midday to avoid TZ issues
    const monthPath = getMonthDocPath(userId, date);
    const docRef = db.doc(monthPath);
    const doc = await docRef.get();

    let dayData = (doc.exists && doc.data().days) ? doc.data().days[dayDateId] : null;

    if (!dayData) {
        // If it doesn't exist, we'll initialize it with defaults before applying updates
        dayData = {
            date: date.toISOString(),
            plannedActivityRaw: "Plan",
            isRestDay: false,
            status: 'pending',
            extras: []
        };
    }

    const updates = { days: { [dayDateId]: {} } };
    let changed = false;

    if (data.plannedActivity !== undefined) {
        const sanitizedActivity = sanitizeString(data.plannedActivity).trim();
        dayData.plannedActivityRaw = sanitizedActivity;
        updates.days[dayDateId].plannedActivityRaw = dayData.plannedActivityRaw;
        changed = true;

        // Auto-creation logic for activities
        if (sanitizedActivity !== "" && sanitizedActivity !== "Plan") {
            const globalRef = db.collection('activity_types').where('name', '==', sanitizedActivity).limit(1);
            const userRef = db.collection(`users/${userId}/activities`).where('name', '==', sanitizedActivity).limit(1);

            const [globalSnap, userSnap] = await Promise.all([globalRef.get(), userRef.get()]);

            if (globalSnap.empty && userSnap.empty) {
                await db.collection(`users/${userId}/activities`).add({
                    name: sanitizedActivity,
                    createdAt: new Date().toISOString()
                });
            }
        }
    }
    if (data.isRestDay !== undefined) {
        dayData.isRestDay = data.isRestDay;
        updates.days[dayDateId].isRestDay = dayData.isRestDay;
        changed = true;
    }
    if (data.status !== undefined) {
        dayData.status = data.status;
        updates.days[dayDateId].status = dayData.status;
        changed = true;
    }
    if (data.extras !== undefined) {
        dayData.extras = sanitizeArray(data.extras);
        updates.days[dayDateId].extras = dayData.extras;
        changed = true;
    }

    // Enforce business rules
    let finalStatus = dayData.status;
    if (dayData.isRestDay && finalStatus === 'skipped') {
        finalStatus = 'pending';
    }

    const todayId = generateId(new Date());
    if (dayDateId < todayId && finalStatus === 'pending' && !dayData.isRestDay) {
        finalStatus = 'skipped';
    }

    if (finalStatus !== dayData.status || updates.days[dayDateId].status) {
        dayData.status = finalStatus;
        updates.days[dayDateId].status = finalStatus;
        changed = true;
    }

    if (changed) {
        await docRef.set(updates, { merge: true });
    }

    return mapFirestoreDay(dayDateId, dayData);
};

const getDaysInRange = async (userId, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Determine which months we need to fetch
    const monthsToFetch = [];
    let current = new Date(start);
    current.setUTCDate(1); // Start of month

    while (current <= end) {
        monthsToFetch.push(getMonthDocPath(userId, current));
        current.setUTCMonth(current.getUTCMonth() + 1);
    }

    const allDays = [];
    for (const path of monthsToFetch) {
        const doc = await db.doc(path).get();
        if (doc.exists && doc.data().days) {
            const daysMap = doc.data().days;
            Object.keys(daysMap).sort().forEach(dateId => {
                if (dateId >= startDate && dateId <= endDate) {
                    allDays.push(mapFirestoreDay(dateId, daysMap[dateId]));
                }
            });
        }
    }

    return allDays;
};

const getActivities = async (userId) => {
    // Fetch global activities
    const globalSnapshot = await db.collection('activity_types').orderBy('name', 'asc').get();
    const globalActivities = globalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), userId: null }));

    // Fetch user-specific activities
    const userSnapshot = await db.collection(`users/${userId}/activities`).orderBy('name', 'asc').get();
    const userActivities = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), userId }));

    return [...globalActivities, ...userActivities].sort((a, b) => a.name.localeCompare(b.name));
};

module.exports = {
    getWeek,
    updateDay,
    getDaysInRange,
    getActivities,
    ensureUser,
    getUserProfile,
    updateUserProfile,
    deleteActivity
};

