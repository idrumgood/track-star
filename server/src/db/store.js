const prisma = require('./prisma');
const { generateId, getMonday, getRangeMondays } = require('../utils/dateUtils');

const ensureUser = async (userId) => {
    return prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId }
    });
};

const generateWeekData = (userId, mondayDate) => {
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(mondayDate);
        d.setUTCDate(mondayDate.getUTCDate() + i);
        const dayId = `${userId}_${generateId(d)}`;

        week.push({
            id: dayId,
            userId: userId,
            date: d,
            plannedActivityRaw: "Plan",
            isRestDay: false,
            status: 'pending'
        });
    }
    return week;
};

const getWeek = async (userId, date) => {
    await ensureUser(userId);
    const monday = getMonday(date);
    const startId = `${userId}_${generateId(monday)}`;

    // Calculate the Sunday ID
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const endId = `${userId}_${generateId(sunday)}`;

    let days = await prisma.day.findMany({
        where: {
            userId: userId,
            id: { gte: startId, lte: endId }
        },
        include: {
            extras: true,
            activityType: true
        },
        orderBy: { date: 'asc' }
    });

    if (days.length === 0) {
        // Generate and save initial week
        const weekData = generateWeekData(userId, monday);
        await prisma.day.createMany({
            data: weekData
        });

        days = await prisma.day.findMany({
            where: {
                userId: userId,
                id: { gte: startId, lte: endId }
            },
            include: {
                extras: true,
                activityType: true
            },
            orderBy: { date: 'asc' }
        });
    }

    // Check for skipped days
    const todayId = generateId(new Date());
    let changed = false;

    const processedDays = days.map(day => {
        const dayDateId = generateId(day.date);
        let updatedStatus = day.status;

        if (day.isRestDay && day.status === 'skipped') {
            updatedStatus = 'pending';
            changed = true;
        }

        if (dayDateId < todayId && day.status === 'pending' && !day.isRestDay) {
            updatedStatus = 'skipped';
            changed = true;
        }

        return { ...day, status: updatedStatus };
    });

    if (changed) {
        // Batch update statuses
        await Promise.all(processedDays.map(day =>
            prisma.day.update({
                where: { id: day.id },
                data: { status: day.status }
            })
        ));
    }

    // Format for return (to match existing API)
    return processedDays.map(day => ({
        id: generateId(day.date), // Controller expects YYYY-MM-DD
        date: day.date.toISOString(),
        dayName: day.date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
        plannedActivity: day.activityType ? day.activityType.name : day.plannedActivityRaw,
        isRestDay: day.isRestDay,
        status: day.status,
        extras: day.extras.map(e => e.name)
    }));
};

const updateDay = async (userId, dayDateId, data) => {
    await ensureUser(userId);
    const dayId = `${userId}_${dayDateId}`;

    const existingDay = await prisma.day.findUnique({
        where: { id: dayId },
        include: { extras: true }
    });

    if (!existingDay) return null;

    const updateData = {};
    if (data.plannedActivity !== undefined) {
        updateData.plannedActivityRaw = data.plannedActivity;
        // In the future, we would look up activityType here
    }
    if (data.isRestDay !== undefined) updateData.isRestDay = data.isRestDay;
    if (data.status !== undefined) updateData.status = data.status;

    // Enforce business rules
    const finalIsRestDay = data.isRestDay !== undefined ? data.isRestDay : existingDay.isRestDay;
    let finalStatus = data.status !== undefined ? data.status : existingDay.status;

    if (finalIsRestDay && finalStatus === 'skipped') {
        finalStatus = 'pending';
    }

    const todayId = generateId(new Date());
    if (dayDateId < todayId && finalStatus === 'pending' && !finalIsRestDay) {
        finalStatus = 'skipped';
    }

    updateData.status = finalStatus;

    // Handle extras
    if (data.extras !== undefined) {
        // Simple strategy: delete and recreate extras
        await prisma.extra.deleteMany({ where: { dayId } });
        await prisma.extra.createMany({
            data: data.extras.map(name => ({ dayId, name }))
        });
    }

    const updatedDay = await prisma.day.update({
        where: { id: dayId },
        data: updateData,
        include: { extras: true, activityType: true }
    });

    return {
        id: generateId(updatedDay.date),
        date: updatedDay.date.toISOString(),
        dayName: updatedDay.date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
        plannedActivity: updatedDay.activityType ? updatedDay.activityType.name : updatedDay.plannedActivityRaw,
        isRestDay: updatedDay.isRestDay,
        status: updatedDay.status,
        extras: updatedDay.extras.map(e => e.name)
    };
};

const getDaysInRange = async (userId, startDate, endDate) => {
    await ensureUser(userId);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const days = await prisma.day.findMany({
        where: {
            userId: userId,
            date: {
                gte: start,
                lte: end
            }
        },
        include: {
            extras: true,
            activityType: true
        },
        orderBy: { date: 'asc' }
    });

    return days.map(day => ({
        id: generateId(day.date),
        date: day.date.toISOString(),
        plannedActivity: day.activityType ? day.activityType.name : day.plannedActivityRaw,
        isRestDay: day.isRestDay,
        status: day.status,
        extras: day.extras.map(e => e.name)
    }));
};

module.exports = {
    getWeek,
    updateDay,
    getDaysInRange
};

