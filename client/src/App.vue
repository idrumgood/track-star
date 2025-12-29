<script setup>
import { ref, onMounted } from 'vue';

const user = ref(null);

onMounted(async () => {
    const savedUser = localStorage.getItem('track_star_user');
    if (savedUser) {
        user.value = JSON.parse(savedUser);
    }
    
    // Fetch dynamic config from backend
    try {
        const res = await fetch('/api/config');
        const config = await res.json();
        if (config.googleClientId) {
            initGoogleSignIn(config.googleClientId);
        }
    } catch (e) {
        console.error("Failed to fetch app config", e);
    }

    // Global 401 handler
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (response.status === 401 && user.value) {
            console.warn("Session expired or unauthorized. Logging out...");
            logout();
        }
        return response;
    };
});

const initGoogleSignIn = (clientId) => {
    const tryInit = () => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                auto_select: true // Try to auto-sign in if possible
            });
            
            // Render in ALL available containers
            const btnContainers = document.querySelectorAll('.google-btn-container');
            btnContainers.forEach(container => {
                if (container && !user.value) {
                    window.google.accounts.id.renderButton(
                        container,
                        { theme: 'outline', size: 'large', type: 'standard', shape: 'pill' }
                    );
                }
            });
            
            // Optional: Also display the One Tap prompt
            if (!user.value) {
                window.google.accounts.id.prompt();
            }
        } else {
            // Script might still be loading, retry in 100ms
            setTimeout(tryInit, 100);
        }
    };
    tryInit();
};



const handleCredentialResponse = (response) => {
    // response.credential is the ID Token (JWT)
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    
    const newUser = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        idToken: response.credential
    };
    
    user.value = newUser;
    localStorage.setItem('track_star_user', JSON.stringify(newUser));
};

const logout = () => {
    user.value = null;
    localStorage.removeItem('track_star_user');
    // Re-render button next frame if needed
    setTimeout(() => {
        const btnContainers = document.querySelectorAll('.google-btn-container');
        if (window.google) {
            btnContainers.forEach(container => {
                window.google.accounts.id.renderButton(
                    container,
                    { theme: 'outline', size: 'large', type: 'standard', shape: 'pill' }
                );
            });
            window.google.accounts.id.prompt(); // Re-show prompt if applicable
        }
    }, 0);
};
</script>

<template>
  <header>
    <div class="brand">
        <img src="/logo.svg" alt="Track Star Logo" class="logo-img" />
        <div class="logo-text">Track Star</div>
    </div>

    <nav v-if="user" class="main-nav">
        <router-link to="/" class="nav-item" active-class="active">Plan</router-link>
        <router-link to="/stats" class="nav-item" active-class="active">Stats</router-link>
    </nav>

    <div class="user-controls">
        <div v-if="user" class="user-info">
            <img v-if="user.picture" :src="user.picture" class="user-avatar" />
            <span class="user-name">{{ user.name }}</span>
            <button class="auth-btn" @click="logout">Logout</button>
        </div>
        <div v-else class="auth-options">
            <div class="google-btn-container"></div>
        </div>
    </div>
  </header>

  <main>
    <div v-if="!user" class="login-prompt glass-panel">
        <h2>Welcome to Track Star</h2>
        <p>Please log in with your Google account to see your training plan.</p>
        <div class="prompt-actions">
            <div class="google-btn-container"></div>
        </div>
    </div>
    
    <router-view v-else v-slot="{ Component }">
      <component :is="Component" :user="user" />
    </router-view>
  </main>

  <footer>
    <div class="footer-content">
      <p>&copy; 2025 Bryan Dunk</p>
      <router-link to="/about" class="footer-link">About</router-link>
    </div>
  </footer>
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

.main-nav {
    display: flex;
    gap: var(--spacing-sm);
    background: rgba(255, 255, 255, 0.03);
    padding: 4px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
}

.nav-item {
    text-decoration: none;
    color: var(--text-secondary);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}

.nav-item:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
}

.nav-item.active {
    color: var(--accent-primary);
    background: rgba(16, 185, 129, 0.1);
}

.user-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--accent-primary);
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

main {
    padding-bottom: 80px; /* Space for fixed footer */
}

footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-md) 0;
    background: rgba(10, 10, 10, 0.8);
    backdrop-filter: blur(8px);
    border-top: 1px solid var(--border-color);
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.85rem;
    z-index: 1000;
}

.footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
}

.footer-link {
    color: var(--accent-secondary);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.footer-link:hover {
    color: var(--accent-primary);
    text-decoration: underline;
}

@media (max-width: 768px) {
    header {
        flex-direction: column;
        gap: var(--spacing-md);
        padding-bottom: var(--spacing-md);
    }

    .brand {
        justify-content: center;
        width: 100%;
    }

    .logo-img {
        width: 36px;
        height: 36px;
    }

    .logo-text {
        font-size: 1.5rem;
    }

    .main-nav {
        width: 100%;
        justify-content: center;
    }

    .nav-item {
        padding: 6px 12px;
        font-size: 0.85rem;
    }

    .user-controls {
        width: 100%;
        justify-content: center;
    }

    .user-info {
        font-size: 0.9rem;
    }

    .login-prompt h2 {
        font-size: 1.8rem;
    }
}
</style>
