<template>
  <div class="hud">
    <div class="panel panel-left">
      <p class="stat">❤️ Vida: {{ health }}/100</p>
      <p class="stat">⚡ Vigor: {{ stamina }}/100</p>
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
  padding: 16px 40px;
  background: linear-gradient(145deg, #3b2e2a, #221912);
  border-bottom: 5px solid #bfa760;
  box-shadow: inset 0 0 8px #000, 0 4px 15px rgba(0, 0, 0, 0.6);
  font-size: 20px;
  z-index: 1000;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-left {
  color: #f4e3b2;
}

.panel-center {
  text-align: center;
  color: #fddc6c;
}

.panel-right {
  text-align: right;
  color: #e3c3a1;
}

.stat,
.resource,
.location {
  margin: 0;
  text-shadow: 1px 1px 1px #000;
  background: rgba(0,0,0,0.2);
  padding: 2px 8px;
  border-radius: 4px;
}

.fps {
  position: absolute;
  bottom: -80px; /* ou maior se quiser mais abaixo */
  left: 20px;
  font-size: 22px;
  color: #b6ffba;
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #76c976;
  z-index: 5;
}

</style>
