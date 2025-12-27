<script setup>
import { ref, onMounted } from 'vue';
import WeekView from './components/WeekView.vue';

const user = ref(null);

onMounted(() => {
    const savedUser = localStorage.getItem('track_star_user');
    if (savedUser) {
        user.value = JSON.parse(savedUser);
    }
});

const login = (id) => {
    const newUser = { id, name: id.charAt(0).toUpperCase() + id.slice(1) };
    user.value = newUser;
    localStorage.setItem('track_star_user', JSON.stringify(newUser));
};

const logout = () => {
    user.value = null;
    localStorage.removeItem('track_star_user');
};
</script>

<template>
  <header>
    <div class="brand">
        <img src="/logo.svg" alt="Track Star Logo" class="logo-img" />
        <div class="logo-text">Track Star</div>
    </div>
    <div class="user-controls">
        <div v-if="user" class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <button class="auth-btn" @click="logout">Logout</button>
        </div>
        <div v-else class="auth-options">
            <button class="auth-btn" @click="login('demo-user')">Demo Login</button>
            <button class="auth-btn" @click="login('tester')">Tester Login</button>
        </div>
    </div>
  </header>

  <main>
    <div v-if="!user" class="login-prompt glass-panel">
        <h2>Welcome to Track Star</h2>
        <p>Please log in to see your training plan.</p>
        <div class="prompt-actions">
            <button class="auth-btn large" @click="login('demo-user')">Get Started</button>
        </div>
    </div>
    <WeekView v-else :user="user" />
  </main>
</template>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-lg);
}

.brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.logo-img {
    width: 48px;
    height: 48px;
    filter: drop-shadow(0 0 8px var(--accent-glow));
}

.logo-text {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary); /* Solid */
  letter-spacing: -0.05em;
  /* Filters/shadows removed globally */
}
.user-controls {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.user-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.user-name {
    font-weight: 600;
    color: var(--text-secondary);
}

.auth-btn {
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    font-weight: 600;
    border: 1px solid var(--border-color);
}
.auth-btn:hover {
    background: var(--surface-hover);
    transform: translateY(-1px);
}
.auth-btn:active {
    transform: translateY(0);
}
.auth-btn.large {
    padding: 12px 24px;
    font-size: 1.1rem;
    background: var(--accent-secondary);
    border: none;
    color: white;
}
.auth-btn.large:hover {
    background: #4f46e5;
}

.login-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--spacing-xl);
    margin-top: var(--spacing-xl);
    gap: var(--spacing-md);
}
.login-prompt h2 {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-xs);
}
.login-prompt p {
    color: var(--text-secondary);
    font-size: 1.1rem;
}
</style>
