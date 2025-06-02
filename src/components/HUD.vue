<template>
  <div class="hud">
    <div class="panel panel-left">
      <!-- Vida -->
      <div class="stat vida">
        <img src="/icons/life-icon.png" alt="Vida" class="icon" />
        <div class="bar-container">
          <div
            class="bar"
            :style="{ width: (gameState.player.health / gameState.player.maxHealth) * 100 + '%' }"
          ></div>
          <span class="bar-label">
            {{ gameState.player.health }}/{{ gameState.player.maxHealth }}
          </span>
        </div>
      </div>

      <!-- Energia -->
      <div class="stat energia">
        <img src="/icons/stam-icon.png" alt="Energia" class="icon" />
        <div class="bar-container">
          <div
            class="bar"
            :style="{ width: (gameState.player.stamina / gameState.player.maxStamina) * 100 + '%' }"
          ></div>
          <span class="bar-label">
            {{ gameState.player.stamina }}/{{ gameState.player.maxStamina }}
          </span>
        </div>
      </div>

      <!-- Ouro -->
      <div class="stat ouro">
        <img src="/icons/gold-icon.png" alt="Ouro" class="icon" />
        <div class="bar-container">
          <div
            class="bar"
            :style="{ width: Math.min(gameState.player.gold / 100, 1) * 100 + '%' }"
          ></div>
          <span class="bar-label">
            {{ gameState.player.gold }} Ouro
          </span>
        </div>
      </div>

      <!-- Poções -->
      <div class="stat potions">
        <img src="/icons/pot-icon.png" alt="Poções" class="icon" />
        <div class="bar-container">
          <div
            class="bar"
            :style="{ width: Math.min(gameState.player.potions / 10, 1) * 100 + '%' }"
          ></div>
          <span class="bar-label">
            {{ gameState.player.potions }} Poções
          </span>
        </div>
      </div>
    </div>

    <p class="fps">{{ fps }} FPS</p>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useGameState } from '@/stores/gameState'

const gameState = useGameState()

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
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');

.hud {
  position: fixed;
  top: 0px;
  left: -10px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 12px 24px;
  font-family: 'Cinzel', serif;
  font-size: 14px;
  z-index: 1000;
  letter-spacing: 0.5px;
  flex-direction: column;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 320px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  width: 24px;
  height: 24px;
  filter: drop-shadow(1px 1px 1px #000);
}

.bar-container {
  position: relative;
  width: 160px;
  height: 18px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  transition: width 0.3s ease-in-out;
}

.bar-label {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: white;
  text-shadow: 1px 1px 2px #000;
  font-weight: bold;
  line-height: 18px;
}

/* Cores específicas */
.vida .bar {
  background: red;
}

.energia .bar {
  background: gold;
}

.ouro .bar {
  background: #ffd700;
}

.potions .bar {
  background: limegreen;
}

.fps {
  position: absolute;
  bottom: 550px;
  left: -1060px;
  transform: translateX(-50%);
  font-size: 20px;
  color: #caffc6;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid #76c976;
  font-family: monospace;
  box-shadow: 0 0 5px #76c976;
  z-index: 5;
}
</style>