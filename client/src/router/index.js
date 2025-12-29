import { createRouter, createWebHistory } from 'vue-router';
import WeekView from '../components/WeekView.vue';
import UserStats from '../components/UserStats.vue';
import AboutView from '../components/AboutView.vue';

const routes = [
    { path: '/', component: WeekView },
    { path: '/stats', component: UserStats },
    { path: '/about', component: AboutView }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
