import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import { setupAuthInterceptor } from './utils/authInterceptor'

const app = createApp(App)

// Global 401 handler to ensure it's active before ANY request
setupAuthInterceptor();

app.use(router)
app.mount('#app')
