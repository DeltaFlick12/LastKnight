<template>
  <div class="hud">
    <div class="hud-container">
      <!-- Arma Equipada -->
      <div class="weapon-container">
        <div class="weapon-frame">
          <img :src="getWeaponIcon()" alt="Arma Equipada" class="weapon-icon" />
        </div>
      </div>
      
      <!-- Painel Principal -->
      <div class="panel panel-main">
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

          <!-- Ouro -->
          <div class="stat ouro">
            <div class="icon-container">
              <img src="/icons/gold-icon.png" alt="Ouro" class="icon" />
            </div>
            <div class="value-container">
              <span class="value-label">{{ gameState.player.gold }} OURO</span>
            </div>
          </div>

          <!-- Poções -->
          <div class="stat potions">
            <div class="icon-container">
              <img src="/icons/pot-icon.png" alt="Poções" class="icon" />
            </div>
            <div class="value-container">
              <span class="value-label">{{ gameState.player.potions }} POÇÕES</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="fps">{{ fps }} FPS</p>
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import { useGameState } from '@/stores/gameState'

const gameState = useGameState()

const fps = ref(0)
let frameCount = 0
let lastTime = performance.now()

// Função para obter o ícone da arma equipada
const getWeaponIcon = () => {
  // Verificar se o jogador tem uma arma equipada
  if (!gameState.player.equippedWeapon) {
    return '/icons/weapons/no-weapon.png' // Ícone padrão quando não há arma equipada
  }
  
  // Mapear o tipo de arma para o caminho do ícone correspondente
  const weaponType = gameState.player.equippedWeapon.type
  
  switch (weaponType) {
    case 'sword':
      return '/icons/weapons/sword.png'
    case 'axe':
      return '/icons/weapons/axe.png'
    case 'spear':
      return '/icons/weapons/spear.png'
    default:
      return '/icons/weapons/no-weapon.png'
  }
}

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
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.hud {
  position: fixed;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  font-family: 'VT323', monospace;
  font-size: 16px;
  letter-spacing: 0.5px;
}

.hud-container {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.weapon-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.weapon-frame {
  background-color: rgba(40, 35, 30, 0.95);
  border: 6px solid;
  border-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAALElEQVQoU2NkIAIwEqGGAa5IU1OTEZkPM+jfv3+MyHxkNlZFMINwKcJpEgDlTRcFFzrw5QAAAABJRU5ErkJggg==') 3 repeat;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  border-radius: 50%;
}

.weapon-icon {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
  object-fit: contain;
}

.panel {
  display: flex;
  flex-direction: column;
}

.panel-frame {
  background-color: rgba(40, 35, 30, 0.95);
  border: 6px solid;
  border-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAALElEQVQoU2NkIAIwEqGGAa5IU1OTEZkPM+jfv3+MyHxkNlZFMINwKcJpEgDlTRcFFzrw5QAAAABJRU5ErkJggg==') 3 repeat;
  padding: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 260px;
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

.fps {
  position: absolute;
  bottom: 550px;
  right: 10px;
  font-size: 16px;
  color: #caffc6;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #76c976;
  font-family: 'VT323', monospace;
  box-shadow: 0 0 5px #76c976;
  z-index: 5;
}
</style>
