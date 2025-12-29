import { createRouter, createWebHistory } from 'vue-router';
import WeekView from '../components/WeekView.vue';
import UserStats from '../components/UserStats.vue';

const routes = [
    { path: '/', component: WeekView },
    { path: '/stats', component: UserStats }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
