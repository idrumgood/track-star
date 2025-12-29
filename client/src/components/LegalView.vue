<template>
  <div class="legal-container glass-panel">
    <div class="legal-content">
      <h1>Terms of Service</h1>
      
      <section class="legal-section">
        <h3>1. Nature of Service</h3>
        <p>
          Track Star is provided "AS IS" and "AS AVAILABLE" for personal, non-commercial use. 
          The service is currently offered completely free of charge. We reserve the right to 
          modify, suspend, or terminate the service at any time without prior notice.
        </p>
      </section>

      <section class="legal-section">
        <h3>2. Data Ownership and Retention</h3>
        <p>
          By using Track Star, you acknowledge and agree that you have no ownership rights or 
          legal claims to any data entered into the system. All user-generated content, training 
          plans, and activity logs may be modified, moved, or permanently deleted at any time 
          without recovery options or compensation.
        </p>
      </section>

      <section class="legal-section">
        <h3>3. Limitation of Liability</h3>
        <p>
          In no event shall the creator or maintainers of Track Star be liable for any indirect, 
          incidental, special, consequential, or punitive damages, including without limitation, 
          loss of profits, data, or other intangible losses resulting from your access to or 
          use of the service.
        </p>
      </section>

      <section class="legal-section">
        <h3>4. No Warranties</h3>
        <p>
          We provide no warranties, express or implied, regarding the accuracy, reliability, or 
          availability of the service. Your use of Track Star is at your own risk.
        </p>
      </section>

      <p class="last-updated">Last Updated: December 29, 2025</p>

      <div class="back-link">
        <router-link to="/">Return to App</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-container {
  max-width: 900px;
  margin: var(--spacing-xl) auto;
  padding: var(--spacing-xl);
}

.legal-content {
  color: var(--text-secondary);
  line-height: 1.7;
}

h1 {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  font-size: 2.5rem;
}

.legal-section {
  margin-bottom: var(--spacing-lg);
}

h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: 1.25rem;
}

.last-updated {
  margin-top: var(--spacing-xl);
  font-style: italic;
  font-size: 0.85rem;
  text-align: center;
}

.back-link {
  text-align: center;
  margin-top: var(--spacing-lg);
}

.back-link a {
  color: var(--accent-secondary);
  text-decoration: none;
  font-weight: 600;
}

.back-link a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
    .legal-container {
        padding: var(--spacing-lg);
        margin: var(--spacing-lg) var(--spacing-md);
    }

    h1 {
        font-size: 1.8rem;
    }
}
</style>
