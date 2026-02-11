<template>
  <div class="auth-page">
    <h2 class="site-title gradient-text">Love Space</h2>
    <div class="auth-card">
      <h1 class="auth-title gradient-text">登录</h1>
      <p class="auth-sub">进入我们的情侣空间</p>
      <form @submit.prevent="submit" class="auth-form">
        <input v-model="form.username" type="text" placeholder="用户名" required class="input" />
        <input v-model="form.password" type="password" placeholder="密码" required class="input" />
        <p v-if="err" class="err">{{ err }}</p>
        <button type="submit" class="btn" :disabled="loading">登录</button>
      </form>
      <p class="auth-footer">还没有账号？ <router-link to="/register">注册</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const loading = ref(false)
const err = ref('')
const form = reactive({ username: '', password: '' })

async function submit() {
  err.value = ''
  loading.value = true
  try {
    const res = await api.login(form)
    if (res?.data?.token) {
      localStorage.setItem('token', res.data.token)
      window.dispatchEvent(new Event('auth-change'))
      try {
        const spaceRes = await api.getDefaultSpace()
        if (spaceRes?.data?.id) api.setSpaceId(spaceRes.data.id)
      } catch (_) {
        // 无空间时 getDefaultSpace 可能抛错（旧后端），忽略并继续跳转首页绑定
      }
      const redirect = router.currentRoute.value.query.redirect || '/'
      router.replace(redirect)
    }
  } catch (e) {
    err.value = e || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  position: relative;
  z-index: 1;
}
.site-title {
  font-family: var(--font-cute);
  font-size: 1.75rem;
  letter-spacing: 0.08em;
  margin-bottom: 1.5rem;
  text-align: center;
  animation: title-glow 3s ease-in-out infinite;
}
@keyframes title-glow {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.5)); }
  50% { filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.7)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.3)); }
}
.auth-card {
  width: 100%;
  max-width: 360px;
  background: var(--bg-card);
  border: 1px solid var(--bg-card-border);
  border-radius: var(--radius);
  padding: 2rem;
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-glow-strong);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  animation: auth-card-pulse 5s ease-in-out infinite;
}
@keyframes auth-card-pulse {
  0%, 100% { box-shadow: 0 0 50px rgba(236, 72, 153, 0.3), 0 0 80px rgba(139, 92, 246, 0.1); }
  50% { box-shadow: 0 0 60px rgba(236, 72, 153, 0.4), 0 0 100px rgba(139, 92, 246, 0.15); }
}
.auth-card:hover {
  border-color: rgba(236, 72, 153, 0.45);
  box-shadow: 0 0 60px rgba(236, 72, 153, 0.25), 0 0 100px rgba(139, 92, 246, 0.1);
}
.auth-title { font-size: 1.5rem; margin-bottom: 0.25rem; }
.auth-sub { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--bg-card-border);
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.06);
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.input:focus {
  border-color: var(--pink-500);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.25), 0 0 20px rgba(236, 72, 153, 0.15);
  animation: input-glow 2s ease-in-out infinite;
}
@keyframes input-glow {
  0%, 100% { box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.25), 0 0 20px rgba(236, 72, 153, 0.15); }
  50% { box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.35), 0 0 25px rgba(236, 72, 153, 0.25); }
}
.input::placeholder { color: var(--text-muted); opacity: 0.8; }
.err { color: #f87171; font-size: 0.9rem; }
.btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--pink-500), var(--pink-600));
  color: var(--white);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  margin-top: 0.5rem;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 24px rgba(236, 72, 153, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 6px 30px rgba(236, 72, 153, 0.5); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-footer { margin-top: 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.9rem; }
.auth-footer a { color: var(--pink-400); transition: color 0.2s; }
.auth-footer a:hover { color: var(--rose-300); }
</style>
