<template>
  <div
    class="castelo-screen"
    @keydown="startMoving"
    @keyup="stopMoving"
    tabindex="0"
  >
    <div
      class="zoom-layer"
      :style="{
        backgroundImage: `url(${bgImage})`,
        transform: `translate(-50%, -50%) scale(${zoomLevel})`
      }"
    >
      <div
        class="character"
        :style="{
          transform: `translate(${characterPosition.x}px, ${characterPosition.y}px)`,
          backgroundImage: `url(${spriteSheet})`,
          backgroundPosition: `-${animations[currentAnimation].frames[currentFrame] * frameWidth}px -${animations[currentAnimation].row * frameHeight}px`,
          width: frameWidth + 'px',
          height: frameHeight + 'px'
        }"
      />

      <div
        v-for="(area, i) in collisionAreas"
        :key="i"
        class="collision-box"
        :style="{
          transform: `translate(${area.x}px, ${area.y}px)`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      />

      <div
        v-for="(area, i) in interactionAreas"
        :key="'interact-' + i"
        class="interaction-box"
        :style="{
          transform: `translate(${area.x}px, ${area.y}px)`,
          width: `${area.width}px`,
          height: `${area.height}px`
        }"
      />
    </div>

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

const currentFrame = ref(0)
const frameTimer = ref(0)
const frameWidth = 96
const frameHeight = 96

const zoomLevel = ref(0.95)
const characterPosition = ref({ x: 0, y: 0 })
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

const collisionAreas = [
  { x: 0, y: 200, width: 1024, height: 50 },
  { x: 0, y: 950, width: 1024, height: 50 },
  { x: 1020, y: 200, width: 50, height: 1000 },
  { x: 820, y: 700, width: 130, height: 100 },
  { x: 430, y: 890, width: 170, height: 50 }
]

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

const isColliding = (nextX, nextY) => {
  const charBox = { x: nextX, y: nextY, width: 80, height: 80 }
  return collisionAreas.some(area =>
    charBox.x < area.x + area.width &&
    charBox.x + charBox.width > area.x &&
    charBox.y < area.y + area.height &&
    charBox.y + charBox.height > area.y
  )
}

const isInInteractionArea = () => {
  const charBox = { ...characterPosition.value, width: 80, height: 80 }
  return interactionAreas.find(area =>
    charBox.x < area.x + area.width &&
    charBox.x + charBox.width > area.x &&
    charBox.y < area.y + area.height &&
    charBox.y + charBox.height > area.y
  )
}

const getMovementBounds = () => {
  return {
    minX: 0,
    maxX: 1024 - 80,
    minY: 0,
    maxY: 1024 - 80
  }
}

let animationFrameId = null

const updateMovement = (timestamp) => {
  const bounds = getMovementBounds()
  const step = 3
  let moved = false

  if (canMove.value && !isAttacking.value) {
    if (moving.value.up && characterPosition.value.y - step >= bounds.minY && !isColliding(characterPosition.value.x, characterPosition.value.y - step)) {
      characterPosition.value.y -= step
      lastDirection.value = 'up'
      moved = true
    }
    if (moving.value.down && characterPosition.value.y + step <= bounds.maxY && !isColliding(characterPosition.value.x, characterPosition.value.y + step)) {
      characterPosition.value.y += step
      lastDirection.value = 'down'
      moved = true
    }
    if (moving.value.left && characterPosition.value.x - step >= bounds.minX && !isColliding(characterPosition.value.x - step, characterPosition.value.y)) {
      characterPosition.value.x -= step
      lastDirection.value = 'left'
      moved = true
    }
    if (moving.value.right && characterPosition.value.x + step <= bounds.maxX && !isColliding(characterPosition.value.x + step, characterPosition.value.y)) {
      characterPosition.value.x += step
      lastDirection.value = 'right'
      moved = true
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

  characterPosition.value.x = (1024 - frameWidth) / 2
  characterPosition.value.y = (1024 - frameHeight) / 2

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

.zoom-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1024px;
  height: 1024px;
  background-repeat: no-repeat;
  background-position: center;
  transform-origin: center center;
  z-index: 0;
}

.character {
  position: absolute;
  transform-origin: top left;
  filter: brightness(0.45);
  scale: 1.9;
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

.collision-box {
  position: absolute;
  background-color: rgba(255, 0, 0, 0.0);
  z-index: 1;
}

.interaction-box {
  position: absolute;
  background-color: rgba(0, 255, 0, 0.0);
  z-index: 1;
}
</style>
