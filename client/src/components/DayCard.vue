<script setup>
import { computed } from 'vue';

const props = defineProps({
  day: {
    type: Object,
    required: true
  },
  isReadOnly: {
    type: Boolean,
    default: false
  },
  allowCompletion: {
    type: Boolean,
    default: true
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
  <div class="day-card glass-panel" :class="{ 'rest-day': isRestDay, 'completed': isCompleted, 'read-only': isReadOnly }">
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
        
        <!-- Toggle Completion -->
        <button 
          v-if="!isRestDay" 
          class="check-btn" 
          :class="{ active: isCompleted, disabled: !allowCompletion || isReadOnly }"
          :disabled="!allowCompletion || isReadOnly"
          @click="emit('toggle-complete', day.id)"
          aria-label="Mark as complete"
        >
          <div class="check-icon" v-if="isCompleted">✓</div>
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
  padding: var(--spacing-md);
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative; 
  border: 1px solid var(--border-color);
}

.day-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow);
  border-color: var(--accent-secondary);
}

.day-card.completed {
  border-color: var(--accent-primary);
  background: linear-gradient(to bottom right, var(--surface-card), rgba(16, 185, 129, 0.1));
}

.day-card.rest-day {
  opacity: 0.7;
  border-style: dashed;
}

.day-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.workout-info h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.rest-badge {
  color: var(--text-muted);
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions {
  margin-top: auto;
  display: flex;
  justify-content: space-between; /* Space out edit and check */
  align-items: center;
  padding-top: var(--spacing-sm);
}

/* Custom Checkbox Button */
.check-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--text-muted);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: transparent;
}

.check-btn:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 8px var(--accent-glow);
}

.check-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--bg-primary);
  box-shadow: 0 0 12px var(--accent-glow);
  transform: scale(1.1);
}

.check-icon {
  font-weight: bold;
  font-size: 1.2rem;
}

.extras {
  margin-top: var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--accent-secondary);
}

.extra-item {
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
}
</style>
