<template>
  <div
    class="igreja-screen"
    @keydown="startMoving"
    @keyup="stopMoving"
    tabindex="0"
  >
    <!-- Camada com imagem e zoom centralizado -->
    <div
      class="zoom-layer"
      :style="{
        backgroundImage: `url(${bgImage})`,
        transform: `translate(-50%, -50%) scale(${zoomLevel})`
      }"
    >
      <!-- Personagem -->
      <div
        class="character"
        :style="{
          transform: `translate(${characterPosition.x}px, ${characterPosition.y}px)`,
          backgroundImage: `url(${currentSprite})`,
          backgroundSize: 'cover',
          width: '80px',
          height: '80px'
        }"
      ></div>
    </div>

    <!-- Caixa de diálogo -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import bgImage from '@/assets/interior/igreja-bg.png'

const sprites = {
  idle: '/img/sprites/player/player_idle.png',
  walk_up: '/img/sprites/player/player_walk_up.png',
  walk_down: '/img/sprites/player/player_walk_down.png',
  walk_left: '/img/sprites/player/player_walk_left.png',
  walk_right: '/img/sprites/player/player_walk_right.png'
}

const currentSprite = ref(sprites.idle)
const characterPosition = ref({ x: 0, y: 0 })
const zoomLevel = ref(1.2)
const moving = ref({ up: false, down: false, left: false, right: false })
const lastDirection = ref('up')

const showDialog = ref(true)
const dialogIndex = ref(0)
const dialogLines = [
  'Filho, bem-vindo à casa sagrada de Albadia.',
  'Aqui oferecemos bênçãos para proteger-te nas tuas batalhas.',
  'Cada bênção carrega consigo um poder divino e um preço justo.',
  'Escolha com fé...'
]
const displayedText = ref('')
const typing = ref(false)
const canMove = ref(false)

const bgWidth = 1024
const bgHeight = 1024
let animationFrameId = null

const typeLine = () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let index = 0
  const interval = setInterval(() => {
    if (index < line.length) {
      displayedText.value += line[index++]
    } else {
      clearInterval(interval)
      typing.value = false
    }
  }, 40)
}

const nextDialog = () => {
  if (typing.value) return
  if (dialogIndex.value < dialogLines.length - 1) {
    dialogIndex.value++
    typeLine()
  } else {
    showDialog.value = false
    canMove.value = true
  }
}

const getMovementBounds = () => {
  const screen = document.querySelector('.igreja-screen')
  const rect = screen.getBoundingClientRect()

  const bgRenderedWidth = bgWidth * zoomLevel.value
  const bgRenderedHeight = bgHeight * zoomLevel.value

  const offsetX = (rect.width - bgRenderedWidth) / 2
  const offsetY = (rect.height - bgRenderedHeight) / 2

  return {
    minX: 0,
    maxX: bgRenderedWidth - 80,
    minY: 0,
    maxY: bgRenderedHeight - 80
  }
}

const updateMovement = () => {
  if (!canMove.value) {
    animationFrameId = requestAnimationFrame(updateMovement)
    return
  }

  const step = 3
  let moved = false
  const bounds = getMovementBounds()

  if (moving.value.up && characterPosition.value.y - step >= bounds.minY) {
    characterPosition.value.y -= step
    lastDirection.value = 'up'
    moved = true
  }
  if (moving.value.down && characterPosition.value.y + step <= bounds.maxY) {
    characterPosition.value.y += step
    lastDirection.value = 'down'
    moved = true
  }
  if (moving.value.left && characterPosition.value.x - step >= bounds.minX) {
    characterPosition.value.x -= step
    lastDirection.value = 'left'
    moved = true
  }
  if (moving.value.right && characterPosition.value.x + step <= bounds.maxX) {
    characterPosition.value.x += step
    lastDirection.value = 'right'
    moved = true
  }

  currentSprite.value = moved
    ? sprites[`walk_${lastDirection.value}`]
    : sprites.walk_up

  animationFrameId = requestAnimationFrame(updateMovement)
}

const startMoving = (event) => {
  if (!canMove.value) return
  switch (event.key.toLowerCase()) {
    case 'w': moving.value.up = true; break
    case 's': moving.value.down = true; break
    case 'a': moving.value.left = true; break
    case 'd': moving.value.right = true; break
  }
}

const stopMoving = (event) => {
  if (!canMove.value) return
  switch (event.key.toLowerCase()) {
    case 'w': moving.value.up = false; break
    case 's': moving.value.down = false; break
    case 'a': moving.value.left = false; break
    case 'd': moving.value.right = false; break
  }
}

onMounted(() => {
  typeLine()

  const screen = document.querySelector('.igreja-screen')
  screen.focus()
  screen.addEventListener('click', () => screen.focus())

  const bounds = getMovementBounds()
  characterPosition.value.x = (bounds.minX + bounds.maxX) / 2
  characterPosition.value.y = (bounds.minY + bounds.maxY) / 2

  animationFrameId = requestAnimationFrame(updateMovement)
})
</script>

<style scoped>
.igreja-screen {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  outline: none;
  font-family: 'Press Start 2P', cursive;
  color: white;
}

.zoom-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1024px;
  height: 1024px;
  background-repeat: no-repeat;
  background-position: center;
  transform-origin: center center;
}

.character {
  position: absolute;
  transition: transform 0.05s linear;
  z-index: 2;
}

.dialog-box {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.85);
  padding: 20px;
  border: 2px solid #ffffff;
  border-radius: 10px;
  text-align: center;
  max-width: 600px;
  z-index: 3;
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
</style>
