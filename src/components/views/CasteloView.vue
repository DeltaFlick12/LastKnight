<template>
  <div
    class="castelo-screen"
    @keydown="startMoving"
    @keyup="stopMoving"
    tabindex="0"
  >
    <!-- Background Layer -->
    <div
      class="zoom-layer background"
      :style="{
        backgroundImage: `url(${bgImage})`,
        backgroundPosition: `${-cameraOffset.x}px ${-cameraOffset.y}px`,
        backgroundSize: 'cover'
      }"
    >
      <div
        v-for="(area, i) in interactionAreas"
        :key="'interact-' + i"
        class="interaction-box"
        :style="{
          left: `${area.x - cameraOffset.x}px`,
          top: `${area.y - cameraOffset.y}px`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      />
    </div>

    <!-- Character Layer -->
    <div
      class="character"
      :style="{
        backgroundImage: `url(${spriteSheet})`,
        backgroundPosition: `-${animations[currentAnimation].frames[currentFrame] * frameWidth}px -${animations[currentAnimation].row * frameHeight}px`,
        width: frameWidth + 'px',
        height: frameHeight + 'px'
      }"
    />

    <!-- Foreground Layer -->
    <div
      class="zoom-layer foreground"
      :style="{
        backgroundImage: `url(${fgImage})`,
        backgroundPosition: `${-cameraOffset.x}px ${-cameraOffset.y}px`,
        backgroundSize: 'cover'
      }"
    />

    <!-- Dialog -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
      <button @click="skipDialog" :disabled="typing">Pular</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import bgImage from '@/assets/interior/bossroom.png'
// Foreground image (detalhes do plano de fundo)
import fgImage from '@/assets/interior/bossroom_detalhes.png'

const currentFrame = ref(0)
const frameTimer = ref(0)
const frameWidth = 96
const frameHeight = 96

const characterPosition = ref({ x: 500, y: 500 })
const moving = ref({ up: false, down: false, left: false, right: false })
const lastDirection = ref('down')
const isAttacking = ref(false)
const canMove = ref(false)

const currentAnimation = computed(() => {
  if (isAttacking.value) {
    return {
      up: 'attack_up',
      down: 'attack_down',
      left: 'attack_left',
      right: 'attack_right'
    }[lastDirection.value]
  }
  if (moving.value.up) return 'walk_up'
  if (moving.value.down) return 'walk_down'
  if (moving.value.left) return 'walk_left'
  if (moving.value.right) return 'walk_right'
  return 'idle'
})

const animations = {
  idle: { row: 3, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
  walk_down: { row: 6, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_up: { row: 4, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_left: { row: 20.1, frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], frameInterval: 70 },
  walk_right: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  attack_up: { row: 13, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 100 },
  attack_down: { row: 15, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 100 },
  attack_left: { row: 12, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 110 },
  attack_right: { row: 14, frames: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11], frameInterval: 100 }
}

const spriteSheet = new URL('/img/sprites/player/player_sprite.png', import.meta.url).href

const showDialog = ref(true)
const dialogIndex = ref(0)
const typing = ref(false)
const displayedText = ref('')

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

const skipDialog = () => {
  typing.value = false
  showDialog.value = false
  canMove.value = true
}

const interactionAreas = [
  {
    x: 430,
    y: 850,
    width: 170,
    height: 80,
    action: () => {
      window.location.href = '/level/albadia'
    }
  }
]

const screenSize = { width: window.innerWidth, height: window.innerHeight }

const cameraOffset = computed(() => ({
  x: characterPosition.value.x - screenSize.width / 2 + frameWidth / 2,
  y: characterPosition.value.y - screenSize.height / 2 + frameHeight / 2
}))

const isInInteractionArea = () => {
  const charBox = { ...characterPosition.value, width: 80, height: 80 }
  return interactionAreas.find(area =>
    charBox.x < area.x + area.width &&
    charBox.x + charBox.width > area.x &&
    charBox.y < area.y + area.height &&
    charBox.y + charBox.height > area.y
  )
}

let animationFrameId = null

const updateMovement = () => {
  const step = 3

  if (canMove.value && !isAttacking.value) {
    if (moving.value.up) {
      characterPosition.value.y -= step
      lastDirection.value = 'up'
    }
    if (moving.value.down) {
      characterPosition.value.y += step
      lastDirection.value = 'down'
    }
    if (moving.value.left) {
      characterPosition.value.x -= step
      lastDirection.value = 'left'
    }
    if (moving.value.right) {
      characterPosition.value.x += step
      lastDirection.value = 'right'
    }
  }

  const anim = animations[currentAnimation.value]
  const now = performance.now()
  if (now - frameTimer.value > anim.frameInterval) {
    frameTimer.value = now
    currentFrame.value++
    if (currentFrame.value >= anim.frames.length) {
      currentFrame.value = 0
      if (isAttacking.value) isAttacking.value = false
    }
  }

  animationFrameId = requestAnimationFrame(updateMovement)
}

const startMoving = (event) => {
  if (!canMove.value) return
  const key = event.key.toLowerCase()

  if (key === 'e') {
    const area = isInInteractionArea()
    if (area) area.action()
  } else if (key === ' ') {
    isAttacking.value = true
    currentFrame.value = 0
  } else {
    if (key === 'w') moving.value.up = true
    if (key === 's') moving.value.down = true
    if (key === 'a') moving.value.left = true
    if (key === 'd') moving.value.right = true
  }
}

const stopMoving = (event) => {
  const key = event.key.toLowerCase()
  if (key === 'w') moving.value.up = false
  if (key === 's') moving.value.down = false
  if (key === 'a') moving.value.left = false
  if (key === 'd') moving.value.right = false
}

onMounted(() => {
  const screen = document.querySelector('.castelo-screen')
  screen.focus()
  screen.addEventListener('click', () => screen.focus())

  frameTimer.value = performance.now()
  animationFrameId = requestAnimationFrame(updateMovement)
  typeLine()
})
</script>

<style scoped>
.castelo-screen {
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  outline: none;
  font-family: 'Press Start 2P', cursive;
  color: white;
}

/* Background Layer */
.zoom-layer.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-repeat: no-repeat;
  background-size: cover;
  z-index: 0;
}

/* Foreground Layer */
.zoom-layer.foreground {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-repeat: no-repeat;
  background-size: cover;
  pointer-events: none; /* Para não atrapalhar cliques */
  z-index: 5;
}

/* Character Layer */
.character {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  /* filter: brightness(0.5); */ /* Opcional: pode tirar se não quiser escurecer personagem */
  scale: 3;
  z-index: 3;
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
  z-index: 10;
}

.interaction-box {
  position: absolute;
  background-color: rgba(0, 255, 0, 0.0);
  z-index: 1;
}
</style>
