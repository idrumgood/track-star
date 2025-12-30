<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import DayCard from './DayCard.vue';
import EditDayModal from './EditDayModal.vue';

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});

const weekDays = ref([]);
const isModalOpen = ref(false);
const editingDay = ref(null);
const currentDate = ref(new Date());
const API_URL = '/api';

const isLoading = ref(true);

const fetchWeek = async () => {
    if (!props.user) return;
    isLoading.value = true;
    try {
        const res = await fetch(`${API_URL}/week?date=${currentDate.value.toISOString()}`, {
            headers: { 'Authorization': `Bearer ${props.user.idToken}` }
        });
        if (res.ok) {
            weekDays.value = await res.json();
        }
    } catch (e) {
        console.error("Failed to fetch week", e);
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchWeek);

// Refetch when user changes (e.g. login/logout handled by parent, but switching users needs this)
watch(() => props.user, fetchWeek);

const changeWeek = (offset) => {
    const newDate = new Date(currentDate.value);
    newDate.setDate(newDate.getDate() + (offset * 7));
    currentDate.value = newDate;
    fetchWeek();
};

const goToday = () => {
    currentDate.value = new Date();
    fetchWeek();
};

const completedCount = computed(() => {
    const todayId = getLocalDayStr(new Date());
    return weekDays.value.filter(d => {
        if (d.status === 'completed') return true;
        if (d.isRestDay) {
            // Only count rest days if they are today or in the past
            return d.id <= todayId;
        }
        return false;
    }).length;
});
const progressPercent = computed(() => weekDays.value.length ? Math.round((completedCount.value / weekDays.value.length) * 100) : 0);

const weekDateRange = computed(() => {
    if (!weekDays.value.length) return '';
    const start = new Date(weekDays.value[0].date);
    const end = new Date(weekDays.value[6].date);
    
    const formatDate = (d) => {
        return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    };
    
    return `${formatDate(start)} – ${formatDate(end)}`;
});

// Helper to check relative time for the current week view
const getLocalDayStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const isPastWeek = computed(() => {
    if (!weekDays.value.length) return false;
    const todayStr = getLocalDayStr(new Date());
    // Get the Saturday of the displayed week
    const lastDayStr = weekDays.value[6].id.split('_')[1];
    return lastDayStr < todayStr;
});

const isFutureWeek = computed(() => {
    if (!weekDays.value.length) return false;
    const todayStr = getLocalDayStr(new Date());
    // Get the Monday of the displayed week
    const firstDayStr = weekDays.value[0].id.split('_')[1];
    return firstDayStr > todayStr;
});

const updateDay = async (day) => {
    try {
        const res = await fetch(`${API_URL}/day/${day.id}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${props.user.idToken}`
            },
            body: JSON.stringify(day)
        });
        
        if (res.ok) {
            const updated = await res.json();
            const index = weekDays.value.findIndex(d => d.id === updated.id);
            if (index !== -1) {
                weekDays.value[index] = updated;
            }
        }
    } catch (e) {
        console.error("Failed to update day", e);
    }
};

const handleToggleComplete = async (id) => {
    const day = weekDays.value.find(d => d.id === id);
    if (day) {
        // Optimistic update
        const originalStatus = day.status;
        const todayId = getLocalDayStr(new Date());
        
        if (day.status === 'completed') {
            // Uncompleting
            day.status = day.id < todayId ? 'skipped' : 'pending';
        } else {
            // Completing
            day.status = 'completed';
        }
        
        // Sync with server
        try {
            await updateDay(day);
        } catch (e) {
            // Revert on error
            day.status = originalStatus;
        }
    }
};

const openEditModal = (day) => {
    editingDay.value = day;
    isModalOpen.value = true;
};

const handleSavePlan = async (updatedDay) => {
    // 1. Optimistic Update
    const index = weekDays.value.findIndex(d => d.id === updatedDay.id);
    let originalDay = null;

    if (index !== -1) {
        originalDay = { ...weekDays.value[index] };
        
        const optimisticallyUpdated = { ...updatedDay };
        if (optimisticallyUpdated.isRestDay && optimisticallyUpdated.status === 'skipped') {
            optimisticallyUpdated.status = 'pending';
        }
        weekDays.value[index] = optimisticallyUpdated; // Apply update immediately
    }

    isModalOpen.value = false; // Close modal immediately

    // 2. Sync with Server
    try {
        await updateDay(updatedDay);
    } catch (e) {
        // 3. Revert on failure
        console.error("Save failed, reverting...", e);
        if (index !== -1 && originalDay) {
            weekDays.value[index] = originalDay;
        }
        // Optional: Show error toast here
    }
};
</script>

<template>
  <div class="week-view">
    <header class="header glass-panel">
      <div class="header-content">
        <div class="title-group">
            <h1>Weekly Plan</h1>
            <span v-if="!isLoading" class="date-range">{{ weekDateRange }}</span>
        </div>
        <div class="stats">
            <span v-if="!isLoading"><span class="highlight">{{ completedCount }}</span> / {{ weekDays.length }} Completed</span>
        </div>
      </div>
      
      <div class="nav-row">
          <div class="nav-controls">
              <button class="nav-btn" @click="changeWeek(-1)">← Prev</button>
              <button class="nav-btn today-btn" @click="goToday">Current Week</button>
              <button class="nav-btn" @click="changeWeek(1)">Next →</button>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
      </div>
    </header>

    <div v-if="isLoading" class="grid-container">
        <div v-for="n in 7" :key="n" class="day-card glass-panel skeleton-card">
            <div class="skeleton-header"></div>
            <div class="skeleton-body"></div>
            <div class="skeleton-actions"></div>
        </div>
    </div>

    <div v-else class="grid-container">
      <DayCard 
        v-for="day in weekDays" 
        :key="day.id"
        :day="day"
        :is-read-only="isPastWeek"
        :allow-completion="!isFutureWeek"
        @toggle-complete="handleToggleComplete"
      >
        <template #actions-extra>
            <button v-if="!isPastWeek" class="edit-btn" @click.stop="openEditModal(day)">
              <span class="icon">✎</span> Edit
            </button>
        </template>
      </DayCard>
    </div>

    <EditDayModal 
      :isOpen="isModalOpen" 
      :dayData="editingDay" 
      @close="isModalOpen = false" 
      @save="handleSavePlan"
    />
  </div>
</template>

<style scoped>
.week-view {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.header {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.nav-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
}

.nav-row {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-btn {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
}
.nav-btn:hover {
    background: var(--accent-secondary);
    color: white;
}

.today-btn {
    background: rgba(16, 185, 129, 0.1);
    color: var(--accent-primary);
    border: 1px solid rgba(16, 185, 129, 0.2);
}

.today-btn:hover {
    background: var(--accent-primary);
    color: white;
}

.header h1 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.title-group {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
}

.date-range {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
    font-family: monospace;
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 8px;
    border-radius: 4px;
}

.stats {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.highlight {
  color: var(--accent-primary);
  font-size: 1.2em;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-top: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: var(--radius-sm);
  transition: width 0.5s ease-out;
  /* Shadow removed globally */
}

.grid-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-xs);
  padding-bottom: var(--spacing-lg);
}

/* Ensure child cards take full width but don't shrink */
.grid-container > * {
    flex-shrink: 0;
    width: 100%;
}


.edit-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.edit-btn:hover {
  background: var(--accent-secondary);
  color: white;
}

@media (min-width: 1000px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); /* auto-fill prevents stretching too wide */
    gap: var(--spacing-lg);
    overflow-x: visible;
    padding-bottom: 0;
  }
  
  .grid-container > * {
    scroll-snap-align: none;
    flex-shrink: 1;
  }
}

/* Skeleton Loading */
.skeleton-card {
  border-color: rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  pointer-events: none;
}

.skeleton-header {
  height: 24px;
  width: 60%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: var(--spacing-sm);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-body {
  height: 100px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin-bottom: var(--spacing-sm);
  animation: pulse 1.5s infinite ease-in-out 0.2s; /* Staggered animation */
}

.skeleton-actions {
    height: 32px;
    width: 100%;
    margin-top: auto;
    display: flex;
    justify-content: space-between;
}

.skeleton-actions::before,
.skeleton-actions::after {
    content: '';
    display: block;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out 0.4s;
}

.skeleton-actions::before {
    width: 60px; /* Edit button width approximation */
}

.skeleton-actions::after {
    width: 32px; /* Check button width */
    border-radius: 50%;
}

@keyframes pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.6; }
  100% { opacity: 0.3; }
}
</style>
