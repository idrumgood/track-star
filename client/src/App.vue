<script setup>
import WeekView from './components/WeekView.vue';
</script>

<template>
  <header>
    <div class="logo">⭐ Track Star</div>
    <nav>
      <!-- Navigation placeholders -->
    </nav>
  </header>

  <main>
    <WeekView />
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

.logo {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.05em;
  filter: drop-shadow(0 0 10px var(--accent-glow));
}
</style>
