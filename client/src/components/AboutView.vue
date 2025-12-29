<template>
  <div class="about-container glass-panel">
    <div class="about-content">
      <h1>About the Creator</h1>
      <p class="intro">
        Track Star was built by <strong>Bryan Dunk</strong>, a Chicago-based web developer and creative.
      </p>

      <div class="links">
        <a href="https://idrumgood.com" target="_blank" rel="noopener">idrumgood.com</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  max-width: 800px;
  margin: var(--spacing-xl) auto;
  padding: var(--spacing-xl);
  display: flex;
  justify-content: center;
  align-items: center;
}

.about-content {
  text-align: center;
  max-width: 600px;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--text-primary);
}

.intro {
  font-size: 1.25rem;
  color: var(--accent-primary);
  margin-bottom: var(--spacing-lg);
}

.links {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

.links a {
  color: var(--accent-secondary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.links a:hover {
  color: var(--accent-primary);
  text-underline-offset: 4px;
  text-decoration: underline;
}
</style>
