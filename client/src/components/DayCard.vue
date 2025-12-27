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

// Extract parts of the date
const dateObj = computed(() => new Date(props.day.date));
const dayNumber = computed(() => dateObj.value.getDate());
const monthShort = computed(() => dateObj.value.toLocaleString('default', { month: 'short' }));
const dayNameFull = computed(() => props.day.dayName); // e.g. "Monday"

</script>

<template>
  <div 
    class="calendar-card" 
    :class="{ 
      'rest-day': isRestDay, 
      'completed': isCompleted, 
      'skipped': isSkipped, 
      'read-only': isReadOnly,
      'interactive': !isReadOnly && allowCompletion
    }"
    @click="(!isReadOnly && allowCompletion) && $emit('toggle-complete', day.id)"
  >
    <!-- Top Binding (visual detail) -->
    <div class="binder-rings">
        <span class="ring" v-for="n in 3" :key="n"></span>
    </div>

    <!-- Header Strip -->
    <div class="calendar-header">
      <span class="month-label">{{ monthShort }}</span>
      <span class="day-label">{{ dayNumber }}</span>
      <span class="weekday-label">{{ dayNameFull }}</span>
    </div>
    
    <!-- Main Body -->
    <div class="calendar-body">
      <div v-if="isRestDay" class="rest-indicator">
        <span class="rest-icon">💤</span>
        <span>Rest</span>
      </div>
      
      <div v-else class="plan-content">
        <h3 :class="{ 'strike': isCompleted }">{{ day.plannedActivity || "No Plan" }}</h3>
        
        <!-- Extras chips -->
        <div v-if="day.extras && day.extras.length > 0" class="extras-grid">
            <span v-for="(extra, idx) in day.extras" :key="idx" class="extra-chip">
                {{ extra }}
            </span>
        </div>
      </div>

      <!-- Action Footer (hover only or subtle) -->
      <div class="card-footer">
         <div class="status-indicator" v-if="isCompleted">
            Completed
         </div>
         <div v-else-if="isSkipped" class="status-indicator skipped">
            Skipped
         </div>
         
         <!-- Edit Slot -->
         <div class="actions-area" @click.stop>
            <slot name="actions-extra"></slot>
         </div>
      </div>
    </div>
    
    <!-- Big Checkmark Overlay -->
    <div class="stamp-overlay" v-if="isCompleted">
       DONE
    </div>
  </div>
</template>

<style scoped>
.calendar-card {
  background: var(--surface-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid var(--border-color);
  min-height: 220px;
  cursor: default; /* Default to non-interactive */
  user-select: none;
}

.calendar-card.interactive {
    cursor: pointer;
}

.calendar-card.interactive:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: var(--shadow-glow);
  border-color: var(--accent-secondary);
}

/* Binder Rings Visual */
.binder-rings {
    position: absolute;
    top: -6px;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: space-evenly;
    z-index: 10;
    pointer-events: none;
}
.ring {
    width: 12px;
    height: 12px;
    background: #334155;
    border-radius: 6px;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);
    border: 2px solid #475569;
}

/* Header Section */
.calendar-header {
  background: var(--bg-secondary);
  padding: var(--spacing-sm);
  padding-top: var(--spacing-md); /* Space for rings */
  text-align: center;
  border-bottom: 2px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: background-color 0.3s ease;
}

/* Subtler Statuses: Colored Border + Text */
.calendar-card.completed {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 1px var(--accent-primary); /* Double border effect */
}
.calendar-card.skipped {
    border-color: var(--accent-danger);
    box-shadow: 0 0 0 1px var(--accent-danger);
}

.calendar-card.completed .day-label {
    color: var(--accent-primary);
}
.calendar-card.skipped .day-label {
    color: var(--accent-danger);
}

/* Revert header background changes */
.calendar-card.completed .calendar-header,
.calendar-card.skipped .calendar-header {
    background: var(--bg-secondary);
    border-bottom-style: dashed;
    border-bottom-color: var(--border-color);
}

/* Revert text colors in header */
.calendar-card.completed .month-label,
.calendar-card.skipped .month-label {
    color: var(--text-muted);
}
.calendar-card.completed .weekday-label,
.calendar-card.skipped .weekday-label {
    color: var(--accent-secondary);
}

.month-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    font-weight: 700;
}

.day-label {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1;
    color: var(--text-primary);
    margin: 4px 0;
    font-family: 'Outfit', sans-serif; 
}

.weekday-label {
    font-size: 0.9rem;
    color: var(--accent-secondary);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

/* Body */
.calendar-body {
  padding: var(--spacing-md);
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--surface-card); /* Solid background */
}

.plan-content h3 {
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
    word-break: break-word;
}
.plan-content h3.strike {
    text-decoration: line-through;
    opacity: 0.5;
}

/* Extras */
.extras-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
}

.extra-chip {
    font-size: 0.75rem;
    background: rgba(59, 130, 246, 0.15);
    color: var(--accent-secondary);
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid rgba(59, 130, 246, 0.2);
}

/* Footer / Actions */
.card-footer {
    margin-top: auto;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 24px;
}

.status-indicator {
    font-size: 0.8rem;
    font-weight: bold;
    color: var(--accent-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.status-indicator.skipped {
    color: var(--accent-danger);
}

/* Hide edit button unless hovering card */
.actions-area {
    opacity: 0;
    transition: opacity 0.2s;
    position: absolute;
    bottom: 8px;
    right: 8px;
}
.calendar-card:hover .actions-area {
    opacity: 1;
}

/* Stamp Overlay */
.stamp-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-15deg);
    border: 4px solid var(--accent-primary);
    color: var(--accent-primary);
    font-size: 2rem;
    font-weight: 900;
    padding: 10px 20px;
    border-radius: 10px;
    opacity: 0.3;
    pointer-events: none;
    text-transform: uppercase;
    mask-image: url("data:image/svg+xml;utf8,<svg...>..."); /* Could add grunge texture here */
    animation: stamp-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes stamp-in {
    from { transform: translate(-50%, -50%) scale(2) rotate(0deg); opacity: 0; }
    to { transform: translate(-50%, -50%) scale(1) rotate(-15deg); opacity: 0.3; }
}

/* Rest Day Styles */
.rest-indicator {
    color: var(--text-muted);
    font-style: italic;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
.rest-icon {
    font-size: 2rem;
}

/* Modifiers */
.calendar-card.rest-day {
    opacity: 0.7;
}

</style>
