export const calculateStats = (rawDays, startDate, endDate) => {
    // Filter days within range
    const daysInRange = rawDays.filter(d => d.id >= startDate && d.id <= endDate);

    const summary = {
        totalDays: daysInRange.length,
        completed: 0,
        skipped: 0,
        restDays: 0,
        extraActivitiesCount: 0,
        consistency: 0
    };

    const activitiesMap = {};

    daysInRange.forEach(day => {
        if (day.isRestDay) {
            summary.restDays++;
        } else {
            if (day.status === 'completed') {
                summary.completed++;
                if (day.plannedActivity) {
                    activitiesMap[day.plannedActivity] = (activitiesMap[day.plannedActivity] || 0) + 1;
                }
            } else if (day.status === 'skipped') {
                summary.skipped++;
            }
        }

        if (day.extras) {
            summary.extraActivitiesCount += day.extras.length;
            day.extras.forEach(extra => {
                activitiesMap[extra.name] = (activitiesMap[extra.name] || 0) + 1;
            });
        }
    });

    // Consistency % (completed / (total - rest))
    const trackableDays = summary.totalDays - summary.restDays;
    summary.consistency = trackableDays > 0
        ? Math.round((summary.completed / trackableDays) * 100)
        : 0;

    // Streaks
    const streaks = calculateStreaks(rawDays);

    // Activity distribution
    const activities = Object.entries(activitiesMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    return {
        summary,
        streaks,
        activities,
        rawDays: daysInRange
    };
};

const calculateStreaks = (allDays) => {
    // Sort all days by ID (YYYY-MM-DD)
    const sorted = [...allDays].sort((a, b) => a.id.localeCompare(b.id));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];

    sorted.forEach(day => {
        // A day counts towards a streak if it's completed OR it's a rest day (doesn't break it)
        if (day.status === 'completed' || day.isRestDay) {
            tempStreak++;
        } else if (day.status === 'skipped') {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
        }
        // if pending and in the past, it's basically a skip but we usually don't have pending in the past
    });

    longestStreak = Math.max(longestStreak, tempStreak);

    // Current streak calculation (backwards from today/last completed)
    // To be precisely like the server, we just use the last tempStreak if it's recent
    // But let's find the last non-future day that was completed or rest
    let current = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
        const day = sorted[i];
        if (day.id > today) continue; // Skip future

        if (day.status === 'completed' || day.isRestDay) {
            current++;
        } else if (day.status === 'skipped' || (day.id < today && day.status === 'pending')) {
            break;
        }
    }
    currentStreak = current;

    return {
        current: currentStreak,
        longest: longestStreak
    };
};
