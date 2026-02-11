import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { title: '登录', guest: true } },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue'), meta: { title: '注册', guest: true } },
  { path: '/', name: 'Home', component: () => import('../views/Home.vue'), meta: { title: '我们的空间', requiresAuth: true } },
  { path: '/photos', name: 'Photos', component: () => import('../views/Photos.vue'), meta: { title: '照片墙', requiresAuth: true } },
  { path: '/diary', name: 'Diary', component: () => import('../views/Diary.vue'), meta: { title: '恋爱日记', requiresAuth: true } },
  { path: '/ai-draw', name: 'AiDraw', component: () => import('../views/AiDraw.vue'), meta: { title: '文生图', requiresAuth: true } },
  { path: '/milestone', name: 'Milestone', component: () => import('../views/Milestone.vue'), meta: { title: '恋爱里程碑', requiresAuth: true } },
  { path: '/wish', name: 'Wish', component: () => import('../views/Wish.vue'), meta: { title: '心愿清单', requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.guest) {
    if (token) next({ path: '/' })
    else next()
    return
  }
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

router.afterEach(to => {
  document.title = to.meta.title ? `${to.meta.title} - 情侣空间` : '情侣空间'
})

export default router
