<script setup>
import { ref, onMounted, computed } from 'vue';
import DayCard from './DayCard.vue';
import EditDayModal from './EditDayModal.vue';

const weekDays = ref([]);
const isModalOpen = ref(false);
const editingDay = ref(null);
const currentDate = ref(new Date());
const API_URL = 'http://localhost:3000/api';

const isLoading = ref(true);

const fetchWeek = async () => {
    isLoading.value = true;
    try {
        const res = await fetch(`${API_URL}/week?date=${currentDate.value.toISOString()}`);
        weekDays.value = await res.json();
    } catch (e) {
        console.error("Failed to fetch week", e);
    } finally {
        isLoading.value = false;
    }
};

const changeWeek = (offset) => {
    const newDate = new Date(currentDate.value);
    newDate.setDate(newDate.getDate() + (offset * 7));
    currentDate.value = newDate;
    fetchWeek();
};

const completedCount = computed(() => weekDays.value.filter(d => d.status === 'completed' || d.isRestDay).length);
const progressPercent = computed(() => weekDays.value.length ? Math.round((completedCount.value / weekDays.value.length) * 100) : 0);

// Helper to check relative time for the current week view
const today = new Date();
today.setHours(0,0,0,0);

const isPastWeek = computed(() => {
    if (!weekDays.value.length) return false;
    // Check if the last day of the week is before today
    const lastDay = new Date(weekDays.value[6].date);
    return lastDay < today;
});

const isFutureWeek = computed(() => {
    if (!weekDays.value.length) return false;
    // Check if the first day of the week is after today
    const firstDay = new Date(weekDays.value[0].date);
    // Use > (greater than) to allow "Current Week" (where Monday <= today) to be editable
    // Actually if Monday is tomorrow, it IS a future week.
    return firstDay > today;
});

onMounted(fetchWeek);

const updateDay = async (day) => {
    try {
        const res = await fetch(`${API_URL}/day/${day.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        day.status = day.status === 'completed' ? 'pending' : 'completed';
        
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
        <div class="nav-controls">
            <button class="nav-btn" @click="changeWeek(-1)">← Prev</button>
            <h1>Weekly Plan</h1>
            <button class="nav-btn" @click="changeWeek(1)">Next →</button>
        </div>
        <div class="stats">
            <span v-if="!isLoading"><span class="highlight">{{ completedCount }}</span> / {{ weekDays.length }} Completed</span>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
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
}

.nav-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.nav-btn {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    padding: 8px 16px; /* Increased padding */
    border-radius: var(--radius-sm);
    font-weight: 600;
}
.nav-btn:hover {
    background: var(--accent-secondary);
    color: white;
}

.header h1 {
  font-size: 2rem;
  background: linear-gradient(to right, var(--text-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0; /* Reset margin */
}

.stats {
  font-weight: 600;
  color: var(--text-secondary);
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
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
  border-radius: var(--radius-sm);
  transition: width 0.5s ease-out;
  box-shadow: 0 0 10px var(--accent-glow);
}

.grid-container {
  display: flex;
  gap: var(--spacing-md);
  overflow-x: auto;
  padding: var(--spacing-xs); /* Avoid shadow clipping */
  padding-bottom: var(--spacing-lg);
  scroll-snap-type: x mandatory;
}

.edit-btn {
  background: rgba(255,255,255,0.1);
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}
.edit-btn:hover {
  background: var(--accent-secondary);
  color: white;
}

@media (min-width: 1000px) {
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    overflow-x: visible;
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
