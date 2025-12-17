<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  dayData: Object
});

const emit = defineEmits(['close', 'save']);

const formState = ref({
  plannedActivity: '',
  isRestDay: false,
  extras: []
});

const newExtra = ref('');

// Initialize form when modal opens with data
watch(() => props.dayData, (newData) => {
  if (newData) {
    formState.value = {
      plannedActivity: newData.plannedActivity,
      isRestDay: newData.isRestDay,
      extras: [...(newData.extras || [])]
    };
  }
}, { immediate: true });

const save = () => {
  emit('save', {
    ...props.dayData,
    ...formState.value
  });
  emit('close');
};

const addExtra = () => {
  if (newExtra.value.trim()) {
    formState.value.extras.push(newExtra.value.trim());
    newExtra.value = '';
  }
};

const removeExtra = (index) => {
  formState.value.extras.splice(index, 1);
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
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
          <input 
            type="text" 
            v-model="formState.plannedActivity" 
            placeholder="e.g. 5k Run, Upper Body Lift..."
            :disabled="formState.isRestDay"
          >
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: transparent;
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
  background: var(--bg-card-hover);
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
}

input[type="text"] {
  background: var(--bg-app);
  border: 1px solid var(--glass-border);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-size: 1rem;
}
input[type="text"]:focus {
  outline: 2px solid var(--primary);
  border-color: transparent;
}

.extras-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
}

.extra-tag {
  background: rgba(74, 222, 128, 0.1);
  color: var(--success);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
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
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.save-btn {
  background: var(--primary);
  color: #0f172a; /* Dark text for contrast against bright primary */
  border-color: var(--primary);
  font-weight: 600;
}
.save-btn:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}
</style>
