import {createRouter, createWebHistory} from 'vue-router'
import Game from "../views/Game.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'game',
            component: Game
        }
    ],
})

export default router