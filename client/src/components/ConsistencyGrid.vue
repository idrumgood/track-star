<script setup>
import { computed } from 'vue';

const props = defineProps({
    days: {
        type: Array, // Expected to be full year
        required: true
    },
    year: {
        type: Number,
        required: true
    }
});

const emit = defineEmits(['year-change']);

// Grid logic: Columns are weeks, rows are days (0=Mon, 6=Sun)
const gridData = computed(() => {
    if (!props.year) return [];

    // Full year boundaries
    const startUTC = Date.UTC(props.year, 0, 1);
    const endUTC = Date.UTC(props.year, 11, 31);
    
    const dayMap = new Map();
    props.days.forEach(day => {
        if (day && day.id) dayMap.set(day.id, day);
    });

    // Determine the first Monday before or on Jan 1st
    const jan1 = new Date(startUTC);
    let dayOfWeek = jan1.getUTCDay(); // 0 is Sunday
    let diff = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Days since Monday
    const gridStart = new Date(startUTC - diff * 24 * 60 * 60 * 1000);

    const weeks = [];
    let currentWeek = [];
    let curr = new Date(gridStart);

    // We want to cover the whole year, aligned to weeks
    const dec31 = new Date(endUTC);
    let lastDayOfWeek = dec31.getUTCDay();
    let lastDiff = (lastDayOfWeek === 0) ? 0 : 7 - lastDayOfWeek;
    const gridEnd = new Date(endUTC + lastDiff * 24 * 60 * 60 * 1000);

    const todayId = new Date().toISOString().split('T')[0];

    while (curr <= gridEnd) {
        const id = curr.toISOString().split('T')[0];
        const dayData = dayMap.get(id);
        
        // Out of range check (for months outside the requested year if showing partial weeks)
        const isOutOfRange = curr.getUTCFullYear() !== props.year;
        const isFuture = id > todayId;

        currentWeek.push({
            id,
            date: new Date(curr),
            data: dayData,
            isOutOfRange,
            isFuture
        });

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        curr.setUTCDate(curr.getUTCDate() + 1);
    }

    return weeks;
});

const getLevel = (day) => {
    if (day.isOutOfRange) return 'level-out';
    if (day.isFuture) return 'level-0';
    if (!day.data) return 'level-0';
    if (day.data.isRestDay) return 'level-rest';
    if (day.data.status === 'skipped') return 'level-skipped';
    if (day.data.status === 'completed') {
        const extras = day.data.extras ? day.data.extras.length : 0;
        if (extras > 0) return 'level-4'; // Extra work!
        return 'level-2';
    }
    return 'level-0';
};

const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        timeZone: 'UTC'
    });
};

const getTooltip = (day) => {
    const dateStr = formatDate(day.date);
    if (day.isOutOfRange) return '';
    if (!day.data || day.isFuture) return `${dateStr}: No data`;
    
    let status = day.data.status || 'Planned';
    if (day.data.isRestDay) status = 'Rest Day';
    
    let activity = day.data.plannedActivity || 'None';
    let extras = '';
    if (day.data.extras && day.data.extras.length > 0) {
        extras = ` (+${day.data.extras.length} extra)`;
    }
    
    return `${dateStr}: ${status} - ${activity}${extras}`;
};

const weekDays = ['M', '', 'W', '', 'F', '', 'S'];

const monthLabels = computed(() => {
    // Return positions for month labels based on first day of each month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((name, i) => {
        const firstOfMonth = new Date(Date.UTC(props.year, i, 1));
        const jan1 = new Date(Date.UTC(props.year, 0, 1));
        const dayOfWeekJan1 = jan1.getUTCDay();
        const startOffset = (dayOfWeekJan1 === 0) ? 6 : dayOfWeekJan1 - 1;
        const daysSinceStart = Math.floor((firstOfMonth - (jan1 - startOffset * 86400000)) / 86400000);
        const weekIndex = Math.floor(daysSinceStart / 7);
        return { name, weekIndex };
    }).filter((m, i, arr) => i === 0 || m.weekIndex !== arr[i-1].weekIndex);
});
</script>

<template>
    <div class="consistency-container glass-panel">
        <div class="grid-header">
            <div class="title-nav">
                <h3>Consistency Timeline</h3>
                <div class="year-nav">
                    <button class="nav-btn-sm" @click="$emit('year-change', -1)">←</button>
                    <span class="year-label">{{ year }}</span>
                    <button class="nav-btn-sm" @click="$emit('year-change', 1)">→</button>
                </div>
            </div>
            <div class="legend">
                <span>Less</span>
                <div class="square level-0"></div>
                <div class="square level-rest"></div>
                <div class="square level-skipped"></div>
                <div class="square level-2"></div>
                <div class="square level-4"></div>
                <span>More</span>
            </div>
        </div>
        
        <div class="grid-wrapper">
            <div class="labels-container">
                <div class="months-labels">
                    <span v-for="m in monthLabels" :key="m.name" 
                          :style="{ left: `${(m.weekIndex / gridData.length) * 100}%` }">
                        {{ m.name }}
                    </span>
                </div>
                <div class="main-grid-area">
                    <div class="days-labels">
                        <span v-for="label in weekDays" :key="label">{{ label }}</span>
                    </div>
                    <div class="weeks-container">
                        <div v-for="(week, index) in gridData" :key="index" class="week-column">
                            <div v-for="day in week" 
                                 :key="day.id" 
                                 class="square" 
                                 :class="[getLevel(day)]"
                                 :title="getTooltip(day)">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.consistency-container {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    overflow: hidden;
}

.grid-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
}

.title-nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.year-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: var(--radius-sm);
}

.year-label {
    font-weight: 700;
    color: var(--accent-secondary);
    min-width: 40px;
    text-align: center;
    font-size: 0.9rem;
}

.nav-btn-sm {
    background: none;
    color: var(--text-muted);
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
}

.nav-btn-sm:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
}

.grid-header h3 {
    font-size: 1.1rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
}

.legend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.7rem;
    color: var(--text-muted);
}

.grid-wrapper {
    overflow-x: auto;
    padding-bottom: 8px;
}

.labels-container {
    display: flex;
    flex-direction: column;
    min-width: fit-content;
}

.months-labels {
    position: relative;
    height: 1.2rem;
    margin-left: 20px;
    font-size: 0.7rem;
    color: var(--text-muted);
}

.months-labels span {
    position: absolute;
    white-space: nowrap;
}

.main-grid-area {
    display: flex;
    gap: 8px;
}

.days-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text-muted);
    padding-top: 2px;
    padding-bottom: 2px;
    width: 12px;
}

.weeks-container {
    display: flex;
    gap: 2px;
    justify-content: space-between;
    width: 100%;
}

.week-column {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
}

.legend .square {
    width: 12px;
    height: 12px;
    flex: none;
}

.square {
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: 16px;
    border-radius: 2px;
    background-color: rgba(255, 255, 255, 0.05);
    transition: all 0.1s ease;
}

.square:hover {
    transform: scale(1.3);
    z-index: 10;
    outline: 2px solid var(--accent-secondary);
    outline-offset: 1px;
}

/* Levels */
.level-out { visibility: hidden; }
.level-0 { background-color: rgba(255, 255, 255, 0.02); } /* Fainter empty square */
.level-rest { background-color: rgba(99, 102, 241, 0.45); } /* More distinct blue/indigo for rest */
.level-skipped { background-color: rgba(244, 63, 94, 0.4); } /* Slightly stronger skip color too */
.level-2 { background-color: var(--accent-primary); }
.level-4 { 
    background-color: #34d399; 
    box-shadow: 0 0 5px var(--accent-primary);
}

@media (max-width: 768px) {
    .square {
        width: 10px;
        height: 10px;
    }
    .months-labels {
        margin-left: 18px;
    }
    /* Update transform index if squares are smaller */
    .months-labels span {
        font-size: 0.6rem;
    }
}
</style>
