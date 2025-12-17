<script setup>
import { ref, onMounted } from 'vue';
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
    <div class="grid">
      <DayCard 
        v-for="day in weekDays" 
        :key="day.id"
        :day="day"
        @toggle-complete="handleToggleComplete"
        @click.self="openEditModal(day)"
      >
        <!-- Pass a slot or action to open edit -->
        <template #actions-extra>
            <button class="edit-btn" @click.stop="openEditModal(day)">✎ Edit</button>
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
  overflow-x: auto;
  padding: var(--spacing-sm) 0;
}

.grid {
  display: flex; /* Horizontal scroll */
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md); /* Space for scrollbar */
}

/* For larger screens, maybe we want a grid? 
   But "Plan for a week" usually implies a timeline. 
   Let's stick to horizontal flex for now or a 7-col grid if space permits.
*/
@media (min-width: 1000px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    overflow-x: visible;
  }
}
</style>
