<template>
  <div class="hud">
    <div class="panel panel-left">
      <p class="stat">❤️ Vida: {{ health }}/100</p>
      <p class="stat">⚡ Stamina: {{ stamina }}/100</p>
    </div>
    <div class="panel panel-center">
      <p class="resource">🪙 Ouro: {{ gold }}</p>
      <p class="resource">🧪 Poções: {{ potions }}</p>
    </div>
    <div class="panel panel-right">
      <p class="location">📍 {{ area }}</p>
    </div>
    <p class="fps">{{ fps }} FPS</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  health: Number,
  stamina: Number,
  gold: Number,
  potions: Number,
  area: String,
})

const fps = ref(0)
let frameCount = 0
let lastTime = performance.now()

onMounted(() => {
  function updateFPS() {
    const now = performance.now()
    frameCount++
    if (now - lastTime >= 1000) {
      fps.value = frameCount
      frameCount = 0
      lastTime = now
    }
    requestAnimationFrame(updateFPS)
  }
  updateFPS()
})
</script>

<style scoped>
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 30px;
  background: rgba(34, 17, 5, 0.85);
  font-family: 'Press Start 2P', cursive;
  font-size: 14px;
  border-bottom: 4px solid #5c2c1d;
  box-shadow: 0 4px 12px rgba(0,0,0,0.7);
  z-index: 1000;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-left {
  color: #fbeec1;
}

.panel-center {
  text-align: center;
  color: #ffd700;
}

.panel-right {
  text-align: right;
  color: #d7b29d;
}

.stat,
.resource,
.location {
  margin: 0;
  text-shadow: 1px 1px 2px #000;
}

.fps {
  position: fixed;
  top: 0%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  font-weight: bold;
  color: #ff0033;
  left: 100px;
  text-shadow: 2px 2px 4px #000;
  z-index: 9999;
  pointer-events: none;
  font-family: 'Press Start 2P', cursive;
}
</style>
