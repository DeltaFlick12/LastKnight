<template>
  <div
    class="igreja-screen"
    @keydown="startMoving"
    @keyup="stopMoving"
    tabindex="0"
  >
    <!-- Fundo SEM zoom -->
    <div
      class="zoom-layer"
      :style="{
        backgroundImage: `url(${bgImage})`,
      }"
    >
      <!-- Padre NPC -->
      <div
        class="npc padre"
        :style="{
          transform: `translate(${padrePosition.x}px, ${padrePosition.y}px)`,
          backgroundImage: `url(${padreSprite})`
        }"
      ></div>

      <!-- Canvas do personagem com zoom 2x -->
      <canvas
        ref="characterCanvas"
        class="character-canvas"
        :style="{
          transform: `translate(${characterPosition.x}px, ${characterPosition.y}px)`
        }"
        width="288"
        height="288"
      ></canvas>

      <!-- Colisões e áreas interativas (mesmo estilo) -->
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

    <!-- Dialogs e menus (igual) -->
    <div v-if="showDialog" class="dialog-box">
      <p>{{ displayedText }}</p>
      <button @click="nextDialog" :disabled="typing">Continuar</button>
    </div>

    <div v-if="showExitDialog && !showDialog" class="dialog-box">
      <p>{{ exitDialogText }}</p>
    </div>

    <div v-if="showBlessingPrompt && !showDialog && !showBlessingMenu" class="dialog-box">
      <p>Para receber a bênção do padre aperte "E"</p>
    </div>

    <div v-if="showBlessingMenu" class="blessing-menu dialog-box">
      <h3>Bênçãos Disponíveis</h3>
      <p>Ouro: {{ gold }}</p>
      <ul>
        <li v-for="(blessing, index) in blessingsAvailable" :key="index">
          <button
            @click="buyBlessing(blessing)"
            :disabled="gold < blessing.cost || blessings.includes(blessing.name)"
          >
            {{ blessing.name }} - Custa {{ blessing.cost }} ouro
          </button>
          <span v-if="blessings.includes(blessing.name)"> (Comprado) </span>
        </li>
      </ul>
      <button @click="closeBlessingMenu">Fechar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import bgImage from '@/assets/interior/igreja-bg.png'
import padreSprite from '@/assets/Padre.png'

const playerSpriteSheet = new Image()
playerSpriteSheet.src = '/img/sprites/player/player_sprite.png'

const frameWidth = 96
const frameHeight = 96
const scaleFactor = 3 // zoom só no personagem

const animations = {
  idle: { row: 3, frames: [7, 1, 2, 3, 4, 5], frameInterval: 150 },
  walk_down: { row: 6, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_up: { row: 4, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 },
  walk_left: { row: 20.1, frames: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], frameInterval: 70 },
  walk_right: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], frameInterval: 70 }
}

const characterPosition = ref({ x: 400, y: 600 })
const moving = ref({ up: false, down: false, left: false, right: false })
const lastDirection = ref('idle')

let currentAnimation = 'idle'
let currentFrameIndex = 0
let frameTimer = 0

const characterCanvas = ref(null)

const gold = ref(100)
const blessings = ref([])
const blessingsAvailable = [
  { name: 'Bênção da Força', cost: 30 },
  { name: 'Bênção da Proteção', cost: 50 },
  { name: 'Bênção da Velocidade', cost: 40 }
]

const showBlessingMenu = ref(false)
const showBlessingPrompt = ref(false)
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

const showExitDialog = ref(false)
const exitDialogText = "Pressione 'E' para Sair da Igreja"

const padrePosition = ref({ x: 400, y: 120 })

const collisionAreas = [
  { x: 0, y: 200, width: 1024, height: 50 },
  { x: 0, y: 950, width: 1024, height: 50 },
  { x: 1020, y: 200, width: 50, height: 1000 },
  { x: 820, y: 700, width: 130, height: 100 },
  { x: 430, y: 890, width: 170, height: 50 }
]

const interactionAreas = [
  { x: 430, y: 850, width: 170, height: 80, action: () => (window.location.href = '/level/albadia') }
]

const isColliding = (nextX, nextY) => {
  const charBox = { x: nextX, y: nextY, width: 80, height: 80 }
  return collisionAreas.some(
    area =>
      charBox.x < area.x + area.width &&
      charBox.x + charBox.width > area.x &&
      charBox.y < area.y + area.height &&
      charBox.y + charBox.height > area.y
  )
}

const isInInteractionArea = () => {
  const charBox = { x: characterPosition.value.x, y: characterPosition.value.y, width: 80, height: 80 }
  return interactionAreas.find(
    area =>
      charBox.x < area.x + area.width &&
      charBox.x + charBox.width > area.x &&
      charBox.y < area.y + area.height &&
      charBox.y + charBox.height > area.y
  )
}

const isNearPadre = () => {
  const charBox = { x: characterPosition.value.x, y: characterPosition.value.y, width: 80, height: 80 }
  const padreBox = { x: padrePosition.value.x, y: padrePosition.value.y, width: 120, height: 120 }
  return (
    charBox.x < padreBox.x + padreBox.width + 30 &&
    charBox.x + charBox.width > padreBox.x - 30 &&
    charBox.y < padreBox.y + padreBox.height + 30 &&
    charBox.y + charBox.height > padreBox.y - 30
  )
}

const typeLine = () => {
  typing.value = true
  displayedText.value = ''
  const line = dialogLines[dialogIndex.value]
  let i = 0
  const interval = setInterval(() => {
    displayedText.value += line[i]
    i++
    if (i >= line.length) {
      clearInterval(interval)
      typing.value = false
    }
  }, 30)
}

const nextDialog = () => {
  if (typing.value) return
  dialogIndex.value++
  if (dialogIndex.value >= dialogLines.length) {
    showDialog.value = false
    canMove.value = true
  } else {
    typeLine()
  }
}
const startMoving = (event) => {
  if (!canMove.value) return
  const key = event.key.toLowerCase()
  switch (key) {
    case 'w':
      moving.value.up = true
      lastDirection.value = 'walk_up'
      break
    case 's':
      moving.value.down = true
      lastDirection.value = 'walk_down'
      break
    case 'a':
      moving.value.left = true
      lastDirection.value = 'walk_left'
      break
    case 'd':
      moving.value.right = true
      lastDirection.value = 'walk_right'
      break
    case 'e':
      handleAction()
      break
  }
}

const stopMoving = (event) => {
  const key = event.key.toLowerCase()
  switch (key) {
    case 'w':
      moving.value.up = false
      break
    case 's':
      moving.value.down = false
      break
    case 'a':
      moving.value.left = false
      break
    case 'd':
      moving.value.right = false
      break
  }

  if (
    !moving.value.up &&
    !moving.value.down &&
    !moving.value.left &&
    !moving.value.right
  ) {
    lastDirection.value = 'idle'
  }
}





const handleAction = () => {
  if (isNearPadre()) {
    if (showBlessingMenu.value) {
      showBlessingMenu.value = false
    } else {
      showBlessingMenu.value = true
      showBlessingPrompt.value = false
    }
  } else if (isInInteractionArea()) {
    const area = isInInteractionArea()
    area.action()
  }
}

const buyBlessing = (blessing) => {
  if (gold.value >= blessing.cost && !blessings.value.includes(blessing.name)) {
    gold.value -= blessing.cost
    blessings.value.push(blessing.name)
  }
}

const closeBlessingMenu = () => {
  showBlessingMenu.value = false
}

const update = (deltaTime) => {
  let speed = 3
  let newX = characterPosition.value.x
  let newY = characterPosition.value.y

  if (moving.value.up) newY -= speed
  if (moving.value.down) newY += speed
  if (moving.value.left) newX -= speed
  if (moving.value.right) newX += speed

  if (!isColliding(newX, newY)) {
    characterPosition.value.x = newX
    characterPosition.value.y = newY
  }

  // Atualiza animação
  frameTimer += deltaTime
  const anim = animations[lastDirection.value] || animations.idle
  if (frameTimer > anim.frameInterval) {
    frameTimer = 0
    currentFrameIndex = (currentFrameIndex + 1) % anim.frames.length
  }
  currentAnimation = lastDirection.value || 'idle'

  drawCharacter()
}

const drawCharacter = () => {
  const ctx = characterCanvas.value.getContext('2d')
  ctx.clearRect(0, 0, frameWidth * scaleFactor, frameHeight * scaleFactor)

  const anim = animations[currentAnimation] || animations.idle
  const frame = anim.frames[currentFrameIndex % anim.frames.length]
  const row = anim.row

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    playerSpriteSheet,
    frame * frameWidth,
    row * frameHeight,
    frameWidth,
    frameHeight,
    0,
    0,
    frameWidth * scaleFactor,
    frameHeight * scaleFactor
  )
}

let lastTimestamp = 0
const gameLoop = (timestamp) => {
  if (!lastTimestamp) lastTimestamp = timestamp
  const deltaTime = timestamp - lastTimestamp
  lastTimestamp = timestamp

  update(deltaTime)
  requestAnimationFrame(gameLoop)
}

onMounted(() => {
  typeLine()
  characterPosition.value.x = 360
  characterPosition.value.y = 670

  document.querySelector('.igreja-screen').focus()

  playerSpriteSheet.onload = () => {
    drawCharacter()
    requestAnimationFrame(gameLoop)
  }
})
</script>

<style scoped>
.igreja-screen {
  position: relative;
  width: 100%;
  height: 1024px;
  outline: none;
  overflow: hidden;
  background: #222;
}

.zoom-layer {
  position: absolute;
  top: 40%;
  left: 50%;
  width: 1024px; /* largura da imagem original */
  height: 1024px; /* altura da imagem original */
  background-repeat: no-repeat;
  background-size: contain; /* garante que a imagem fique inteira visível */
  background-position: center center; /* centraliza a imagem */
  transform-origin: center center;
  user-select: none;

  /* Centraliza a div em relação à tela */
  transform: translate(-50%, -50%) scale(0.89);
}

.npc.padre {
  position: absolute;
  width: 120px;
  height: 120px;
  background-repeat: no-repeat;
  background-size: contain;
  pointer-events: none;
}

.character-canvas {
  position: absolute;
  width: 288px;
  height: 288px;
  image-rendering: pixelated;
  pointer-events: none;
  user-select: none;
  /* ajusta para centralizar o personagem pelo meio do sprite */
  transform-origin: top left;
}

.collision-box {
  position: relative;
  background: rgba(255, 0, 0, 0.5);
  pointer-events: none;
}

.interaction-box {
  position: absolute;
  background: rgba(0, 255, 0, 0.0);
  pointer-events: none;
}

.dialog-box {
  position: absolute;
  bottom: 500px;
  left: 46.5%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  width: 600px;
  border-radius: 8px;
  user-select: none;
}

.blessing-menu {
  max-width: 400px;
}
</style>