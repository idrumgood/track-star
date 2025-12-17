<script setup>
import { computed } from 'vue';

const props = defineProps({
  day: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['toggle-complete', 'add-extra', 'edit-plan']);

const isRestDay = computed(() => props.day.isRestDay);
const isCompleted = computed(() => props.day.status === 'completed');
const isSkipped = computed(() => props.day.status === 'skipped');

// Format date like "12/17"
const formattedDate = computed(() => {
    const d = new Date(props.day.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
});
</script>

<template>
  <div class="day-card" :class="{ 'rest-day': isRestDay, 'completed': isCompleted }">
    <div class="day-header">
      <span class="day-name">{{ day.dayName }}</span>
      <span class="day-date">{{ formattedDate }}</span>
    </div>
    
    <div class="day-body">
      <div v-if="isRestDay" class="rest-badge">
        <span>😴 Rest Day</span>
      </div>
      <div v-else class="workout-info">
        <h3>{{ day.plannedActivity || "No plan" }}</h3>
      </div>

      <div class="actions">
        <!-- Edit trigger -->
        <slot name="actions-extra"></slot>
        
        <!-- Checkbox for completion -->
        <button 
          v-if="!isRestDay" 
          class="check-btn" 
          :class="{ active: isCompleted }"
          @click="emit('toggle-complete', day.id)"
          aria-label="Mark as complete"
        >
          <span v-if="isCompleted">✅</span>
          <span v-else>⬜</span>
        </button>
      </div>
      
      <!-- Extras section -->
      <div v-if="day.extras && day.extras.length > 0" class="extras">
        <div v-for="(extra, idx) in day.extras" :key="idx" class="extra-item">
          + {{ extra }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  backdrop-filter: blur(12px);
  transition: transform 0.2s;
  flex: 1;
  position: relative; /* For edit button positioning if needed, though flex is better */
}

/* Allow clicking the card to potentially allow edit, but button is clearer */

/* ... existing styles ... */

.day-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.day-card.rest-day {
  border-color: var(--accent);
  opacity: 0.8;
}

.day-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  color: var(--text-muted);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.workout-info h3 {
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: var(--spacing-sm);
}

.rest-badge {
  color: var(--accent);
  font-weight: 600;
  font-size: 1.2rem;
}

.actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.check-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  padding: 4px;
}
.check-btn:hover {
  transform: scale(1.1);
  box-shadow: none;
  background: transparent;
}

.extras {
  margin-top: var(--spacing-xs);
  font-size: 0.9rem;
  color: var(--success);
}
</style>
