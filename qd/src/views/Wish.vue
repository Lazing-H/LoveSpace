<template>
  <div class="wish-page">
    <h2 class="page-title">心愿清单</h2>
    <p class="hint">一起完成的小目标</p>
    <button class="btn-add" @click="showForm = true">添加心愿</button>

    <ul class="wish-list">
      <li v-for="w in wishes" :key="w.id" class="wish-item" :class="{ done: w.completed }">
        <label class="check-wrap">
          <input type="checkbox" :checked="w.completed === 1" @change="toggle(w)" />
          <span class="checkmark"></span>
        </label>
        <span class="wish-text">{{ w.content }}</span>
        <button class="btn-delete" @click="deleteWish(w)">删除</button>
      </li>
    </ul>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <h4>添加心愿</h4>
        <input v-model="newWish" placeholder="例如：一起看一次极光" />
        <div class="modal-actions">
          <button @click="showForm = false">取消</button>
          <button class="primary" @click="addWish">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const wishes = ref([])
const showForm = ref(false)
const newWish = ref('')

async function load() {
  if (!api.getSpaceId()) {
    wishes.value = []
    return
  }
  try {
    const res = await api.getWishes()
    wishes.value = res?.data ?? []
  } catch {
    wishes.value = []
  }
}
function addWish() {
  if (!newWish.value?.trim()) return
  if (!api.getSpaceId()) { alert('请先绑定空间'); return }
  api.createWish({ content: newWish.value.trim() }).then(() => { load(); showForm.value = false; newWish.value = '' }).catch(err => alert(err || '添加失败'))
}
function toggle(w) {
  api.toggleWish(w.id).then(res => { if (res?.data) w.completed = res.data.completed }).catch(() => {})
}
function deleteWish(w) {
  if (!confirm('确定删除？')) return
  api.deleteWish(w.id).then(load).catch(err => alert(err || '删除失败'))
}

onMounted(load)
</script>

<style scoped>
.wish-page { padding: 0.5rem 0; }
.page-title { font-size: 1.3rem; margin-bottom: 0.35rem; color: var(--pink-800); text-align: center; }
.hint { font-size: 0.9rem; color: var(--pink-600); text-align: center; margin-bottom: 1rem; }
.btn-add { display: block; margin: 0 auto 1.5rem; padding: 0.6rem 1.5rem; background: var(--pink-500); color: #fff; border-radius: var(--radius-sm); }
.wish-list { list-style: none; }
.wish-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255,255,255,0.9);
  border-radius: var(--radius-sm);
  margin-bottom: 0.75rem;
  box-shadow: var(--shadow);
}
.wish-item.done .wish-text { text-decoration: line-through; color: var(--pink-500); }
.check-wrap {
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}
.check-wrap input { position: absolute; opacity: 0; width: 24px; height: 24px; margin: 0; cursor: pointer; }
.checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 2px solid var(--pink-400);
  border-radius: 50%;
  background: #fff;
  box-sizing: border-box;
  transition: background 0.2s, border-color 0.2s;
}
.check-wrap input:checked + .checkmark {
  background: var(--pink-500);
  border-color: var(--pink-500);
}
.check-wrap input:checked + .checkmark::after {
  content: '✓';
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.wish-text { flex: 1; color: var(--pink-800); font-size: 1rem; line-height: 24px; min-height: 24px; display: flex; align-items: center; }
.btn-delete { padding: 0.35rem 0.7rem; background: var(--pink-100); color: var(--pink-700); border: 1px solid #e0e0e0; border-radius: 8px; font-size: 0.85rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.modal { background: #fff; padding: 1.5rem; border-radius: var(--radius); min-width: 280px; }
.modal input { width: 100%; padding: 0.6rem; border: 1px solid var(--pink-200); border-radius: 8px; margin-bottom: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
.modal-actions button { padding: 0.5rem 1rem; border-radius: 8px; background: var(--pink-100); color: var(--pink-700); }
.modal-actions .primary { background: var(--pink-500); color: #fff; }
</style>
