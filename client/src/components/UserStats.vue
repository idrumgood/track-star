<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { Doughnut, Bar } from 'vue-chartjs';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement 
} from 'chart.js';
import ContributionGrid from './ContributionGrid.vue';
import { getMonthFromCache, saveMonthToCache } from '../utils/statsCache';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});

const stats = ref(null);
const isLoading = ref(true);
const yearDays = ref([]);
const selectedYear = ref(new Date().getFullYear());
const isYearLoading = ref(false);

// Default range: last 30 days
const defaultEndDate = new Date().toISOString().split('T')[0];
const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const endDate = ref(sessionStorage.getItem('stats_end_date') || defaultEndDate);
const startDate = ref(sessionStorage.getItem('stats_start_date') || defaultStartDate);

const fetchStats = async () => {
    if (!props.user) return;
    isLoading.value = true;
    try {
        const res = await fetch(`/api/stats?start=${startDate.value}&end=${endDate.value}`, {
            headers: { 'Authorization': `Bearer ${props.user.idToken}` }
        });
        if (res.ok) {
            stats.value = await res.json();
        }
    } catch (e) {
        console.error("Failed to fetch stats", e);
    } finally {
        isLoading.value = false;
    }
};

const fetchYearData = async () => {
    if (!props.user) return;
    isYearLoading.value = true;
    const year = selectedYear.value;
    const months = [];
    
    // Check cache first
    const missingMonths = [];
    for (let m = 1; m <= 12; m++) {
        const monthId = `${year}-${String(m).padStart(2, '0')}`;
        const cached = getMonthFromCache(props.user.id, monthId);
        if (cached) {
            months[m - 1] = cached;
        } else {
            missingMonths.push(m);
        }
    }

    if (missingMonths.length > 0) {
        try {
            // Fetch missing months in chunks or one range
            // To simplify, we'll fetch the whole range of missing months
            const startMonth = missingMonths[0];
            const endMonth = missingMonths[missingMonths.length - 1];
            
            const startStr = `${year}-${String(startMonth).padStart(2, '0')}-01`;
            const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
            const endStr = `${year}-${String(endMonth).padStart(2, '0')}-${lastDay}`;

            const res = await fetch(`/api/stats?start=${startStr}&end=${endStr}`, {
                headers: { 'Authorization': `Bearer ${props.user.idToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                const fetchedDays = data.rawDays || [];
                
                // Group fetched days by month and cache them
                missingMonths.forEach(m => {
                    const monthId = `${year}-${String(m).padStart(2, '0')}`;
                    const monthDays = fetchedDays.filter(d => d.id.startsWith(monthId));
                    saveMonthToCache(props.user.id, monthId, monthDays);
                    months[m - 1] = monthDays;
                });
            }
        } catch (e) {
            console.error("Failed to fetch year data", e);
        }
    }

    yearDays.value = months.flat().filter(Boolean);
    isYearLoading.value = false;
};

onMounted(() => {
    fetchStats();
    fetchYearData();
});

watch([startDate, endDate], () => {
    sessionStorage.setItem('stats_start_date', startDate.value);
    sessionStorage.setItem('stats_end_date', endDate.value);
    fetchStats();
});

watch(selectedYear, fetchYearData);

const handleYearChange = (offset) => {
    selectedYear.value += offset;
};

// Chart Data: Activity Distribution
const activityChartData = computed(() => {
    if (!stats.value || !stats.value.activities) return null;
    
    // Take top 5 activities, group rest as "Other"
    const top = stats.value.activities.slice(0, 5);
    const otherCount = stats.value.activities.slice(5).reduce((acc, curr) => acc + curr.count, 0);
    
    const labels = top.map(a => a.name);
    const data = top.map(a => a.count);
    
    if (otherCount > 0) {
        labels.push('Other');
        data.push(otherCount);
    }

    return {
        labels,
        datasets: [{
            data,
            backgroundColor: [
                '#10b981', '#6366f1', '#f472b6', '#3b82f6', '#f59e0b', '#64748b'
            ],
            borderWidth: 0
        }]
    };
});

// Chart Data: Weekly Progress (simulated from rawDays)
const weeklyProgressData = computed(() => {
    if (!stats.value || !stats.value.rawDays) return null;
    
    const weeks = {};
    stats.value.rawDays.forEach(day => {
        // Simple week grouping by index or date floor
        const d = new Date(day.date);
        const dayOfWeek = d.getUTCDay();
        const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff)).toISOString().split('T')[0];
        
        if (!weeks[monday]) weeks[monday] = { completed: 0, total: 0 };
        if (!day.isRestDay) {
            weeks[monday].total++;
            if (day.status === 'completed') weeks[monday].completed++;
        }
    });

    const labels = Object.keys(weeks).sort();
    const data = labels.map(l => {
        const w = weeks[l];
        return w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0;
    });

    return {
        labels: labels.map(l => l.substring(5)), // MM-DD
        datasets: [{
            label: 'Completion %',
            data,
            backgroundColor: '#6366f1',
            borderRadius: 8
        }]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: { color: '#f8fafc', font: { family: 'Outfit', size: 12 } }
        }
    }
};

const barOptions = {
    ...chartOptions,
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8' }
        },
        x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' }
        }
    }
};
</script>

<template>
  <div class="stats-view">
    <header class="stats-header glass-panel">
        <div class="header-main">
            <h1>Activity Dashboard</h1>
            <div class="range-controls">
                <input type="date" v-model="startDate" class="date-input" />
                <span>to</span>
                <input type="date" v-model="endDate" class="date-input" />
            </div>
        </div>
    </header>

    <div v-if="isLoading" class="loader">
        <div class="spinner"></div>
        <p>Calculating your greatness...</p>
    </div>

    <div v-else-if="stats" class="dashboard-grid">
        <!-- Summary Cards -->
        <div class="summary-cards">
            <div class="stat-card glass-panel">
                <span class="stat-label">Consistency</span>
                <span class="stat-value highlight">{{ stats.summary.consistency }}%</span>
            </div>
            <div class="stat-card glass-panel">
                <span class="stat-label">Longest Streak</span>
                <span class="stat-value highlight-blue">{{ stats.streaks.longest }} <small>days</small></span>
            </div>
            <div class="stat-card glass-panel">
                <span class="stat-label">Current Streak</span>
                <span class="stat-value highlight-pink">{{ stats.streaks.current }} <small>days</small></span>
            </div>
            <div class="stat-card glass-panel">
                <span class="stat-label">Extra Work</span>
                <span class="stat-value">{{ stats.summary.extraActivitiesCount }} <small>items</small></span>
            </div>
        </div>
        
        <!-- Contribution Grid -->
        <ContributionGrid 
            :days="yearDays" 
            :year="selectedYear"
            @year-change="handleYearChange"
        />

        <!-- Charts Row -->
        <div class="charts-row">
            <div class="chart-container glass-panel">
                <h3>Activity Distribution</h3>
                <div class="chart-wrapper">
                    <Doughnut v-if="activityChartData" :data="activityChartData" :options="chartOptions" />
                    <p v-else class="empty-state">No activities tracked in this range.</p>
                </div>
            </div>
            <div class="chart-container glass-panel">
                <h3>Weekly Completion %</h3>
                <div class="chart-wrapper">
                    <Bar v-if="weeklyProgressData" :data="weeklyProgressData" :options="barOptions" />
                    <p v-else class="empty-state">No progress data available.</p>
                </div>
            </div>
        </div>

        <!-- Details Row -->
        <div class="details-row glass-panel">
            <h3>Recent Metrics</h3>
            <div class="metrics-grid">
                <div class="metric-item">
                    <span class="m-val">{{ stats.summary.completed }}</span>
                    <span class="m-label">Completed</span>
                </div>
                <div class="metric-item">
                    <span class="m-val skipped">{{ stats.summary.skipped }}</span>
                    <span class="m-label">Skipped</span>
                </div>
                <div class="metric-item">
                    <span class="m-val">{{ stats.summary.restDays }}</span>
                    <span class="m-label">Rest Days</span>
                </div>
                <div class="metric-item">
                    <span class="m-val">{{ stats.summary.totalDays }}</span>
                    <span class="m-label">Total Days</span>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.stats-view {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.stats-header {
    padding: var(--spacing-lg);
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--spacing-md);
}

.range-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--text-secondary);
}

.date-input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 0.9rem;
}

.date-input:focus {
    outline: none;
    border-color: var(--accent-secondary);
}

.dashboard-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
}

.stat-card {
    padding: var(--spacing-lg);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.stat-label {
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    font-weight: 700;
}

.stat-value {
    font-size: 2.5rem;
    font-weight: 800;
}

.stat-value small {
    font-size: 1rem;
    color: var(--text-muted);
}

.highlight { color: var(--accent-primary); }
.highlight-blue { color: var(--accent-secondary); }
.highlight-pink { color: var(--accent-tertiary); }

.charts-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
}

@media (min-width: 1000px) {
    .charts-row {
        grid-template-columns: 400px 1fr;
    }
}

.chart-container {
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.chart-wrapper {
    height: 300px;
    position: relative;
}

.chart-container h3 {
    font-size: 1.1rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-style: italic;
}

.details-row {
    padding: var(--spacing-lg);
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin-top: var(--spacing-lg);
}

.metric-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.m-val {
    font-size: 1.5rem;
    font-weight: 700;
}

.m-val.skipped {
    color: var(--accent-danger);
}

.m-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    gap: var(--spacing-md);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(99, 102, 241, 0.1);
    border-top-color: var(--accent-secondary);
    border-radius: 50%;
    animation: rotate 1s infinite linear;
}

@keyframes rotate {
    to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
    .header-main {
        flex-direction: column;
        text-align: center;
    }

    .stat-value {
        font-size: 1.8rem;
    }

    .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
    }
}

@media (max-width: 480px) {
    .metrics-grid {
        grid-template-columns: 1fr;
    }
}
</style>
