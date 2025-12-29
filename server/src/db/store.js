const { Firestore } = require('@google-cloud/firestore');
const { generateId, getMonday } = require('../utils/dateUtils');

const db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    databaseId: process.env.FIRESTORE_DATABASE_ID
});

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

const getWeek = async (userId, date) => {
    const monday = getMonday(date);
    const weekKey = generateId(monday);

    // Path: users/{userId}/weeks/{weekKey}/days/{dayId}
    const daysCollection = db.collection('users').doc(userId)
        .collection('weeks').doc(weekKey)
        .collection('days');

    const snapshot = await daysCollection.get();
    let week;

    if (snapshot.empty) {
        // Generate and save initial week
        week = generateWeek(monday);
        const batch = db.batch();
        week.forEach(day => {
            const dayRef = daysCollection.doc(day.id);
            batch.set(dayRef, day);
        });
        await batch.commit();
    } else {
        week = snapshot.docs.map(doc => doc.data());
        // Sort by id (YYYY-MM-DD) to ensure correct order
        week.sort((a, b) => a.id.localeCompare(b.id));
    }

    // Check for skipped days
    const today = new Date();
    const todayId = generateId(today);

    let changed = false;
    week.forEach(day => {
        // Enforce: Rest Days cannot be pending or skipped if in the past? 
        // Actually the original logic:
        if (day.isRestDay && day.status === 'skipped') {
            day.status = 'pending';
            changed = true;
        }

        if (day.id < todayId && day.status === 'pending' && !day.isRestDay) {
            day.status = 'skipped';
            changed = true;
        }
    });

    if (changed) {
        const batch = db.batch();
        week.forEach(day => {
            const dayRef = daysCollection.doc(day.id);
            batch.set(dayRef, day);
        });
        await batch.commit();
    }

    return week;
};

const updateDay = async (userId, dayId, data) => {
    // dayId is YYYY-MM-DD
    const [y, m, d] = dayId.split('-').map(Number);
    const dayDate = new Date(y, m - 1, d);
    const monday = getMonday(dayDate);
    const weekKey = generateId(monday);

    const dayRef = db.collection('users').doc(userId)
        .collection('weeks').doc(weekKey)
        .collection('days').doc(dayId);

    const doc = await dayRef.get();
    if (!doc.exists) {
        return null;
    }

    const currentData = doc.data();
    const updatedData = { ...currentData, ...data };

    // Enforce: Rest Days cannot be skipped
    if (updatedData.isRestDay && updatedData.status === 'skipped') {
        updatedData.status = 'pending';
    }

    // Enforce: Past days that are not completed should be skipped
    const todayId = generateId(new Date());
    if (updatedData.id < todayId && updatedData.status === 'pending' && !updatedData.isRestDay) {
        updatedData.status = 'skipped';
    }

    await dayRef.set(updatedData);
    return updatedData;
};

module.exports = {
    getWeek,
    updateDay
};

