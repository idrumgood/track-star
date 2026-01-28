<script setup>
import { ref, onMounted } from 'vue';
import { auth } from './firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut,
    updateProfile
} from 'firebase/auth';

const user = ref(null);
const email = ref('');
const password = ref('');
const displayName = ref('');
const isSignUp = ref(false);
const authError = ref('');
const isLoading = ref(true);

onMounted(() => {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const idToken = await firebaseUser.getIdToken();
            user.value = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName,
                email: firebaseUser.email,
                picture: firebaseUser.photoURL,
                idToken: idToken
            };
            localStorage.setItem('track_star_user', JSON.stringify(user.value));
        } else {
            user.value = null;
            localStorage.removeItem('track_star_user');
        }
        isLoading.value = false;
    });
});

const handleEmailAuth = async () => {
    authError.value = '';
    try {
        if (isSignUp.value) {
            const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
            await updateProfile(userCredential.user, {
                displayName: displayName.value
            });
            // onAuthStateChanged will handle the rest
        } else {
            await signInWithEmailAndPassword(auth, email.value, password.value);
        }
    } catch (error) {
        console.error("Auth error:", error);
        authError.value = error.message;
    }
};

const handleGoogleSignIn = async () => {
    authError.value = '';
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Google sign-in error:", error);
        authError.value = error.message;
    }
};

const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
    }
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
        <router-link to="/settings" class="nav-item" active-class="active">Settings</router-link>
    </nav>

    <div class="user-controls">
        <div v-if="user" class="user-info">
            <img v-if="user.picture" :src="user.picture" class="user-avatar" />
            <span class="user-name">{{ user.name || user.email }}</span>
            <button class="auth-btn" @click="logout">Logout</button>
        </div>
        <div v-else-if="!isLoading" class="auth-options">
            <button class="auth-btn" @click="isSignUp = !isSignUp">
                {{ isSignUp ? 'Switch to Login' : 'Sign Up' }}
            </button>
        </div>
    </div>
  </header>

  <main>
    <div v-if="isLoading" class="loading-screen">
        <div class="loader"></div>
        <p>Initializing Session...</p>
    </div>

    <div v-else-if="!user" class="landing-page">
        <!-- Hero Section -->
        <section class="hero-section glass-panel">
            <div class="hero-content">
                <h1 class="hero-title">Elevate Your <span class="text-gradient">Training</span></h1>
                <p class="hero-subtitle">The simple, powerful way to plan your week and track your fitness journey. No fluff, just progress.</p>
                
                <div class="auth-form-container glass-panel">
                    <h2 class="form-title">{{ isSignUp ? 'Create Account' : 'Welcome Back' }}</h2>
                    <form @submit.prevent="handleEmailAuth" class="auth-form">
                        <div v-if="isSignUp" class="form-group">
                            <label>Name</label>
                            <input v-model="displayName" type="text" placeholder="Your Name" required />
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input v-model="email" type="email" placeholder="email@example.com" required />
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input v-model="password" type="password" placeholder="••••••••" required />
                        </div>
                        <div v-if="authError" class="auth-error">{{ authError }}</div>
                        <button type="submit" class="auth-submit-btn">
                            {{ isSignUp ? 'Sign Up' : 'Sign In' }}
                        </button>
                    </form>

                    <div class="auth-divider">
                        <span>OR</span>
                    </div>

                    <button class="google-signin-btn" @click="handleGoogleSignIn">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        Sign in with Google
                    </button>

                    <p class="auth-toggle">
                        {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
                        <a href="#" @click.prevent="isSignUp = !isSignUp">
                            {{ isSignUp ? 'Login' : 'Sign Up' }}
                        </a>
                    </p>
                </div>
            </div>
            <div class="hero-visual">
                <img src="/hero.png" alt="Track Star Hero" class="hero-img" />
            </div>
        </section>

        <!-- Features Section -->
        <section class="features-section">
            <h2 class="section-title">Why Track Star?</h2>
            <div class="features-grid">
                <div class="feature-card glass-panel">
                    <div class="feature-icon">📅</div>
                    <h3>Plan Your Week</h3>
                    <p>Intuitive weekly planning interface designed for athletes. Set your goals and crush them.</p>
                </div>
                <div class="feature-card glass-panel">
                    <div class="feature-icon">✅</div>
                    <h3>Track Progress</h3>
                    <p>Simple one-tap completion tracking. Stay accountable with a clear visual of your wins.</p>
                </div>
                <div class="feature-card glass-panel">
                    <div class="feature-icon">📊</div>
                    <h3>Data Insights</h3>
                    <p>Beautiful charts and metrics that show your consistency and effort over time.</p>
                </div>
                <div class="feature-card glass-panel">
                    <div class="feature-icon">🚀</div>
                    <h3>Go Above & Beyond</h3>
                    <p>Log extra activities easily. Every bit of effort counts toward your long-term success.</p>
                </div>
            </div>
        </section>
    </div>
    
    <router-view v-else v-slot="{ Component }">
      <component :is="Component" :user="user" />
    </router-view>
  </main>

  <footer>
    <div class="footer-content">
      <p>&copy; {{ new Date().getFullYear() }} Bryan Dunk</p>
      <div class="footer-links">
        <router-link to="/about" class="footer-link">About</router-link>
        <span class="divider">•</span>
        <router-link to="/legal" class="footer-link">Legal</router-link>
      </div>
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

.footer-links {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.divider {
    color: var(--text-muted);
    font-size: 0.7rem;
    user-select: none;
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

    main {
        padding-bottom: 0;
    }

    footer {
        position: static;
        background: var(--bg-primary);
        padding: var(--spacing-xl) 0;
    }
}

/* Landing Page Styles */
.landing-page {
    display: flex;
    flex-direction: column;
    gap: 100px;
    padding: var(--spacing-xl) var(--spacing-md);
    animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.hero-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: var(--spacing-xl);
    padding: var(--spacing-xxl) var(--spacing-xl);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.hero-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: left;
}

.hero-title {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
}

.text-gradient {
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.hero-subtitle {
    font-size: 1.25rem;
    color: var(--text-secondary);
    max-width: 500px;
}

.hero-visual {
    position: relative;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.hero-img {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.5s ease;
}

.hero-section:hover .hero-img {
    transform: scale(1.02);
}

.features-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
}

.section-title {
    font-size: 2.5rem;
    font-weight: 700;
    text-align: center;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: var(--spacing-lg);
}

.feature-card {
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    transition: transform 0.3s ease, border-color 0.3s ease;
    border: 1px solid transparent;
}

.feature-card:hover {
    transform: translateY(-8px);
    border-color: var(--accent-primary);
}

.feature-icon {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-xs);
}

.feature-card h3 {
    font-size: 1.5rem;
    font-weight: 700;
}

.feature-card p {
    color: var(--text-secondary);
    line-height: 1.6;
}

.cta-section {
    text-align: center;
    padding: var(--spacing-xxl) var(--spacing-xl);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    background: linear-gradient(rgba(10, 10, 10, 0.5), rgba(10, 10, 10, 0.5)), 
                radial-gradient(circle at top right, rgba(16, 185, 129, 0.1), transparent),
                radial-gradient(circle at bottom left, rgba(99, 102, 241, 0.1), transparent);
}

.cta-section h2 {
    font-size: 2.5rem;
    font-weight: 800;
}

.cta-section p {
    font-size: 1.2rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin-bottom: var(--spacing-md);
}

/* Authentication Form Styles */
.auth-form-container {
    padding: var(--spacing-lg);
    width: 100%;
    max-width: 400px;
    margin-top: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.form-title {
    font-size: 1.5rem;
    margin-bottom: var(--spacing-sm);
    text-align: center;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.form-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    padding-left: 4px;
}

.form-group input {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: var(--text-primary);
    font-family: inherit;
    font-size: 1rem;
    transition: all 0.2s ease;
}

.form-group input:focus {
    outline: none;
    border-color: var(--accent-primary);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.auth-submit-btn {
    background: var(--accent-primary);
    color: white;
    padding: 12px;
    border-radius: var(--radius-sm);
    font-weight: 700;
    font-size: 1rem;
    margin-top: var(--spacing-xs);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.auth-submit-btn:hover {
    background: #059669;
    transform: translateY(-1px);
}

.auth-divider {
    display: flex;
    align-items: center;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8rem;
    font-weight: 600;
}

.auth-divider::before,
.auth-divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--border-color);
}

.auth-divider span {
    padding: 0 10px;
}

.google-signin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: white;
    color: #333;
    padding: 11px;
    border-radius: var(--radius-sm);
    font-weight: 600;
    font-size: 0.95rem;
}

.google-signin-btn img {
    width: 18px;
    height: 18px;
}

.google-signin-btn:hover {
    background: #f3f4f6;
    transform: translateY(-1px);
}

.auth-error {
    color: var(--accent-danger);
    font-size: 0.85rem;
    background: rgba(244, 63, 94, 0.1);
    padding: 8px 12px;
    border-radius: 6px;
    border-left: 3px solid var(--accent-danger);
}

.auth-toggle {
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.auth-toggle a {
    color: var(--accent-secondary);
    text-decoration: none;
    font-weight: 600;
}

.auth-toggle a:hover {
    text-decoration: underline;
}

/* Loading Screen */
.loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 50vh;
    gap: var(--spacing-md);
}

.loader {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border-color);
    border-top: 4px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@media (max-width: 968px) {
    .hero-section {
        grid-template-columns: 1fr;
        text-align: center;
        padding: var(--spacing-xl);
    }

    .hero-content {
        align-items: center;
        text-align: center;
    }

    .hero-title {
        font-size: 3rem;
    }

    .hero-subtitle {
        margin: 0 auto;
    }

    .auth-form-container {
        max-width: 100%;
    }
}

@media (max-width: 480px) {
    .hero-title {
        font-size: 2.5rem;
    }
    
    .landing-page {
        gap: 60px;
        padding-top: var(--spacing-lg);
    }

    .feature-card {
        padding: var(--spacing-lg);
    }

    .hero-section, .cta-section {
        padding: var(--spacing-xl) var(--spacing-md);
    }
}
</style>
