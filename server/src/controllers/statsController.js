const store = require('../db/store');

const getStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: "Missing start or end date" });
        }

        // Basic date validation
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ error: "Invalid start or end date format" });
        }

        const days = await store.getDaysInRange(userId, start, end);

        // Aggregation logic
        let completed = 0;
        let skipped = 0;
        let restDays = 0;
        let extraActivitiesCount = 0;
        const activities = {};

        days.forEach(day => {
            if (day.status === 'completed') completed++;
            if (day.status === 'skipped') skipped++;
            if (day.isRestDay) restDays++;

            if (day.extras && day.extras.length > 0) {
                extraActivitiesCount += day.extras.length;
            }

            if (!day.isRestDay && day.plannedActivity && day.plannedActivity !== "Plan") {
                activities[day.plannedActivity] = (activities[day.plannedActivity] || 0) + 1;
            }
        });

        const sortedActivities = Object.entries(activities)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        // Streak Calculation
        let currentStreak = 0;
        let maxStreak = 0;
        let runningStreak = 0;

        // Sort days by ID (already done by store, but double check)
        days.forEach(day => {
            if (day.status === 'completed') {
                runningStreak++;
                if (runningStreak > maxStreak) maxStreak = runningStreak;
            } else if (!day.isRestDay) {
                // Only break streak on non-rest days that aren't completed
                runningStreak = 0;
            }
            // Rest days don't break the streak if they aren't 'skipped'
            // Actually, if a rest day is passed, it counts as "neutral". 
            // Most streak trackers say "completed target" or "intentional rest".
            // Let's say rest days don't break it if they aren't skipped.
        });

        // Current streak should look at the most recent days backwards
        const reverseDays = [...days].reverse();
        const todayId = new Date().toISOString().split('T')[0];

        let foundStop = false;
        reverseDays.forEach(day => {
            if (foundStop) return;
            if (day.id > todayId) return; // Ignore future days

            if (day.status === 'completed') {
                currentStreak++;
            } else if (!day.isRestDay) {
                foundStop = true;
            }
        });

        res.json({
            summary: {
                totalDays: days.length,
                completed,
                skipped,
                restDays,
                extraActivitiesCount,
                consistency: days.length > 0 ? Math.round((completed / days.filter(d => !d.isRestDay).length || 1) * 100) : 0
            },
            streaks: {
                current: currentStreak,
                longest: maxStreak
            },
            activities: sortedActivities,
            rawDays: days // Optional: useful for charts
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getStats };
