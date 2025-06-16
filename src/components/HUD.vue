<template>
  <div class="main-hud">
    <!-- Painel com vida e energia -->
    <div class="panel-frame">
      <!-- Vida -->
      <div class="stat vida">
        <div class="icon-container">
          <img src="/icons/life-icon.png" alt="Vida" class="icon" />
          <span class="lives-count">{{ gameState.player.lives }}</span>
        </div>
        <div class="bar-container segmented">
          <div
            v-for="i in maxBarSegments"
            :key="'vida-' + i"
            class="segment"
            :class="{ filled: i <= filledHealthSegments }"
          ></div>
          <span class="bar-label">
            {{ Math.floor(gameState.player.health) }}/{{ Math.floor(gameState.player.maxHealth) }}
          </span>
        </div>
      </div>

      <!-- Energia -->
      <div class="stat energia">
        <div class="icon-container">
          <img src="/icons/stam-icon.png" alt="Energia" class="icon" />
        </div>
        <div class="bar-container segmented">
          <div
            v-for="i in maxBarSegments"
            :key="'energia-' + i"
            class="segment"
            :class="{ filled: i <= filledStaminaSegments }"
          ></div>
          <span class="bar-label">
            {{ Math.floor(gameState.player.stamina) }}/{{ Math.floor(gameState.player.maxStamina) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Botões no lado direito central -->
    <div class="hud-buttons">
      <!-- Botão MENU -->
      <button class="menu-button" @click="togglePauseMenu" :class="{ active: pauseMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      <!-- Botão MAPA -->
      <button class="map-button" @click="handleMapClick">
        <img src="/icons/map-icon.png" alt="Mapa" class="button-icon" />
      </button>

      <!-- Botão MOCHILA -->
      <button class="bag-button" @click="toggleBag">
        <img src="/icons/bag-icon.png" alt="Mochila" class="button-icon" />
      </button>
    </div>

    <!-- Inventário -->
    <Inventory v-if="inventoryOpen" />
    
    <!-- Menu de Pausa -->
    <div v-if="pauseMenuOpen" class="pause-menu-overlay">
      <div class="pause-menu">
        <h2 class="pause-title">Menu</h2>
        <div class="pause-options">
          <button class="pause-option" @click="continuarJogo">Continuar</button>
          <button class="pause-option" @click="voltarAoMenu">Sair</button>
        </div>
      </div>
    </div>

    <!-- Mensagem de recompensa -->
    <div v-if="tossRewardMessage" class="reward-message">
      {{ tossRewardMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Inventory from '@/components/Inventory.vue'
import { useGameState } from '@/stores/gameState'

// Global audio manager to persist audio across navigation
const audioManager = {
  mapOpenSound: new Audio('/sounds/map.mp3'),
  bagOpenSound: new Audio('/sounds/zipper.mp3'),
  menuToggleSound: new Audio('/sounds/click.wav'),
  buttonClickSound: new Audio('/sounds/click.wav'),
}
audioManager.mapOpenSound.volume = 0.5
audioManager.bagOpenSound.volume = 0.5
audioManager.menuToggleSound.volume = 0.5
audioManager.buttonClickSound.volume = 0.5

defineProps(['potions', 'coins', 'tossRewardMessage'])
const gameState = useGameState()
const router = useRouter()

const inventoryOpen = ref(false)
const pauseMenuOpen = ref(false)

const startAudioOnInteraction = () => {
  try {
    // Preload sounds
    [
      audioManager.bagOpenSound,
      audioManager.mapOpenSound,
      audioManager.menuToggleSound,
      audioManager.buttonClickSound
    ].forEach((sound) => {
      sound.play().then(() => sound.pause()).catch((error) => {
        console.error(`Erro ao pré-carregar som ${sound.src}:`, error)
      })
    })
  } catch (error) {
    console.error('Erro em startAudioOnInteraction:', error)
  }
  document.removeEventListener('click', startAudioOnInteraction)
  document.removeEventListener('keydown', startAudioOnInteraction)
}

onMounted(() => {
  try {
    document.addEventListener('click', startAudioOnInteraction)
    document.addEventListener('keydown', startAudioOnInteraction)
  } catch (error) {
    console.error('Erro em onMounted:', error)
  }
})

onUnmounted(() => {
  try {
    document.removeEventListener('click', startAudioOnInteraction)
    document.removeEventListener('keydown', startAudioOnInteraction)
    audioManager.bagOpenSound.pause()
    audioManager.mapOpenSound.pause()
    audioManager.menuToggleSound.pause()
    audioManager.buttonClickSound.pause()
  } catch (error) {
    console.error('Erro em onUnmounted:', error)
  }
})

watch(inventoryOpen, (newValue) => {
  try {
    if (newValue) {
      audioManager.bagOpenSound.currentTime = 0
      audioManager.bagOpenSound.play().catch((error) => {
        console.error('Erro ao tocar som de mochila:', error)
      })
    }
  } catch (error) {
    console.error('Erro em watch inventoryOpen:', error)
  }
})

const toggleBag = () => {
  try {
    if (pauseMenuOpen.value) return
    inventoryOpen.value = !inventoryOpen.value
  } catch (error) {
    console.error('Erro em toggleBag:', error)
  }
}

const togglePauseMenu = () => {
  try {
    pauseMenuOpen.value = !pauseMenuOpen.value
    if (pauseMenuOpen.value) {
      inventoryOpen.value = false
    }
    audioManager.menuToggleSound.currentTime = 0
    audioManager.menuToggleSound.play().catch((error) => {
      console.error('Erro ao tocar som de menu:', error)
    })
  } catch (error) {
    console.error('Erro em togglePauseMenu:', error)
  }
}

const continuarJogo = () => {
  try {
    audioManager.buttonClickSound.currentTime = 0
    audioManager.buttonClickSound.play().catch((error) => {
      console.error('Erro ao tocar som de botão:', error)
    })
    pauseMenuOpen.value = false
  } catch (error) {
    console.error('Erro em continuarJogo:', error)
  }
}

const voltarAoMenu = () => {
  try {
    audioManager.buttonClickSound.currentTime = 0
    audioManager.buttonClickSound.play().catch((error) => {
      console.error('Erro ao tocar som de botão:', error)
    })
    router.push('/')
  } catch (error) {
    console.error('Erro em voltarAoMenu:', error)
  }
}

const handleMapClick = async () => {
  try {
    if (pauseMenuOpen.value) return
    audioManager.mapOpenSound.currentTime = 0
    await audioManager.mapOpenSound.play().catch((error) => {
      console.error('Erro ao tocar som de mapa:', error)
    })
    // Delay navigation to ensure sound starts
    setTimeout(() => {
      router.push('/map')
    }, 150)
  } catch (error) {
    console.error('Erro em handleMapClick:', error)
    router.push('/map') // Fallback navigation
  }
}

const maxBarSegments = 10

const filledHealthSegments = computed(() => {
  return Math.round(
    (gameState.player.health / gameState.player.maxHealth) * maxBarSegments
  )
})

const filledStaminaSegments = computed(() => {
  return Math.round(
    (gameState.player.stamina / gameState.player.maxStamina) * maxBarSegments
  )
})
</script>

<style scoped>
.main-hud {
  position: fixed;
  bottom: 10px;
  left: 5px;
  z-index: 1000;
  font-size: 6px;
  letter-spacing: 0.5px;
}

.panel-frame {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-container {
  position: relative;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  margin-left: 20px;
  z-index: 100;
}

.lives-count {
  position: absolute;
  top: 60%;
  left: 80%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #fff;
  text-shadow: 1px 1px 2px #000;
  font-weight: bold;
  z-index: 101;
}

.bar-container {
  position: relative;
  width: 280px;
  height: 34px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid #333;
  overflow: hidden;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
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

.bar-container.segmented {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5px;
  padding: 1px;
}

.segment {
  flex: none;
  width: 26px;
  height: 28px;
  background: rgba(0, 0, 0, 0.2);
  border: 0.2px solid #222;
  box-shadow: inset 0 0 3px #000;
}

.vida .segment.filled {
  background: linear-gradient(to bottom, #ff3333, rgb(106, 15, 15));
}

.energia .segment.filled {
  background: linear-gradient(to bottom, #33cc33, rgb(11, 112, 11));
}

.moedas .bar-label {
  position: static;
  transform: none;
  font-size: 18px;
  margin-left: 10px;
}

.hud-buttons {
  position: fixed;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-button,
.map-button,
.bag-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 122px;
  height: 122px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-button:hover img,
.bag-button:hover img,
.menu-button:hover {
  transform: scale(1.1);
  transition: transform 0.2s;
}

.map-button:active img,
.bag-button:active img,
.menu-button:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}

.button-icon {
  width: 122px;
  height: 122px;
  image-rendering: pixelated;
  z-index: 10000;
}

.menu-button {
  flex-direction: column;
  gap: 10px;
  background: rgba(0, 0, 0, 0);
  padding: 20px;
  z-index: 10000;
}

.menu-button span {
  display: block;
  width: 60px;
  height: 8px;
  background-color: #fff9d6;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.menu-button.active span:nth-child(1) {
  transform: rotate(45deg) translate(12px, 12px);
}

.menu-button.active span:nth-child(2) {
  opacity: 0;
}

.menu-button.active span:nth-child(3) {
  transform: rotate(-45deg) translate(14px, -14px);
}

.pause-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.pause-menu {
  background: #e0a867;
  border: 6px solid #5c2c1d;
  border-radius: 10px;
  padding: 30px;
  width: 400px;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  animation: scaleIn 0.3s ease-out;
  image-rendering: pixelated;
}

@keyframes scaleIn {
  from { transform: scale(0.8); }
  to { transform: scale(1); }
}

.pause-title {
  font-size: 40px;
  color: #5c2c1d;
  text-align: center;
  margin-bottom: 30px;
  text-shadow: 2px 2px #d17844;
}

.pause-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.pause-option {
  background-color: #e0a867;
  color: #5c2c1d;
  border: 4px solid #5c2c1d;
  padding: 15px;
  font-size: 24px;
  text-align: center;
  cursor: pointer;
  box-shadow: inset -6px -6px #d17844, inset 6px 6px #ffcb8e;
  font-weight: bold;
  transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s;
}

.pause-option:hover {
  background-color: #f4b76a;
  color: #3e1e14;
  box-shadow: inset -6px -6px #c96a32, inset 6px 6px #ffd9a1;
}

.pause-option:active {
  transform: translateY(2px);
  box-shadow: inset -3px -3px #d17844, inset 3px 3px #ffcb8e;
}

.reward-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  color: #aaffaa;
  font-size: 18px;
}
</style>