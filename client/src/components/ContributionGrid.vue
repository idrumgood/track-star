<script setup>
import { computed } from 'vue';

const props = defineProps({
    days: {
        type: Array,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    }
});

// Grid logic: Columns are weeks, rows are days (0=Mon, 6=Sun)
// We need to map the date range to a grid.
const gridData = computed(() => {
    if (!props.days || props.days.length === 0) return [];

    const start = new Date(props.startDate);
    const end = new Date(props.endDate);
    
    // Normalize to UTC for consistent date math without time-zone issues
    const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    
    const dayMap = new Map();
    props.days.forEach(day => {
        dayMap.set(day.id, day);
    });

    // Determine the first Monday before or on the start date
    const firstDay = new Date(startUTC);
    let dayOfWeek = firstDay.getUTCDay(); // 0 is Sunday
    let diff = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Days since Monday
    const gridStart = new Date(startUTC - diff * 24 * 60 * 60 * 1000);

    const weeks = [];
    let currentWeek = [];
    let curr = new Date(gridStart);

    // We want to cover at least until the end date, aligned to weeks
    const lastDay = new Date(endUTC);
    let lastDayOfWeek = lastDay.getUTCDay();
    let lastDiff = (lastDayOfWeek === 0) ? 0 : 7 - lastDayOfWeek;
    const gridEnd = new Date(endUTC + lastDiff * 24 * 60 * 60 * 1000);

    while (curr <= gridEnd) {
        const id = curr.toISOString().split('T')[0];
        const dayData = dayMap.get(id);
        
        // Out of range check (for styling muted squares)
        const isOutOfRange = curr < start || curr > end;

        currentWeek.push({
            id,
            date: new Date(curr),
            data: dayData,
            isOutOfRange
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
    if (!day.data || day.isOutOfRange) return 'level-0';
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
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const getTooltip = (day) => {
    const dateStr = formatDate(day.date);
    if (!day.data || day.isOutOfRange) return `${dateStr}: No data`;
    
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
</script>

<template>
    <div class="contribution-container glass-panel">
        <div class="grid-header">
            <h3>Consistency Timeline</h3>
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
            <div class="days-labels">
                <span v-for="label in weekDays" :key="label">{{ label }}</span>
            </div>
            <div class="weeks-container">
                <div v-for="(week, index) in gridData" :key="index" class="week-column">
                    <div v-for="day in week" 
                         :key="day.id" 
                         class="square" 
                         :class="[getLevel(day), { 'out-of-range': day.isOutOfRange }]"
                         :title="getTooltip(day)">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.contribution-container {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    overflow-x: auto;
}

.grid-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-md);
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
    display: flex;
    gap: 8px;
    padding-bottom: 4px;
}

.days-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--text-muted);
    padding-top: 2px;
    padding-bottom: 2px;
}

.weeks-container {
    display: flex;
    gap: 4px;
}

.week-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.square {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    background-color: rgba(255, 255, 255, 0.05);
    transition: transform 0.1s ease;
}

.square:hover {
    transform: scale(1.2);
    z-index: 10;
    outline: 1px solid var(--accent-secondary);
}

.square.out-of-range {
    opacity: 0.3;
}

/* Levels */
.level-0 { background-color: rgba(255, 255, 255, 0.05); }
.level-rest { background-color: rgba(99, 102, 241, 0.2); } /* Faint blue */
.level-skipped { background-color: rgba(244, 63, 94, 0.3); } /* Faint red */
.level-2 { background-color: var(--accent-primary); } /* Solid green */
.level-4 { background-color: #34d399; box-shadow: 0 0 5px var(--accent-primary); } /* Brighter green with glow */

@media (max-width: 768px) {
    .square {
        width: 10px;
        height: 10px;
    }
}
</style>
