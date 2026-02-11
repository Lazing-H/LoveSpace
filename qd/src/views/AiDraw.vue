<template>
  <div class="ai-draw-page">
    <h2 class="page-title">文生图</h2>
    <p class="hint">描述你想要的画面，AI 生成后直接保存到空间（智谱清言）</p>

    <div class="generate-box">
      <textarea v-model="prompt" placeholder="例如：一对情侣在海边看日落，浪漫温馨..." rows="3"></textarea>
      <button class="btn-generate" :disabled="loading" @click="generate">
        {{ loading ? '生成中...' : '生成' }}
      </button>
    </div>

    <div class="ai-list">
      <div v-for="item in aiList" :key="item.id" class="ai-card">
        <img :src="imageUrl(item.url)" alt="" loading="lazy" @click="preview(item.url)" />
        <p class="ai-prompt">{{ item.prompt }}</p>
        <span class="ai-date">{{ formatDate(item.createdAt) }}</span>
        <button class="btn-delete" @click="deleteAi(item)">删除</button>
      </div>
    </div>
    <div v-if="previewUrl" class="preview-overlay" @click="previewUrl = null">
      <button type="button" class="preview-close" aria-label="关闭" @click.stop="previewUrl = null">×</button>
      <img :src="imageUrl(previewUrl)" alt="" class="preview-media" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api, getImageUrl } from '../api'

const prompt = ref('')
const loading = ref(false)
const aiList = ref([])
const previewUrl = ref(null)

function imageUrl(url) {
  return getImageUrl(url)
}
function formatDate(s) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadList() {
  try {
    const res = await api.getAiImageList()
    aiList.value = res?.data ?? []
  } catch {
    aiList.value = []
  }
}
async function generate() {
  const text = prompt.value?.trim()
  if (!text) { alert('请输入描述'); return }
  loading.value = true
  try {
    const res = await api.generateAiImage(text)
    if (res?.data) {
      aiList.value.unshift(res.data)
      prompt.value = ''
    } else {
      alert(res?.message || '生成失败')
    }
  } catch (err) {
    alert('生成失败：' + (err?.message || err))
  } finally {
    loading.value = false
  }
}
function preview(url) {
  previewUrl.value = url
}
function deleteAi(item) {
  if (!confirm('确定删除？')) return
  api.deleteAiImage(item.id).then(() => {
    aiList.value = aiList.value.filter(x => x.id !== item.id)
  })
}

onMounted(loadList)
</script>

<style scoped>
.ai-draw-page { padding: 0.5rem 0; }
.page-title { font-size: 1.3rem; margin-bottom: 0.5rem; color: var(--pink-800); text-align: center; }
.hint { font-size: 0.9rem; color: var(--pink-600); text-align: center; margin-bottom: 1.5rem; }
.generate-box { background: rgba(255,255,255,0.9); border-radius: var(--radius); padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: var(--shadow); }
.generate-box textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--pink-200); border-radius: var(--radius-sm); margin-bottom: 1rem; resize: vertical; }
.btn-generate { width: 100%; padding: 0.75rem; background: linear-gradient(135deg, var(--pink-500), var(--pink-600)); color: #fff; border-radius: var(--radius-sm); }
.btn-generate:disabled { opacity: 0.7; cursor: not-allowed; }
.ai-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.ai-card { background: #fff; border-radius: var(--radius-sm); overflow: hidden; box-shadow: var(--shadow); }
.ai-card img { width: 100%; aspect-ratio: 1; object-fit: cover; cursor: pointer; }
.ai-prompt { padding: 0.5rem 0.6rem; font-size: 0.85rem; color: var(--pink-800); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ai-date { padding: 0 0.6rem; font-size: 0.8rem; color: var(--pink-500); }
.btn-delete { width: 100%; padding: 0.4rem; background: var(--pink-100); color: var(--pink-700); border: 1px solid #e0e0e0; font-size: 0.85rem; }
.preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 2.5rem 1rem 1rem; }
.preview-overlay .preview-close { position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10; width: 2.5rem; height: 2.5rem; border: none; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; font-size: 1.5rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.preview-overlay .preview-close:hover { background: rgba(0,0,0,0.8); }
.preview-overlay .preview-media { max-width: 100%; max-height: min(82vh, calc(100vh - 5rem)); object-fit: contain; }
@media (min-width: 600px) { .ai-list { grid-template-columns: repeat(3, 1fr); } }
</style>
