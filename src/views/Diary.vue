<template>
  <div class="diary-page" @click="openDiaryMenuId && (openDiaryMenuId = null)">
    <h2 class="page-title gradient-glow">我们的日记</h2>
    <p class="page-subtitle">记录每一天的点点滴滴</p>
    <button class="btn-add" @click.stop="openEditorForNew()">💡 写日记</button>

    <div class="diary-list">
      <article v-for="d in diaryList" :key="d.id" class="diary-card">
        <div class="diary-meta">
          <span class="mood" v-if="d.mood">{{ d.mood }}</span>
          <span class="weather" v-if="d.weather">{{ d.weather }}</span>
          <span class="location" v-if="d.location">{{ d.location }}</span>
          <time class="date">{{ formatDate(d.createdAt) }}</time>
        </div>
        <p class="diary-content">{{ d.content }}</p>
        <div v-if="d.images?.length" class="diary-images">
          <template v-for="(img, i) in d.images" :key="i">
            <span class="diary-media-wrap" :class="{ 'is-video': isVideoUrl(img) }">
              <video v-if="isVideoUrl(img)" :src="getImageUrl(img)" muted loop playsinline preload="metadata" class="diary-media" @click="preview(img)" />
              <img v-else :src="getImageUrl(img)" alt="" loading="lazy" class="diary-media" @click="preview(img)" />
              <span v-if="isVideoUrl(img)" class="diary-video-play" aria-hidden="true">▶</span>
            </span>
          </template>
        </div>
        <div class="diary-menu-wrap" :class="{ 'menu-open': openDiaryMenuId === d.id }">
          <button type="button" class="menu-trigger" @click.stop="toggleDiaryMenu(d.id)" aria-label="更多">
            <span class="menu-dots">⋮</span>
          </button>
          <div v-if="openDiaryMenuId === d.id" class="dropdown-menu" @click.stop>
            <button type="button" @click="editDiary(d); openDiaryMenuId = null">编辑</button>
            <button type="button" class="dropdown-item-delete" @click="openDeleteSheet(d)">删除</button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showEditor" class="modal-overlay" @click.self="closeEditor">
      <div class="modal diary-editor">
        <div class="modal-editor-scroll">
          <h4 class="editor-title">{{ editingDiaryId ? '编辑日记' : '写日记' }}</h4>
          <textarea v-model="newContent" placeholder="记录今天的小确幸..." rows="4" class="editor-textarea"></textarea>

          <div class="editor-optional editor-optional-inline">
            <p class="optional-label">心情 <span class="optional-tag">可选</span></p>
            <div class="option-chips">
              <button type="button" v-for="m in moodOptions" :key="m" class="chip" :class="{ active: newMood === m }" @click="newMood = newMood === m ? '' : m">{{ m }}</button>
              <input v-if="newMood === '自定义'" type="text" v-model="newMoodCustom" class="chip-input" placeholder="自定义心情" maxlength="8" />
            </div>
          </div>
          <div class="editor-optional editor-optional-inline">
            <p class="optional-label">天气 <span class="optional-tag">可选</span></p>
            <div class="option-chips">
              <button type="button" v-for="w in weatherOptions" :key="w" class="chip" :class="{ active: newWeather === w }" @click="newWeather = newWeather === w ? '' : w">{{ w }}</button>
              <input v-if="newWeather === '自定义'" type="text" v-model="newWeatherCustom" class="chip-input" placeholder="自定义天气" maxlength="8" />
            </div>
          </div>
          <div class="editor-optional editor-optional-inline">
            <p class="optional-label">地点 <span class="optional-tag">可选</span></p>
            <div class="option-chips">
              <button type="button" v-for="loc in locationOptions" :key="loc" class="chip" :class="{ active: newLocation === loc }" @click="newLocation = newLocation === loc ? '' : loc">{{ loc }}</button>
              <input v-if="newLocation === '自定义'" type="text" v-model="newLocationCustom" class="chip-input" placeholder="自定义地点" maxlength="10" />
            </div>
          </div>

          <div class="image-uploads">
            <p class="optional-label">添加图片/视频</p>
            <div class="uploads-row">
              <div v-for="(url, i) in newImageUrls" :key="i" class="thumb" :class="{ 'thumb-video': isVideoUrl(url) }">
                <video v-if="isVideoUrl(url)" :src="getImageUrl(url)" muted loop playsinline preload="metadata" class="thumb-media" />
                <img v-else :src="getImageUrl(url)" alt="" class="thumb-media" />
                <span v-if="isVideoUrl(url)" class="thumb-play" aria-hidden="true">▶</span>
                <button type="button" @click="newImageUrls.splice(i, 1)">×</button>
              </div>
              <label class="add-img">
                <input type="file" accept="image/*,video/*" @change="onDiaryImageSelect" hidden />
                + 图片/视频
              </label>
            </div>
          </div>
        </div>
        <div class="modal-actions modal-actions-sticky">
          <button type="button" class="btn-cancel" @click="closeEditor">取消</button>
          <button type="button" class="btn-publish primary" @click="submitDiary">{{ editingDiaryId ? '保存' : '发布' }}</button>
        </div>
      </div>
    </div>

    <div v-if="openDiaryMenuId" class="dropdown-overlay" @click="openDiaryMenuId = null"></div>

    <!-- 手机风格底部操作栏：删除确认 -->
    <div v-if="showDeleteSheet" class="sheet-overlay" @click="closeDeleteSheet">
      <div class="action-sheet" @click.stop>
        <p class="action-sheet-title">确定删除这条日记？</p>
        <div class="action-sheet-actions">
          <button type="button" class="sheet-btn sheet-cancel" @click="closeDeleteSheet">取消</button>
          <button type="button" class="sheet-btn sheet-danger" @click="confirmDeleteDiary">删除</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="previewImg" class="preview-overlay" @click="previewImg = null">
        <div class="preview-close-layer">
          <button type="button" class="preview-close" aria-label="关闭" @click.stop="previewImg = null">×</button>
        </div>
        <video v-if="isVideoUrl(previewImg)" :src="getImageUrl(previewImg)" controls autoplay class="preview-media" @click.stop></video>
        <img v-else :src="getImageUrl(previewImg)" alt="" class="preview-media" @click.stop />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api, getImageUrl } from '../api'

const diaryList = ref([])
const showEditor = ref(false)
const newContent = ref('')
const newMood = ref('')
const newWeather = ref('')
const newLocation = ref('')
const newImageUrls = ref([])
const previewImg = ref(null)
const openDiaryMenuId = ref(null)
const showDeleteSheet = ref(false)
const diaryToDelete = ref(null)
const editingDiaryId = ref(null)
function openEditorForNew() {
  editingDiaryId.value = null
  resetEditorForm()
  showEditor.value = true
}
function closeEditor() {
  showEditor.value = false
  resetEditorForm()
  editingDiaryId.value = null
}
function toggleDiaryMenu(id) {
  openDiaryMenuId.value = openDiaryMenuId.value === id ? null : id
}
function resetEditorForm() {
  newContent.value = ''
  newMood.value = ''
  newWeather.value = ''
  newLocation.value = ''
  newMoodCustom.value = ''
  newWeatherCustom.value = ''
  newLocationCustom.value = ''
  newImageUrls.value = []
  editingDiaryId.value = null
}
function fillFormFromDiary(d) {
  newContent.value = d.content || ''
  newMood.value = moodOptions.includes(d.mood) ? d.mood : (d.mood ? '自定义' : '')
  newMoodCustom.value = moodOptions.includes(d.mood) ? '' : (d.mood || '')
  newWeather.value = weatherOptions.includes(d.weather) ? d.weather : (d.weather ? '自定义' : '')
  newWeatherCustom.value = weatherOptions.includes(d.weather) ? '' : (d.weather || '')
  newLocation.value = locationOptions.includes(d.location) ? d.location : (d.location ? '自定义' : '')
  newLocationCustom.value = locationOptions.includes(d.location) ? '' : (d.location || '')
  newImageUrls.value = Array.isArray(d.images) ? [...d.images] : []
}
function openDeleteSheet(d) {
  diaryToDelete.value = d
  openDiaryMenuId.value = null
  showDeleteSheet.value = true
}
function closeDeleteSheet() {
  showDeleteSheet.value = false
  diaryToDelete.value = null
}

const moodOptions = ['开心', '甜蜜', '平静', '想念', '自定义']
const weatherOptions = ['晴', '阴', '雨', '雪', '多云', '风', '自定义']
const locationOptions = ['家里', '餐厅', '公园', '旅行', '自定义']
const newMoodCustom = ref('')
const newWeatherCustom = ref('')
const newLocationCustom = ref('')
function moodDisplay() {
  if (newMood.value === '自定义') return newMoodCustom.value || '自定义'
  return newMood.value
}
function weatherDisplay() {
  if (newWeather.value === '自定义') return newWeatherCustom.value || '自定义'
  return newWeather.value
}
function locationDisplay() {
  if (newLocation.value === '自定义') return newLocationCustom.value || '自定义'
  return newLocation.value
}

function formatDate(s) {
  if (s == null) return ''
  let dateStr = s
  if (Array.isArray(s)) {
    const [y, mo, d, h, min] = s
    dateStr = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h || 0).padStart(2, '0')}:${String(min || 0).padStart(2, '0')}:00`
  }
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadDiary() {
  if (!api.getSpaceId()) {
    diaryList.value = []
    return
  }
  try {
    const res = await api.getDiaryList()
    diaryList.value = res?.data ?? []
  } catch {
    diaryList.value = []
  }
}
function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false
  return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url.toLowerCase())
}
function preview(url) {
  previewImg.value = url
}
async function onDiaryImageSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const res = await api.uploadDiaryImage(file)
    if (res?.data) newImageUrls.value.push(res.data)
  } catch (err) {
    alert('上传失败：' + (err?.message || err))
  }
  e.target.value = ''
}
async function submitDiary() {
  if (!newContent.value.trim()) { alert('写点内容吧'); return }
  const spaceId = api.getSpaceId()
  if (!spaceId) {
    alert('请先绑定空间')
    return
  }
  const payload = {
    content: newContent.value,
    mood: moodDisplay() || null,
    weather: weatherDisplay() || null,
    location: locationDisplay() || null,
    imageUrls: newImageUrls.value
  }
  try {
    if (editingDiaryId.value) {
      await api.updateDiary(editingDiaryId.value, payload)
      loadDiary()
      closeEditor()
    } else {
      await api.createDiary({ spaceId, ...payload })
      loadDiary()
      closeEditor()
    }
  } catch (err) {
    alert(editingDiaryId.value ? '保存失败：' + (err?.message || err) : '发布失败：' + (err?.message || err))
  }
}
function editDiary(d) {
  editingDiaryId.value = d.id
  fillFormFromDiary(d)
  showEditor.value = true
}
function confirmDeleteDiary() {
  const d = diaryToDelete.value
  if (!d) return
  closeDeleteSheet()
  api.deleteDiary(d.id).then(loadDiary).catch(err => alert(err || '删除失败'))
}

onMounted(loadDiary)
</script>

<style scoped>
.diary-page { padding: 0.5rem 0; position: relative; z-index: 1; }
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.35rem;
  background: linear-gradient(135deg, var(--rose-300), var(--pink-500), #e879f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 18px rgba(236, 72, 153, 0.5));
  animation: diary-title-glow 3s ease-in-out infinite;
}
@keyframes diary-title-glow {
  0%, 100% { filter: drop-shadow(0 0 18px rgba(236, 72, 153, 0.5)); }
  50% { filter: drop-shadow(0 0 28px rgba(236, 72, 153, 0.75)) drop-shadow(0 0 35px rgba(139, 92, 246, 0.25)); }
}
.page-subtitle { font-size: 0.95rem; color: var(--text-muted); text-align: center; margin-bottom: 1.25rem; }
.btn-add {
  display: block;
  margin: 0 auto 1.5rem;
  padding: 0.65rem 2rem;
  background: linear-gradient(135deg, var(--pink-500), var(--pink-600));
  color: #fff;
  border-radius: 999px;
  font-size: 1rem;
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 0 24px rgba(236, 72, 153, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: btn-add-pulse 2.5s ease-in-out infinite;
}
@keyframes btn-add-pulse {
  0%, 100% { box-shadow: 0 0 24px rgba(236, 72, 153, 0.4); }
  50% { box-shadow: 0 0 35px rgba(236, 72, 153, 0.55), 0 0 20px rgba(139, 92, 246, 0.2); }
}
.btn-add:hover { transform: scale(1.05); box-shadow: 0 0 35px rgba(236, 72, 153, 0.6), 0 0 25px rgba(139, 92, 246, 0.25); }
.diary-list { display: flex; flex-direction: column; gap: 1rem; }
.diary-card {
  background: rgba(28, 20, 45, 0.6);
  backdrop-filter: blur(12px);
  border-radius: var(--radius);
  padding: 1.25rem;
  border: 1px solid rgba(236, 72, 153, 0.25);
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.15), 0 0 40px rgba(139, 92, 246, 0.06);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
.diary-card:hover {
  border-color: rgba(236, 72, 153, 0.4);
  box-shadow: 0 0 30px rgba(236, 72, 153, 0.25), 0 0 50px rgba(139, 92, 246, 0.1);
}
.diary-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--pink-400); }
.diary-content { white-space: pre-wrap; margin-bottom: 0.75rem; color: var(--text); line-height: 1.6; }
.diary-images { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
.diary-media-wrap { position: relative; width: 56px; height: 56px; flex-shrink: 0; border-radius: 8px; overflow: hidden; cursor: pointer; background: rgba(0,0,0,0.2); }
.diary-media-wrap .diary-media { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 8px; }
.diary-media-wrap video.diary-media { min-width: 100%; min-height: 100%; }
.diary-media-wrap.is-video .diary-video-play {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,0.6);
  color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center;
  padding-left: 2px; pointer-events: none;
}
.thumb.thumb-video .thumb-play {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.6);
  color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center;
  padding-left: 3px; pointer-events: none;
}
.thumb .thumb-media { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; display: block; }
/* 关闭按钮单独一层，保证一定在视频/图片上方 */
.preview-close-layer { position: absolute; inset: 0; z-index: 9999; pointer-events: none; }
.preview-close-layer .preview-close {
  pointer-events: auto;
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.75);
  color: #fff;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.preview-close-layer .preview-close:hover { background: rgba(0,0,0,0.9); }
.preview-overlay .preview-media { position: relative; z-index: 0; max-width: 100%; max-height: min(82vh, calc(100vh - 5rem)); object-fit: contain; }
.diary-menu-wrap { position: relative; display: flex; justify-content: flex-end; margin-top: 0.75rem; }
.diary-menu-wrap.menu-open { z-index: 250; }
.menu-trigger {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.menu-trigger:hover { background: rgba(236, 72, 153, 0.2); color: var(--pink-300); }
.menu-dots { font-size: 1.1rem; line-height: 1; font-weight: 700; }
.dropdown-menu {
  position: absolute;
  right: 0;
  bottom: 100%;
  margin-bottom: 4px;
  min-width: 96px;
  padding: 4px 0;
  background: rgba(28, 20, 45, 0.98);
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  z-index: 200;
}
.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  font-size: 0.9rem;
  color: var(--text);
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.dropdown-menu button:hover { background: rgba(236, 72, 153, 0.15); }
.dropdown-menu .dropdown-item-delete:hover { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.dropdown-overlay { position: fixed; inset: 0; z-index: 199; pointer-events: none; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: flex-start; justify-content: center; padding: max(6rem, calc(env(safe-area-inset-top) + 4rem)) 0.75rem 0.75rem; overflow-y: auto; }
.modal.diary-editor {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 7rem);
  margin-top: 0;
  padding: 0;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  background: rgba(28, 20, 45, 0.95);
  border: 1px solid rgba(236, 72, 153, 0.3);
  box-shadow: 0 0 40px rgba(236, 72, 153, 0.25);
}
.modal-editor-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  -webkit-overflow-scrolling: touch;
}
.modal-actions-sticky {
  flex-shrink: 0;
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid rgba(236, 72, 153, 0.2);
  background: rgba(28, 20, 45, 0.98);
  border-radius: 0 0 20px 20px;
}
.editor-title { color: var(--pink-200); font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(236, 72, 153, 0.3); }
.editor-textarea { width: 100%; padding: 0.85rem; border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 12px; margin-bottom: 1rem; font-size: 1rem; line-height: 1.5; resize: vertical; min-height: 100px; background: rgba(255,255,255,0.06); color: var(--text); }
.editor-textarea:focus { border-color: var(--pink-500); outline: none; box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.2); }
.editor-optional { margin-bottom: 1rem; }
.optional-label { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem; }
.optional-tag { font-size: 0.8rem; color: var(--pink-400); margin-left: 0.25rem; }
.option-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.editor-optional-inline .option-chips { flex-wrap: wrap; align-items: center; }
.chip { padding: 0.4rem 0.75rem; border-radius: 20px; border: 1px solid rgba(236, 72, 153, 0.35); background: rgba(255,255,255,0.05); color: var(--pink-200); font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.chip:hover { border-color: var(--pink-500); background: rgba(236, 72, 153, 0.2); }
.chip.active { background: var(--pink-500); border-color: var(--pink-500); color: #fff; }
.chip-input {
  min-width: 80px; max-width: 100px;
  padding: 0.35rem 0.6rem;
  border: 1px solid rgba(236, 72, 153, 0.4);
  border-radius: 20px;
  font-size: 0.85rem;
  background: rgba(255,255,255,0.08);
  color: var(--text);
}
.chip-input:focus { border-color: var(--pink-500); outline: none; }
.chip-input::placeholder { color: var(--text-muted); }
.image-uploads { margin-bottom: 0.5rem; }
.image-uploads .optional-label { margin-bottom: 0.5rem; }
.uploads-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: flex-start; }
.thumb { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
.thumb button { position: absolute; top: -4px; right: -4px; width: 22px; height: 22px; border-radius: 50%; background: var(--pink-500); color: #fff; font-size: 14px; line-height: 1; cursor: pointer; border: none; }
.add-img { width: 72px; height: 72px; border: 2px dashed rgba(236, 72, 153, 0.5); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--pink-400); font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.add-img:hover { border-color: var(--pink-500); background: rgba(236, 72, 153, 0.15); }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }
.btn-cancel { padding: 0.6rem 1.25rem; border-radius: 12px; background: rgba(236, 72, 153, 0.2); color: var(--pink-300); font-size: 0.95rem; cursor: pointer; border: 1px solid rgba(236, 72, 153, 0.3); }
.btn-publish { padding: 0.6rem 1.5rem; border-radius: 12px; background: linear-gradient(135deg, var(--pink-500), var(--pink-600)); color: #fff; font-size: 0.95rem; cursor: pointer; border: none; }
.modal-actions .primary { box-shadow: 0 4px 20px rgba(236, 72, 153, 0.45); }
.modal-actions .primary:hover { opacity: 0.95; }
/* 手机风格底部操作栏 */
.sheet-overlay {
  position: fixed; inset: 0; z-index: 205;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 0 0 max(env(safe-area-inset-bottom), 0.5rem);
}
.action-sheet {
  width: 100%; max-width: 400px;
  background: rgba(28, 20, 45, 0.98);
  border-radius: 16px 16px 0 0;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(236, 72, 153, 0.25);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.3);
}
.action-sheet-title { margin: 0 0 1rem; color: var(--text); font-size: 1rem; text-align: center; }
.action-sheet-actions { display: flex; gap: 0.75rem; }
.sheet-btn { flex: 1; padding: 0.65rem 1rem; border-radius: 12px; font-size: 0.95rem; cursor: pointer; border: 1px solid transparent; }
.sheet-cancel { background: rgba(255,255,255,0.1); color: var(--pink-200); border-color: rgba(236, 72, 153, 0.3); }
.sheet-danger { background: rgba(239, 68, 68, 0.25); color: #fca5a5; border: 1px solid #e0e0e0; }
.preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 4rem 1rem 2rem; }
</style>
