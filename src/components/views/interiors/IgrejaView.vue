<template>
  <div
    class="igreja-screen"
    :style="{ backgroundImage: `url(${bgImage})`, backgroundSize: 'auto 120%', transform: `scale(${zoomLevel})` }"
    tabindex="0"
    ref="screenRef"
  >
    <!-- Caixa de Diálogo -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <!-- Escolha de Bênçãos -->
    <div v-if="showBlessings" class="blessings-box">
      <h3>Escolha uma bênção:</h3>
      <div class="blessing-options">
        <div
          v-for="blessing in blessings"
          :key="blessing.id"
          class="blessing-card"
          @click="selectBlessing(blessing)"
        >
          <h4>{{ blessing.name }}</h4>
          <p>{{ blessing.description }}</p>
        </div>
      </div>
    </div>

    <!-- Dica de movimentação -->
    <p v-if="!showDialog && !showBlessings" class="dica-movimento">Use W A S D para mover-se</p>

    <!-- Personagem -->
    <div
      class="character"
      :style="{
        left: `${characterPosition.x}px`,
        top: `${characterPosition.y}px`,
        backgroundImage: `url(${currentSprite})`,
        backgroundSize: 'cover',
        width: `${characterSize}px`,
        height: `${characterSize}px`
      }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import bgImage from '@/assets/interior/igreja-bg.png'

// Referência DOM
const screenRef = ref(null)

// Sprites
const sprites = {
  idle: '/img/sprites/player/player_idle.png',
  walk_up: '/img/sprites/player/player_walk_up.png',
  walk_down: '/img/sprites/player/player_walk_down.png',
  walk_left: '/img/sprites/player/player_walk_left.png',
  walk_right: '/img/sprites/player/player_walk_right.png'
}

const currentSprite = ref(sprites.idle)
const characterSize = 80
const characterPosition = ref({ x: 655, y: 365 })
const zoomLevel = ref(0.95)
const canMove = ref(false)
const pressedKeys = new Set()

// Movimento contínuo
const moving = ref({ up: false, down: false, left: false, right: false })

const updateDirectionFromKeys = () => {
  const keys = Array.from(pressedKeys)
  moving.value.up = keys.includes('w')
  moving.value.down = keys.includes('s')
  moving.value.left = keys.includes('a')
  moving.value.right = keys.includes('d')

  if (moving.value.up) currentSprite.value = sprites.walk_up
  else if (moving.value.down) currentSprite.value = sprites.walk_down
  else if (moving.value.left) currentSprite.value = sprites.walk_left
  else if (moving.value.right) currentSprite.value = sprites.walk_right
  else currentSprite.value = sprites.idle
}

// Diálogo
const showDialog = ref(true)
const dialogIndex = ref(0)
const displayedText = ref('')
const typing = ref(false)
const dialogLines = [
  'Filho, bem-vindo à casa sagrada de Albadia.',
  'Aqui oferecemos bênçãos para proteger-te nas tuas batalhas.',
  'Cada bênção carrega consigo um poder divino e um preço justo.',
  'Escolha com fé...'
]

const typeLine = () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0

  const interval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index]
      index++
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 40)
}

const nextDialog = () => {
  if (typing.value) {
    typing.value = false
    displayedText.value = dialogLines[dialogIndex.value]
    return
  }

  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    showDialog.value = false
    showBlessings.value = true
  }
}

// Bênçãos
const showBlessings = ref(false)
const selectedBlessing = ref(null)
const blessings = [
  { id: 'atk', name: 'Bênção da Força', description: 'Aumenta o ataque em 20%.' },
  { id: 'def', name: 'Bênção do Escudo', description: 'Reduz o dano recebido em 25%.' },
  { id: 'cura', name: 'Bênção da Cura', description: 'Regenera vida lentamente fora de combate.' },
  { id: 'rio', name: 'Bênção do Caminho Sagrado', description: 'Permite atravessar o Rio Sagrado com segurança.' }
]

const selectBlessing = (blessing) => {
  selectedBlessing.value = blessing
  showBlessings.value = false
  canMove.value = true
  localStorage.setItem('blessing_' + blessing.id, 'true')
  console.log('Bênção escolhida:', blessing.name)
}

// Teclado
const startMoving = (event) => {
  if (!canMove.value) return
  pressedKeys.add(event.key.toLowerCase())
  updateDirectionFromKeys()
}

const stopMoving = (event) => {
  pressedKeys.delete(event.key.toLowerCase())
  updateDirectionFromKeys()
}

// Mapa
const mapWidth = 1024
const mapHeight = 1024

const updateMovement = () => {
  const step = 5
  if (moving.value.up) characterPosition.value.y = Math.max(characterPosition.value.y - step, 0)
  if (moving.value.down) characterPosition.value.y = Math.min(characterPosition.value.y + step, mapHeight - characterSize)
  if (moving.value.left) characterPosition.value.x = Math.max(characterPosition.value.x - step, 0)
  if (moving.value.right) characterPosition.value.x = Math.min(characterPosition.value.x + step, mapWidth - characterSize)
}

// Loop
let movementInterval = null

onMounted(async () => {
  await nextTick()
  screenRef.value?.focus()
  typeLine()
  window.addEventListener('keydown', startMoving)
  window.addEventListener('keyup', stopMoving)
  movementInterval = setInterval(updateMovement, 16)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', startMoving)
  window.removeEventListener('keyup', stopMoving)
  clearInterval(movementInterval)
})
</script>

<style scoped>
.igreja-screen {
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  height: 100vh;
  width: 100vw;
  color: white;
  font-family: 'Press Start 2P', cursive;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  overflow: hidden;
  outline: none;
  transform-origin: center center;
}

.dialog-box {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid #ffffff;
  border-radius: 10px;
  text-align: center;
  max-width: 600px;
  z-index: 1;
  margin-top: 400px;
}

button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #ffffff;
  color: black;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.character {
  position: absolute;
  transition: left 0.1s, top 0.1s;
}

.dica-movimento {
  position: absolute;
  bottom: 10px;
  font-size: 12px;
  opacity: 0.7;
  font-family: 'Press Start 2P', cursive;
}

.blessings-box {
  background-color: rgba(0, 0, 0, 0.9);
  padding: 20px;
  border: 2px solid #fff;
  border-radius: 10px;
  text-align: center;
  max-width: 700px;
  margin-top: 300px;
  z-index: 1;
}

.blessing-options {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.blessing-card {
  background-color: #1a1a1a;
  border: 2px solid #fff;
  padding: 15px;
  border-radius: 8px;
  width: 180px;
  cursor: pointer;
  transition: 0.2s;
}

.blessing-card:hover {
  background-color: #333;
  transform: scale(1.05);
}

.blessing-card h4 {
  margin-bottom: 10px;
  color: #ffd700;
}
</style>
