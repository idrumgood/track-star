<script setup>
import { ref, onMounted, computed } from 'vue';
import DayCard from './DayCard.vue';
import EditDayModal from './EditDayModal.vue';

const weekDays = ref([]);
const isModalOpen = ref(false);
const editingDay = ref(null);
const API_URL = 'http://localhost:3000/api';

const fetchWeek = async () => {
    try {
        const res = await fetch(`${API_URL}/week`);
        weekDays.value = await res.json();
    } catch (e) {
        console.error("Failed to fetch week", e);
    }
};

const completedCount = computed(() => weekDays.value.filter(d => d.status === 'completed').length);
const progressPercent = computed(() => weekDays.value.length ? Math.round((completedCount.value / weekDays.value.length) * 100) : 0);

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
    await updateDay(updatedDay);
    isModalOpen.value = false;
};
</script>

<template>
  <div class="week-view">
    <header class="header glass-panel">
      <div class="header-content">
        <h1>Weekly Plan</h1>
        <div class="stats">
            <span class="highlight">{{ completedCount }}</span> / {{ weekDays.length }} Completed
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </header>

    <div class="grid-container">
      <DayCard 
        v-for="day in weekDays" 
        :key="day.id"
        :day="day"
        @toggle-complete="handleToggleComplete"
      >
        <template #actions-extra>
            <button class="edit-btn" @click.stop="openEditModal(day)">
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

.header h1 {
  font-size: 2rem;
  background: linear-gradient(to right, var(--text-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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
</style>
