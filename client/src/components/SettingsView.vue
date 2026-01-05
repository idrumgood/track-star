<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});

const profile = ref({
    name: '',
    picture: '',
    email: '',
    settings: {
        theme: 'dark'
    }
});

const activities = ref([]);
const isLoadingProfile = ref(true);
const isLoadingActivities = ref(true);
const isSaving = ref(false);
const message = ref({ text: '', type: '' });

const fetchProfile = async () => {
    try {
        const res = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${props.user.idToken}` }
        });
        if (res.ok) {
            profile.value = await res.json();
        }
    } catch (e) {
        console.error("Failed to fetch profile", e);
    } finally {
        isLoadingProfile.value = false;
    }
};

const fetchActivities = async () => {
    try {
        const res = await fetch('/api/activities', {
            headers: { 'Authorization': `Bearer ${props.user.idToken}` }
        });
        if (res.ok) {
            activities.value = await res.json();
        }
    } catch (e) {
        console.error("Failed to fetch activities", e);
    } finally {
        isLoadingActivities.value = false;
    }
};

const saveProfile = async () => {
    isSaving.value = true;
    message.value = { text: '', type: '' };
    try {
        const res = await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${props.user.idToken}`
            },
            body: JSON.stringify({
                name: profile.value.name,
                picture: profile.value.picture,
                settings: profile.value.settings
            })
        });

        if (res.ok) {
            message.value = { text: 'Profile saved successfully!', type: 'success' };
            // Update local user object for header display if needed
            const savedUser = JSON.parse(localStorage.getItem('track_star_user'));
            if (savedUser) {
                savedUser.name = profile.value.name;
                savedUser.picture = profile.value.picture;
                localStorage.setItem('track_star_user', JSON.stringify(savedUser));
                // Note: The App.vue user object won't update immediately unless we emit an event or use a store
            }
        } else {
            message.value = { text: 'Failed to save profile.', type: 'error' };
        }
    } catch (e) {
        console.error("Error saving profile", e);
        message.value = { text: 'An error occurred.', type: 'error' };
    } finally {
        isSaving.value = false;
    }
};

const deleteActivity = async (activityId) => {
    if (!confirm("Are you sure you want to delete this activity type? This won't affect past logs but it will disappear from your quick-pick list.")) return;

    try {
        const res = await fetch(`/api/activities/${activityId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${props.user.idToken}` }
        });

        if (res.ok) {
            activities.value = activities.value.filter(a => a.id !== activityId);
        } else {
            alert("Failed to delete activity.");
        }
    } catch (e) {
        console.error("Error deleting activity", e);
    }
};

onMounted(() => {
    fetchProfile();
    fetchActivities();
});
</script>

<template>
    <div class="settings-view">
        <header class="glass-panel">
            <h1>Settings</h1>
            <p>Manage your profile and preferences.</p>
        </header>

        <div class="settings-grid">
            <!-- Profile Section -->
            <section class="settings-section glass-panel">
                <h2>Profile</h2>
                <div v-if="isLoadingProfile" class="skeleton-loader"></div>
                <div v-else class="form-group">
                    <label for="displayName">Display Name</label>
                    <input id="displayName" v-model="profile.name" type="text" placeholder="Your name" />

                    <label for="avatarUrl">Avatar URL</label>
                    <input id="avatarUrl" v-model="profile.picture" type="text" placeholder="https://..." />

                    <div v-if="profile.picture" class="avatar-preview">
                        <img :src="profile.picture" alt="Avatar preview" />
                    </div>

                    <button class="save-btn" :disabled="isSaving" @click="saveProfile">
                        {{ isSaving ? 'Saving...' : 'Save Changes' }}
                    </button>

                    <div v-if="message.text" :class="['message', message.type]">
                        {{ message.text }}
                    </div>
                </div>
            </section>

            <!-- Activities Section -->
            <section class="settings-section glass-panel">
                <h2>Custom Activities</h2>
                <p class="subtitle">These activities were added when you typed them in your plan.</p>
                <div v-if="isLoadingActivities" class="skeleton-loader"></div>
                <div v-else class="activity-list">
                    <div v-if="activities.filter(a => a.userId).length === 0" class="empty-state">
                        No custom activities yet.
                    </div>
                    <div v-for="activity in activities.filter(a => a.userId)" :key="activity.id" class="activity-item">
                        <span>{{ activity.name }}</span>
                        <button class="delete-btn" @click="deleteActivity(activity.id)">Remove</button>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.settings-view {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

header {
    padding: var(--spacing-lg);
}

header h1 {
    margin: 0;
    font-size: 2rem;
}

header p {
    color: var(--text-secondary);
    margin: 4px 0 0 0;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: var(--spacing-lg);
}

.settings-section {
    padding: var(--spacing-xl);
}

.settings-section h2 {
    margin: 0 0 var(--spacing-md) 0;
    font-size: 1.5rem;
    color: var(--accent-primary);
}

.subtitle {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-md);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-secondary);
}

input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 1rem;
    transition: border-color 0.2s;
}

input:focus {
    border-color: var(--accent-primary);
    outline: none;
}

.avatar-preview {
    margin-top: 8px;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid var(--accent-primary);
}

.avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.save-btn {
    background: var(--accent-primary);
    color: white;
    padding: 12px;
    border-radius: var(--radius-md);
    font-weight: 700;
    margin-top: var(--spacing-md);
    transition: filter 0.2s;
}

.save-btn:hover:not(:disabled) {
    filter: brightness(1.1);
}

.save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.message {
    padding: 10px;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    margin-top: var(--spacing-md);
    text-align: center;
}

.message.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--accent-primary);
}

.message.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.activity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
}

.delete-btn {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid rgba(239, 68, 68, 0.2);
    transition: all 0.2s;
}

.delete-btn:hover {
    background: #ef4444;
    color: white;
}

.empty-state {
    color: var(--text-muted);
    font-style: italic;
    text-align: center;
    padding: var(--spacing-md);
}

.skeleton-loader {
    height: 200px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-sm);
    animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
    0% { opacity: 0.3; }
    50% { opacity: 0.6; }
    100% { opacity: 0.3; }
}
</style>
