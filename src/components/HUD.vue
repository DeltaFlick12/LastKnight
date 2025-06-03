<template>
  <div class="main-hud">
    <div class="panel-frame">
      <!-- Vida -->
      <div class="stat vida">
        <div class="icon-container">
          <img src="/icons/life-icon.png" alt="Vida" class="icon" />
        </div>
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
        <div class="icon-container">
          <img src="/icons/stam-icon.png" alt="Energia" class="icon" />
        </div>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGameState } from '@/stores/gameState'

const gameState = useGameState()
</script>

<style scoped>
.main-hud {
  position: fixed;
  bottom: 10px;
  left: 5px; /* deslocado para a direita para não ficar em cima do weapon */
  z-index: 1000;
  font-family: 'VT323', monospace;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-container {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.bar-container {
  position: relative;
  width: 180px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #333;
  overflow: hidden;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
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
  font-size: 16px;
  color: #fff9d6;
  text-shadow: 2px 2px 0 #000;
  font-weight: bold;
  line-height: 24px;
  letter-spacing: 1px;
}

.value-container {
  position: relative;
  width: 180px;
  height: 24px;
  background: rgba(60, 40, 20, 0.8);
  border: 2px solid #5a4a2d;
  display: flex;
  justify-content: center;
  align-items: center;
}

.value-label {
  font-size: 16px;
  color: #fff9d6;
  text-shadow: 2px 2px 0 #000;
  font-weight: bold;
  letter-spacing: 1px;
}

/* Cores específicas */
.vida .bar {
  background: linear-gradient(to bottom, #ff3333, #cc0000);
}

.energia .bar {
  background: linear-gradient(to bottom, #33cc33, #009900);
}

.ouro .value-container {
  background: linear-gradient(to bottom, #8b6b23, #5a4a2d);
  border-color: #c8a951;
}

.potions .value-container {
  background: linear-gradient(to bottom, #8b3a23, #5a2d2d);
  border-color: #c85151;
}
</style>
