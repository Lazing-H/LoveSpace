<template>
  <div class="photos-page">
    <h2 class="page-title">照片墙</h2>
    <div class="categories" v-if="!showGallery">
      <div v-for="cat in displayCategories" :key="cat.id" class="category-card" @click="openCategory(cat)">
        <div class="cat-cover" :style="coverStyle(cat)"></div>
        <span class="cat-name">{{ cat.name }}</span>
        <div class="cat-actions" v-if="!cat.isAiDraw">
          <div class="cat-menu-wrap">
            <button type="button" class="menu-trigger" @click.stop="toggleCatMenu(cat.id)" aria-label="更多">
              <span class="menu-dots">⋮</span>
            </button>
            <div v-if="openCatMenuId === cat.id" class="dropdown-menu">
              <button type="button" @click.stop="openEditSheet(cat)">编辑</button>
              <button type="button" class="dropdown-item-delete" @click.stop="openDeleteCatSheet(cat)">删除</button>
            </div>
          </div>
        </div>
      </div>
      <button class="add-category" @click="showAddCategory = true">
        <span>+ 新建分类</span>
      </button>
    </div>

    <div v-else class="gallery-view">
      <button class="back-btn" @click="backFromGallery">← 返回分类</button>
      <h3 class="gallery-title">{{ currentCategory?.name }}</h3>

      <!-- 文生图分类：生成 + 列表 -->
      <template v-if="currentCategory?.isAiDraw">
        <div class="ai-draw-inline">
          <div class="generate-box">
            <textarea v-model="aiPrompt" placeholder="描述你想要的画面，AI 生成后保存到此相册..." rows="2"></textarea>
            <button class="btn-generate" :disabled="aiLoading" @click="generateAiImage">
              {{ aiLoading ? '生成中...' : '生成' }}
            </button>
          </div>
          <div class="photo-grid">
            <div v-for="item in aiList" :key="item.id" class="photo-item">
              <img :src="imageUrl(item.url)" alt="" loading="lazy" @click="previewAi(item.url)" />
              <div class="photo-menu-wrap">
                <button type="button" class="menu-trigger" @click.stop="togglePhotoMenu(item.id)" aria-label="更多">⋮</button>
                <div v-if="openPhotoMenuId === item.id" class="dropdown-menu">
                  <button type="button" @click.stop="showPromptSheetFor(item); openPhotoMenuId = null">提示词</button>
                  <button type="button" class="dropdown-item-delete" @click.stop="openDeletePhotoSheet(item); openPhotoMenuId = null">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 普通分类：照片网格 -->
      <template v-else>
        <div class="photo-grid">
          <div v-for="p in photos" :key="p.id" class="photo-item">
            <video v-if="isVideoUrl(p.url)" :src="imageUrl(p.url)" muted loop playsinline class="photo-media" @click="preview(p)" />
            <img v-else :src="imageUrl(p.url)" :alt="p.description" loading="lazy" class="photo-media" @click="preview(p)" />
            <p v-if="p.description" class="photo-desc">{{ p.description }}</p>
            <div class="photo-menu-wrap">
              <button type="button" class="menu-trigger" @click.stop="togglePhotoMenu(p.id)" aria-label="更多">⋮</button>
              <div v-if="openPhotoMenuId === p.id" class="dropdown-menu">
                <button type="button" class="dropdown-item-delete" @click.stop="openDeletePhotoSheet(p); openPhotoMenuId = null">删除</button>
              </div>
            </div>
          </div>
        </div>
        <div class="upload-area">
          <label class="upload-btn">
            <input type="file" accept="image/*,video/*" multiple @change="onPhotoSelect" hidden />
            上传照片/视频
          </label>
        </div>
      </template>
    </div>

    <div v-if="openCatMenuId || openPhotoMenuId" class="dropdown-overlay" @click="openCatMenuId = null; openPhotoMenuId = null"></div>
    <div v-if="previewUrl" class="preview-overlay" @click="previewUrl = null">
      <button type="button" class="preview-close" aria-label="关闭" @click.stop="previewUrl = null">×</button>
      <video v-if="isVideoUrl(previewUrl)" :src="previewUrl" controls autoplay class="preview-media" @click.stop></video>
      <img v-else :src="previewUrl" alt="预览" class="preview-media" @click.stop />
    </div>

    <div v-if="showAddCategory" class="modal-overlay" @click.self="showAddCategory = false">
      <div class="modal">
        <h4>新建分类</h4>
        <input v-model="newCategoryName" placeholder="分类名称" />
        <div class="modal-actions">
          <button @click="showAddCategory = false">取消</button>
          <button class="primary" @click="addCategory">确定</button>
        </div>
      </div>
    </div>

    <!-- 手机风格底部操作栏 -->
    <div v-if="showEditSheet" class="sheet-overlay" @click="closeEditSheet">
      <div class="action-sheet" @click.stop>
        <p class="action-sheet-title">编辑分类名称</p>
        <input v-model="editCategoryName" class="sheet-input" placeholder="分类名称" />
        <div class="action-sheet-actions">
          <button type="button" class="sheet-btn sheet-cancel" @click="closeEditSheet">取消</button>
          <button type="button" class="sheet-btn sheet-primary" @click="saveEditCategory">保存</button>
        </div>
      </div>
    </div>
    <div v-if="showDeleteCatSheet" class="sheet-overlay" @click="closeDeleteCatSheet">
      <div class="action-sheet" @click.stop>
        <p class="action-sheet-title">删除该分类会同时删除分类下所有照片，确定吗？</p>
        <div class="action-sheet-actions">
          <button type="button" class="sheet-btn sheet-cancel" @click="closeDeleteCatSheet">取消</button>
          <button type="button" class="sheet-btn sheet-danger" @click="confirmDeleteCategory">删除</button>
        </div>
      </div>
    </div>
    <div v-if="showDeletePhotoSheet" class="sheet-overlay" @click="closeDeletePhotoSheet">
      <div class="action-sheet" @click.stop>
        <p class="action-sheet-title">确定删除这张照片？</p>
        <div class="action-sheet-actions">
          <button type="button" class="sheet-btn sheet-cancel" @click="closeDeletePhotoSheet">取消</button>
          <button type="button" class="sheet-btn sheet-danger" @click="confirmDeletePhoto">删除</button>
        </div>
      </div>
    </div>
    <!-- 文生图：查看提示词 -->
    <div v-if="showPromptSheet" class="sheet-overlay" @click="showPromptSheet = false">
      <div class="action-sheet action-sheet-prompt" @click.stop>
        <p class="action-sheet-title">生成提示词</p>
        <div class="prompt-text">{{ promptSheetText || '（无提示词）' }}</div>
        <div class="action-sheet-actions">
          <button type="button" class="sheet-btn sheet-primary" @click="showPromptSheet = false">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { api, getImageUrl } from '../api'

const AI_DRAW_ID = 'ai-draw'
const categories = ref([])
const photos = ref([])
const allPhotosForCovers = ref([])
const aiListForCovers = ref([])
const showGallery = ref(false)
const currentCategory = ref(null)
const previewUrl = ref(null)
const showAddCategory = ref(false)
const newCategoryName = ref('')
const openCatMenuId = ref(null)
const openPhotoMenuId = ref(null)
const showEditSheet = ref(false)
const showDeleteCatSheet = ref(false)
const showDeletePhotoSheet = ref(false)
const editCategoryName = ref('')
const categoryToEdit = ref(null)
const categoryToDelete = ref(null)
const photoToDelete = ref(null) // { type: 'photo'|'ai', data }
const showPromptSheet = ref(false)
const promptSheetText = ref('')
const aiPrompt = ref('')
const aiLoading = ref(false)
const aiList = ref([])

const displayCategories = computed(() => {
  const list = [...categories.value]
  list.push({ id: AI_DRAW_ID, name: '文生图', isAiDraw: true })
  return list
})

function toggleCatMenu(id) {
  openCatMenuId.value = openCatMenuId.value === id ? null : id
  openPhotoMenuId.value = null
}
function togglePhotoMenu(id) {
  openPhotoMenuId.value = openPhotoMenuId.value === id ? null : id
  openCatMenuId.value = null
}

function imageUrl(url) {
  return getImageUrl(url)
}
function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false
  return /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url.toLowerCase())
}
function coverStyle(cat) {
  if (cat.isAiDraw) {
    const first = aiListForCovers.value[0]
    if (first?.url) return { backgroundImage: `url(${imageUrl(first.url)})` }
    return { background: 'linear-gradient(135deg, #e879f9, var(--pink-400))' }
  }
  const first = allPhotosForCovers.value.find(p => p.categoryId === cat.id)
  if (first?.url) return { backgroundImage: `url(${imageUrl(first.url)})` }
  return { background: 'linear-gradient(135deg, var(--pink-200), var(--pink-300))' }
}

async function loadCategories() {
  if (!api.getSpaceId()) {
    categories.value = []
    allPhotosForCovers.value = []
    aiListForCovers.value = []
    return
  }
  try {
    const res = await api.getPhotoCategories()
    categories.value = res?.data ?? []
    await Promise.all([loadAllPhotosForCovers(), loadAiListForCovers()])
  } catch {
    categories.value = []
    allPhotosForCovers.value = []
    await loadAiListForCovers()
  }
}
async function loadAiListForCovers() {
  try {
    const res = await api.getAiImageList()
    aiListForCovers.value = res?.data ?? []
  } catch {
    aiListForCovers.value = []
  }
}

async function loadAllPhotosForCovers() {
  if (!api.getSpaceId()) return
  try {
    const res = await api.getPhotosBySpace()
    allPhotosForCovers.value = res?.data ?? []
  } catch {
    allPhotosForCovers.value = []
  }
}

async function loadPhotos() {
  if (!currentCategory.value || currentCategory.value.isAiDraw) return
  try {
    const res = await api.getPhotosByCategory(currentCategory.value.id)
    photos.value = res?.data ?? []
  } catch {
    photos.value = []
  }
}

function openCategory(cat) {
  currentCategory.value = cat
  showGallery.value = true
  openCatMenuId.value = null
  if (cat.isAiDraw) loadAiList()
  else loadPhotos()
}
function backFromGallery() {
  showGallery.value = false
  currentCategory.value = null
}
watch(currentCategory, (cat) => {
  if (cat && !cat.isAiDraw) loadPhotos()
})
async function loadAiList() {
  try {
    const res = await api.getAiImageList()
    aiList.value = res?.data ?? []
  } catch {
    aiList.value = []
  }
}
async function generateAiImage() {
  const text = aiPrompt.value?.trim()
  if (!text) return
  aiLoading.value = true
  try {
    const res = await api.generateAiImage(text)
    if (res?.data) {
      aiList.value.unshift(res.data)
      aiListForCovers.value = [res.data, ...aiListForCovers.value]
      aiPrompt.value = ''
    } else {
      alert(res?.message || '生成失败')
    }
  } catch (err) {
    alert('生成失败：' + (err?.message || err))
  } finally {
    aiLoading.value = false
  }
}
function previewAi(url) {
  previewUrl.value = imageUrl(url)
}

function preview(p) {
  previewUrl.value = imageUrl(p?.url ?? p)
}
function openEditSheet(cat) {
  openCatMenuId.value = null
  categoryToEdit.value = cat
  editCategoryName.value = cat.name
  showEditSheet.value = true
}
function closeEditSheet() {
  showEditSheet.value = false
  categoryToEdit.value = null
}
function saveEditCategory() {
  const cat = categoryToEdit.value
  const name = editCategoryName.value?.trim()
  if (!name || !cat) return
  closeEditSheet()
  api.updatePhotoCategory(cat.id, { name }).then(loadCategories).catch(err => alert(err || '保存失败'))
}
function openDeleteCatSheet(cat) {
  openCatMenuId.value = null
  categoryToDelete.value = cat
  showDeleteCatSheet.value = true
}
function closeDeleteCatSheet() {
  showDeleteCatSheet.value = false
  categoryToDelete.value = null
}
function confirmDeleteCategory() {
  const cat = categoryToDelete.value
  if (!cat) return
  closeDeleteCatSheet()
  api.deletePhotoCategory(cat.id).then(() => { loadCategories(); backFromGallery() }).catch(err => alert(err || '删除失败'))
}
function showPromptSheetFor(item) {
  promptSheetText.value = item.prompt || ''
  showPromptSheet.value = true
}
function openDeletePhotoSheet(item) {
  const isAi = currentCategory.value?.isAiDraw
  photoToDelete.value = { type: isAi ? 'ai' : 'photo', data: item }
  showDeletePhotoSheet.value = true
}
function closeDeletePhotoSheet() {
  showDeletePhotoSheet.value = false
  photoToDelete.value = null
}
function confirmDeletePhoto() {
  const payload = photoToDelete.value
  if (!payload) return
  closeDeletePhotoSheet()
  if (payload.type === 'ai') {
    api.deleteAiImage(payload.data.id).then(() => {
      aiList.value = aiList.value.filter(x => x.id !== payload.data.id)
      aiListForCovers.value = aiListForCovers.value.filter(x => x.id !== payload.data.id)
    })
  } else {
    api.deletePhoto(payload.data.id).then(() => { loadPhotos(); loadAllPhotosForCovers() }).catch(err => alert(err || '删除失败'))
  }
}
function addCategory() {
  if (!newCategoryName.value.trim()) return
  const spaceId = api.getSpaceId()
  if (!spaceId) {
    alert('请先绑定空间')
    return
  }
  api.createPhotoCategory({
    spaceId,
    name: newCategoryName.value.trim(),
    sortOrder: categories.value.length
  }).then(() => { loadCategories(); showAddCategory.value = false; newCategoryName.value = '' }).catch(err => alert(err || '创建失败'))
}
async function onPhotoSelect(e) {
  const files = e.target.files
  if (!files?.length || !currentCategory.value || currentCategory.value.isAiDraw) return
  const spaceId = api.getSpaceId()
  if (!spaceId) {
    alert('请先绑定空间')
    e.target.value = ''
    return
  }
  try {
    for (const file of files) {
      const form = new FormData()
      form.append('file', file)
      form.append('categoryId', String(currentCategory.value.id))
      form.append('spaceId', String(spaceId))
      await api.uploadPhoto(form)
    }
    await loadPhotos()
    await loadAllPhotosForCovers()
  } catch (err) {
    alert('上传失败：' + (err?.message || err))
  }
  e.target.value = ''
}

onMounted(loadCategories)
</script>

<style scoped>
.photos-page { padding: 0.5rem 0; }
.page-title { font-size: 1.3rem; margin-bottom: 1rem; color: var(--pink-800); text-align: center; }
.categories { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; }
.category-card {
  background: rgba(255,255,255,0.9);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  position: relative;
}
.cat-cover { height: 100px; background-size: cover; background-position: center; }
.cat-name { display: block; padding: 0.6rem; text-align: center; font-weight: 600; color: var(--pink-800); }
.cat-actions { position: absolute; top: 6px; right: 6px; }
.cat-menu-wrap { position: relative; }
.cat-menu-wrap .menu-trigger {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  color: var(--pink-700);
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.cat-menu-wrap .menu-trigger:hover { background: #fff; transform: scale(1.08); }
.cat-menu-wrap .menu-dots { line-height: 1; font-weight: 700; }
.cat-menu-wrap .dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 4px;
  min-width: 88px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid rgba(236, 72, 153, 0.25);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  z-index: 160;
}
.cat-menu-wrap .dropdown-menu button {
  display: block;
  width: 100%;
  padding: 0.45rem 0.85rem;
  text-align: left;
  font-size: 0.85rem;
  color: var(--pink-800);
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.cat-menu-wrap .dropdown-menu button:hover { background: var(--pink-50); }
.cat-menu-wrap .dropdown-item-delete:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.dropdown-overlay { position: fixed; inset: 0; z-index: 150; }
.add-category {
  min-height: 120px;
  border: 2px dashed var(--pink-300);
  border-radius: var(--radius);
  background: rgba(255,255,255,0.5);
  color: var(--pink-600);
  font-size: 0.95rem;
}
.add-category:hover { background: var(--pink-50); }
.gallery-view { padding: 0.5rem 0; }
.back-btn { margin-bottom: 1rem; padding: 0.4rem 0.8rem; background: var(--pink-100); color: var(--pink-700); border-radius: var(--radius-sm); }
.gallery-title { margin-bottom: 1rem; color: var(--pink-800); }
.photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
.photo-item { position: relative; background: #fff; border-radius: var(--radius-sm); overflow: visible; box-shadow: var(--shadow); }
.photo-item .photo-media { width: 100%; aspect-ratio: 1; object-fit: cover; cursor: pointer; display: block; }
.preview-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 2.5rem 1rem 1rem; }
.preview-overlay .preview-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-overlay .preview-close:hover { background: rgba(0,0,0,0.8); }
.preview-overlay .preview-media { max-width: 100%; max-height: min(82vh, calc(100vh - 5rem)); object-fit: contain; }
.photo-desc { padding: 0.4rem 0.6rem; font-size: 0.85rem; color: var(--pink-700); }
.photo-menu-wrap { position: absolute; bottom: 0.4rem; right: 0.4rem; }
.photo-menu-wrap .menu-trigger {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.35);
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.photo-menu-wrap .menu-trigger:hover { background: rgba(0,0,0,0.5); transform: scale(1.08); }
.photo-menu-wrap .menu-dots { line-height: 1; font-weight: 700; }
.photo-menu-wrap .dropdown-menu {
  position: absolute;
  right: 0;
  bottom: 100%;
  margin-bottom: 4px;
  min-width: 88px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid rgba(236, 72, 153, 0.25);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  z-index: 160;
}
.photo-menu-wrap .dropdown-menu button {
  display: block;
  width: 100%;
  padding: 0.45rem 0.85rem;
  text-align: left;
  font-size: 0.85rem;
  color: var(--pink-800);
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.photo-menu-wrap .dropdown-menu button:hover { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.upload-area { margin-top: 1.5rem; text-align: center; }
.upload-btn { display: inline-block; padding: 0.6rem 1.2rem; background: var(--pink-500); color: #fff; border-radius: var(--radius-sm); cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal { background: #fff; padding: 1.5rem; border-radius: var(--radius); min-width: 260px; }
.modal h4 { margin-bottom: 1rem; color: var(--pink-800); }
.modal input { width: 100%; padding: 0.6rem; border: 1px solid var(--pink-200); border-radius: 8px; margin-bottom: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.modal-actions button { padding: 0.5rem 1rem; border-radius: 8px; background: var(--pink-100); color: var(--pink-700); }
.modal-actions .primary { background: var(--pink-500); color: #fff; }

/* 文生图内嵌 */
.ai-draw-inline { padding: 0.5rem 0; }
.ai-draw-inline .generate-box {
  background: rgba(255,255,255,0.95);
  border-radius: var(--radius);
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow);
}
.ai-draw-inline .generate-box textarea {
  width: 100%;
  padding: 0.65rem;
  border: 1px solid var(--pink-200);
  border-radius: var(--radius-sm);
  margin-bottom: 0.75rem;
  resize: vertical;
  font-size: 0.9rem;
}
.ai-draw-inline .btn-generate {
  width: 100%;
  padding: 0.6rem;
  background: linear-gradient(135deg, var(--pink-500), var(--pink-600));
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
}
.ai-draw-inline .btn-generate:disabled { opacity: 0.7; cursor: not-allowed; }

/* 手机风格底部操作栏 */
.sheet-overlay {
  position: fixed; inset: 0; z-index: 205;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 0 0 max(env(safe-area-inset-bottom), 0.5rem);
}
.action-sheet {
  width: 100%; max-width: 400px;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(236, 72, 153, 0.2);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
}
.action-sheet-title { margin: 0 0 1rem; color: var(--pink-800); font-size: 1rem; text-align: center; }
.sheet-input { width: 100%; padding: 0.6rem 0.85rem; border: 1px solid var(--pink-200); border-radius: 10px; margin-bottom: 1rem; font-size: 0.95rem; }
.action-sheet-actions { display: flex; gap: 0.75rem; }
.sheet-btn { flex: 1; padding: 0.65rem 1rem; border-radius: 12px; font-size: 0.95rem; cursor: pointer; border: 1px solid transparent; }
.sheet-cancel { background: var(--pink-50); color: var(--pink-700); border-color: rgba(236, 72, 153, 0.3); }
.sheet-primary { background: var(--pink-500); color: #fff; }
.sheet-danger { background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid #e0e0e0; }
.action-sheet-prompt .prompt-text {
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  background: var(--pink-50);
  border-radius: 12px;
  color: var(--pink-800);
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 40vh;
  overflow-y: auto;
}

@media (min-width: 600px) { .photo-grid { grid-template-columns: repeat(3, 1fr); } }
</style>
