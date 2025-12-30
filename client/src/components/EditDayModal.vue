<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  dayData: Object
});

const emit = defineEmits(['close', 'save']);

const formState = reactive({
  plannedActivity: '',
  isRestDay: false,
  extras: []
});

const newExtra = ref('');
const availableActivities = ref([]);
const showSuggestions = ref(false);

const fetchActivities = async () => {
    try {
        const savedUser = localStorage.getItem('track_star_user');
        if (!savedUser) return;
        const { idToken } = JSON.parse(savedUser);
        
        const res = await fetch('/api/activities', {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (res.ok) {
            availableActivities.value = await res.json();
        }
    } catch (err) {
        console.error('Failed to fetch activities:', err);
    }
};

onMounted(fetchActivities);

// Refetch activities when modal opens to catch newly created custom ones
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        fetchActivities();
    }
});

const filteredActivities = computed(() => {
    const query = formState.plannedActivity.toLowerCase().trim();
    if (!query || !showSuggestions.value) return [];
    return availableActivities.value.filter(a => 
        a.name.toLowerCase().includes(query) && 
        a.name.toLowerCase() !== query
    ).slice(0, 5);
});

const selectActivity = (activity) => {
    formState.plannedActivity = activity.name;
    showSuggestions.value = false;
};

const hideSuggestions = () => {
    setTimeout(() => {
        showSuggestions.value = false;
    }, 200);
};

// Initialize form when modal opens with data
watch(() => props.dayData, (newData) => {
  if (newData) {
    formState.plannedActivity = newData.plannedActivity || '';
    formState.isRestDay = !!newData.isRestDay;
    formState.extras = [...(newData.extras || [])];
  }
}, { immediate: true });

const save = () => {
  // Ensure we send a fresh copy of the whole object
  const updatedDay = {
    ...props.dayData,
    plannedActivity: formState.plannedActivity,
    isRestDay: formState.isRestDay,
    extras: [...formState.extras]
  };
  
  emit('save', updatedDay);
  emit('close');
};

const addExtra = () => {
  if (newExtra.value.trim()) {
    formState.extras.push(newExtra.value.trim());
    newExtra.value = '';
  }
};

const removeExtra = (index) => {
  formState.extras.splice(index, 1);
};

</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal glass-panel">
      <div class="modal-header">
        <h2>Edit Plan for {{ dayData?.dayName }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formState.isRestDay">
          <span>Is this a Rest Day?</span>
        </label>

        <div class="form-group" :class="{ disabled: formState.isRestDay }">
          <label>Planned Activity</label>
          <div class="autocomplete-wrapper">
            <input 
              type="text" 
              v-model="formState.plannedActivity" 
              placeholder="e.g. 5k Run, Upper Body Lift..."
              :disabled="formState.isRestDay"
              @focus="showSuggestions = true"
              @blur="hideSuggestions"
            >
            <div v-if="filteredActivities.length" class="suggestions glass-panel">
              <div 
                v-for="activity in filteredActivities" 
                :key="activity.id"
                class="suggestion-item"
                @click="selectActivity(activity)"
              >
                <span class="suggestion-icon">{{ activity.icon }}</span>
                <span class="suggestion-name">{{ activity.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Extra Activities</label>
          <div class="extras-list">
            <div v-for="(extra, idx) in formState.extras" :key="idx" class="extra-tag">
              {{ extra }}
              <span @click="removeExtra(idx)" class="remove-extra">×</span>
            </div>
          </div>
          <div class="add-extra">
            <input 
              type="text" 
              v-model="newExtra" 
              placeholder="Add extra (e.g. Walk)" 
              @keyup.enter="addExtra"
            >
            <button @click="addExtra" class="small-btn">+</button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
        <button class="save-btn" @click="save">Save Plan</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  width: 90%;
  max-width: 500px;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--border-color);
}

@keyframes slideUp {
  from { transform: translateY(20px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.modal-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  border: none;
  font-size: 1.5rem;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  transition: opacity 0.3s;
}
.form-group.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
}
.checkbox-label:hover {
  color: var(--text-primary);
}

input[type="text"] {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid var(--border-color);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s;
}
input[type="text"]:focus {
  outline: none;
  border-color: var(--accent-secondary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  background: rgba(15, 23, 42, 0.5);
}

.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  z-index: 10;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

.suggestion-item {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: rgba(59, 130, 246, 0.2);
}

.suggestion-icon {
  font-size: 1.2rem;
}

.suggestion-name {
  color: var(--text-primary);
  font-weight: 500;
}

.extras-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.extra-tag {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-secondary);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.remove-extra {
  cursor: pointer;
  font-weight: bold;
  opacity: 0.7;
}
.remove-extra:hover { opacity: 1; }

.add-extra {
  display: flex;
  gap: var(--spacing-xs);
}
.add-extra input {
  flex: 1;
}

.small-btn {
  padding: 0 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
}
.small-btn:hover {
  background: var(--surface-hover);
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.cancel-btn {
  background: transparent;
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-sm);
}
.cancel-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.save-btn {
  background: var(--accent-secondary); /* Solid */
  color: white;
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); /* Softer shadow */
}
.save-btn:hover {
  background: #4f46e5; /* Slightly darker indigo manually or use filter in future */
  transform: translateY(-1px);
}
</style>
