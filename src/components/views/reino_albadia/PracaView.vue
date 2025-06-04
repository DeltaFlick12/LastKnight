<template>
  <div class="game-view">
    <canvas ref="canvas" class="game-canvas"></canvas>

    <HUD />

    <div v-if="showEnterPrompt" class="enter-prompt">
      Pressione <span class="key">E</span> para entrar em {{ structureName }}
    </div>
  </div>
</template>

<script setup>
import { useGameState } from '@/stores/gameState'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Inventory from '@/components/Inventory.vue'
import HUD from '@/components/HUD.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const gameState = useGameState()

const maxStamina = gameState.player.maxStamina
const staminaRecoveryRate = 10 // por segundo
const staminaConsumptionRate = 25 // por segundo

const staminaRounded = computed(() => Math.floor(gameState.player.stamina))

const gold = ref(150)
const potions = ref(3)
const currentArea = ref('Reino de Albadia')
const showEnterPrompt = ref(false)
const structureName = ref('')

const bagOpen = ref(false)
const toggleBag = () => (bagOpen.value = !bagOpen.value)

const equippedWeapon = ref('Espada de Treinamento')
const equipWeapon = (name) => (equippedWeapon.value = name)

const usePotion = () => {
  if (potions.value > 0) {
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30)
    potions.value--
  }
}

const handleMapClick = () => {
  const tutorialDone = localStorage.getItem('tutorialCompleted')
  if (!tutorialDone) {
    localStorage.setItem('tutorialCompleted', 'true')
    router.push('/tutorial')
  } else {
    router.push('/map')
  }
}

// Canvas + mapa
const canvas = ref(null)
let ctx
const player = {
  x: 830 + 128 / 2,
  y: 1600 + 128 / 2,
  size: 128,
  speed: 6,
  runSpeed: 12,
  direction: 'idle'
}
const keys = { w: false, a: false, s: false, d: false, shift: false }
const world = { width: 3000, height: 2000 }
const background = new Image()
const foreground = new Image()

// Spritesheet do player
const playerSpriteSheet = new Image()

// Controle de animação
const frameWidth = 32
const frameHeight = 32

// Ajuste aqui conforme sua spritesheet
const animations = {
  idle: { row: 0, frames: [0] },
  walk_down: { row: 0, frames: [1, 2] },
  walk_up: { row: 1, frames: [0, 1] },
  walk_left: { row: 1, frames: [2, 3] },
  walk_right: { row: 2, frames: [0, 1] }
}

let currentFrameIndex = 0
let frameTimer = 0
const frameInterval = 300 // ms entre frames

let allImagesLoaded = false
let imagesLoadedCount = 0
const totalImagesToLoad = 3 // background, foreground, spritesheet

function imageLoadedCallback() {
  imagesLoadedCount++
  if (imagesLoadedCount >= totalImagesToLoad) {
    allImagesLoaded = true
    requestAnimationFrame(gameLoop)
  }
}

function loadImage(img, src) {
  img.onload = imageLoadedCallback
  img.onerror = () => console.error(`Erro ao carregar imagem: ${src}`)
  img.src = src
}

const obstacles = [
  { x: 480, y: 380, width: 480, height: 180, name: 'Ferreiro', route: '/interior/ferreiro' },
  { x: 1310, y: 820, width: 350, height: 150, name: 'Loja de Poções', route: '/interior/bruxa' },
  { x: 2080, y: 590, width: 330, height: 140, name: 'Igreja', route: '/interior/igreja' },
  { x: 1165, y: 1300, width: 290, height: 20, name: 'Fonte' },
  { x: 1155, y: 1320, width: 315, height: 25 },
  { x: 1145, y: 1345, width: 335, height: 120 },
  { x: 1165, y: 1465, width: 290, height: 20 },
  { x: 400, y: 1545, width: 310, height: 20 },
  { x: 380, y: 1545, width: 20, height: 320 },
  { x: 400, y: 1810, width: 310, height: 55 },
]

onMounted(() => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  loadImage(background, '/public/img/albadia/albadia-bg.png')
  loadImage(foreground, '/public/img/albadia/albadiaDetalhes.png')

  loadImage(playerSpriteSheet, '/img/sprites/player/player_sprite.png')
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('resize', resizeCanvas)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})

function resizeCanvas() {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
}

function onKeyDown(e) {
  const k = e.key.toLowerCase()
  if (keys.hasOwnProperty(k)) keys[k] = true
  if (k === 'e') {
    const current = getPlayerNearbyStructure()
    if (current?.route) router.push(current.route)
  }
}

function onKeyUp(e) {
  const k = e.key.toLowerCase()
  if (keys.hasOwnProperty(k)) keys[k] = false
}

let animationFrameId = null
let lastUpdateTime = 0

function gameLoop(timestamp) {
  if (!allImagesLoaded) {
    animationFrameId = requestAnimationFrame(gameLoop)
    return
  }

  if (!lastUpdateTime) lastUpdateTime = timestamp

  const delta = timestamp - lastUpdateTime

  if (delta >= 15) { // ~30 FPS
    update(delta / 1000) // delta em segundos
    lastUpdateTime = timestamp
  }

  draw()
  animationFrameId = requestAnimationFrame(gameLoop)
}

function update(deltaSeconds) {
  const { w, a, s, d, shift } = keys
  let moved = false
  let dx = 0
  let dy = 0

  if (w) { dy -= 1; moved = true }
  if (s) { dy += 1; moved = true }
  if (a) { dx -= 1; moved = true }
  if (d) { dx += 1; moved = true }

  if (dx !== 0 && dy !== 0) {
    const invSqrt2 = 1 / Math.sqrt(2)
    dx *= invSqrt2
    dy *= invSqrt2
  }

  if (moved) {
    let speed = player.speed

    if (shift && gameState.player.stamina > 0) {
      speed = player.runSpeed

      gameState.player.stamina -= staminaConsumptionRate * deltaSeconds
      if (gameState.player.stamina < 0) gameState.player.stamina = 0
    } else {
      gameState.player.stamina += staminaRecoveryRate * deltaSeconds
      if (gameState.player.stamina > maxStamina) gameState.player.stamina = maxStamina
    }

    if (dy < 0) player.direction = 'walk_up'
    else if (dy > 0) player.direction = 'walk_down'
    else if (dx < 0) player.direction = 'walk_left'
    else if (dx > 0) player.direction = 'walk_right'

    let newX = player.x + dx * speed
    let newY = player.y + dy * speed

    // colisões simples
    for (const obs of obstacles) {
      if (rectCircleColliding(newX, newY, player.size, player.size, obs.x, obs.y, obs.width, obs.height)) {
        newX = player.x
        newY = player.y
        break
      }
    }

    player.x = Math.min(Math.max(newX, 0), world.width)
    player.y = Math.min(Math.max(newY, 0), world.height)
  } else {
    player.direction = 'idle'
    gameState.player.stamina += staminaRecoveryRate * deltaSeconds
    if (gameState.player.stamina > maxStamina) gameState.player.stamina = maxStamina
  }

  // detectar estruturas para "Pressione E"
  const nearbyStructure = getPlayerNearbyStructure()
  if (nearbyStructure && nearbyStructure.name) {
    showEnterPrompt.value = true
    structureName.value = nearbyStructure.name
  } else {
    showEnterPrompt.value = false
  }
}

function getPlayerNearbyStructure() {
  for (const obs of obstacles) {
    const distX = Math.abs(player.x - (obs.x + obs.width / 2))
    const distY = Math.abs(player.y - (obs.y + obs.height / 2))

    if (distX < obs.width / 2 + player.size / 2 && distY < obs.height / 2 + player.size / 2) {
      return obs
    }
  }
  return null
}

function rectCircleColliding(cx, cy, cwidth, cheight, rx, ry, rw, rh) {
  // aproximação AABB para colisão circular
  return !(
    cx + cwidth < rx ||
    cx > rx + rw ||
    cy + cheight < ry ||
    cy > ry + rh
  )
}

function draw() {
  if (!ctx || !allImagesLoaded) return

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  const cam = {
    x: player.x - canvas.value.width / 2,
    y: player.y - canvas.value.height / 2
  }
  cam.x = Math.max(0, Math.min(cam.x, world.width - canvas.value.width))
  cam.y = Math.max(0, Math.min(cam.y, world.height - canvas.value.height))

  ctx.drawImage(background, -cam.x, -cam.y, world.width, world.height)

  // cálculo da animação
  const anim = animations[player.direction] || animations.idle

  // Atualizar frame da animação (feito no update, mas aqui só garante caso idle)
  if (player.direction === 'idle') {
    currentFrameIndex = 0
    frameTimer = 0
  }

  // frame atual para desenhar
  const frame = anim.frames[currentFrameIndex]
  const sx = frame * frameWidth
  const sy = anim.row * frameHeight

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
  ctx.shadowBlur = 15
  ctx.shadowOffsetX = 5
  ctx.shadowOffsetY = 10

  ctx.drawImage(
    playerSpriteSheet,
    sx, sy, frameWidth, frameHeight,
    player.x - cam.x - player.size / 2,
    player.y - cam.y - player.size / 2,
    player.size,
    player.size
  )

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  ctx.drawImage(foreground, -cam.x, -cam.y, world.width, world.height)
}

// Atualiza frame da animação
function updateAnimation(deltaSeconds) {
  if (player.direction !== 'idle') {
    frameTimer += deltaSeconds * 1000
    if (frameTimer >= frameInterval) {
      frameTimer = 0
      currentFrameIndex++
      const anim = animations[player.direction]
      if (currentFrameIndex >= anim.frames.length) currentFrameIndex = 0
    }
  } else {
    currentFrameIndex = 0
    frameTimer = 0
  }
}

// No update() chamar updateAnimation
const originalUpdate = update
update = (deltaSeconds) => {
  originalUpdate(deltaSeconds)
  updateAnimation(deltaSeconds)
}

</script>

<style scoped>
.game-canvas {
  width: 100vw;
  height: 100vh;
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
}
.enter-prompt {
  position: fixed;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(20, 20, 20, 0.8);
  color: white;
  padding: 10px 25px;
  border-radius: 10px;
  font-size: 20px;
  font-weight: bold;
  user-select: none;
  z-index: 10;
}
.key {
  background-color: #444;
  padding: 2px 10px;
  border-radius: 6px;
}
</style>
