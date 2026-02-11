<template>
  <div class="home">
    <!-- 欢迎条：撑起顶部、全屏时不再显得空 -->
    <header class="welcome-bar" v-if="hasSpace && !showBind">
      <p class="welcome-text">欢迎回来，{{ user?.username || '我们' }}</p>
      <p class="welcome-sub">记录点滴，留住美好</p>
    </header>
    <header class="welcome-bar welcome-bar-bind" v-else-if="showBind">
      <p class="welcome-text">创建或加入空间</p>
      <p class="welcome-sub">和 TA 一起开启专属空间</p>
    </header>

    <div class="home-main">
    <section class="couple-card" :class="{ 'card-bind': showBind }">
      <template v-if="hasSpace && !showBind">
        <div class="couple-avatars">
          <label class="avatar-wrap">
            <input type="file" accept="image/*" class="avatar-input" @change="onMyAvatarChange" />
            <div class="avatar">
              <img v-if="myAvatar" :src="avatarUrl(myAvatar)" alt="" class="avatar-img" />
              <span v-else>我</span>
            </div>
          </label>
          <span class="hearts-between">♥ ♥</span>
          <div class="avatar">
            <img v-if="partner && partner.avatar" :src="avatarUrl(partner.avatar)" alt="" class="avatar-img" />
            <span v-else>TA</span>
          </div>
        </div>

        <!-- 未设置纪念日：仅日期选择 + 保存 -->
        <template v-if="!anniversary">
          <div class="date-set">
            <input v-model="anniversaryInput" type="date" class="input-date" />
            <button type="button" class="btn btn-save" @click="saveAnniversary" :disabled="!anniversaryInput || dateSaving">保存</button>
          </div>
          <p v-if="dateErr" class="bind-err">{{ dateErr }}</p>
        </template>
        <!-- 已设置纪念日：点击时长区域可修改日期 -->
        <template v-else>
          <p class="label">我们在一起已经</p>
          <button type="button" class="duration-block" @click="showDateEdit = true">
            <span class="duration gradient-glow">{{ durationText }}</span>
            <span class="days-sub">{{ daysTogether }} 天</span>
          </button>

          <!-- 续火花（双方都续才算一天） -->
          <div class="spark-block">
            <div class="spark-menu-wrap">
              <button type="button" class="spark-menu-btn" @click="showSparkMenu = !showSparkMenu" title="更多">⋮</button>
              <div v-if="showSparkMenu" class="spark-menu-dropdown">
                <button type="button" class="spark-menu-item" @click="openSparkCalendar(); showSparkMenu = false">📅 日历</button>
                <button type="button" class="spark-menu-item" @click="showSparkHelp = true; showSparkMenu = false">📋 说明</button>
              </div>
            </div>
            <div v-if="showSparkMenu" class="spark-menu-overlay" @click="showSparkMenu = false"></div>
            <div class="spark-display">
              <span v-if="sparkIconByTier[sparkDisplayTier]" class="spark-icon" :class="['tier-' + sparkDisplayTier, sparkDisplayBright ? 'spark-bright' : 'spark-dim']" :title="TIER_NAMES[sparkDisplayTier]">{{ sparkIconByTier[sparkDisplayTier] }}</span>
              <div class="spark-info">
                <span class="spark-days">已续 {{ sparkDisplayTotal }} 天</span>
                <span class="spark-level-name">{{ TIER_NAMES[sparkDisplayTier] }}</span>
              </div>
            </div>
            <button type="button" class="btn-spark" :disabled="sparkState.checkedInToday" @click="doSparkCheckin">
              {{ sparkButtonText }}
            </button>
            <p v-if="sparkSuccessTip" class="spark-success-tip">{{ sparkSuccessTip }}</p>
          </div>

          <!-- 说明与预览弹层：规则 + 各等级火苗预览 -->
          <div v-if="showSparkHelp" class="modal-overlay" @click.self="showSparkHelp = false">
            <div class="modal-date spark-help-modal" @click.stop>
              <h4 class="spark-help-title">续火规则说明</h4>
              <p class="spark-help-rules">双方都续火即续火成功。等级按连续天数划分，中断一天回退 1 级。</p>
              <h4 class="spark-help-title">各等级形态</h4>
              <div class="spark-help-gallery">
                <div v-for="tier in [1, 2, 3, 4, 5]" :key="tier" class="spark-help-level">
                  <span v-if="sparkIconByTier[tier]" class="spark-icon spark-bright" :class="'tier-' + tier">{{ sparkIconByTier[tier] }}</span>
                  <span class="spark-help-level-name">{{ TIER_NAMES[tier] }}</span>
                  <span class="spark-help-level-days">{{ tier === 1 ? '1–7 天' : tier === 2 ? '8–30 天' : tier === 3 ? '31–100 天' : tier === 4 ? '101–365 天' : '366 天以上' }}</span>
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-save" @click="showSparkHelp = false">关闭</button>
              </div>
            </div>
          </div>

          <!-- 续火日历弹层 -->
          <div v-if="showSparkCalendar" class="modal-overlay" @click.self="showSparkCalendar = false">
            <div class="modal-date spark-calendar-modal" @click.stop>
              <div class="spark-calendar-header">
                <button type="button" class="spark-calendar-prev" @click="sparkCalendarPrev">‹</button>
                <span class="spark-calendar-title">{{ sparkCalendarYear }}年{{ sparkCalendarMonth }}月</span>
                <button type="button" class="spark-calendar-next" @click="sparkCalendarNext">›</button>
              </div>
              <div class="spark-calendar-weekdays">
                <span v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</span>
              </div>
              <div class="spark-calendar-grid">
                <span v-for="d in sparkCalendarDays" :key="d.key" class="spark-calendar-day" :class="{ empty: d.empty, renewed: d.renewed }">
                  {{ d.empty ? '' : d.day }}
                </span>
              </div>
              <p class="spark-calendar-legend">标亮的日期为双方都续火</p>
              <div class="modal-actions">
                <button type="button" class="btn btn-save" @click="showSparkCalendar = false">关闭</button>
              </div>
            </div>
          </div>

          <!-- 修改个人信息（低调入口） -->
          <button type="button" class="link-profile" @click="openProfileEdit">修改个人信息</button>
        </template>

        <!-- 弹层：修改在一起日期 -->
        <div v-if="showDateEdit" class="modal-overlay" @click.self="showDateEdit = false">
          <div class="modal-date">
            <input v-model="anniversaryInput" type="date" class="input-date" />
            <div class="modal-actions">
              <button type="button" class="btn btn-cancel" @click="showDateEdit = false">取消</button>
              <button type="button" class="btn btn-save" @click="saveAnniversaryClose">保存</button>
            </div>
          </div>
        </div>

        <!-- 弹层：修改个人信息 -->
        <div v-if="showProfileEdit" class="modal-overlay" @click.self="showProfileEdit = false">
          <div class="modal-date modal-profile">
            <h4 class="modal-title">修改个人信息</h4>
            <label class="profile-avatar-wrap">
              <input type="file" accept="image/*" class="avatar-input" @change="onProfileAvatarChange" />
              <div class="profile-avatar">
                <img v-if="profileAvatar" :src="avatarUrl(profileAvatar)" alt="" />
                <span v-else>头像</span>
              </div>
              <span class="profile-avatar-hint">点击更换头像</span>
            </label>
            <div class="profile-row">
              <span class="profile-label">昵称</span>
              <input v-model="profileUsername" type="text" class="input-date profile-input" placeholder="输入昵称" maxlength="20" />
            </div>
            <div class="profile-row profile-gender-wrap">
              <span class="profile-label">性别</span>
              <div class="gender-dropdown profile-input">
                <button type="button" class="gender-trigger input-date" :class="{ open: showGenderOptions }" @click="showGenderOptions = !showGenderOptions">
                  {{ genderOptions.find(o => o.value === profileGender)?.label || '未设置' }}
                  <span class="gender-chevron">▼</span>
                </button>
                <div v-if="showGenderOptions" class="gender-options-overlay" @click="showGenderOptions = false"></div>
                <div v-if="showGenderOptions" class="gender-options">
                  <button v-for="opt in genderOptions" :key="opt.value" type="button" class="gender-option" :class="{ active: profileGender === opt.value }" @click="profileGender = opt.value; showGenderOptions = false">
                    {{ opt.label }}
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-cancel" @click="showProfileEdit = false">取消</button>
              <button type="button" class="btn btn-save" @click="saveProfile" :disabled="profileSaving">保存</button>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="showBind">
        <p class="bind-desc">你还没有空间。可自己设置绑定码创建空间（把绑定码告诉 TA），或输入 TA 的绑定码加入已有空间。</p>
        <div class="bind-actions">
          <div class="create-row">
            <input v-model="createKey" type="text" placeholder="绑定码 4～8 位（选填，不填则自动生成）" class="input-join" maxlength="8" />
            <button type="button" class="btn btn-create" @click="createSpace" :disabled="bindLoading">
              {{ createdKey ? `绑定码：${createdKey}，请告诉 TA` : '创建空间' }}
            </button>
          </div>
          <div class="join-row">
            <input v-model="joinKey" type="text" placeholder="输入 TA 的绑定码" class="input-join" maxlength="8" />
            <button type="button" class="btn btn-join" @click="joinSpace" :disabled="bindLoading">绑定</button>
          </div>
          <p v-if="bindErr" class="bind-err">{{ bindErr }}</p>
        </div>
      </template>
    </section>

    <section class="shortcuts" v-if="hasSpace">
      <router-link to="/photos" class="shortcut-card neon-card">
        <span class="shortcut-icon">📷</span>
        <span class="shortcut-title">相册</span>
        <span class="shortcut-desc">按分类存放我们的照片</span>
      </router-link>
      <router-link to="/diary" class="shortcut-card neon-card">
        <span class="shortcut-icon">📝</span>
        <span class="shortcut-title">恋爱日记</span>
        <span class="shortcut-desc">写下每一天的小确幸</span>
      </router-link>
      <router-link to="/milestone" class="shortcut-card neon-card">
        <span class="shortcut-icon">💕</span>
        <span class="shortcut-title">恋爱里程碑</span>
        <span class="shortcut-desc">重要日子与纪念</span>
      </router-link>
      <router-link to="/wish" class="shortcut-card neon-card">
        <span class="shortcut-icon">🌟</span>
        <span class="shortcut-title">心愿清单</span>
        <span class="shortcut-desc">一起完成的小目标</span>
      </router-link>
    </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { api, getImageUrl } from '../api'

const anniversary = ref(null)
const anniversaryInput = ref('')
const showDateEdit = ref(false)
const dateSaving = ref(false)
const dateErr = ref('')
const showBind = ref(false)
const bindLoading = ref(false)
const bindErr = ref('')
const createKey = ref('')
const createdKey = ref('')
const joinKey = ref('')
const myAvatar = ref('')
const partner = ref(null)
const hasSpace = ref(false)
const user = ref(null)
const sparkState = ref({ level: 0, consecutiveDays: 0, checkedInToday: false, partnerCheckedInToday: false })
const showProfileEdit = ref(false)
const profileUsername = ref('')
const profileAvatar = ref('')
const profileGender = ref(0)
const showGenderOptions = ref(false)
const profileSaving = ref(false)
const genderOptions = [
  { value: 0, label: '未设置' },
  { value: 1, label: '男' },
  { value: 2, label: '女' }
]

const TIER_NAMES = ['未续火', '烛火', '火苗', '火焰', '永恒之火', '小火人']
const sparkIconByTier = ['', '🕯️', '🔥', '🔥', '🔥', '🧸']

/** 按连续天数划分档位：7 天内烛火，30 天内火苗，100 天内火焰，1 年内永恒之火，2 年内小火人。返回 0–5 */
function daysToTier(days) {
  const n = Math.max(0, Math.floor(Number(days) || 0))
  if (n <= 0) return 0
  if (n <= 7) return 1
  if (n <= 30) return 2
  if (n <= 100) return 3
  if (n <= 365) return 4
  return 5
}

const sparkDisplayTotal = computed(() => sparkState.value.consecutiveDays || 0)
const sparkDisplayTier = computed(() => daysToTier(sparkDisplayTotal.value))
const sparkLevelName = computed(() => TIER_NAMES[daysToTier(sparkState.value.consecutiveDays || 0)])
function todayDateStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}
const sparkBothToday = computed(() => {
  const s = sparkState.value
  const me = s.checkedInToday === true
  const partner = s.partnerCheckedInToday === true
  const bothDoneToday = s.lastCheckinDate === todayDateStr() && (s.consecutiveDays || 0) > 0
  const partnerDone = partner || (me && bothDoneToday)
  return me && partnerDone
})
const sparkButtonText = computed(() => {
  const s = sparkState.value
  if (s.checkedInToday === true) return '今日已续火'
  const partnerDone = s.partnerCheckedInToday === true || (s.lastCheckinDate === todayDateStr() && (s.consecutiveDays || 0) > 0)
  return partnerDone ? '今日续火 · TA 已续' : '今日续火，提醒 TA'
})

const showSparkMenu = ref(false)
const showSparkHelp = ref(false)
const sparkDisplayBright = computed(() => sparkBothToday.value)

const showSparkCalendar = ref(false)
const sparkCalendarYear = ref(new Date().getFullYear())
const sparkCalendarMonth = ref(new Date().getMonth() + 1)
const sparkCalendarRenewedDates = ref([])
const sparkCalendarDays = computed(() => {
  const y = sparkCalendarYear.value
  const m = sparkCalendarMonth.value
  const first = new Date(y, m - 1, 1)
  const last = new Date(y, m, 0)
  const startPad = first.getDay()
  const daysInMonth = last.getDate()
  const renewedSet = new Set(sparkCalendarRenewedDates.value)
  const list = []
  for (let i = 0; i < startPad; i++) list.push({ key: 'pad-' + i, empty: true, day: 0, renewed: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0')
    list.push({ key: dateStr, empty: false, day: d, renewed: renewedSet.has(dateStr) })
  }
  return list
})
async function loadSparkCalendar() {
  const spaceId = api.getSpaceId()
  if (!spaceId) return
  try {
    const res = await api.getSparkCalendar(spaceId, sparkCalendarYear.value, sparkCalendarMonth.value)
    const raw = res?.data ?? []
    sparkCalendarRenewedDates.value = raw.map((d) => (typeof d === 'string' && d.length >= 10 ? d.slice(0, 10) : String(d)))
  } catch (_) {
    sparkCalendarRenewedDates.value = []
  }
}
function sparkCalendarPrev() {
  if (sparkCalendarMonth.value <= 1) {
    sparkCalendarYear.value--
    sparkCalendarMonth.value = 12
  } else {
    sparkCalendarMonth.value--
  }
  loadSparkCalendar()
}
function sparkCalendarNext() {
  if (sparkCalendarMonth.value >= 12) {
    sparkCalendarYear.value++
    sparkCalendarMonth.value = 1
  } else {
    sparkCalendarMonth.value++
  }
  loadSparkCalendar()
}
function openSparkCalendar() {
  const d = new Date()
  sparkCalendarYear.value = d.getFullYear()
  sparkCalendarMonth.value = d.getMonth() + 1
  showSparkCalendar.value = true
  loadSparkCalendar()
}

function avatarUrl(url) {
  return getImageUrl(url)
}

async function loadSpark() {
  const spaceId = api.getSpaceId()
  if (!spaceId) return
  try {
    const res = await api.getSparkState(spaceId)
    if (res?.data) sparkState.value = { ...sparkState.value, ...res.data }
  } catch (_) {}
}

const sparkSuccessTip = ref('')
let sparkSuccessTimer = null
async function doSparkCheckin() {
  const spaceId = api.getSpaceId()
  if (!spaceId || sparkState.value.checkedInToday) return
  try {
    const res = await api.sparkCheckin(spaceId)
    if (res?.data) {
      sparkState.value = { ...sparkState.value, ...res.data }
      sparkSuccessTip.value = res.data.partnerCheckedInToday
        ? '今日双方已续火，火苗 +1～'
        : '续火成功！记得提醒 TA 也来续火哦～'
      if (sparkSuccessTimer) clearTimeout(sparkSuccessTimer)
      sparkSuccessTimer = setTimeout(() => {
        sparkSuccessTip.value = ''
        sparkSuccessTimer = null
      }, 4000)
    }
  } catch (err) {
    alert(err || '续火失败')
  }
}

function openProfileEdit() {
  profileUsername.value = user.value?.username || ''
  profileAvatar.value = myAvatar.value || ''
  profileGender.value = user.value?.gender ?? 0
  showGenderOptions.value = false
  showProfileEdit.value = true
}

async function saveProfile() {
  const name = profileUsername.value?.trim()
  if (!name) {
    alert('请输入昵称')
    return
  }
  profileSaving.value = true
  try {
    const res = await api.updateProfile({ username: name, gender: profileGender.value })
    if (res?.data) {
      user.value = { ...user.value, username: res.data.username, avatar: res.data.avatar, gender: res.data.gender }
      if (res.data.avatar) myAvatar.value = res.data.avatar
      showProfileEdit.value = false
    }
  } catch (err) {
    alert(err || '保存失败')
  } finally {
    profileSaving.value = false
  }
}

function onProfileAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  e.target.value = ''
  api.uploadAvatar(file).then((res) => {
    if (res?.data?.avatar) {
      profileAvatar.value = res.data.avatar
      myAvatar.value = res.data.avatar
    }
  }).catch((err) => alert(err || '上传失败'))
}

const daysTogether = computed(() => {
  if (!anniversary.value) return 0
  const start = new Date(anniversary.value)
  const now = new Date()
  return Math.floor((now - start) / (24 * 60 * 60 * 1000))
})

function getDurationParts() {
  const total = daysTogether.value
  if (total <= 0) return { years: 0, months: 0, days: 0 }
  const years = Math.floor(total / 365)
  const rest = total % 365
  const months = Math.floor(rest / 30)
  const days = rest % 30
  return { years, months, days }
}

const durationText = computed(() => {
  const { years, months, days } = getDurationParts()
  const parts = []
  if (years > 0) parts.push(years + ' 年')
  if (months > 0) parts.push(months + ' 月')
  parts.push(days + ' 天')
  return parts.join(' ') || '0 天'
})

async function loadSpaceAndPartner() {
  try {
    const [spaceRes, partnerRes] = await Promise.all([api.getDefaultSpace(), api.getPartner()])
    if (spaceRes?.data?.id) {
      api.setSpaceId(spaceRes.data.id)
      hasSpace.value = true
      if (spaceRes.data.anniversaryDate) {
        anniversary.value = spaceRes.data.anniversaryDate
        anniversaryInput.value = spaceRes.data.anniversaryDate
      }
      partner.value = partnerRes?.data ?? null
    } else {
      hasSpace.value = false
      partner.value = null
      api.setSpaceId(null)
    }
  } catch (_) {
    hasSpace.value = false
    partner.value = null
  }
}

async function loadMe() {
  try {
    const res = await api.me()
    if (res?.data) {
      if (res.data.avatar) myAvatar.value = res.data.avatar
      user.value = res.data
    }
  } catch (_) {}
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    await loadSpaceAndPartner()
    await loadMe()
    if (hasSpace.value && anniversary.value) loadSpark()
  } finally {
    if (!hasSpace.value) showBind.value = true
  }
})

watch([hasSpace, anniversary], () => {
  if (hasSpace.value && anniversary.value) loadSpark()
})

async function onMyAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  e.target.value = ''
  try {
    const res = await api.uploadAvatar(file)
    if (res?.data?.avatar) {
      myAvatar.value = res.data.avatar
      window.dispatchEvent(new Event('auth-change'))
    }
  } catch (err) {
    alert(err || '上传失败')
  }
}

function saveAnniversary() {
  dateErr.value = ''
  if (!anniversaryInput.value) return
  dateSaving.value = true
  api.updateAnniversary(anniversaryInput.value).then((res) => {
    if (res?.data?.anniversaryDate) {
      anniversary.value = res.data.anniversaryDate
      anniversaryInput.value = res.data.anniversaryDate
    }
    dateSaving.value = false
  }).catch((e) => {
    dateErr.value = e || '保存失败'
    dateSaving.value = false
  })
}

function saveAnniversaryClose() {
  dateErr.value = ''
  if (!anniversaryInput.value) return
  dateSaving.value = true
  api.updateAnniversary(anniversaryInput.value).then((res) => {
    if (res?.data?.anniversaryDate) {
      anniversary.value = res.data.anniversaryDate
      anniversaryInput.value = res.data.anniversaryDate
      showDateEdit.value = false
    }
    dateSaving.value = false
  }).catch((e) => {
    dateErr.value = e || '保存失败'
    dateSaving.value = false
  })
}

async function createSpace() {
  bindErr.value = ''
  const raw = createKey.value?.trim() ?? ''
  const key = raw.toUpperCase()
  if (key.length > 0 && (key.length < 4 || key.length > 8)) {
    bindErr.value = '绑定码须 4～8 位，或留空由系统生成'
    return
  }
  bindLoading.value = true
  try {
    const res = await api.createSpace(key.length >= 4 ? key : null)
    if (res?.data?.id) {
      createdKey.value = res.data.coupleKey || ''
      hasSpace.value = true
      showBind.value = false
      api.setSpaceId(res.data.id)
      await loadSpaceAndPartner()
    } else {
      bindErr.value = '创建成功但未返回空间信息，请刷新重试'
    }
  } catch (e) {
    bindErr.value = e || '创建失败'
  } finally {
    bindLoading.value = false
  }
}

async function joinSpace() {
  bindErr.value = ''
  const key = joinKey.value?.trim().toUpperCase()
  if (!key) {
    bindErr.value = '请输入绑定码'
    return
  }
  if (key.length < 4 || key.length > 8) {
    bindErr.value = '绑定码为 4～8 位'
    return
  }
  bindLoading.value = true
  try {
    await api.joinSpace(key)
    joinKey.value = ''
    showBind.value = false
    await loadSpaceAndPartner()
  } catch (e) {
    bindErr.value = e || '绑定失败'
  } finally {
    bindLoading.value = false
  }
}
</script>

<style scoped>
.home {
  padding: 0.5rem 0;
  position: relative;
  z-index: 1;
}

/* 欢迎条 */
.welcome-bar {
  text-align: center;
  padding: 1.25rem 1rem;
  margin-bottom: 1rem;
}
.welcome-text {
  margin: 0 0 0.35rem;
  font-size: 1.25rem;
  font-weight: 600;
  background: linear-gradient(135deg, var(--rose-200), var(--pink-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.4));
}
.welcome-sub {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
}
.welcome-bar-bind .welcome-text { font-size: 1.15rem; }

/* 网页端：全屏撑满 + 欢迎条 + 卡片区居中 */
@media (min-width: 768px) {
  .home {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 100px);
    max-width: 100%;
    padding: 0 1rem 2rem;
    box-sizing: border-box;
  }
  .home .welcome-bar {
    flex: 0 0 auto;
    padding: 2.5rem 1rem 2rem;
    min-height: 100px;
    margin-bottom: 0;
  }
  .home .welcome-bar .welcome-text { font-size: 1.6rem; }
  .home .welcome-bar .welcome-sub { font-size: 1rem; letter-spacing: 0.12em; }
  .home .home-main {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(360px, 420px) minmax(380px, 480px);
    gap: 2.5rem;
    align-content: center;
    justify-content: center;
    max-width: 100%;
    margin: 0 auto;
  }
  .home .couple-card {
    margin: 0;
    max-width: none;
    padding: 2.5rem 2rem;
  }
  .home .couple-card .avatar { width: 80px; height: 80px; font-size: 1.4rem; }
  .home .couple-card .hearts-between { font-size: 1.25rem; }
  .home .couple-card .duration { font-size: 2.1rem; }
  .home .couple-card .days-sub { font-size: 1rem; }
  .home .shortcuts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin: 0;
    align-content: center;
  }
  .home .shortcut-card {
    min-height: 160px;
    padding: 1.75rem 1.25rem;
  }
  .home .shortcut-card .shortcut-icon { font-size: 2.5rem; margin-bottom: 0.65rem; }
  .home .shortcut-card .shortcut-title { font-size: 1.15rem; margin-bottom: 0.35rem; }
  .home .shortcut-card .shortcut-desc { font-size: 0.9rem; }
}

@media (min-width: 1100px) {
  .home { min-height: calc(100vh - 110px); }
  .home .welcome-bar { padding: 3rem 1rem 2.5rem; min-height: 110px; }
  .home .welcome-bar .welcome-text { font-size: 1.75rem; }
  .home .home-main {
    grid-template-columns: 440px 520px;
    gap: 3rem;
  }
  .home .couple-card { padding: 3rem 2.25rem; }
  .home .couple-card .avatar { width: 88px; height: 88px; font-size: 1.5rem; }
  .home .couple-card .duration { font-size: 2.35rem; }
  .home .shortcuts { gap: 1.75rem; }
  .home .shortcut-card {
    min-height: 180px;
    padding: 2rem 1.5rem;
  }
  .home .shortcut-card .shortcut-icon { font-size: 2.75rem; }
  .home .shortcut-card .shortcut-title { font-size: 1.2rem; }
  .home .shortcut-card .shortcut-desc { font-size: 0.95rem; }
}

.couple-card {
  max-width: 420px;
  margin: 0 auto 2rem;
  padding: 2rem 1.5rem;
  background: rgba(28, 20, 45, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(236, 72, 153, 0.25);
  box-shadow: 0 0 30px rgba(236, 72, 153, 0.2), 0 0 60px rgba(139, 92, 246, 0.08);
  text-align: center;
  animation: card-glow-pulse 4s ease-in-out infinite;
}
@keyframes card-glow-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.2), 0 0 60px rgba(139, 92, 246, 0.08); border-color: rgba(236, 72, 153, 0.25); }
  50% { box-shadow: 0 0 45px rgba(236, 72, 153, 0.35), 0 0 80px rgba(139, 92, 246, 0.15); border-color: rgba(236, 72, 153, 0.4); }
}
.couple-card.card-bind { padding: 1.75rem 1.5rem; }

.couple-avatars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}
.avatar-input { display: none; }
.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.5), rgba(139, 92, 246, 0.4));
  border: 2px solid rgba(236, 72, 153, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--text);
  font-weight: 600;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
  animation: avatar-ring 3s ease-in-out infinite;
  overflow: hidden;
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
@keyframes avatar-ring {
  0%, 100% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.3); border-color: rgba(236, 72, 153, 0.5); }
  50% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.5), 0 0 15px rgba(139, 92, 246, 0.4); border-color: rgba(236, 72, 153, 0.7); }
}
.hearts-between {
  color: #ec4899;
  font-size: 1.1rem;
  letter-spacing: 0.2em;
  filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.6));
  animation: heart-beat 1.2s ease-in-out infinite;
}
@keyframes heart-beat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.6)); }
  50% { transform: scale(1.15); filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.9)); }
}

.label { font-size: 0.95rem; color: rgba(252, 231, 243, 0.9); margin-bottom: 0.5rem; }
.date-set { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; align-items: center; margin-bottom: 0.5rem; }
.input-date {
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  color: var(--text);
  font-size: 1rem;
}
.input-date:focus { outline: none; border-color: var(--pink-500); }
.duration {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 0.35rem;
  background: linear-gradient(135deg, var(--rose-300), var(--pink-500), #e879f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.5));
  animation: duration-glow 3s ease-in-out infinite;
}
@keyframes duration-glow {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(236, 72, 153, 0.5)); }
  50% { filter: drop-shadow(0 0 30px rgba(236, 72, 153, 0.8)) drop-shadow(0 0 40px rgba(139, 92, 246, 0.3)); }
}
.days-sub { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.25rem; }
.duration-block {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: block;
  text-align: center;
  width: 100%;
}
.duration-block .duration { display: block; }
.duration-block .days-sub { display: block; }

/* 续火花 */
.spark-block {
  margin-top: 1.25rem;
  padding: 1rem;
  background: rgba(255,255,255,0.06);
  border-radius: 16px;
  border: 1px solid rgba(236, 72, 153, 0.2);
}
.spark-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.spark-icons-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.15em;
}
.spark-icon {
  font-size: 2.5rem;
  line-height: 1;
  filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.5));
  transition: opacity 0.3s, filter 0.3s;
}
.spark-icon.tier-0 { font-size: 1.75rem; }
.spark-icon.tier-1 { font-size: 1.85rem; }
.spark-icon.tier-2 { font-size: 2rem; }
.spark-icon.tier-3 { font-size: 2.25rem; }
.spark-icon.tier-4 { font-size: 2.6rem; }
.spark-icon.tier-5 { font-size: 2.6rem; }
.spark-icon.spark-dim {
  opacity: 0.45;
  filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.25)) grayscale(0.25);
}
.spark-icon.spark-bright {
  opacity: 1;
  filter: drop-shadow(0 0 14px rgba(236, 72, 153, 0.6)) drop-shadow(0 0 8px rgba(255, 140, 0, 0.4));
}
.spark-icon.spark-bright.tier-0 { filter: drop-shadow(0 0 8px rgba(255, 200, 120, 0.55)) drop-shadow(0 0 4px rgba(255, 180, 100, 0.4)); }
.spark-icon.spark-bright.tier-1 { filter: drop-shadow(0 0 10px rgba(255, 160, 60, 0.55)) drop-shadow(0 0 6px rgba(255, 180, 80, 0.4)); }
.spark-icon.spark-bright.tier-2 { filter: drop-shadow(0 0 12px rgba(255, 140, 50, 0.6)) drop-shadow(0 0 8px rgba(255, 180, 80, 0.45)); }
.spark-icon.spark-bright.tier-3 { filter: drop-shadow(0 0 20px rgba(255, 60, 20, 0.75)) drop-shadow(0 0 16px rgba(236, 72, 153, 0.5)); }
.spark-icon.spark-bright.tier-4 { filter: drop-shadow(0 0 20px rgba(255, 60, 20, 0.75)) drop-shadow(0 0 16px rgba(236, 72, 153, 0.5)); }
.spark-icon.spark-bright.tier-5 { filter: drop-shadow(0 0 18px rgba(255, 140, 50, 0.8)) drop-shadow(0 0 12px rgba(255, 180, 80, 0.5)); }
.spark-info { text-align: left; }
.spark-days { display: block; font-size: 1rem; color: var(--text); font-weight: 600; }
.spark-level-name { font-size: 0.85rem; color: var(--text-muted); }
.spark-block { position: relative; }
.spark-menu-wrap { position: absolute; top: 0.5rem; right: 0.5rem; z-index: 2; }
.spark-menu-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  color: var(--text-muted);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.spark-menu-btn:hover { background: rgba(236, 72, 153, 0.25); color: var(--pink-400); }
.spark-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 2px;
  min-width: 90px;
  padding: 3px 0;
  border-radius: 10px;
  background: var(--card-bg);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.spark-menu-item {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text);
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
}
.spark-menu-item:hover { background: rgba(236, 72, 153, 0.2); }
.spark-menu-overlay { position: fixed; inset: 0; z-index: 1; }
.spark-help-modal { min-width: 320px; max-width: 90vw; }
.spark-help-title { margin: 0 0 0.5rem; font-size: 1rem; color: var(--text); }
.spark-help-rules { margin: 0 0 1.25rem; font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; }
.spark-help-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-bottom: 1rem;
  justify-content: center;
}
.spark-help-level {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}
.spark-help-level .spark-icon { margin: 0; }
.spark-help-level-name { font-size: 0.8rem; color: var(--text-muted); display: block; }
.spark-help-level-days { font-size: 0.75rem; color: var(--text-muted); opacity: 0.9; }
.spark-calendar-modal { min-width: 300px; }
.spark-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.spark-calendar-prev, .spark-calendar-next {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  color: var(--text);
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}
.spark-calendar-prev:hover, .spark-calendar-next:hover { background: rgba(236, 72, 153, 0.3); }
.spark-calendar-title { font-size: 1rem; color: var(--text); }
.spark-calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
}
.spark-calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 0.75rem;
}
.spark-calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: var(--text);
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
}
.spark-calendar-day.empty { background: transparent; }
.spark-calendar-day.renewed { background: rgba(236, 72, 153, 0.35); color: var(--white); }
.spark-calendar-legend { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem; text-align: center; }
.btn-spark {
  width: 100%;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.95rem;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(219, 39, 119, 0.5));
  color: var(--text);
  border: 1px solid rgba(236, 72, 153, 0.4);
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}
.btn-spark:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.6), rgba(219, 39, 119, 0.7));
}
.btn-spark:disabled { opacity: 0.7; cursor: default; }
.spark-success-tip {
  margin: 0.75rem 0 0;
  font-size: 0.9rem;
  color: var(--pink-300);
  text-align: center;
  animation: spark-tip-in 0.3s ease;
}
@keyframes spark-tip-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.link-profile {
  margin-top: 1rem;
  padding: 0;
  background: none;
  border: none;
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: color 0.2s;
}
.link-profile:hover { color: var(--pink-400); }

.modal-profile .modal-title { margin-bottom: 1rem; }
.profile-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
  cursor: pointer;
}
.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: 2px solid rgba(236, 72, 153, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 1rem;
  color: var(--text-muted);
}
.profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-avatar-hint { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; }
.profile-field { display: block; margin-bottom: 1rem; }
.profile-label { display: block; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.35rem; }
.profile-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.profile-row .profile-label {
  flex-shrink: 0;
  width: 4em;
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-bottom: 0;
}
.profile-row .profile-input { flex: 1; min-width: 0; }
.profile-row .input-date { width: 100%; }
.profile-field { display: block; margin-bottom: 1rem; }
.profile-label { display: block; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.35rem; }
.profile-field .input-date { width: 100%; }
.profile-gender-wrap { position: relative; }
.gender-dropdown { position: relative; width: 100%; min-width: 0; }
.gender-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
}
.gender-trigger .gender-chevron {
  font-size: 0.65rem;
  opacity: 0.8;
  transition: transform 0.2s;
}
.gender-trigger.open .gender-chevron { transform: rotate(180deg); }
.gender-options-overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
}
.gender-options {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  z-index: 11;
  border-radius: 12px;
  border: 1px solid rgba(236, 72, 153, 0.35);
  background: rgba(28, 20, 45, 0.98);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(236, 72, 153, 0.15);
  overflow: hidden;
}
.gender-option {
  display: block;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 1rem;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.gender-option:hover {
  background: rgba(236, 72, 153, 0.2);
  color: var(--pink-200);
}
.gender-option.active {
  background: rgba(236, 72, 153, 0.35);
  color: var(--white);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-date {
  background: rgba(28, 20, 45, 0.95);
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  min-width: 260px;
}
.modal-title { margin-bottom: 1rem; color: var(--text); }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }
.btn-cancel {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.1);
  color: var(--text);
  border: 1px solid rgba(236, 72, 153, 0.3);
}
.btn-save { padding: 0.5rem 1rem; border-radius: 12px; background: linear-gradient(135deg, var(--pink-500), var(--pink-600)); color: #fff; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.bind-desc { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem; }
.bind-actions { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
.btn {
  padding: 0.65rem 1.4rem;
  border-radius: 999px;
  font-size: 0.95rem;
  background: linear-gradient(135deg, var(--pink-500), var(--pink-600));
  color: var(--white);
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 24px rgba(236, 72, 153, 0.45);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn:hover:not(:disabled) {
  transform: scale(1.03);
  box-shadow: 0 6px 30px rgba(236, 72, 153, 0.55);
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.create-row, .join-row { display: flex; gap: 0.5rem; align-items: center; }
.create-row .input-join { width: 200px; }
.input-join {
  width: 140px;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  color: var(--text);
  font-size: 1rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.input-join:focus { border-color: var(--pink-500); box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.2); outline: none; }
.bind-err { color: #f87171; font-size: 0.9rem; }

.shortcuts {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}
.shortcut-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
  min-height: 120px;
  background: rgba(28, 20, 45, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(236, 72, 153, 0.2);
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.15);
  text-decoration: none;
  color: var(--text);
  transition: all 0.35s ease;
  animation: shortcut-in 0.6s ease-out backwards;
}
.shortcut-card:nth-child(1) { animation-delay: 0.05s; }
.shortcut-card:nth-child(2) { animation-delay: 0.1s; }
.shortcut-card:nth-child(3) { animation-delay: 0.15s; }
.shortcut-card:nth-child(4) { animation-delay: 0.2s; }
@keyframes shortcut-in {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.shortcut-card:hover {
  border-color: rgba(236, 72, 153, 0.7);
  box-shadow: 0 0 35px rgba(236, 72, 153, 0.45), 0 0 60px rgba(139, 92, 246, 0.2);
  transform: translateY(-6px) scale(1.02);
}
.shortcut-card:hover .shortcut-icon {
  transform: scale(1.15);
  filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.6));
}
.shortcut-icon { font-size: 2rem; margin-bottom: 0.5rem; transition: transform 0.3s ease, filter 0.3s ease; }
.shortcut-title { font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem; color: var(--pink-200); }
.shortcut-desc { font-size: 0.8rem; color: var(--text-muted); }

@media (min-width: 600px) and (max-width: 767px) {
  .shortcuts { grid-template-columns: repeat(2, 1fr); }
}
</style>
