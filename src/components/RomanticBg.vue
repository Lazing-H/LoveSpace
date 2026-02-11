<template>
  <div class="romantic-bg" aria-hidden="true">
    <!-- 科技感：缓慢流动的渐变光带 -->
    <div class="aurora"></div>
    <!-- 科技感：极淡网格 + 扫描线 -->
    <div class="grid-overlay"></div>
    <div class="scanline"></div>

    <div class="stars stars-1"></div>
    <div class="stars stars-2"></div>
    <div class="stars stars-3"></div>

    <!-- 浪漫：漂浮闪光点 -->
    <span v-for="(s, i) in sparkles" :key="'spark-' + i" class="sparkle" :style="sparkleStyle(s)"></span>

    <!-- 大号模糊爱心：满屏分布，大小不一，原位浮动 -->
    <div
      v-for="(h, i) in largeHearts"
      :key="'blur-' + i"
      class="heart-wrap heart-blur"
      :style="heartStyle(h)"
    >
      <span class="heart-char">♥</span>
    </div>

    <!-- 粒子爱心：满屏分布，原位呼吸 -->
    <div
      v-for="(ph, i) in particleHearts"
      :key="'particle-' + i"
      class="heart-wrap particle-heart"
      :style="particleHeartStyle(ph)"
    >
      <span
        v-for="(pt, j) in heartPoints"
        :key="j"
        class="dot"
        :style="{ left: pt[0] + '%', top: pt[1] + '%', animationDelay: (j * 0.05 + ph.delay) + 's' }"
      ></span>
    </div>

    <!-- 小爱心符号：满屏分布，大小不一，原位发光浮动 -->
    <div
      v-for="(s, i) in smallHearts"
      :key="'small-' + i"
      class="heart-wrap heart-symbol"
      :style="smallHeartStyle(s)"
    >
      ♥
    </div>

    <!-- 不规则光晕：满屏分布，原位呼吸 -->
    <div
      v-for="(b, i) in blobs"
      :key="'blob-' + i"
      class="heart-wrap blob"
      :style="blobStyle(b)"
    ></div>
  </div>
</template>

<script setup>
// 大模糊爱心：left/top 满屏分布，size 差异大
const largeHearts = [
  { left: 5, top: 8, size: 220, opacity: 0.16, blur: 32, delay: 0 },
  { left: 28, top: 55, size: 120, opacity: 0.22, blur: 20, delay: 1 },
  { left: 52, top: 25, size: 180, opacity: 0.14, blur: 28, delay: 2 },
  { left: 75, top: 70, size: 95, opacity: 0.24, blur: 18, delay: 0.5 },
  { left: 88, top: 40, size: 150, opacity: 0.18, blur: 24, delay: 1.5 },
  { left: 15, top: 78, size: 160, opacity: 0.12, blur: 30, delay: 3 },
  { left: 62, top: 12, size: 80, opacity: 0.28, blur: 16, delay: 2.5 },
  { left: 40, top: 88, size: 130, opacity: 0.2, blur: 22, delay: 1 },
]

const heartPoints = [
  [50, 15], [35, 28], [65, 28], [25, 48], [75, 48], [18, 68], [82, 68], [50, 92],
  [40, 52], [60, 52], [32, 38], [68, 38], [42, 62], [58, 62], [50, 72],
]
const particleHearts = [
  { left: 12, top: 20, size: 36, opacity: 0.5, delay: 0 },
  { left: 48, top: 60, size: 52, opacity: 0.4, delay: 1 },
  { left: 85, top: 35, size: 42, opacity: 0.45, delay: 2 },
  { left: 22, top: 75, size: 28, opacity: 0.55, delay: 0.5 },
  { left: 70, top: 15, size: 46, opacity: 0.42, delay: 1.5 },
]

// 小爱心：满屏分布，大小不一（10px～26px）
const smallHearts = [
  { left: 8, top: 15, size: 22, opacity: 0.55, delay: 0 },
  { left: 32, top: 45, size: 14, opacity: 0.65, delay: 0.8 },
  { left: 55, top: 8, size: 26, opacity: 0.5, delay: 0.3 },
  { left: 78, top: 62, size: 18, opacity: 0.6, delay: 1.2 },
  { left: 92, top: 30, size: 12, opacity: 0.7, delay: 0.5 },
  { left: 18, top: 82, size: 20, opacity: 0.52, delay: 1 },
  { left: 42, top: 28, size: 16, opacity: 0.58, delay: 0.2 },
  { left: 68, top: 85, size: 24, opacity: 0.48, delay: 1.5 },
]

const blobs = [
  { left: 25, top: 35, size: 140, opacity: 0.14, delay: 0 },
  { left: 58, top: 72, size: 90, opacity: 0.18, delay: 2 },
  { left: 82, top: 18, size: 110, opacity: 0.12, delay: 1 },
]

// 漂浮闪光点（浪漫 + 科技）
const sparkles = [
  { left: 10, top: 20, size: 3, delay: 0 },
  { left: 35, top: 60, size: 2, delay: 0.5 },
  { left: 60, top: 15, size: 4, delay: 1 },
  { left: 85, top: 50, size: 2, delay: 1.5 },
  { left: 20, top: 80, size: 3, delay: 0.8 },
  { left: 75, top: 30, size: 2, delay: 2 },
  { left: 45, top: 40, size: 3, delay: 0.3 },
  { left: 92, top: 75, size: 2, delay: 1.2 },
  { left: 5, top: 55, size: 4, delay: 2.2 },
  { left: 50, top: 90, size: 2, delay: 0.6 },
]
function sparkleStyle(s) {
  return {
    left: s.left + '%',
    top: s.top + '%',
    width: s.size + 'px',
    height: s.size + 'px',
    animationDelay: s.delay + 's',
  }
}

function heartStyle(h) {
  return {
    left: h.left + '%',
    top: h.top + '%',
    width: h.size + 'px',
    height: h.size + 'px',
    opacity: h.opacity,
    filter: `blur(${h.blur}px)`,
    animationDelay: h.delay + 's',
  }
}

function particleHeartStyle(ph) {
  return {
    left: ph.left + '%',
    top: ph.top + '%',
    width: ph.size + 'px',
    height: ph.size + 'px',
    opacity: ph.opacity,
    animationDelay: ph.delay + 's',
  }
}

function smallHeartStyle(s) {
  return {
    left: s.left + '%',
    top: s.top + '%',
    fontSize: s.size + 'px',
    opacity: s.opacity,
    animationDelay: s.delay + 's',
  }
}

function blobStyle(b) {
  return {
    left: b.left + '%',
    top: b.top + '%',
    width: b.size + 'px',
    height: b.size + 'px',
    opacity: b.opacity,
    animationDelay: b.delay + 's',
  }
}
</script>

<style scoped>
.romantic-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

/* 科技感：流动渐变光带（浪漫粉紫） */
.aurora {
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 180deg at 50% 50%,
    transparent 0deg,
    rgba(236, 72, 153, 0.08) 60deg,
    rgba(139, 92, 246, 0.06) 120deg,
    rgba(34, 211, 238, 0.04) 180deg,
    rgba(236, 72, 153, 0.06) 240deg,
    transparent 300deg
  );
  animation: aurora-spin 25s linear infinite;
}
@keyframes aurora-spin {
  to { transform: rotate(360deg); }
}

/* 科技感：极淡网格 */
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(236, 72, 153, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(236, 72, 153, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: grid-pulse 8s ease-in-out infinite;
}
@keyframes grid-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 科技感：扫描线 */
.scanline {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(236, 72, 153, 0.02) 50%,
    transparent 100%
  );
  background-size: 100% 8px;
  animation: scan 4s linear infinite;
  pointer-events: none;
}
@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* 浪漫：闪光点 */
.sparkle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 10px rgba(252, 231, 243, 0.8), 0 0 20px rgba(236, 72, 153, 0.4);
  animation: sparkle-twinkle 3s ease-in-out infinite;
  transform: translate(-50%, -50%);
}
@keyframes sparkle-twinkle {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
}

.stars {
  position: absolute;
  inset: 0;
  background-repeat: repeat;
}

.stars-1 {
  background-image:
    radial-gradient(2px 2px at 30px 40px, rgba(255,255,255,0.9), transparent),
    radial-gradient(2px 2px at 80px 120px, rgba(255,255,255,0.7), transparent),
    radial-gradient(1.5px 1.5px at 150px 60px, rgba(254,205,211,0.8), transparent),
    radial-gradient(2px 2px at 200px 180px, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 50px 200px, rgba(252,231,243,0.7), transparent);
  background-size: 220px 220px;
  animation: twinkle 4s ease-in-out infinite;
}

.stars-2 {
  background-image:
    radial-gradient(1.5px 1.5px at 60px 80px, rgba(255,255,255,0.8), transparent),
    radial-gradient(2px 2px at 120px 30px, rgba(252,231,243,0.75), transparent),
    radial-gradient(2px 2px at 180px 150px, rgba(255,255,255,0.65), transparent),
    radial-gradient(1.5px 1.5px at 20px 160px, rgba(255,255,255,0.7), transparent);
  background-size: 200px 200px;
  animation: twinkle 5s ease-in-out infinite 0.5s;
}

.stars-3 {
  background-image:
    radial-gradient(1px 1px at 90px 90px, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 140px 40px, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 40px 140px, rgba(254,205,211,0.55), transparent);
  background-size: 180px 180px;
  animation: twinkle 3.5s ease-in-out infinite 1s;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 所有爱心：用 top/left 满屏分布，不再从底部开始 */
.heart-wrap {
  position: absolute;
  margin-left: -0.5em;
  margin-top: -0.5em;
  will-change: transform, opacity;
}

/* 原位浮动：小范围上下左右 + 轻微缩放 */
.heart-blur {
  animation: drift-inplace 8s ease-in-out infinite;
}
.particle-heart {
  animation: drift-inplace 6s ease-in-out infinite;
}
.heart-symbol {
  color: rgba(236, 72, 153, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.5));
  animation: drift-inplace 4s ease-in-out infinite, heart-glow 2.5s ease-in-out infinite;
}
.blob {
  animation: drift-inplace 7s ease-in-out infinite, blob-breathe 5s ease-in-out infinite;
}

@keyframes drift-inplace {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(2vw, -3vh) scale(1.08);
  }
  50% {
    transform: translate(-1.5vw, 2vh) scale(0.95);
  }
  75% {
    transform: translate(-2vw, -1.5vh) scale(1.05);
  }
}

@keyframes heart-glow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.5)); opacity: 0.6; }
  50% { filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.8)); opacity: 1; }
}

@keyframes blob-breathe {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.heart-blur .heart-char {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1rem;
  color: transparent;
  background: radial-gradient(
    ellipse 70% 70% at 50% 50%,
    rgba(244, 114, 182, 0.7),
    rgba(219, 39, 119, 0.35) 50%,
    rgba(232, 121, 249, 0.2) 80%,
    transparent
  );
  border-radius: 50%;
}

.particle-heart .dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(251, 207, 232, 0.95);
  box-shadow: 0 0 6px rgba(236, 72, 153, 0.6);
  transform: translate(-50%, -50%);
  animation: dot-pulse 2s ease-in-out infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
}

.blob {
  border-radius: 45% 55% 52% 48% / 55% 48% 52% 45%;
  background: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    rgba(244, 114, 182, 0.35),
    rgba(219, 39, 119, 0.12) 50%,
    transparent 75%
  );
}
</style>
