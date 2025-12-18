import { createRouter, createWebHistory } from 'vue-router'
import Game from '../views/Game.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/game', component: Game, meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 인증 체크
router.beforeEach((to, from, next) => {
  const userId = localStorage.getItem('user_id')
  if (to.meta.requiresAuth && !userId) next('/login')
  else next()
})

export default router