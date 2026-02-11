<template>
  <div class="app">
    <RomanticBg />
    <template v-if="isAuthPage">
      <div class="auth-layout">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </template>
    <template v-else>
      <header class="header">
        <div class="logo-wrap">
          <img src="/logo.png" alt="" class="site-logo" />
          <h1 class="logo gradient-text">Love Space</h1>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/photos" class="nav-link">相册</router-link>
          <router-link to="/diary" class="nav-link">日记</router-link>
          <router-link to="/milestone" class="nav-link">里程碑</router-link>
          <router-link to="/wish" class="nav-link">心愿</router-link>
          <template v-if="user">
            <button type="button" class="nav-btn nav-btn-logout" @click="logout">退出</button>
          </template>
        </nav>
      </header>
      <main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RomanticBg from './components/RomanticBg.vue'
import { api } from './api'

const route = useRoute()
const router = useRouter()
const user = ref(null)

const isAuthPage = computed(() => route.meta.guest === true)

async function initAuth() {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const res = await api.me()
    user.value = res?.data ?? null
    const spaceRes = await api.getDefaultSpace()
    if (spaceRes?.data?.id) api.setSpaceId(spaceRes.data.id)
    else api.setSpaceId(null)
  } catch {
    user.value = null
    api.setSpaceId(null)
    localStorage.removeItem('token')
  }
}

function logout() {
  if (!confirm('确定要退出登录吗？')) return
  localStorage.removeItem('token')
  api.setSpaceId(null)
  user.value = null
  router.push('/login')
}

function onAuthExpired() {
  localStorage.removeItem('token')
  api.setSpaceId(null)
  user.value = null
  router.push('/login')
}

onMounted(() => {
  initAuth()
  window.addEventListener('auth-change', initAuth)
  window.addEventListener('auth-expired', onAuthExpired)
})
onUnmounted(() => {
  window.removeEventListener('auth-change', initAuth)
  window.removeEventListener('auth-expired', onAuthExpired)
})
</script>

<style scoped>
.app { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; position: relative; z-index: 1; }
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  background: rgba(18, 10, 26, 0.85);
  padding: 0.75rem 1rem;
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(236, 72, 153, 0.15);
  box-shadow: 0 4px 30px rgba(236, 72, 153, 0.12), 0 0 60px rgba(139, 92, 246, 0.06);
  transform: translateZ(0);
  backface-visibility: hidden;
}
.header::after {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--pink-500), var(--pink-400), var(--pink-500), transparent);
  opacity: 0.7;
  box-shadow: 0 0 12px rgba(236, 72, 153, 0.5);
  animation: header-line-glow 2.5s ease-in-out infinite;
}
@keyframes header-line-glow {
  0%, 100% { opacity: 0.7; box-shadow: 0 0 12px rgba(236, 72, 153, 0.5); }
  50% { opacity: 1; box-shadow: 0 0 20px rgba(236, 72, 153, 0.8), 0 0 30px rgba(139, 92, 246, 0.3); }
}
.logo-wrap { display: flex; align-items: center; gap: 0.6rem; }
.site-logo { height: 2.75rem; width: auto; display: block; object-fit: contain; }
.logo {
  font-family: var(--font-cute);
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  filter: drop-shadow(0 0 14px rgba(236, 72, 153, 0.5));
  margin: 0;
  animation: logo-glow 4s ease-in-out infinite;
}
@keyframes logo-glow {
  0%, 100% { filter: drop-shadow(0 0 14px rgba(236, 72, 153, 0.5)); }
  50% { filter: drop-shadow(0 0 22px rgba(236, 72, 153, 0.7)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.3)); }
}
.nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}
.nav-link {
  color: rgba(252, 231, 243, 0.9);
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.9rem;
  transition: all 0.25s ease;
}
.nav-link:hover {
  background: rgba(236, 72, 153, 0.25);
  color: var(--white);
}
.nav-link.router-link-active {
  background: rgba(139, 92, 246, 0.7);
  color: var(--white);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  animation: nav-active-pulse 2s ease-in-out infinite;
}
@keyframes nav-active-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.4); }
  50% { box-shadow: 0 0 28px rgba(139, 92, 246, 0.6), 0 0 15px rgba(236, 72, 153, 0.3); }
}
.nav-btn {
  background: transparent;
  color: var(--pink-400);
  font-size: 0.9rem;
  padding: 0.4rem 0.7rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(236, 72, 153, 0.3);
  transition: all 0.25s ease;
}
.nav-btn:hover {
  background: rgba(236, 72, 153, 0.2);
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.25);
}
.nav-btn-logout { margin-left: 0.25rem; }
.main { flex: 1; padding: 1rem; max-width: 900px; margin: 0 auto; width: 100%; }
.auth-layout { position: relative; z-index: 1; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (min-width: 768px) {
  .header { padding: 1rem 1.25rem; }
  .site-logo { height: 3.25rem; }
  .logo { font-size: 1.6rem; }
  .nav { gap: 0.35rem; }
  .nav-link { padding: 0.5rem 1rem; }
}
</style>
