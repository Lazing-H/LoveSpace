<template>
  <div class="milestone-page">
    <h2 class="page-title">恋爱里程碑</h2>
    <button class="btn-add" @click="showForm = true">添加里程碑</button>

    <div class="milestone-list">
      <div v-for="m in milestones" :key="m.id" class="milestone-card">
        <div v-if="coverOrFirstMedia(m)" class="m-cover" @click="preview(coverOrFirstMedia(m).url)">
          <img v-if="coverOrFirstMedia(m).type !== 'video'" :src="getImageUrl(coverOrFirstMedia(m).url)" alt="" />
          <video v-else :src="getImageUrl(coverOrFirstMedia(m).url)" muted loop playsinline controls class="m-cover-video"></video>
        </div>
        <div class="m-date">{{ formatDate(m.eventDate) }}</div>
        <h4 class="m-title">{{ m.title }}</h4>
        <p v-if="m.description" class="m-desc">{{ m.description }}</p>
        <div v-if="mediaList(m).length > 1" class="m-media-list">
          <template v-for="(item, i) in mediaList(m)" :key="i">
            <span class="m-media-wrap">
              <img v-if="item.type !== 'video'" :src="getImageUrl(item.url)" alt="" class="m-media-item" @click="preview(item.url)" />
              <video v-else :src="getImageUrl(item.url)" muted loop playsinline controls class="m-media-item"></video>
            </span>
          </template>
        </div>
        <div class="m-actions">
          <button class="btn-delete" @click="deleteMilestone(m)">删除</button>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal milestone-form">
        <h4>添加里程碑</h4>
        <input v-model="form.title" placeholder="标题，如：第一次牵手" />
        <input v-model="form.description" placeholder="描述（可选）" />
        <input v-model="form.eventDate" type="date" placeholder="日期" />
        <div class="media-upload">
          <p class="label">图片 / 视频（可选）</p>
          <div class="media-previews">
            <div v-for="(item, i) in form.mediaList" :key="i" class="media-thumb">
              <img v-if="item.type === 'image'" :src="getImageUrl(item.url)" alt="" />
              <video v-else :src="getImageUrl(item.url)" muted loop playsinline></video>
              <button type="button" class="remove-media" @click="form.mediaList.splice(i, 1)">×</button>
            </div>
            <label class="add-media">
              <input type="file" accept="image/*,video/*" @change="onMediaSelect" hidden />
              + 添加
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showForm = false">取消</button>
          <button class="primary" @click="submitMilestone">确定</button>
        </div>
      </div>
    </div>

    <div v-if="previewUrl" class="preview-overlay" @click="previewUrl = null">
      <button type="button" class="preview-close" aria-label="关闭" @click.stop="previewUrl = null">×</button>
      <video v-if="isVideoUrl(previewUrl)" :src="getImageUrl(previewUrl)" controls autoplay class="preview-media" @click.stop></video>
      <img v-else :src="getImageUrl(previewUrl)" alt="" class="preview-media" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api, getImageUrl } from '../api'

const milestones = ref([])
const showForm = ref(false)
const previewUrl = ref(null)
const form = ref({
  title: '',
  description: '',
  eventDate: '',
  mediaList: []
})

function formatDate(s) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
function mediaList(m) {
  if (!m.mediaJson) return []
  try {
    return JSON.parse(m.mediaJson) || []
  } catch {
    return []
  }
}
function coverOrFirstMedia(m) {
  const list = mediaList(m)
  if (list.length) return list[0]
  if (m.coverUrl) return { url: m.coverUrl, type: 'image' }
  return null
}
function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false
  return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url.toLowerCase())
}
function preview(url) {
  previewUrl.value = url
}

async function load() {
  if (!api.getSpaceId()) {
    milestones.value = []
    return
  }
  try {
    const res = await api.getMilestones()
    milestones.value = res?.data ?? []
  } catch {
    milestones.value = []
  }
}

async function onMediaSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const type = file.type.startsWith('video/') ? 'video' : 'image'
  try {
    const res = await api.uploadMilestoneMedia(file)
    if (res?.data) form.value.mediaList.push({ url: res.data, type: type === 'video' ? 'video' : 'image' })
  } catch (err) {
    alert('上传失败：' + (err?.message || err))
  }
  e.target.value = ''
}

function submitMilestone() {
  if (!form.value.title?.trim()) { alert('请填写标题'); return }
  if (!form.value.eventDate) { alert('请选择日期'); return }
  if (!api.getSpaceId()) { alert('请先绑定空间'); return }
  api.createMilestone({
    title: form.value.title,
    description: form.value.description || null,
    eventDate: form.value.eventDate,
    coverUrl: form.value.mediaList[0]?.type === 'image' ? form.value.mediaList[0].url : null,
    mediaList: form.value.mediaList
  }).then(() => {
    load()
    showForm.value = false
    form.value = { title: '', description: '', eventDate: '', mediaList: [] }
  }).catch(err => alert(err || '创建失败'))
}

function deleteMilestone(m) {
  if (!confirm('确定删除？')) return
  api.deleteMilestone(m.id).then(load).catch(err => alert(err || '删除失败'))
}

onMounted(load)
</script>

<style scoped>
.milestone-page { padding: 0.5rem 0; }
.page-title { font-size: 1.3rem; margin-bottom: 1rem; color: var(--pink-800); text-align: center; }
.btn-add { display: block; margin: 0 auto 1.5rem; padding: 0.6rem 1.5rem; background: var(--pink-500); color: #fff; border-radius: var(--radius-sm); }
.milestone-list { display: flex; flex-direction: column; gap: 1rem; }
.milestone-card {
  background: rgba(255,255,255,0.9);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow);
  border-left: 4px solid var(--pink-400);
}
.m-cover { width: 100%; aspect-ratio: 1; max-height: 200px; border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 0.75rem; background: rgba(0,0,0,0.1); cursor: pointer; }
.m-cover img, .m-cover video { width: 100%; height: 100%; object-fit: cover; display: block; }
.m-cover-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.m-date { font-size: 0.9rem; color: var(--pink-600); margin-bottom: 0.35rem; }
.m-title { font-size: 1.1rem; color: var(--pink-800); margin-bottom: 0.35rem; }
.m-desc { font-size: 0.95rem; color: var(--pink-700); margin-bottom: 0.75rem; }
.m-media-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
.m-media-wrap { width: 72px; height: 72px; flex-shrink: 0; border-radius: 8px; overflow: hidden; }
.m-media-wrap .m-media-item { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 8px; cursor: pointer; }
.m-media-wrap video.m-media-item { cursor: default; }
.btn-delete { padding: 0.35rem 0.8rem; background: var(--pink-100); color: var(--pink-700); border: 1px solid #e0e0e0; border-radius: 8px; font-size: 0.85rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; overflow-y: auto; }
.modal { background: #fff; padding: 1.5rem; border-radius: var(--radius); min-width: 280px; max-width: 420px; width: 100%; max-height: 90vh; overflow-y: auto; }
.milestone-form input { width: 100%; padding: 0.6rem; border: 1px solid var(--pink-200); border-radius: 8px; margin-bottom: 0.75rem; }
.media-upload { margin-bottom: 1rem; }
.media-upload .label { font-size: 0.9rem; color: var(--pink-700); margin-bottom: 0.5rem; }
.media-previews { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.media-thumb { position: relative; width: 72px; height: 72px; border-radius: 8px; overflow: hidden; }
.media-thumb img, .media-thumb video { width: 100%; height: 100%; object-fit: cover; }
.remove-media { position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; border-radius: 50%; background: var(--pink-500); color: #fff; font-size: 14px; line-height: 1; }
.add-media { width: 72px; height: 72px; border: 2px dashed var(--pink-300); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--pink-600); font-size: 0.9rem; cursor: pointer; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.modal-actions button { padding: 0.5rem 1rem; border-radius: 8px; background: var(--pink-100); color: var(--pink-700); }
.modal-actions .primary { background: var(--pink-500); color: #fff; }
.preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 201; display: flex; align-items: center; justify-content: center; padding: 2.5rem 1rem 1rem; }
.preview-overlay .preview-close { position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10; width: 2.5rem; height: 2.5rem; border: none; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; font-size: 1.5rem; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.preview-overlay .preview-close:hover { background: rgba(0,0,0,0.8); }
.preview-overlay .preview-media { max-width: 100%; max-height: min(82vh, calc(100vh - 5rem)); object-fit: contain; }
</style>
